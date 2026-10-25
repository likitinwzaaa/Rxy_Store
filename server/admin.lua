local ICONS = { star = true, box = true, car = true, crown = true, coin = true, gift = true, shirt = true, blade = true, home = true, fire = true, bolt = true, tag = true }
local PERIODS = { ever = true, day = true, week = true, month = true }
local ACCOUNTS = { money = 'เงินสด', bank = 'เงินในธนาคาร', black_money = 'เงินแดง' }
local ACTIONS = {
    create = 'เพิ่ม',
    update = 'แก้',
    delete = 'ลบ',
}
local KINDS = {
    product = 'สินค้า',
    category = 'หมวด',
    banner = 'แบนเนอร์',
    code = 'โค้ด',
    settings = 'ตั้งค่าร้าน',
}

local function text(value, max, required)
    if value == nil then value = '' end
    if type(value) ~= 'string' then return nil end
    value = value:match('^%s*(.-)%s*$')
    if required and value == '' then return nil end
    local len = utf8.len(value)
    if not len or len > max then return nil end
    return value
end

local function int(value, min, max)
    value = tonumber(value)
    if not value or value % 1 ~= 0 or value < min or value > max then return nil end
    return math.floor(value)
end

local function satang(value, min, max)
    value = tonumber(value)
    if not value then return nil end
    local s = math.floor(value * 100 + 0.5)
    if math.abs(s - value * 100) > 0.001 or s < min * 100 or s > max * 100 then return nil end
    return s
end

local function stamp(value)
    if value == nil or value == false then return nil end
    local ms = tonumber(value)
    if not ms or ms < 0 or ms > 4102444800000 then return false end
    return DB.fromMs(ms)
end

local function list(value, max, pattern)
    if value == nil then return {} end
    if type(value) ~= 'table' then return nil end
    local out = {}
    for i, v in ipairs(value) do
        if i > max or type(v) ~= 'string' or #v > 48 or (pattern and not v:match(pattern)) then return nil end
        out[#out + 1] = v
    end
    return out
end

local function uid(prefix, exists)
    local chars = 'abcdefghijkmnpqrstuvwxyz23456789'
    for _ = 1, 20 do
        local id = prefix
        for _ = 1, 6 do
            local n = math.random(1, #chars)
            id = id .. chars:sub(n, n)
        end
        if not exists(id) then return id end
    end
    return nil
end

local function imageOk(url)
    if url == '' then return true end
    if not url:match('^https://[^%s"\'()<>]+$') then return false end
    local hosts = Config.ImageHosts or {}
    if #hosts == 0 then return true end
    local host = url:match('^https://([^/:?#]+)')
    host = host and host:lower()
    for _, h in ipairs(hosts) do
        if host == tostring(h):lower() then return true end
    end
    return false
end

local function groups()
    local source = Config.CategoryAccess == 'role' and (Config.Discord.Roles or {}) or (Config.Jobs or {})
    local out = {}
    for id, name in pairs(source) do
        out[#out + 1] = { id = tostring(id), name = tostring(name) }
    end
    table.sort(out, function(a, b) return a.name < b.name end)
    return out
end

local function roleName(id)
    for roleId, name in pairs(Config.Discord.Roles or {}) do
        if tostring(roleId) == tostring(id) then return tostring(name) end
    end
    return nil
end

local function adminData(src)
    local roleMode = Config.CategoryAccess == 'role'
    local categories, products, banners, codes = {}, {}, {}, {}

    for _, c in ipairs(Catalog.categories) do
        categories[#categories + 1] = {
            id = c.id,
            name = c.name,
            icon = c.icon,
            enabled = c.enabled,
            groups = roleMode and c.roles or c.jobs,
            hideEmpty = c.hideEmpty,
            rev = c.rev,
        }
    end

    for _, p in ipairs(Catalog.products) do
        products[#products + 1] = {
            id = p.id,
            name = p.name,
            category = p.category,
            description = p.description,
            image = p.image,
            price = p.price / 100,
            salePrice = p.salePrice and p.salePrice / 100 or nil,
            saleEndsAt = p.saleEndsAt,
            stock = p.stock,
            limit = p.limit,
            limitPeriod = p.limitPeriod,
            rewards = p.rewards,
            featured = p.featured,
            startsAt = p.startsAt,
            hideWhenBlocked = p.hideWhenBlocked,
            enabled = p.enabled,
            rev = p.rev,
        }
    end

    for _, b in ipairs(Catalog.banners) do
        banners[#banners + 1] = {
            id = b.id,
            label = b.label,
            image = b.image,
            link = b.link,
            startsAt = b.startsAt,
            endsAt = b.endsAt,
            enabled = b.enabled,
            rev = b.rev,
        }
    end

    for _, c in pairs(Catalog.codes) do
        codes[#codes + 1] = {
            code = c.code,
            kind = c.kind,
            value = c.kind == 'fixed' and c.value / 100 or c.value,
            limit = c.limit,
            perPlayer = c.perPlayer,
            used = c.used,
            startsAt = c.startsAt,
            endsAt = c.endsAt,
            enabled = c.enabled,
            allowOnSale = c.allowOnSale,
            minTotal = c.minTotal and c.minTotal / 100 or nil,
            maxOff = c.maxOff and c.maxOff / 100 or nil,
            onlyCategories = c.onlyCategories,
            onlyProducts = c.onlyProducts,
            rev = c.rev,
        }
    end
    table.sort(codes, function(a, b) return a.code < b.code end)

    local roles = {}
    for id, name in pairs(Config.Discord.Roles or {}) do
        roles[#roles + 1] = { id = tostring(id), name = tostring(name) }
    end
    table.sort(roles, function(a, b) return a.name < b.name end)

    return {
        dev = Perms.isDev(src),
        categories = categories,
        products = products,
        banners = banners,
        codes = codes,
        groups = groups(),
        roles = roles,
        settings = {
            name = Settings.get('name'),
            theme = Settings.get('theme'),
            openKey = Config.OpenKey,
            bannerSeconds = Settings.get('bannerSeconds'),
            locked = Settings.locked(),
        },
        imageHosts = Config.ImageHosts or {},
        status = {
            bot = GetConvar('rxystore_discord_token', '') ~= '',
            guild = (Config.Discord.GuildId or '') ~= '',
            debug = Config.Debug == true,
            webhooks = {
                finance = GetConvar('rxystore_webhook_finance', '') ~= '',
                delivery = GetConvar('rxystore_webhook_delivery', '') ~= '',
                admin = GetConvar('rxystore_webhook_admin', '') ~= '',
                daily = GetConvar('rxystore_webhook_daily', '') ~= '',
                error = GetConvar('rxystore_webhook_error', '') ~= '',
                logbackup = GetConvar('rxystore_webhook_logbackup', '') ~= '',
            },
        },
    }
end

local function summary(before, after)
    local lines = {}
    if type(before) ~= 'table' or type(after) ~= 'table' then return lines end
    local keys = {}
    for k in pairs(before) do keys[k] = true end
    for k in pairs(after) do keys[k] = true end
    for k in pairs(keys) do
        if k ~= 'rev' then
            local a, b = json.encode(before[k]), json.encode(after[k])
            if a ~= b then
                local line = ('`%s` %s → %s'):format(k, a, b)
                if #line > 300 then line = line:sub(1, 300) .. '...' end
                lines[#lines + 1] = line
            end
        end
    end
    table.sort(lines)
    return lines
end

local function record(src, action, kind, id, label, before, after, notify)
    local player = Players.get(src)
    DB.insert(
        [[INSERT INTO {admin_logs} (at, admin_license, admin_name, action, target_type, target_id, before_data, after_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)]],
        {
            DB.now(),
            player and player.license or 'unknown',
            player and player.name or GetPlayerName(src),
            action,
            kind,
            id,
            before and json.encode(before) or nil,
            after and json.encode(after) or nil,
        }
    )

    if not notify then return end
    local lines = {
        ('**แอดมิน** %s'):format(Discord.escape(player and player.name or GetPlayerName(src))),
        ('**%s** %s'):format(KINDS[kind] or kind, Discord.escape(label or id or '-')),
    }
    if action == 'update' then
        for _, line in ipairs(summary(before, after)) do lines[#lines + 1] = line end
    end
    Discord.log('admin', ('%s%s'):format(ACTIONS[action] or action, KINDS[kind] or kind), lines, 0x4C8DFF)
end

local function changed()
    Catalog.reload()
    return true
end

local function findIn(listValue, key, value)
    for _, item in ipairs(listValue) do
        if item[key] == value then return item end
    end
    return nil
end

local function itemLabel(name)
    local ok, row = pcall(MySQL.single.await, 'SELECT label FROM items WHERE name = ?', { name })
    if not ok then return name, true end
    if not row then return nil, false end
    return row.label or name, true
end

local function cleanRewards(input, productId)
    if type(input) ~= 'table' or #input == 0 then return nil, 'ต้องมีของอย่างน้อย 1 อย่าง' end
    if #input > 10 then return nil, 'ใส่ของได้ไม่เกิน 10 อย่าง' end

    local out, fixed = {}, false
    for _, r in ipairs(input) do
        if type(r) ~= 'table' then return nil, 'ข้อมูลของไม่ถูกต้อง' end
        local days = r.days ~= nil and r.days ~= '' and int(r.days, 1, 3650) or nil
        if r.days ~= nil and r.days ~= '' and not days then return nil, 'อายุต้องเป็น 1 ถึง 3650 วัน' end

        if r.kind == 'item' then
            local name = text(r.value, 50, true)
            local amount = int(r.amount, 1, 1000000)
            if not name or not name:match('^[%w_%-]+$') then return nil, 'ชื่อไอเทมใช้ได้แค่ a-z, 0-9, _ และ -' end
            if not amount then return nil, 'จำนวนไอเทมต้องเป็น 1 ขึ้นไป' end
            local label, exists = itemLabel(name)
            if not exists then return nil, ('ไม่มีไอเทม %s ในเซิร์ฟ'):format(name) end
            out[#out + 1] = { kind = 'item', value = name, label = label, amount = amount, days = days }
        elseif r.kind == 'money' then
            local amount = int(r.amount, 1, 1000000000)
            if not ACCOUNTS[r.value] then return nil, 'เลือกประเภทเงิน' end
            if not amount then return nil, 'จำนวนเงินต้องเป็น 1 ขึ้นไป' end
            out[#out + 1] = { kind = 'money', value = r.value, label = ACCOUNTS[r.value], amount = amount }
        elseif r.kind == 'vehicle' then
            local model = text(r.value, 32, true)
            local amount = int(r.amount, 1, 20)
            if not model or not model:match('^[%w_]+$') then return nil, 'ชื่อโมเดลรถใช้ได้แค่ a-z, 0-9 และ _' end
            if not amount then return nil, 'จำนวนรถต้องเป็น 1 ถึง 20 คัน' end
            local mode = r.plateMode or 'random'
            local plate = nil
            if mode == 'fixed' then
                plate = Plates.clean(r.plate)
                local err = Plates.check(plate)
                if err then return nil, err end
                if Plates.taken(plate, productId) then return nil, ('ป้าย %s มีคนใช้แล้ว'):format(plate) end
                if fixed or amount ~= 1 then return nil, 'สินค้าที่ใช้ป้ายตายตัวต้องมีรถคันเดียว' end
                amount, fixed = 1, true
            elseif mode == 'prefix' then
                plate = Plates.clean(r.plate)
                local err = Plates.checkPrefix(plate)
                if err then return nil, err end
            elseif mode ~= 'random' then
                return nil, 'เลือกแบบป้ายทะเบียน'
            end
            out[#out + 1] = { kind = 'vehicle', value = model:lower(), label = model:lower(), amount = amount, days = days, plateMode = mode, plate = plate }
        elseif r.kind == 'role' then
            local name = roleName(r.value)
            if not name then return nil, 'เลือก Discord role' end
            out[#out + 1] = { kind = 'role', value = tostring(r.value), label = name, amount = 1, days = days }
        else
            return nil, 'ชนิดของไม่ถูกต้อง'
        end
    end
    return out, nil, fixed
end

local function errors(field, message)
    return { errors = { [field] = message } }
end

Requests.on('admin:load', { admin = true, limit = 5, per = 10 }, function(src)
    return adminData(src)
end)

Requests.on('admin:product:save', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = type(p.id) == 'string' and Catalog.byId[p.id] or nil
    if p.id and not old then return nil, 'conflict' end

    local name = text(p.name, 80, true)
    if not name then return errors('name', 'ต้องใส่ชื่อสินค้า ไม่เกิน 80 ตัว') end
    local description = text(p.description, 500)
    if not description then return errors('description', 'คำอธิบายยาวเกิน 500 ตัว') end
    local image = text(p.image, 512)
    if not image or not imageOk(image) then return errors('image', 'ใช้รูปจากเว็บนี้ไม่ได้') end
    if not findIn(Catalog.categories, 'id', p.category) then return errors('category', 'เลือกหมวด') end

    local price = satang(p.price, 1, 1000000)
    if not price then return errors('price', 'ราคาต้องเป็น 1 ขึ้นไป ทศนิยมไม่เกิน 2 ตำแหน่ง') end
    local salePrice = nil
    if p.salePrice ~= nil and p.salePrice ~= '' then
        salePrice = satang(p.salePrice, 1, 1000000)
        if not salePrice or salePrice >= price then return errors('salePrice', 'ราคาลดต้องน้อยกว่าราคาปกติ') end
    end
    local saleEnds = salePrice and stamp(p.saleEndsAt) or nil
    if saleEnds == false then return errors('salePrice', 'เวลาหมดโปรไม่ถูกต้อง') end
    local startsAt = stamp(p.startsAt)
    if startsAt == false then return errors('startsAt', 'เวลาเปิดขายไม่ถูกต้อง') end

    local stock = nil
    if p.stock ~= nil and p.stock ~= '' then
        stock = int(p.stock, 0, 1000000)
        if not stock then return errors('stock', 'สต็อกต้องเป็น 0 ขึ้นไป') end
    end
    local limit = nil
    if p.limit ~= nil and p.limit ~= '' then
        limit = int(p.limit, 1, 999)
        if not limit then return errors('limit', 'ลิมิตต้องเป็น 1 ถึง 999') end
    end
    local period = PERIODS[p.limitPeriod] and p.limitPeriod or 'ever'

    local rewards, err, fixed = cleanRewards(p.rewards, old and old.id)
    if not rewards then return errors('rewards', err) end
    if fixed then stock = math.min(stock or 1, 1) end

    local now = DB.now()
    local values = {
        p.category, name, description ~= '' and description or nil, image ~= '' and image or nil, price, salePrice, saleEnds,
        stock, limit, period, json.encode(rewards), DB.bool(p.hideWhenBlocked) and 1 or 0, DB.bool(p.featured) and 1 or 0, startsAt,
    }

    if old then
        local before = adminData(src).products
        local seen = p.stockSeen
        if seen == '' then seen = nil end
        values[15] = now
        values[16] = old.id
        values[17] = tonumber(p.rev) or -1
        values[18] = tonumber(seen)
        local n = DB.update([[
            UPDATE {products} SET category_id = ?, name = ?, description = ?, image = ?, price = ?, sale_price = ?, sale_ends_at = ?,
                stock = ?, limit_count = ?, limit_period = ?, rewards = ?, hide_when_blocked = ?, featured = ?, starts_at = ?,
                updated_at = ?, rev = rev + 1
            WHERE id = ? AND rev = ? AND deleted_at IS NULL AND stock <=> ?
        ]], values)
        if (n or 0) == 0 then
            local row = DB.single('SELECT rev, stock FROM {products} WHERE id = ?', { old.id })
            changed()
            if row and tonumber(row.rev) == tonumber(p.rev) then return nil, 'stock_changed' end
            return nil, 'conflict'
        end
        changed()
        record(src, 'update', 'product', old.id, name, findIn(before, 'id', old.id), findIn(adminData(src).products, 'id', old.id), true)
    else
        local id = uid('p', function(id)
            return (tonumber(DB.scalar('SELECT COUNT(*) FROM {products} WHERE id = ?', { id })) or 0) > 0
        end)
        if not id then return nil, 'error' end
        local sort = 0
        for _, x in ipairs(Catalog.products) do sort = math.max(sort, x.sort + 1) end
        values = { id, table.unpack(values, 1, 14) }
        values[16] = sort
        values[17] = now
        values[18] = now
        DB.insert([[
            INSERT INTO {products} (id, category_id, name, description, image, price, sale_price, sale_ends_at, stock, limit_count,
                limit_period, rewards, hide_when_blocked, featured, starts_at, sort, created_at, updated_at, enabled)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ]], values)
        changed()
        record(src, 'create', 'product', id, name, nil, findIn(adminData(src).products, 'id', id), true)
        local data = adminData(src)
        data.savedId = id
        return data
    end
    return adminData(src)
end)

Requests.on('admin:product:delete', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = Catalog.byId[p.id]
    if not old then return nil, 'conflict' end
    local n = DB.update(
        'UPDATE {products} SET deleted_at = ?, enabled = 0, rev = rev + 1 WHERE id = ? AND rev = ? AND deleted_at IS NULL',
        { DB.now(), old.id, tonumber(p.rev) or -1 }
    )
    changed()
    if (n or 0) == 0 then return nil, 'conflict' end
    record(src, 'delete', 'product', old.id, old.name, nil, nil, true)
    return adminData(src)
end)

Requests.on('admin:product:toggle', { admin = true, limit = 20, per = 10 }, function(src, p)
    local old = Catalog.byId[p.id]
    if not old then return nil, 'conflict' end
    local on = DB.bool(p.enabled)
    DB.update('UPDATE {products} SET enabled = ?, rev = rev + 1 WHERE id = ? AND deleted_at IS NULL', { on and 1 or 0, old.id })
    changed()
    record(src, 'toggle', 'product', old.id, old.name, { enabled = old.enabled }, { enabled = on }, false)
    return adminData(src)
end)

local function sortRows(src, kind, tableName, ids, keyColumn)
    if type(ids) ~= 'table' or #ids > 500 then return nil, 'bad' end
    for i, id in ipairs(ids) do
        if type(id) ~= 'string' or #id > 48 then return nil, 'bad' end
        DB.update(('UPDATE {%s} SET sort = ? WHERE %s = ?'):format(tableName, keyColumn), { i, id })
    end
    changed()
    record(src, 'sort', kind, nil, nil, nil, ids, false)
    return adminData(src)
end

Requests.on('admin:product:sort', { admin = true, limit = 10, per = 10 }, function(src, p)
    return sortRows(src, 'product', 'products', p.ids, 'id')
end)

Requests.on('admin:category:save', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = type(p.id) == 'string' and findIn(Catalog.categories, 'id', p.id) or nil
    if p.id and not old then return nil, 'conflict' end

    local name = text(p.name, 40, true)
    if not name then return errors('name', 'ต้องใส่ชื่อหมวด ไม่เกิน 40 ตัว') end
    if not ICONS[p.icon] then return errors('icon', 'เลือกไอคอน') end
    local picked = list(p.groups, 50)
    if not picked then return errors('groups', 'กลุ่มไม่ถูกต้อง') end
    local allowed = {}
    for _, g in ipairs(groups()) do allowed[g.id] = true end
    for _, g in ipairs(picked) do
        if not allowed[g] then return errors('groups', 'มีกลุ่มที่ไม่มีใน config') end
    end
    local column = Config.CategoryAccess == 'role' and 'discord_roles' or 'jobs'
    local access = #picked > 0 and json.encode(picked) or nil
    local hideEmpty = DB.bool(p.hideEmpty) and 1 or 0

    if old then
        local before = findIn(adminData(src).categories, 'id', old.id)
        local n = DB.update(
            ('UPDATE {categories} SET name = ?, icon = ?, %s = ?, hide_empty = ?, rev = rev + 1 WHERE id = ? AND rev = ? AND deleted_at IS NULL'):format(column),
            { name, p.icon, access, hideEmpty, old.id, tonumber(p.rev) or -1 }
        )
        changed()
        if (n or 0) == 0 then return nil, 'conflict' end
        record(src, 'update', 'category', old.id, name, before, findIn(adminData(src).categories, 'id', old.id), true)
        return adminData(src)
    end

    local id = uid('c', function(id)
        return (tonumber(DB.scalar('SELECT COUNT(*) FROM {categories} WHERE id = ?', { id })) or 0) > 0
    end)
    if not id then return nil, 'error' end
    local sort = 0
    for _, c in ipairs(Catalog.categories) do sort = math.max(sort, c.sort + 1) end
    DB.insert(
        ('INSERT INTO {categories} (id, name, icon, sort, enabled, %s, hide_empty) VALUES (?, ?, ?, ?, 1, ?, ?)'):format(column),
        { id, name, p.icon, sort, access, hideEmpty }
    )
    changed()
    record(src, 'create', 'category', id, name, nil, findIn(adminData(src).categories, 'id', id), true)
    local data = adminData(src)
    data.savedId = id
    return data
end)

Requests.on('admin:category:delete', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = findIn(Catalog.categories, 'id', p.id)
    if not old then return nil, 'conflict' end
    for _, product in ipairs(Catalog.products) do
        if product.category == old.id then return nil, 'in_use' end
    end
    local n = DB.update(
        'UPDATE {categories} SET deleted_at = ?, enabled = 0, rev = rev + 1 WHERE id = ? AND rev = ? AND deleted_at IS NULL',
        { DB.now(), old.id, tonumber(p.rev) or -1 }
    )
    changed()
    if (n or 0) == 0 then return nil, 'conflict' end
    record(src, 'delete', 'category', old.id, old.name, nil, nil, true)
    return adminData(src)
end)

Requests.on('admin:category:toggle', { admin = true, limit = 20, per = 10 }, function(src, p)
    local old = findIn(Catalog.categories, 'id', p.id)
    if not old then return nil, 'conflict' end
    local on = DB.bool(p.enabled)
    DB.update('UPDATE {categories} SET enabled = ?, rev = rev + 1 WHERE id = ? AND deleted_at IS NULL', { on and 1 or 0, old.id })
    changed()
    record(src, 'toggle', 'category', old.id, old.name, { enabled = old.enabled }, { enabled = on }, false)
    return adminData(src)
end)

Requests.on('admin:category:sort', { admin = true, limit = 10, per = 10 }, function(src, p)
    return sortRows(src, 'category', 'categories', p.ids, 'id')
end)

local function cleanLink(link)
    if type(link) ~= 'table' or link.kind == 'none' or link.kind == nil then return 'none', nil end
    if link.kind == 'product' and Catalog.byId[link.id] then return 'product', link.id end
    if link.kind == 'category' and findIn(Catalog.categories, 'id', link.id) then return 'category', link.id end
    return nil
end

Requests.on('admin:banner:save', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = type(p.id) == 'string' and findIn(Catalog.banners, 'id', p.id) or nil
    if p.id and not old then return nil, 'conflict' end

    local label = text(p.label, 40, true)
    if not label then return errors('label', 'ต้องใส่ชื่อ ไม่เกิน 40 ตัว') end
    local image = text(p.image, 512, true)
    if not image or not imageOk(image) then return errors('image', 'ใช้รูปจากเว็บนี้ไม่ได้') end
    local kind, target = cleanLink(p.link)
    if not kind then return errors('target', 'เลือกปลายทาง') end
    local startsAt, endsAt = stamp(p.startsAt), stamp(p.endsAt)
    if startsAt == false or endsAt == false then return errors('end', 'เวลาไม่ถูกต้อง') end
    if startsAt and endsAt and endsAt <= startsAt then return errors('end', 'เวลาจบต้องหลังเวลาเริ่ม') end

    if old then
        local before = findIn(adminData(src).banners, 'id', old.id)
        local n = DB.update(
            'UPDATE {banners} SET label = ?, image = ?, link_kind = ?, link_id = ?, starts_at = ?, ends_at = ?, rev = rev + 1 WHERE id = ? AND rev = ?',
            { label, image, kind, target, startsAt, endsAt, old.id, tonumber(p.rev) or -1 }
        )
        changed()
        if (n or 0) == 0 then return nil, 'conflict' end
        record(src, 'update', 'banner', old.id, label, before, findIn(adminData(src).banners, 'id', old.id), true)
        return adminData(src)
    end

    local id = uid('b', function(id)
        return (tonumber(DB.scalar('SELECT COUNT(*) FROM {banners} WHERE id = ?', { id })) or 0) > 0
    end)
    if not id then return nil, 'error' end
    local sort = 0
    for _, b in ipairs(Catalog.banners) do sort = math.max(sort, b.sort + 1) end
    DB.insert(
        'INSERT INTO {banners} (id, label, image, link_kind, link_id, starts_at, ends_at, enabled, sort) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
        { id, label, image, kind, target, startsAt, endsAt, sort }
    )
    changed()
    record(src, 'create', 'banner', id, label, nil, findIn(adminData(src).banners, 'id', id), true)
    local data = adminData(src)
    data.savedId = id
    return data
end)

Requests.on('admin:banner:delete', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = findIn(Catalog.banners, 'id', p.id)
    if not old then return nil, 'conflict' end
    local n = DB.update('DELETE FROM {banners} WHERE id = ? AND rev = ?', { old.id, tonumber(p.rev) or -1 })
    changed()
    if (n or 0) == 0 then return nil, 'conflict' end
    record(src, 'delete', 'banner', old.id, old.label, nil, nil, true)
    return adminData(src)
end)

Requests.on('admin:banner:toggle', { admin = true, limit = 20, per = 10 }, function(src, p)
    local old = findIn(Catalog.banners, 'id', p.id)
    if not old then return nil, 'conflict' end
    local on = DB.bool(p.enabled)
    DB.update('UPDATE {banners} SET enabled = ?, rev = rev + 1 WHERE id = ?', { on and 1 or 0, old.id })
    changed()
    record(src, 'toggle', 'banner', old.id, old.label, { enabled = old.enabled }, { enabled = on }, false)
    return adminData(src)
end)

Requests.on('admin:banner:sort', { admin = true, limit = 10, per = 10 }, function(src, p)
    return sortRows(src, 'banner', 'banners', p.ids, 'id')
end)

Requests.on('admin:banner:seconds', { admin = true, limit = 10, per = 10 }, function(src, p)
    local seconds = int(p.seconds, 2, 30)
    if not seconds then return nil, 'bad' end
    local before = Settings.get('bannerSeconds')
    Settings.save('bannerSeconds', seconds, Players.get(src) and Players.get(src).license)
    changed()
    record(src, 'update', 'settings', 'bannerSeconds', 'เวลาเปลี่ยนแบนเนอร์', { bannerSeconds = before }, { bannerSeconds = seconds }, true)
    return adminData(src)
end)

Requests.on('admin:code:save', { admin = true, limit = 10, per = 10 }, function(src, p)
    local code = type(p.code) == 'string' and p.code:upper() or ''
    if not code:match('^[A-Z0-9_]+$') or #code < 3 or #code > 16 then return errors('code', 'A-Z, 0-9 หรือ _ ยาว 3 ถึง 16 ตัว') end
    local oldCode = type(p.old) == 'string' and p.old or nil
    local old = oldCode and Catalog.codes[oldCode] or nil
    if oldCode and not old then return nil, 'conflict' end
    if old and code ~= old.code and old.used > 0 then return errors('code', 'โค้ดนี้มีคนใช้แล้ว เปลี่ยนชื่อไม่ได้') end
    if (not old or code ~= old.code) and Catalog.codes[code] then return errors('code', 'มีโค้ดนี้อยู่แล้ว') end

    local kind = p.kind == 'fixed' and 'fixed' or 'percent'
    local value
    if kind == 'percent' then
        value = int(p.value, 1, 90)
        if not value then return errors('value', 'ลดได้ 1 ถึง 90%') end
    else
        value = satang(p.value, 1, 1000000)
        if not value then return errors('value', 'ส่วนลดต้องเป็น 1 บาทขึ้นไป') end
    end
    local limit = nil
    if p.limit ~= nil and p.limit ~= '' then
        limit = int(p.limit, 1, 1000000)
        if not limit then return errors('limit', 'ต้องมากกว่า 0') end
    end
    local startsAt, endsAt = stamp(p.startsAt), stamp(p.endsAt)
    if startsAt == false or endsAt == false then return errors('end', 'เวลาไม่ถูกต้อง') end
    if startsAt and endsAt and endsAt <= startsAt then return errors('end', 'เวลาหมดต้องหลังเวลาเริ่ม') end
    local minTotal, maxOff = nil, nil
    if p.minTotal ~= nil and p.minTotal ~= '' then
        minTotal = satang(p.minTotal, 1, 1000000)
        if not minTotal then return errors('minTotal', 'ยอดขั้นต่ำไม่ถูกต้อง') end
    end
    if p.maxOff ~= nil and p.maxOff ~= '' then
        maxOff = satang(p.maxOff, 1, 1000000)
        if not maxOff then return errors('maxOff', 'ลดสูงสุดไม่ถูกต้อง') end
    end
    local onlyCategories = list(p.onlyCategories, 100)
    local onlyProducts = list(p.onlyProducts, 500)
    if not onlyCategories or not onlyProducts then return errors('only', 'เลือกหมวดหรือสินค้าไม่ถูกต้อง') end

    local values = {
        code, kind, value, limit, DB.bool(p.perPlayer) and 1 or 0, startsAt, endsAt, DB.bool(p.enabled) and 1 or 0,
        DB.bool(p.allowOnSale) and 1 or 0, minTotal, maxOff,
        #onlyCategories > 0 and json.encode(onlyCategories) or nil, #onlyProducts > 0 and json.encode(onlyProducts) or nil,
    }

    if old then
        local before = findIn(adminData(src).codes, 'code', old.code)
        values[14] = old.code
        values[15] = tonumber(p.rev) or -1
        local n = DB.update([[
            UPDATE {codes} SET code = ?, kind = ?, value = ?, limit_total = ?, per_player = ?, starts_at = ?, ends_at = ?, enabled = ?,
                allow_on_sale = ?, min_total = ?, max_off = ?, only_categories = ?, only_products = ?, rev = rev + 1
            WHERE code = ? AND rev = ?
        ]], values)
        changed()
        if (n or 0) == 0 then return nil, 'conflict' end
        record(src, 'update', 'code', code, code, before, findIn(adminData(src).codes, 'code', code), true)
        return adminData(src)
    end

    values[14] = DB.now()
    DB.insert([[
        INSERT INTO {codes} (code, kind, value, limit_total, per_player, starts_at, ends_at, enabled, allow_on_sale, min_total, max_off,
            only_categories, only_products, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ]], values)
    changed()
    record(src, 'create', 'code', code, code, nil, findIn(adminData(src).codes, 'code', code), true)
    return adminData(src)
end)

Requests.on('admin:code:delete', { admin = true, limit = 10, per = 10 }, function(src, p)
    local old = type(p.code) == 'string' and Catalog.codes[p.code] or nil
    if not old then return nil, 'conflict' end
    local n = DB.update('DELETE FROM {codes} WHERE code = ? AND rev = ?', { old.code, tonumber(p.rev) or -1 })
    changed()
    if (n or 0) == 0 then return nil, 'conflict' end
    record(src, 'delete', 'code', old.code, old.code, nil, nil, true)
    return adminData(src)
end)

Requests.on('admin:settings:save', { admin = true, limit = 10, per = 10 }, function(src, p)
    local locked = Settings.locked()
    local before = { name = Settings.get('name'), theme = Settings.get('theme') }
    local by = Players.get(src) and Players.get(src).license
    local name, theme = nil, nil

    if not locked.name then
        name = text(p.name, 24, true)
        if not name then return errors('name', 'ต้องใส่ชื่อร้าน ไม่เกิน 24 ตัว') end
    end

    if not locked.theme and type(p.theme) == 'table' then
        local primary = type(p.theme.primary) == 'string' and p.theme.primary:upper() or ''
        local secondary = type(p.theme.secondary) == 'string' and p.theme.secondary:upper() or nil
        if not primary:match('^#%x%x%x%x%x%x$') then return errors('theme', 'สีต้องเป็น #RRGGBB') end
        if secondary and not secondary:match('^#%x%x%x%x%x%x$') then return errors('theme', 'สีต้องเป็น #RRGGBB') end
        theme = { primary = primary, secondary = secondary }
    end

    if name then Settings.save('name', name, by) end
    if theme then Settings.save('theme', theme, by) end

    changed()
    record(src, 'update', 'settings', 'shop', 'ชื่อร้านและสี', before, { name = Settings.get('name'), theme = Settings.get('theme') }, true)
    return adminData(src)
end)
