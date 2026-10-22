# Rxy Store

ร้านค้าในเกมสำหรับเซิร์ฟ FiveM ผู้เล่นจ่ายเงินจริงผ่าน PromptPay แล้วได้ของในเกม แอดมินตั้งค่าสินค้าได้จากในเกม

ยังทำไม่เสร็จ ตอนนี้ยังเอาไปใช้จริงไม่ได้

## ตอนนี้ทำอะไรได้แล้ว

- กด F5 หรือพิมพ์ `/shop` เพื่อเปิดหน้าร้าน (ยังเป็นหน้าต่างเปล่า)
- กด Esc หรือปุ่ม X เพื่อปิด
- เปลี่ยนสีร้านได้ใน config.lua
- สคริปต์อื่นสั่งเปิดปิดร้านได้ผ่าน export

```lua
exports.Rxy_Store:open()
exports.Rxy_Store:close()
```

## ติดตั้ง

1. เอาโฟลเดอร์ `Rxy_Store` ไปไว้ใน `resources`
2. build หน้า web ก่อน (ดูหัวข้อถัดไป) ถ้าไม่มีโฟลเดอร์ `web/dist` ร้านจะเปิดไม่ขึ้น
3. เพิ่มใน `server.cfg`

```
ensure Rxy_Store
```

## build หน้า web

ต้องมี Node.js 18 ขึ้นไป

```
cd web
npm install
npm run build
```

ไฟล์ที่ได้จะอยู่ใน `web/dist`

ถ้าจะแก้หน้าตาร้าน ใช้ `npm run dev` แล้วเปิด http://localhost:3000 ใน browser ได้เลย ไม่ต้องเข้าเกม

## ตั้งค่า

แก้ใน `config.lua`

| ค่า | ใช้ทำอะไร | ค่าเริ่มต้น |
|---|---|---|
| `Config.OpenKey` | ปุ่มเปิดร้าน | `F5` |
| `Config.Command` | คำสั่งเปิดร้าน | `shop` |
| `Config.Theme.primary` | สีหลัก ใช้กับราคา ป้ายลดราคา ตัวเลขบนตะกร้า | `#FF7A1A` |
| `Config.Theme.secondary` | สีรอง ใช้กับสถานะ ส่วนลด กล่องรับของ ถ้าเป็น `nil` จะใช้สีตรงข้ามของสีหลักให้เอง | `nil` |

สีต้องเป็นรูปแบบ `#RRGGBB` ถ้าใส่ผิด ร้านจะกลับไปใช้สีเริ่มต้น

ผู้เล่นเปลี่ยนปุ่มเองได้ที่ Settings > Key Bindings > FiveM

## โครงสร้างไฟล์

```
Rxy_Store/
├── fxmanifest.lua
├── config.lua
├── client/
│   └── main.lua        เปิดปิดหน้าร้าน
└── web/                หน้าร้าน (React + Vite + TypeScript)
    └── src/
        ├── App.tsx
        ├── components/           ปุ่ม สวิตช์ ไอคอน ที่ใช้ทั้งร้าน
        ├── styles/               ฟอนต์ สี และ CSS กลาง
        ├── lib/
        │   ├── nui.ts            ส่งข้อมูลจากหน้า web ไปฝั่ง Lua
        │   ├── theme.ts          ตั้งสีร้าน
        │   └── csp.ts            กันสคริปต์แปลกปลอมตอนรันในเกม
        └── hooks/useNuiEvent.ts  รับข้อมูลจากฝั่ง Lua
```

ฟอนต์ (IBM Plex Sans Thai, IBM Plex Mono) ฝังมากับตัวร้าน ไม่ได้โหลดจากเน็ต

## LICENSE

ข้อกำหนดเป็นไปตาม [LICENSE FILE](LICENSE)
