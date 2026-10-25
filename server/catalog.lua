Catalog = {
    version = 0,
    categories = {},
    products = {},
    byId = {},
    banners = {},
    codes = {},
    tiers = {},
}

local function num(value)
    return tonumber(value)
end

local function loadCategories()
    local rows = DB.query([[
        SELECT id, name, icon, sort, enabled, jobs, discord_roles, hide_empty, rev
        FROM {categories} WHERE deleted_at IS NULL ORDER BY sort, id
    ]]) or {}
    local list = {}
    for _, r in ipairs(rows) do
        list[#list + 1] = {
            id = r.id,
            name = r.name,
            icon = r.icon,
            sort = num(r.sort) or 0,
            enabled = DB.bool(r.enabled),
            jobs = DB.json(r.jobs, {}),
            roles = DB.json(r.discord_roles, {}),
            hideEmpty = DB.bool(r.hide_empty),
            rev = num(r.rev) or 1,
        }
    end
    return list
end

local function loadProducts()
    local rows = DB.query([[
        SELECT id, category_id, name, description, image, price, sale_price, ]] .. DB.time('sale_ends_at') .. [[,
            stock, limit_count, limit_period, rewards, hide_when_blocked, enabled, sort, featured, ]] .. DB.time('starts_at') .. [[, rev
        FROM {products} WHERE deleted_at IS NULL ORDER BY sort, id
    ]]) or {}
    local list = {}
    for _, r in ipairs(rows) do
        list[#list + 1] = {
            id = r.id,
            category = r.category_id,
            name = r.name,
            description = r.description,
            image = r.image,
            price = num(r.price) or 0,
            salePrice = num(r.sale_price),
            saleEndsAt = DB.toMs(r.sale_ends_at),
            stock = num(r.stock),
            limit = num(r.limit_count),
            limitPeriod = r.limit_period or 'ever',
            rewards = DB.json(r.rewards, {}),
            hideWhenBlocked = DB.bool(r.hide_when_blocked),
            enabled = DB.bool(r.enabled),
            sort = num(r.sort) or 0,
            featured = DB.bool(r.featured),
            startsAt = DB.toMs(r.starts_at),
            rev = num(r.rev) or 1,
        }
    end
    return list
end

local function loadBanners()
    local rows = DB.query([[
        SELECT id, label, image, link_kind, link_id, ]] .. DB.time('starts_at') .. ', ' .. DB.time('ends_at') .. [[,
            enabled, sort, rev
        FROM {banners} ORDER BY sort, id
    ]]) or {}
    local list = {}
    for _, r in ipairs(rows) do
        list[#list + 1] = {
            id = r.id,
            label = r.label,
            image = r.image,
            link = r.link_kind ~= 'none' and r.link_id and { kind = r.link_kind, id = r.link_id } or { kind = 'none' },
            startsAt = DB.toMs(r.starts_at),
            endsAt = DB.toMs(r.ends_at),
            enabled = DB.bool(r.enabled),
            sort = num(r.sort) or 0,
            rev = num(r.rev) or 1,
        }
    end
    return list
end

local function loadCodes()
    local rows = DB.query([[
        SELECT code, kind, value, limit_total, per_player, used, ]] .. DB.time('starts_at') .. ', ' .. DB.time('ends_at') .. [[,
            enabled, allow_on_sale, min_total, max_off, only_categories, only_products, rev
        FROM {codes} WHERE deleted_at IS NULL ORDER BY created_at
    ]]) or {}
    local map = {}
    for _, r in ipairs(rows) do
        map[r.code] = {
            code = r.code,
            kind = r.kind,
            value = num(r.value) or 0,
            limit = num(r.limit_total),
            perPlayer = DB.bool(r.per_player),
            used = num(r.used) or 0,
            startsAt = DB.toMs(r.starts_at),
            endsAt = DB.toMs(r.ends_at),
            enabled = DB.bool(r.enabled),
            allowOnSale = DB.bool(r.allow_on_sale),
            minTotal = num(r.min_total),
            maxOff = num(r.max_off),
            onlyCategories = DB.json(r.only_categories, {}),
            onlyProducts = DB.json(r.only_products, {}),
            rev = num(r.rev) or 1,
        }
    end
    return map
end

local function loadTiers()
    local rows = DB.query([[
        SELECT id, name, min_total, discount_pct, rewards, reward_days, stack_with_code, enabled, sort, rev
        FROM {tiers} ORDER BY min_total
    ]]) or {}
    local list = {}
    for _, r in ipairs(rows) do
        list[#list + 1] = {
            id = num(r.id),
            name = r.name,
            minTotal = num(r.min_total) or 0,
            discount = num(r.discount_pct) or 0,
            rewards = DB.json(r.rewards, {}),
            rewardDays = num(r.reward_days),
            stack = DB.bool(r.stack_with_code),
            enabled = DB.bool(r.enabled),
            rev = num(r.rev) or 1,
        }
    end
    return list
end

function Catalog.reload()
    Catalog.categories = loadCategories()
    Catalog.products = loadProducts()
    Catalog.banners = loadBanners()
    Catalog.codes = loadCodes()
    Catalog.tiers = loadTiers()
    Catalog.byId = {}
    for _, p in ipairs(Catalog.products) do Catalog.byId[p.id] = p end
    Catalog.version = Catalog.version + 1
end

function Catalog.price(p, now)
    now = now or os.time() * 1000
    if p.salePrice and (not p.saleEndsAt or p.saleEndsAt > now) then return p.salePrice, true end
    return p.price, false
end

local function canSee(src, category)
    local list = Config.CategoryAccess == 'role' and category.roles or category.jobs
    if type(list) ~= 'table' or #list == 0 then return true end

    if Config.CategoryAccess == 'role' then
        local roles = Players.roles(src)
        if type(roles) ~= 'table' then return false end
        for _, need in ipairs(list) do
            for _, role in ipairs(roles) do
                if tostring(role) == tostring(need) then return true end
            end
        end
        return false
    end

    local job, grade = Bridge.job(src)
    if not job then return false end
    for _, need in ipairs(list) do
        local name, minGrade = tostring(need):match('^([^:]+):?(%d*)$')
        if name == job and grade >= (tonumber(minGrade) or 0) then return true end
    end
    return false
end

function Catalog.visible(src)
    local ids, set = {}, {}
    for _, c in ipairs(Catalog.categories) do
        if c.enabled and canSee(src, c) then
            ids[#ids + 1] = c.id
            set[c.id] = true
        end
    end
    return set, table.concat(ids, ',')
end

function Catalog.isOnSale(p, visible)
    return p and p.enabled and visible[p.category] == true
end

local function publicReward(r)
    return { kind = r.kind, label = r.label, amount = r.amount, days = r.days }
end

function Catalog.forPlayer(visible)
    local categories, products, banners = {}, {}, {}
    local now = os.time() * 1000

    for _, c in ipairs(Catalog.categories) do
        if visible[c.id] then
            categories[#categories + 1] = { id = c.id, name = c.name, icon = c.icon, hideEmpty = c.hideEmpty }
        end
    end

    for _, p in ipairs(Catalog.products) do
        if Catalog.isOnSale(p, visible) then
            local rewards = {}
            for i, r in ipairs(p.rewards) do rewards[i] = publicReward(r) end
            products[#products + 1] = {
                id = p.id,
                name = p.name,
                category = p.category,
                description = p.description,
                image = p.image,
                price = p.price / 100,
                salePrice = p.salePrice and p.salePrice / 100 or nil,
                saleEndsAt = p.saleEndsAt,
                limit = p.limit,
                limitPeriod = p.limitPeriod,
                rewards = rewards,
                featured = p.featured,
                startsAt = p.startsAt,
                hideWhenBlocked = p.hideWhenBlocked,
            }
        end
    end

    for _, b in ipairs(Catalog.banners) do
        if b.enabled and (not b.endsAt or b.endsAt > now) then
            banners[#banners + 1] = { id = b.id, label = b.label, image = b.image, link = b.link, startsAt = b.startsAt, endsAt = b.endsAt }
        end
    end

    return { categories = categories, products = products, banners = banners }
end

function Catalog.stock(visible)
    local map = {}
    for _, p in ipairs(Catalog.products) do
        if p.stock and Catalog.isOnSale(p, visible) then map[p.id] = p.stock end
    end
    return map
end

local function periodStart(period)
    local t = os.time() + 7 * 3600
    if period == 'day' then return os.date('!%Y-%m-%d 00:00:00', t) end
    if period == 'week' then
        local wday = tonumber(os.date('!%w', t))
        return os.date('!%Y-%m-%d 00:00:00', t - ((wday + 6) % 7) * 86400)
    end
    if period == 'month' then return os.date('!%Y-%m-01 00:00:00', t) end
    return nil
end

function Catalog.bought(playerId)
    local rows = DB.query([[
        SELECT l.product_id,
            SUM(l.qty) AS ever,
            SUM(CASE WHEN o.paid_at >= ? THEN l.qty ELSE 0 END) AS day,
            SUM(CASE WHEN o.paid_at >= ? THEN l.qty ELSE 0 END) AS week,
            SUM(CASE WHEN o.paid_at >= ? THEN l.qty ELSE 0 END) AS month
        FROM {order_lines} l
        JOIN (
            SELECT id, paid_at FROM {orders} WHERE player_id = ? AND status = 'paid'
            UNION
            SELECT id, paid_at FROM {orders} WHERE recipient_id = ? AND status = 'paid'
        ) o ON o.id = l.order_id
        GROUP BY l.product_id
    ]], { periodStart('day'), periodStart('week'), periodStart('month'), playerId, playerId }) or {}

    local map = {}
    for _, r in ipairs(rows) do
        local p = Catalog.byId[r.product_id]
        if p and p.limit then
            map[r.product_id] = tonumber(r[p.limitPeriod] or r.ever) or 0
        end
    end
    return map
end

DB.onReady(function()
    Settings.load()
    Catalog.reload()
end)
