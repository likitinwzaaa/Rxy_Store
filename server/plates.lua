Plates = {}

local function banned(text)
    local flat = text:gsub(' ', '')
    for _, word in ipairs(Config.BannedPlates or {}) do
        local w = tostring(word):upper():gsub(' ', '')
        if w ~= '' and flat:find(w, 1, true) then return true end
    end
    return false
end

function Plates.clean(text)
    if type(text) ~= 'string' then return '' end
    return (text:upper():gsub('%s+', ' '):match('^%s*(.-)%s*$'))
end

function Plates.check(text)
    if #text < 3 or #text > 8 then return 'ป้ายต้องยาว 3 ถึง 8 ตัว' end
    if text:find('[^A-Z0-9 ]') then return 'ป้ายใช้ได้แค่ A-Z, 0-9 และเว้นวรรค' end
    if not text:find('%d') then return 'ป้ายต้องมีตัวเลขอย่างน้อย 1 ตัว' end
    if banned(text) then return 'ป้ายนี้มีคำต้องห้าม' end
    return nil
end

function Plates.checkPrefix(text)
    if #text < 1 or #text > 3 then return 'ตัวหน้าป้ายต้องยาว 1 ถึง 3 ตัว' end
    if text:find('[^A-Z0-9]') then return 'ตัวหน้าป้ายใช้ได้แค่ A-Z และ 0-9' end
    if banned(text) then return 'ตัวหน้าป้ายมีคำต้องห้าม' end
    return nil
end

function Plates.taken(text, exceptProduct)
    local used = DB.scalar('SELECT COUNT(*) FROM {plates} WHERE plate = ?', { text })
    if (tonumber(used) or 0) > 0 then return true end

    local ok, owned = pcall(MySQL.scalar.await, 'SELECT COUNT(*) FROM owned_vehicles WHERE plate = ?', { text })
    if ok and (tonumber(owned) or 0) > 0 then return true end

    for _, p in ipairs(Catalog.products) do
        if p.id ~= exceptProduct then
            for _, r in ipairs(p.rewards) do
                if r.kind == 'vehicle' and r.plateMode == 'fixed' and r.plate == text then return true end
            end
        end
    end
    return false
end
