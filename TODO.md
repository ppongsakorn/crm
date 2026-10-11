# งานที่ค้างไว้ (ต.ค. 2026)

## รอเจ้าของเว็บ
- [ ] TTS ภาษาไทยด้วยโมเดลของตัวเอง: เพิ่ม custom connector (MCP แบบ HTTPS) ที่ claude.ai/customize/connectors แล้วเปิด session ใหม่
- [ ] หน้าเว็บ Buzzebees ที่ข้อมูลขัดกัน: ราคา CRM PLUS (ตาราง 2,990 กับ FAQ 1,290 บาท และจำนวนสาขา 2 กับ 5), กรณีศึกษาไม่มีปีและบางรายใช้ชื่อเดิม (Tesco Lotus), หน้า CDP ข้อมูลน้อย แก้แล้วอัปเดต `data/vendors/*.json` และ `data/profiles.json`
- [ ] ยืนยันข้อมูล Buzzebees: เลขทะเบียนนิติบุคคลกับ DBD (ตอนนี้อ้าง Creden), Series A และแผน IPO (ยังไม่ได้ใส่)

## ทำต่อได้เลย (แนะนำ 1–3 ก่อน)
1. [ ] AI Search ค้นเครื่องมือ ผู้ให้บริการ และเส้นทางเริ่มต้นได้ (`lib/searchDocs.ts`, `data/search-phrases.json`, ชุดทดสอบ `tests/search-queries.json`)
2. [ ] ที่ปรึกษา AI แนะนำหน้า `/tools` เมื่อผู้ใช้ถามว่าควรใช้ระบบอะไร (`lib/prompt.ts`)
3. [ ] เปลี่ยน "Looker Studio" เป็น "Data Studio (เดิมชื่อ Looker Studio)" ใน `data/knowledge/*.json` 4 ไฟล์
4. [ ] Search โหลดเร็วขึ้น: static embeddings + lazy-load โมเดล (ตอนนี้โหลดครั้งแรกราว 32MB)
5. [ ] ตั้ง Routine ตรวจราคาและลิงก์ใน `data/vendors/` ทุกเดือน แจ้งเฉพาะรายการที่เปลี่ยน

## ข้อจำกัดที่รู้แล้ว
- โลโก้ดึงไม่ได้ 5 เจ้า: Capillary, CRM Ultra, Mandala, Ocha, PDPA Pro (แสดงเป็นตัวอักษรแรก ใส่ไฟล์เองใน `public/logos/` + `data/logos.json` ได้)
- ลิงก์ที่ยังไม่ใช่หน้าผลิตภัณฑ์: ChatGPT และ Capillary (ติด Cloudflare), TikTok Shop (มีแค่หน้า login), Meta Business Agent (ลิงก์ไปหน้าข่าว)
