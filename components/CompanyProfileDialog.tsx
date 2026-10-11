"use client";

import { useEffect, useRef } from "react";
import type { CompanyProfile } from "@/lib/vendorMeta";

const ext = { target: "_blank", rel: "noopener noreferrer nofollow" } as const;

/** Modal with a vendor's full researched profile. Rendered only while open. */
export function CompanyProfileDialog({ profile, logo, onClose }: { profile: CompanyProfile; logo?: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="cprofile"
      aria-labelledby="cprofile-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose(); // backdrop
      }}
    >
      <div className="cp-inner">
        <header>
          {logo && <img src={logo} alt="" width={44} height={44} />}
          <div>
            <h2 id="cprofile-title">{profile.name}</h2>
            {profile.legalName && <small>{profile.legalName}</small>}
          </div>
          <button type="button" className="cp-close" onClick={onClose} aria-label="ปิด">
            ×
          </button>
        </header>
        {profile.disclosure && <p className="vc-disclosure">{profile.disclosure}</p>}
        <dl className="cp-facts">
          {profile.founded && (
            <>
              <dt>ก่อตั้ง</dt>
              <dd>{profile.founded}</dd>
            </>
          )}
          {profile.hq && (
            <>
              <dt>สำนักงานใหญ่</dt>
              <dd>{profile.hq}</dd>
            </>
          )}
        </dl>
        <p>{profile.summary}</p>
        {profile.companyClaims && <p className="cp-claims">{profile.companyClaims}</p>}

        <h3>ผลิตภัณฑ์และบริการ ({profile.products.length})</h3>
        <ul className="cp-products">
          {profile.products.map((p) => (
            <li key={p.url + p.name}>
              <a href={p.url} {...ext}>
                {p.name} ↗
              </a>
              <span>{p.what}</span>
            </li>
          ))}
        </ul>

        {profile.integrations?.length ? (
          <>
            <h3>เชื่อมต่อกับ</h3>
            <ul className="cp-list">
              {profile.integrations.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        ) : null}

        {profile.watchOut?.length ? (
          <>
            <h3>ข้อควรรู้</h3>
            <ul className="cp-list cp-watch">
              {profile.watchOut.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </>
        ) : null}

        {profile.clients?.length ? (
          <>
            <h3>ลูกค้าและกรณีศึกษาที่เปิดเผย ({profile.clients.length})</h3>
            <p className="cp-note">จากหน้ากรณีศึกษาและข่าวที่เปิดเผยต่อสาธารณะ บางรายไม่ระบุปี จึงไม่ยืนยันว่ายังใช้งานอยู่</p>
            <ul className="cp-chips">
              {profile.clients.map((c) => (
                <li key={c.name}>
                  <a href={c.source} {...ext}>
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {profile.news?.length ? (
          <>
            <h3>ข่าวและความเคลื่อนไหว</h3>
            <ol className="cp-news">
              {[...profile.news].reverse().map((n) => (
                <li key={n.url + n.title}>
                  <time>{n.date}</time>
                  <a href={n.url} {...ext}>
                    {n.title}
                  </a>
                </li>
              ))}
            </ol>
          </>
        ) : null}

        {profile.sources?.length ? (
          <details className="cp-sources">
            <summary>แหล่งอ้างอิง ({profile.sources.length})</summary>
            <ul>
              {profile.sources.map((u) => (
                <li key={u}>
                  <a href={u} {...ext}>
                    {u.replace(/^https?:\/\/(www\.)?/, "").slice(0, 80)}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>
    </dialog>
  );
}
