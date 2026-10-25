Config = {}

Config.OpenKey = 'F5'
Config.Command = 'shop'
Config.AdminCommand = 'shopadmin'

-- ปิดแล้วยังเตือนถ้าเป็นอัปเดตแก้ช่องโหว่
Config.UpdateCheck = true

Config.Debug = false

-- AutoClean = true จะเก็บ backup ไว้แค่ Keep ชุดล่าสุด, false = เก็บไว้ตลอด
Config.Backup = {
    AutoClean = true,
    Keep = 3,
}

-- #RRGGBB เท่านั้น, secondary เป็น nil = ใช้สีตรงข้ามของ primary
Config.Theme = {
    primary = '#FF7A1A',
    secondary = nil,
}
