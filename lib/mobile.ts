/**
 * The phone app lives under /mobile with its own screens. These helpers map
 * between desktop and mobile URLs and remember the visitor's choice of view.
 */

const KEY = "view"; // localStorage: "full" = stay on the desktop site

/**
 * Desktop path → the matching mobile screen, or null when there is none
 * (e.g. /architecture, /advisor). Serialised into an inline script, so it must
 * not reference anything outside its own body.
 */
export function toMobilePath(path: string, hash = ""): string | null {
  const p = path.replace(/\/+$/, "") || "/";
  if (p === "/") return "/mobile/";
  if (p === "/topics") {
    const id = hash.replace("#", "");
    const stages = ["attract", "activate", "engage", "grow", "measure", "predict", "retain", "listen", "data"];
    return stages.indexOf(id) >= 0 ? "/mobile/g/" + id + "/" : "/mobile/search/";
  }
  const m = p.match(/^\/topics\/([a-z0-9-]+)$/);
  if (m) return "/mobile/t/" + m[1] + "/";
  if (p === "/prompts") return "/mobile/prompts/";
  if (p === "/trends") return "/mobile/trends/";
  if (p === "/updates") return "/mobile/updates/";
  return null;
}

/** Mobile path → the matching desktop page. */
export function toDesktopPath(path: string): string {
  const p = path.replace(/\/+$/, "");
  const t = p.match(/\/mobile\/t\/([a-z0-9-]+)$/);
  if (t) return `/topics/${t[1]}/`;
  const g = p.match(/\/mobile\/g\/([a-z]+)$/);
  if (g) return `/topics/#${g[1]}`;
  if (p.endsWith("/mobile/search")) return "/topics/";
  if (p.endsWith("/mobile/prompts")) return "/prompts/";
  if (p.endsWith("/mobile/trends")) return "/trends/";
  if (p.endsWith("/mobile/updates")) return "/updates/";
  return "/";
}

/**
 * Inline script for the desktop layout. On a phone-sized screen it replaces the
 * page with its mobile screen before paint, unless the visitor picked the full
 * site. Links marked data-view="mobile" clear that choice.
 */
export function mobileRedirectScript(basePath: string): string {
  const map = toMobilePath.toString();
  return `(function(){try{
var b=${JSON.stringify(basePath)},k=${JSON.stringify(KEY)};
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-view=mobile]");if(a)try{localStorage.removeItem(k)}catch(_){}});
var full=false;try{full=localStorage.getItem(k)==="full"}catch(_){}
if(full||!matchMedia("(max-width: 760px)").matches)return;
var toMobilePath=${map};
var path=location.pathname.slice(b.length)||"/";var t=toMobilePath(path,location.hash);
if(t)location.replace(b+t);
}catch(_){}})();`;
}

/** Inline script for the mobile layout: links marked data-view="full" remember the choice. */
export function fullSiteChoiceScript(): string {
  return `document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-view=full]");if(a)try{localStorage.setItem(${JSON.stringify(KEY)},"full")}catch(_){}});`;
}
