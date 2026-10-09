"use client";

import { useProfile } from "@/components/ProfileProvider";
import { PROFILE_FIELDS } from "@/lib/prompts";

/** One-time business details that fill matching [placeholders] in every prompt on the site. */
export function ProfilePanel({ compact }: { compact?: boolean }) {
  const { profile, custom, setField, clear } = useProfile();
  const done = PROFILE_FIELDS.filter((f) => profile[f.id]?.trim()).length;
  const extra = Object.values(custom).filter((v) => v.trim()).length;
  return (
    <details className={`profile${compact ? " compact" : ""}`}>
      <summary>
        <span className="profile-title">เติมช่องว่างใน prompt อัตโนมัติ</span>
        <span className="profile-count">
          {done ? `กรอกแล้ว ${done}/${PROFILE_FIELDS.length}` : "กรอกข้อมูลธุรกิจครั้งเดียว ใช้ได้ทุก prompt"}
          {extra ? ` · จำค่าที่กรอกเอง ${extra} ช่อง` : ""}
        </span>
      </summary>
      <div className="profile-body">
        <div className="profile-grid">
          {PROFILE_FIELDS.map((f) => (
            <label key={f.id}>
              <span>{f.label}</span>
              <input value={profile[f.id] ?? ""} placeholder={`เช่น ${f.example}`} onChange={(e) => setField(f.id, e.target.value)} />
            </label>
          ))}
        </div>
        <p className="profile-note">
          ข้อมูลเก็บไว้ในเบราว์เซอร์นี้เท่านั้น ไม่ได้ส่งไปที่ใด ช่องว่างที่ตรงกับข้อมูลนี้จะถูกเติมให้ทุก prompt ส่วนช่องอื่นกด &quot;เติมช่องว่าง&quot; ที่ prompt นั้น
          {(done > 0 || extra > 0) && (
            <button type="button" className="profile-clear" onClick={clear}>
              ล้างข้อมูลทั้งหมด
            </button>
          )}
        </p>
      </div>
    </details>
  );
}
