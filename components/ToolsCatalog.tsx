"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BusinessType } from "@/lib/paths";
import { CompanyProfileDialog } from "@/components/CompanyProfileDialog";
import { basePath } from "@/lib/site";
import { CATEGORY_EMOJI, CATEGORY_SHORT, SIZE_LABEL, TIER_LABEL, vendorHost, type CompanyProfile, type Origin, type PriceTier, type Size, type ToolCategory, type Vendor } from "@/lib/vendorMeta";

const TYPE_KEY = "crm-path-type"; // shared with the starter path
const TYPES: { id: BusinessType; label: string }[] = [
  { id: "online", label: "ร้านออนไลน์" },
  { id: "store", label: "ร้านหน้าร้าน" },
  { id: "service", label: "ธุรกิจบริการ" },
];
const SIZES: Size[] = ["micro", "sme", "mid", "enterprise"];
const TIERS: PriceTier[] = ["free", "low", "mid", "enterprise"];
type GroupBy = "origin" | "tier";

// name, maker and what it is for; not the caveat fields, where "LINE" often appears as "not confirmed"
const haystack = (v: Vendor) => [v.name, v.company, v.country, v.goodFor, v.priceNote, ...(v.products ?? []).map((p) => p.name)].join(" ").toLowerCase();

export function VendorLogo({ v, logos }: { v: Vendor; logos: Record<string, string> }) {
  const f = logos[vendorHost(v)];
  return f ? (
    <img className="vc-logo" src={`${basePath}/logos/${f}`} alt="" width={36} height={36} loading="lazy" decoding="async" />
  ) : (
    <span className="vc-logo mono" aria-hidden="true">
      {v.name.replace(/[^A-Za-z0-9ก-๙]/g, "").slice(0, 1).toUpperCase()}
    </span>
  );
}

/** One provider: the essentials up front, the rest folded away. */
export function VendorCard({ v, logos, onProfile }: { v: Vendor; logos: Record<string, string>; onProfile?: (host: string) => void }) {
  const page = v.productUrl ?? v.url;
  return (
    <article className={`vcard${v.disclosure ? " disclosed" : ""}`}>
      <header>
        <VendorLogo v={v} logos={logos} />
        <div className="vc-title">
          <a href={page} target="_blank" rel="noopener noreferrer nofollow" className="vc-name">
            {v.name}
          </a>
          <span className="vc-badges">
            <span className={`v-badge v-${v.origin}`}>{v.origin === "th" ? "ไทย" : v.country.replace(/\s*\(.*\)$/, "")}</span>
            <span className={`v-badge v-tier-${v.priceTier}`}>{TIER_LABEL[v.priceTier]}</span>
          </span>
        </div>
      </header>
      {v.disclosure && <p className="vc-disclosure">{v.disclosure}</p>}
      {onProfile && (
        <button type="button" className="vc-profile" onClick={() => onProfile(vendorHost(v))}>
          ข้อมูลบริษัทเต็ม: ผลิตภัณฑ์ ลูกค้า ข่าว ›
        </button>
      )}
      <p className="vc-good">{v.goodFor}</p>
      <p className="vc-price">{v.priceNote}</p>
      <details className="vc-more">
        <summary>รายละเอียด</summary>
        <dl>
          {v.company && v.company !== v.name && (
            <>
              <dt>บริษัท</dt>
              <dd>
                {v.company} · {v.country}
              </dd>
            </>
          )}
          <dt>ภาษาไทย / LINE</dt>
          <dd>{v.thai}</dd>
          <dt>ข้อควรรู้</dt>
          <dd>{v.watchOut}</dd>
          <dt>เหมาะกับขนาด</dt>
          <dd>{v.size.map((s) => SIZE_LABEL[s]).join(" · ")}</dd>
          {v.products?.length ? (
            <>
              <dt>ผลิตภัณฑ์</dt>
              <dd>
                <ul className="vc-products">
                  {v.products.map((p) => (
                    <li key={p.url + p.name}>
                      <a href={p.url} target="_blank" rel="noopener noreferrer nofollow">
                        {p.name}
                      </a>{" "}
                      {p.what}
                    </li>
                  ))}
                </ul>
              </dd>
            </>
          ) : null}
        </dl>
        <p className="vc-links">
          <a href={page} target="_blank" rel="noopener noreferrer nofollow">
            {v.productUrl && v.productUrl !== v.url ? "หน้าผลิตภัณฑ์ ↗" : "เว็บไซต์ ↗"}
          </a>
          {v.productUrl && v.productUrl !== v.url && (
            <a href={v.url} target="_blank" rel="noopener noreferrer nofollow">
              เว็บไซต์หลัก ↗
            </a>
          )}
          <a href={v.source} target="_blank" rel="noopener noreferrer nofollow">
            ที่มาของข้อมูล ↗
          </a>
        </p>
      </details>
    </article>
  );
}

function Grid({ vendors, logos, profiles, onProfile }: { vendors: Vendor[]; logos: Record<string, string>; profiles: Record<string, CompanyProfile>; onProfile: (host: string) => void }) {
  return (
    <div className="vgrid">
      {vendors.map((v) => (
        <VendorCard key={v.name} v={v} logos={logos} onProfile={profiles[vendorHost(v)] ? onProfile : undefined} />
      ))}
    </div>
  );
}

/**
 * The software catalogue in two levels: an overview of categories, then one
 * category at a time. A sticky bar searches and filters across everything
 * (origin, business type, size, free plan); counts update everywhere. The open
 * category lives in the URL hash so /tools#crm-core links straight to it.
 */
export function ToolsCatalog({
  sections,
  categories,
  logos,
  profiles = {},
  mobile = false,
}: {
  sections: { title: string; ids: string[] }[];
  categories: ToolCategory[];
  logos: Record<string, string>;
  profiles?: Record<string, CompanyProfile>;
  mobile?: boolean;
}) {
  const [profile, setProfile] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [type, setType] = useState<BusinessType | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);
  const [cat, setCat] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>("origin");
  const top = useRef<HTMLDivElement>(null);

  const byId = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TYPE_KEY);
      if (t === "online" || t === "store" || t === "service") setType(t);
    } catch {}
    const fromHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      setCat(byId[id] ? id : null);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [byId]);

  const pickType = (t: BusinessType | null) => {
    setType(t);
    try {
      if (t) localStorage.setItem(TYPE_KEY, t);
      else localStorage.removeItem(TYPE_KEY);
    } catch {}
  };
  const open = (id: string | null) => {
    setCat(id);
    history.replaceState(null, "", id ? `#${id}` : location.pathname + location.search);
    if (top.current && top.current.getBoundingClientRect().top < 0) top.current.scrollIntoView({ block: "start" });
  };

  const needle = q.trim().toLowerCase();
  const keep = (v: Vendor) =>
    (!origin || v.origin === origin) &&
    (!type || v.types.includes(type)) &&
    (!size || v.size.includes(size)) &&
    (!freeOnly || v.priceTier === "free") &&
    (!needle || haystack(v).includes(needle));
  const shown = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.vendors.filter(keep)])), [categories, origin, type, size, freeOnly, needle]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = categories.reduce((n, c) => n + c.vendors.length, 0);
  const matched = categories.reduce((n, c) => n + shown[c.id].length, 0);
  const filtered = !!(origin || type || size || freeOnly || needle);
  const clear = () => {
    setQ("");
    setOrigin(null);
    pickType(null);
    setSize(null);
    setFreeOnly(false);
  };

  const c = cat ? byId[cat] : null;
  const order = sections.flatMap((s) => s.ids).filter((id) => byId[id]);
  const at = c ? order.indexOf(c.id) : -1;

  const groups = (vs: Vendor[]) =>
    groupBy === "origin"
      ? ([
          ["ผู้ให้บริการในประเทศ", vs.filter((v) => v.origin === "th")],
          ["ผู้ให้บริการต่างประเทศ", vs.filter((v) => v.origin === "intl")],
        ] as const)
      : TIERS.map((t) => [TIER_LABEL[t], vs.filter((v) => v.priceTier === t)] as const);

  return (
    <div className="tools" ref={top}>
      {profile && profiles[profile] && (
        <CompanyProfileDialog profile={profiles[profile]} logo={logos[profile] ? `${basePath}/logos/${logos[profile]}` : undefined} onClose={() => setProfile(null)} />
      )}
      <div className="tools-bar">
        <label className="tools-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z" fill="currentColor" />
          </svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาชื่อหรือสิ่งที่ต้องการ เช่น LINE, แต้ม, ฟรี" aria-label="ค้นหาเครื่องมือ" />
        </label>
        <div className="tools-filter-row">
          <div className="seg" role="group" aria-label="ผู้ให้บริการ">
            {([null, "th", "intl"] as (Origin | null)[]).map((o) => (
              <button key={o ?? "all"} type="button" aria-pressed={origin === o} onClick={() => setOrigin(o)}>
                {o === null ? "ทั้งหมด" : o === "th" ? "ไทย" : "ต่างประเทศ"}
              </button>
            ))}
          </div>
          <select value={type ?? ""} onChange={(e) => pickType((e.target.value || null) as BusinessType | null)} aria-label="ประเภทธุรกิจ" className={type ? "on" : ""}>
            <option value="">ธุรกิจทุกแบบ</option>
            {TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select value={size ?? ""} onChange={(e) => setSize((e.target.value || null) as Size | null)} aria-label="ขนาดธุรกิจ" className={size ? "on" : ""}>
            <option value="">ทุกขนาด</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {SIZE_LABEL[s]}
              </option>
            ))}
          </select>
          <button type="button" className="toggle" aria-pressed={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>
            มีแผนฟรี
          </button>
          <span className="tools-count" aria-live="polite">
            {filtered ? `ตรง ${matched} จาก ${total}` : `${total} รายการ`}
            {filtered && (
              <button type="button" className="profile-clear" onClick={clear}>
                ล้าง
              </button>
            )}
          </span>
        </div>
      </div>
      <nav className="tools-tabs" aria-label="หมวดเครื่องมือ">
        <button type="button" aria-current={!c ? "page" : undefined} onClick={() => open(null)}>
          ทุกหมวด
        </button>
        {order.map((id) => (
          <button key={id} type="button" aria-current={cat === id ? "page" : undefined} onClick={() => open(id)} className={shown[id].length ? "" : "empty"}>
            {CATEGORY_EMOJI[id]} {CATEGORY_SHORT[id] ?? byId[id].name} <small>{shown[id].length}</small>
          </button>
        ))}
      </nav>

      <div className="tools-layout">
        <aside className="tools-side" aria-label="หมวดเครื่องมือ">
          <button type="button" className="side-all" aria-current={!c ? "page" : undefined} onClick={() => open(null)}>
            ภาพรวมทุกหมวด <small>{matched}</small>
          </button>
          {sections.map((s) => (
            <div key={s.title}>
              <h3>{s.title}</h3>
              {s.ids
                .filter((id) => byId[id])
                .map((id) => (
                  <button key={id} type="button" aria-current={cat === id ? "page" : undefined} onClick={() => open(id)} className={shown[id].length ? "" : "empty"}>
                    <span>
                      {CATEGORY_EMOJI[id]} {byId[id].name}
                    </span>
                    <small>{shown[id].length}</small>
                  </button>
                ))}
            </div>
          ))}
        </aside>

        <div className="tools-main">
          {!c && needle ? (
            /* search results across categories */
            matched === 0 ? (
              <p className="tools-empty">ไม่พบเครื่องมือที่ตรงกับ “{q}” ลองคำอื่น หรือล้างตัวกรอง</p>
            ) : (
              order
                .filter((id) => shown[id].length)
                .map((id) => (
                  <section key={id} className="tools-results">
                    <h2>
                      <button type="button" onClick={() => open(id)}>
                        {CATEGORY_EMOJI[id]} {byId[id].name} <small>{shown[id].length} รายการ ›</small>
                      </button>
                    </h2>
                    <Grid vendors={shown[id]} logos={logos} profiles={profiles} onProfile={setProfile} />
                  </section>
                ))
            )
          ) : !c ? (
            /* overview: one tile per category */
            sections.map((s) => (
              <section key={s.title} className="tools-overview">
                <h2>{s.title}</h2>
                <div className="tiles">
                  {s.ids
                    .filter((id) => byId[id])
                    .map((id) => {
                      const cc = byId[id];
                      const vs = shown[id];
                      const th = vs.filter((v) => v.origin === "th").length;
                      const free = vs.filter((v) => v.priceTier === "free").length;
                      return (
                        <button key={id} type="button" className={`tile${vs.length ? "" : " empty"}`} onClick={() => open(id)}>
                          <span className="tile-emoji" aria-hidden="true">
                            {CATEGORY_EMOJI[id]}
                          </span>
                          <b>{cc.name}</b>
                          <span className="tile-what">{cc.what}</span>
                          <span className="tile-stats">
                            {vs.length ? (
                              <>
                                <span>{vs.length} รายการ</span>
                                <span>ไทย {th}</span>
                                {free > 0 && <span className="free">ฟรี {free}</span>}
                              </>
                            ) : (
                              <span>ไม่มีรายการตรงตัวกรอง</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </section>
            ))
          ) : (
            /* one category */
            <section className="tool-view">
              <button type="button" className="tool-back" onClick={() => open(null)}>
                ‹ ทุกหมวด
              </button>
              <header className="tool-head">
                <span className="tile-emoji" aria-hidden="true">
                  {CATEGORY_EMOJI[c.id]}
                </span>
                <div>
                  <h2>{c.name}</h2>
                  <small>{c.en}</small>
                </div>
              </header>
              <p className="tool-what">{c.what}</p>
              {!mobile && (
                <div className="tool-facts">
                  <div>
                    <h4>ควรเริ่มใช้เมื่อไร</h4>
                    <p>{c.whenNeeded}</p>
                  </div>
                  <div>
                    <h4>เริ่มแบบไม่เสียเงิน</h4>
                    <p>{c.freeStart}</p>
                  </div>
                </div>
              )}
              <details className="tool-choose">
                <summary>{mobile ? "ควรเริ่มเมื่อไร · เริ่มฟรี · เกณฑ์เลือก" : `เกณฑ์เลือก ${c.chooseBy.length} ข้อ${c.note ? " และข้อสังเกตของหมวดนี้" : ""}`}</summary>
                {mobile && (
                  <div className="tool-facts">
                    <div>
                      <h4>ควรเริ่มใช้เมื่อไร</h4>
                      <p>{c.whenNeeded}</p>
                    </div>
                    <div>
                      <h4>เริ่มแบบไม่เสียเงิน</h4>
                      <p>{c.freeStart}</p>
                    </div>
                  </div>
                )}
                <ol>
                  {c.chooseBy.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ol>
                {c.note && <p className="tool-note">{c.note}</p>}
              </details>

              <div className="tool-toolbar">
                <span>
                  {shown[c.id].length === c.vendors.length ? `${c.vendors.length} รายการ` : `ตรงตัวกรอง ${shown[c.id].length} จาก ${c.vendors.length}`}
                </span>
                <div className="seg small" role="group" aria-label="จัดกลุ่มตาม">
                  <span>จัดกลุ่ม</span>
                  <button type="button" aria-pressed={groupBy === "origin"} onClick={() => setGroupBy("origin")}>
                    ไทย/ต่างประเทศ
                  </button>
                  <button type="button" aria-pressed={groupBy === "tier"} onClick={() => setGroupBy("tier")}>
                    ระดับราคา
                  </button>
                </div>
              </div>

              {shown[c.id].length === 0 ? (
                <p className="tools-empty">
                  ไม่มีรายการในหมวดนี้ที่ตรงตัวกรอง{" "}
                  <button type="button" className="profile-clear" onClick={clear}>
                    ล้างตัวกรอง
                  </button>
                </p>
              ) : (
                groups(shown[c.id]).map(([title, vs]) =>
                  vs.length ? (
                    <section key={title} className="vgroup">
                      <h3>
                        {title} <small>{vs.length}</small>
                      </h3>
                      <Grid vendors={vs} logos={logos} profiles={profiles} onProfile={setProfile} />
                    </section>
                  ) : null,
                )
              )}

              <nav className="tool-pager" aria-label="หมวดก่อนหน้าและถัดไป">
                {at > 0 ? (
                  <button type="button" onClick={() => open(order[at - 1])}>
                    ‹ {CATEGORY_EMOJI[order[at - 1]]} {byId[order[at - 1]].name}
                  </button>
                ) : (
                  <span />
                )}
                {at < order.length - 1 && (
                  <button type="button" onClick={() => open(order[at + 1])}>
                    {CATEGORY_EMOJI[order[at + 1]]} {byId[order[at + 1]].name} ›
                  </button>
                )}
              </nav>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
