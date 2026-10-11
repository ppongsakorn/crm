"use client";

import { useEffect, useMemo, useState } from "react";
import type { BusinessType } from "@/lib/paths";
import { ORIGIN_LABEL, SIZE_LABEL, TIER_LABEL, type Origin, type Size, type ToolCategory, type Vendor } from "@/lib/vendorMeta";

const TYPE_KEY = "crm-path-type"; // shared with the starter path
const TYPES: { id: BusinessType; label: string }[] = [
  { id: "online", label: "ร้านออนไลน์" },
  { id: "store", label: "ร้านหน้าร้าน" },
  { id: "service", label: "ธุรกิจบริการ" },
];
const SIZES: Size[] = ["micro", "sme", "mid", "enterprise"];

export function VendorCard({ v }: { v: Vendor }) {
  return (
    <article className="vendor">
      <header>
        <a href={v.url} target="_blank" rel="noopener noreferrer nofollow">
          {v.name}
        </a>
        <span className={`v-badge v-${v.origin}`}>{v.origin === "th" ? "ไทย" : v.country}</span>
        <span className={`v-badge v-tier-${v.priceTier}`}>{TIER_LABEL[v.priceTier]}</span>
      </header>
      {v.company && v.company !== v.name && <small className="v-company">{v.company}</small>}
      <p className="v-good">{v.goodFor}</p>
      <dl>
        <dt>ราคา</dt>
        <dd>{v.priceNote}</dd>
        <dt>ภาษาไทย / LINE</dt>
        <dd>{v.thai}</dd>
        <dt>ข้อควรรู้</dt>
        <dd>{v.watchOut}</dd>
      </dl>
      <footer>
        <span>{v.size.map((s) => SIZE_LABEL[s]).join(" · ")}</span>
        <a href={v.source} target="_blank" rel="noopener noreferrer nofollow">
          ที่มา
        </a>
      </footer>
    </article>
  );
}

/**
 * The software catalogue, one section per category. Filters (origin, business
 * type, size, free plan) narrow the vendor cards; the business type is shared
 * with the starter path so a visitor picks it once.
 */
export function ToolsCatalog({ sections, categories }: { sections: { title: string; ids: string[] }[]; categories: ToolCategory[] }) {
  const [origin, setOrigin] = useState<Origin | null>(null);
  const [type, setType] = useState<BusinessType | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    try {
      const t = localStorage.getItem(TYPE_KEY);
      if (t === "online" || t === "store" || t === "service") setType(t);
    } catch {}
  }, []);
  const pickType = (t: BusinessType | null) => {
    setType(t);
    try {
      if (t) localStorage.setItem(TYPE_KEY, t);
      else localStorage.removeItem(TYPE_KEY);
    } catch {}
  };

  const keep = (v: Vendor) =>
    (!origin || v.origin === origin) && (!type || v.types.includes(type)) && (!size || v.size.includes(size)) && (!freeOnly || v.priceTier === "free");
  const byId = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const shown = categories.reduce((n, c) => n + c.vendors.filter(keep).length, 0);
  const total = categories.reduce((n, c) => n + c.vendors.length, 0);
  const filtered = !!(origin || type || size || freeOnly);

  return (
    <div className="tools">
      <section className="tools-filters" aria-label="กรองรายชื่อ">
        <div className="journey-types" role="group" aria-label="ผู้ให้บริการ">
          <span className="journey-label">ผู้ให้บริการ</span>
          {(["th", "intl"] as Origin[]).map((o) => (
            <button key={o} type="button" aria-pressed={origin === o} onClick={() => setOrigin(origin === o ? null : o)}>
              {o === "th" ? "ในประเทศ" : "ต่างประเทศ"}
            </button>
          ))}
        </div>
        <div className="journey-types" role="group" aria-label="ประเภทธุรกิจ">
          <span className="journey-label">ธุรกิจ</span>
          {TYPES.map((t) => (
            <button key={t.id} type="button" aria-pressed={type === t.id} onClick={() => pickType(type === t.id ? null : t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="journey-types" role="group" aria-label="ขนาดธุรกิจ">
          <span className="journey-label">ขนาด</span>
          {SIZES.map((s) => (
            <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(size === s ? null : s)}>
              {SIZE_LABEL[s]}
            </button>
          ))}
          <button type="button" aria-pressed={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>
            มีแผนฟรี
          </button>
        </div>
        <p className="tools-count" aria-live="polite">
          แสดง {shown} จาก {total} รายการ
          {filtered && (
            <button
              type="button"
              className="profile-clear"
              onClick={() => {
                setOrigin(null);
                pickType(null);
                setSize(null);
                setFreeOnly(false);
              }}
            >
              ล้างตัวกรอง
            </button>
          )}
        </p>
      </section>

      <nav className="tools-jump" aria-label="หมวดเครื่องมือ">
        {categories.map((c) => (
          <a key={c.id} href={`#${c.id}`} className="chip">
            {c.name}
          </a>
        ))}
      </nav>

      {sections.map((sec) => {
        const cats = sec.ids.map((id) => byId[id]).filter(Boolean);
        if (!cats.length) return null;
        return (
          <section key={sec.title} className="tools-section">
            <h2>{sec.title}</h2>
            {cats.map((c) => {
              const vs = c.vendors.filter(keep);
              const th = vs.filter((v) => v.origin === "th");
              const intl = vs.filter((v) => v.origin === "intl");
              return (
                <section key={c.id} id={c.id} className="tool-cat">
                  <header>
                    <h3>
                      {c.name} <small>{c.en}</small>
                    </h3>
                    <p>{c.what}</p>
                  </header>
                  <div className="tool-guide">
                    <div>
                      <h4>ควรเริ่มใช้เมื่อไร</h4>
                      <p>{c.whenNeeded}</p>
                      <h4>เริ่มแบบไม่เสียเงิน</h4>
                      <p>{c.freeStart}</p>
                    </div>
                    <div>
                      <h4>เลือกอย่างไร</h4>
                      <ul>
                        {c.chooseBy.map((x, i) => (
                          <li key={i}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {c.note && <p className="tool-note">{c.note}</p>}
                  {vs.length === 0 ? (
                    <p className="muted">ไม่มีรายการที่ตรงกับตัวกรองในหมวดนี้</p>
                  ) : (
                    <>
                      {th.length > 0 && (
                        <>
                          <h4 className="v-group">{ORIGIN_LABEL.th}</h4>
                          <div className="vendors">
                            {th.map((v) => (
                              <VendorCard key={v.name} v={v} />
                            ))}
                          </div>
                        </>
                      )}
                      {intl.length > 0 && (
                        <>
                          <h4 className="v-group">{ORIGIN_LABEL.intl}</h4>
                          <div className="vendors">
                            {intl.map((v) => (
                              <VendorCard key={v.name} v={v} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </section>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
