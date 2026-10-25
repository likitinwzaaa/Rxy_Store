DB = {
    prefix = 'rxy_store_',
    ready = false,
}

local waiting = {}

-- ชื่อตารางเต็ม เช่น orders เป็น rxy_store_orders
function DB.t(name)
    return DB.prefix .. name
end

-- เปลี่ยน {orders} ใน SQL เป็นชื่อตารางเต็ม
function DB.sql(query)
    return (query:gsub('{(%w[%w_]*)}', function(name)
        return '`' .. DB.prefix .. name .. '`'
    end))
end

-- เวลาไทยแบบ DATETIME บวกเพิ่มได้เป็นวินาที
function DB.now(offset)
    return os.date('!%Y-%m-%d %H:%M:%S', os.time() + 7 * 3600 + (offset or 0))
end

-- รอให้ DB พร้อมก่อนค่อยทำ
function DB.onReady(cb)
    if DB.ready then
        CreateThread(cb)
        return
    end
    waiting[#waiting + 1] = cb
end

-- บอกทุกส่วนที่รออยู่ว่า DB พร้อมแล้ว
function DB.setReady()
    DB.ready = true
    for _, cb in ipairs(waiting) do
        CreateThread(cb)
    end
    waiting = {}
end
