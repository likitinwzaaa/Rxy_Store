# Rxy Store

ร้านค้าในเกมสำหรับเซิร์ฟ FiveM ผู้เล่นจ่ายเงินจริงผ่าน PromptPay แล้วได้ของในเกม แอดมินจัดการร้านได้จากในเกม แจกฟรี

ยังทำไม่เสร็จ ตอนนี้ยังเอาไปใช้จริงไม่ได้

## จุดเด่น

- จ่ายผ่าน PromptPay QR ตรวจยอดอัตโนมัติ ไม่ต้องส่งสลิป
- แอดมินเพิ่มสินค้า หมวด แบนเนอร์ และโค้ดส่วนลดได้ในเกม ไม่ต้องแก้ไฟล์
- ซื้อให้คนอื่นได้ มีกล่องรับของ ของมีวันหมดแล้วระบบดึงคืนเอง
- ราคา สต็อก ลิมิต และโค้ด ให้ server เป็นคนคิดทั้งหมด
- สิทธิ์แอดมินเช็คจาก Discord role หรือ ace
- สร้างตารางใน DB เอง อัปเดตแล้ว backup ตารางเดิมให้ก่อน
- หน้าร้านขยายตามขนาดจอ ใช้ได้ทุกสัดส่วน

## ติดตั้ง

ต้องมี [oxmysql](https://github.com/overextended/oxmysql), es_extended และ Node.js 18 ขึ้นไป

1. เอาโฟลเดอร์ `Rxy_Store` ไปไว้ใน `resources`
2. build หน้า web

```
cd web
npm install
npm run build
```

3. เพิ่มใน `server.cfg`

```
ensure oxmysql
ensure es_extended
ensure Rxy_Store

set rxystore_discord_token "token บอท"
set rxystore_webhook_admin "https://discord.com/api/webhooks/..."

add_ace group.admin rxystore.admin allow
add_ace identifier.license:xxxxxxxx rxystore.dev allow
```

token กับ webhook ต้องใช้ `set` เท่านั้น ห้ามใช้ `setr` เพราะ `setr` ส่งค่าไปให้ผู้เล่นทุกคนเห็น

4. ตั้งค่าใน `config.lua` ตอนเปิดเซิร์ฟครั้งแรกร้านจะสร้างตารางที่ขึ้นต้นด้วย `rxy_store_` ให้เอง

| ค่า | ใช้ทำอะไร |
|---|---|
| `OpenKey`, `Command`, `AdminCommand` | ปุ่มเปิดร้าน คำสั่งเปิดร้าน และคำสั่งเปิดหน้าแอดมิน |
| `UpdateCheck` | เช็คเวอร์ชันใหม่ ปิดแล้วยังเตือนถ้าเป็นอัปเดตที่แก้ช่องโหว่ |
| `Debug` | พิมพ์ log ทุกอย่างลง console |
| `Backup.AutoClean`, `Backup.Keep` | ลบ backup ตารางเก่าเองโดยเก็บไว้ `Keep` ชุดล่าสุด ถ้าปิดจะเก็บไว้ตลอด |
| `ShopName`, `Theme` | เป็น `nil` = แอดมินแก้ในเกมได้ ถ้าใส่ค่าไว้จะล็อก สีต้องเป็น `#RRGGBB` |
| `Discord.GuildId`, `Discord.AdminRoles` | เซิร์ฟ Discord และ role ที่เป็นแอดมินร้าน |
| `Discord.Roles` | role ที่ให้เลือกในหน้าแอดมิน ใส่เป็น `['role id'] = 'ชื่อ'` |
| `CategoryAccess` | `'job'` = หมวดเห็นตาม job ของ ESX, `'role'` = เห็นตาม Discord role |
| `Jobs` | job ที่ให้เลือกในหน้าแอดมิน ใส่ `police:2` = grade 2 ขึ้นไป |
| `BannedPlates` | คำที่ห้ามใช้บนป้ายทะเบียน เช่น `{ 'FUCK', 'KUY' }` |
| `ImageHosts` | เว็บที่ใช้เก็บรูปสินค้าได้ เว็บที่เก็บรูปจะเห็น IP ของผู้เล่นทุกคนที่เปิดร้าน เลยต้องจำกัดไว้ ถ้าเว้นว่างจะใช้ได้ทุกเว็บ |

ถ้าจะแก้หน้าตาร้าน ใช้ `npm run dev` ในโฟลเดอร์ `web` แล้วเปิด http://localhost:3000 ใน browser ได้เลย หน้าแอดมินอยู่ที่ `/#admin`

## อัปเดต

ร้านจะบอกใน console เองเมื่อมีเวอร์ชันใหม่ พิมพ์ `rxystore_version` ใน console เพื่อเช็คเดี๋ยวนั้นได้ ถ้าขึ้นสีแดงคืออัปเดตที่แก้ช่องโหว่ ควรอัปเดตให้เร็วที่สุด

## LICENSE

ข้อกำหนดเป็นไปตาม [LICENSE FILE](LICENSE)
