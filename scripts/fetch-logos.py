"""Fetch each vendor's own site icon for the tools catalogue.

For every distinct host in data/vendors/*.json: read the homepage, pick the
largest declared icon (apple-touch-icon, <link rel=icon>, web manifest), fall
back to /favicon.ico and then to Google's favicon cache for that domain. Raster
icons are normalised to 64×64 PNG; SVG icons are kept as SVG. Writes
public/logos/<host>.(png|svg) and data/logos.json ({host: file}). Hosts with no
usable icon are left out, and the page shows a monogram instead.

Usage: python3 scripts/fetch-logos.py [--only host,host]
"""

import io
import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "logos"
MAP = ROOT / "data" / "logos.json"
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"}
VERIFY = os.environ.get("REQUESTS_CA_BUNDLE") or ("/root/.ccr/ca-bundle.crt" if Path("/root/.ccr/ca-bundle.crt").exists() else True)
S = requests.Session()
S.headers.update(UA)


def host_of(url: str) -> str:
    return urlparse(url).hostname.removeprefix("www.")


class Icons(HTMLParser):
    def __init__(self):
        super().__init__()
        self.found = []  # (score, href)
        self.manifest = None

    def handle_starttag(self, tag, attrs):
        if tag != "link":
            return
        a = dict(attrs)
        rel = (a.get("rel") or "").lower()
        href = a.get("href")
        if not href:
            return
        if "manifest" in rel:
            self.manifest = href
        if "icon" not in rel:
            return
        size = 0
        m = re.search(r"(\d+)x\d+", a.get("sizes") or "")
        if m:
            size = int(m.group(1))
        elif "apple-touch-icon" in rel:
            size = 180
        if href.endswith(".svg") or "svg" in (a.get("type") or ""):
            size = 1000
        self.found.append((size, href))


def get(url, **kw):
    r = S.get(url, timeout=20, verify=VERIFY, **kw)
    r.raise_for_status()
    return r


def candidates(site: str):
    out = []
    try:
        r = get(site)
        p = Icons()
        p.feed(r.text[:400_000])
        base = r.url
        out += [(s, urljoin(base, h)) for s, h in p.found]
        if p.manifest:
            try:
                m = get(urljoin(base, p.manifest)).json()
                for i in m.get("icons", []):
                    s = re.search(r"(\d+)x", i.get("sizes", "") or "")
                    out.append((int(s.group(1)) if s else 0, urljoin(urljoin(base, p.manifest), i["src"])))
            except Exception:
                pass
        out.append((32, urljoin(base, "/favicon.ico")))
    except Exception as e:
        print("  homepage failed:", type(e).__name__)
        out.append((32, urljoin(site, "/favicon.ico")))
    # prefer 64–512 px rasters and SVG; very large images last
    return sorted(out, key=lambda x: (-(x[0] if x[0] <= 512 else 100), x[1]))


def save(content: bytes, ctype: str, name: str):
    if b"<svg" in content[:2000].lower() or "svg" in ctype:
        if b"<script" in content.lower():
            return None
        (OUT / f"{name}.svg").write_bytes(content)
        return f"{name}.svg"
    im = Image.open(io.BytesIO(content))
    if getattr(im, "n_frames", 1) > 1 or im.format == "ICO":
        sizes = sorted(im.info.get("sizes", [im.size]))
        if sizes:
            try:
                im.size = sizes[-1]
            except Exception:
                pass
    im.load()
    if min(im.size) < 32:
        return None
    im = im.convert("RGBA")
    im.thumbnail((64, 64), Image.LANCZOS)
    canvas = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    canvas.paste(im, ((64 - im.width) // 2, (64 - im.height) // 2), im)
    canvas.save(OUT / f"{name}.png", optimize=True)
    return f"{name}.png"


def fetch(host: str, site: str):
    name = re.sub(r"[^a-z0-9.-]", "-", host)
    for _, url in candidates(site):
        try:
            r = get(url)
            f = save(r.content, r.headers.get("content-type", ""), name)
            if f:
                return f, url
        except Exception:
            continue
    # last resort: Google's cached copy of the same site's favicon
    try:
        r = get(f"https://www.google.com/s2/favicons?domain={host}&sz=128")
        f = save(r.content, r.headers.get("content-type", ""), name)
        if f:
            return f, "google-favicon-cache"
    except Exception:
        pass
    return None, None


def main():
    only = set(sys.argv[sys.argv.index("--only") + 1].split(",")) if "--only" in sys.argv else None
    OUT.mkdir(parents=True, exist_ok=True)
    mapping = json.loads(MAP.read_text()) if MAP.exists() else {}
    sites = {}
    for f in sorted((ROOT / "data" / "vendors").glob("*.json")):
        for v in json.loads(f.read_text())["vendors"]:
            for u in (v["url"], v.get("productUrl")):
                if u:
                    sites.setdefault(host_of(u), f"https://{urlparse(u).hostname}/")
    for host, site in sorted(sites.items()):
        if (only and host not in only) or (not only and host in mapping):
            continue
        print(host)
        f, src = fetch(host, site)
        if f:
            mapping[host] = f
            print("  ->", f, "from", src)
        else:
            print("  no usable icon")
    MAP.write_text(json.dumps(dict(sorted(mapping.items())), indent=1) + "\n")
    print(f"{len(mapping)} logos")


if __name__ == "__main__":
    main()
