local TABLE = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4'

local migrations = {
    {
        tables = {},
        sql = {
            [[CREATE TABLE IF NOT EXISTS {settings} (
                k VARCHAR(64) NOT NULL PRIMARY KEY,
                v LONGTEXT NULL,
                updated_at DATETIME NULL,
                updated_by VARCHAR(64) NULL
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {logs} (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                at DATETIME NOT NULL,
                level VARCHAR(8) NOT NULL,
                source VARCHAR(32) NOT NULL,
                message TEXT NOT NULL,
                data LONGTEXT NULL,
                INDEX idx_at (at),
                INDEX idx_level (level, at)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {players} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                license VARCHAR(64) NOT NULL,
                discord VARCHAR(32) NULL,
                steam VARCHAR(32) NULL,
                fivem VARCHAR(32) NULL,
                xbl VARCHAR(32) NULL,
                live VARCHAR(32) NULL,
                ip VARCHAR(45) NULL,
                name VARCHAR(64) NULL,
                total_topup BIGINT UNSIGNED NOT NULL DEFAULT 0,
                hide_rank TINYINT(1) NOT NULL DEFAULT 0,
                first_seen DATETIME NOT NULL,
                last_seen DATETIME NOT NULL,
                UNIQUE KEY uq_license (license),
                INDEX idx_discord (discord),
                INDEX idx_topup (total_topup)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {categories} (
                id VARCHAR(32) NOT NULL PRIMARY KEY,
                name VARCHAR(64) NOT NULL,
                icon VARCHAR(16) NOT NULL DEFAULT 'box',
                sort INT NOT NULL DEFAULT 0,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                jobs LONGTEXT NULL,
                discord_roles LONGTEXT NULL,
                hide_empty TINYINT(1) NOT NULL DEFAULT 0,
                deleted_at DATETIME NULL
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {products} (
                id VARCHAR(48) NOT NULL PRIMARY KEY,
                category_id VARCHAR(32) NOT NULL,
                name VARCHAR(80) NOT NULL,
                description TEXT NULL,
                image VARCHAR(512) NULL,
                price INT UNSIGNED NOT NULL,
                sale_price INT UNSIGNED NULL,
                sale_ends_at DATETIME NULL,
                stock INT NULL,
                limit_count INT UNSIGNED NULL,
                limit_period VARCHAR(8) NOT NULL DEFAULT 'ever',
                rewards LONGTEXT NOT NULL,
                hide_when_blocked TINYINT(1) NOT NULL DEFAULT 0,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                sort INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NOT NULL,
                deleted_at DATETIME NULL,
                INDEX idx_category (category_id)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {banners} (
                id VARCHAR(16) NOT NULL PRIMARY KEY,
                label VARCHAR(64) NOT NULL,
                image VARCHAR(512) NOT NULL,
                link_kind VARCHAR(10) NOT NULL DEFAULT 'none',
                link_id VARCHAR(48) NULL,
                starts_at DATETIME NULL,
                ends_at DATETIME NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                sort INT NOT NULL DEFAULT 0
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {codes} (
                code VARCHAR(16) NOT NULL PRIMARY KEY,
                kind VARCHAR(8) NOT NULL,
                value INT UNSIGNED NOT NULL,
                limit_total INT UNSIGNED NULL,
                per_player TINYINT(1) NOT NULL DEFAULT 0,
                used INT UNSIGNED NOT NULL DEFAULT 0,
                starts_at DATETIME NULL,
                ends_at DATETIME NULL,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                allow_on_sale TINYINT(1) NOT NULL DEFAULT 1,
                min_total INT UNSIGNED NULL,
                max_off INT UNSIGNED NULL,
                only_categories LONGTEXT NULL,
                only_products LONGTEXT NULL,
                created_at DATETIME NOT NULL,
                deleted_at DATETIME NULL
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {tiers} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(64) NOT NULL,
                min_total BIGINT UNSIGNED NOT NULL,
                discount_pct DECIMAL(5, 2) NOT NULL DEFAULT 0,
                rewards LONGTEXT NULL,
                reward_days INT UNSIGNED NULL,
                stack_with_code TINYINT(1) NOT NULL DEFAULT 0,
                enabled TINYINT(1) NOT NULL DEFAULT 1,
                sort INT NOT NULL DEFAULT 0
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {orders} (
                id VARCHAR(24) NOT NULL PRIMARY KEY,
                day CHAR(6) NOT NULL,
                seq INT UNSIGNED NOT NULL,
                player_id INT UNSIGNED NOT NULL,
                identifiers LONGTEXT NOT NULL,
                ip VARCHAR(45) NULL,
                name VARCHAR(64) NULL,
                recipient_id INT UNSIGNED NULL,
                recipient_identifiers LONGTEXT NULL,
                recipient_name VARCHAR(64) NULL,
                subtotal INT UNSIGNED NOT NULL,
                code_off INT UNSIGNED NOT NULL DEFAULT 0,
                tier_off INT UNSIGNED NOT NULL DEFAULT 0,
                total INT UNSIGNED NOT NULL,
                code VARCHAR(16) NULL,
                gateway VARCHAR(8) NOT NULL,
                charge_id VARCHAR(64) NULL,
                status VARCHAR(10) NOT NULL,
                review_reason VARCHAR(32) NULL,
                created_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                paid_at DATETIME NULL,
                refunded_at DATETIME NULL,
                refund_note TEXT NULL,
                gateway_raw LONGTEXT NULL,
                note TEXT NULL,
                UNIQUE KEY uq_day_seq (day, seq),
                UNIQUE KEY uq_charge (charge_id),
                INDEX idx_player (player_id, status),
                INDEX idx_status (status, expires_at),
                INDEX idx_created (created_at)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {order_lines} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(24) NOT NULL,
                product_id VARCHAR(48) NOT NULL,
                name VARCHAR(80) NOT NULL,
                price INT UNSIGNED NOT NULL,
                qty INT UNSIGNED NOT NULL,
                rewards LONGTEXT NOT NULL,
                INDEX idx_order (order_id),
                INDEX idx_product (product_id)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {order_events} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                order_id VARCHAR(24) NOT NULL,
                at DATETIME NOT NULL,
                text VARCHAR(255) NOT NULL,
                by_text VARCHAR(255) NULL,
                tone VARCHAR(8) NULL,
                INDEX idx_order (order_id)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {inbox} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                player_id INT UNSIGNED NOT NULL,
                order_id VARCHAR(24) NULL,
                from_player_id INT UNSIGNED NULL,
                reward LONGTEXT NOT NULL,
                status VARCHAR(10) NOT NULL DEFAULT 'waiting',
                created_at DATETIME NOT NULL,
                expires_at DATETIME NOT NULL,
                warned_at DATETIME NULL,
                claimed_at DATETIME NULL,
                INDEX idx_player (player_id, status),
                INDEX idx_status (status, expires_at)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {owned} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                player_id INT UNSIGNED NOT NULL,
                order_id VARCHAR(24) NULL,
                kind VARCHAR(12) NOT NULL,
                value VARCHAR(80) NOT NULL,
                amount INT UNSIGNED NOT NULL DEFAULT 1,
                starts_at DATETIME NOT NULL,
                ends_at DATETIME NOT NULL,
                status VARCHAR(10) NOT NULL DEFAULT 'active',
                removed_at DATETIME NULL,
                INDEX idx_player (player_id, status),
                INDEX idx_status (status, ends_at)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {plates} (
                plate VARCHAR(8) NOT NULL PRIMARY KEY,
                player_id INT UNSIGNED NOT NULL,
                model VARCHAR(48) NOT NULL,
                order_id VARCHAR(24) NULL,
                source VARCHAR(8) NOT NULL,
                created_at DATETIME NOT NULL,
                INDEX idx_player (player_id)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {tier_grants} (
                id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                player_id INT UNSIGNED NOT NULL,
                tier_id INT UNSIGNED NOT NULL,
                granted_at DATETIME NOT NULL,
                ends_at DATETIME NULL,
                status VARCHAR(10) NOT NULL DEFAULT 'active',
                removed_at DATETIME NULL,
                INDEX idx_player (player_id, tier_id),
                INDEX idx_status (status, ends_at)
            ) ]] .. TABLE,

            [[CREATE TABLE IF NOT EXISTS {admin_logs} (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                at DATETIME NOT NULL,
                admin_license VARCHAR(64) NOT NULL,
                admin_name VARCHAR(64) NULL,
                action VARCHAR(32) NOT NULL,
                target_type VARCHAR(16) NOT NULL,
                target_id VARCHAR(48) NULL,
                before_data LONGTEXT NULL,
                after_data LONGTEXT NULL,
                note TEXT NULL,
                INDEX idx_target (target_type, target_id),
                INDEX idx_at (at)
            ) ]] .. TABLE,
        },
    },
    {
        tables = { 'products', 'categories', 'banners', 'codes', 'tiers' },
        columns = {
            products = {
                { 'featured', 'TINYINT(1) NOT NULL DEFAULT 0' },
                { 'starts_at', 'DATETIME NULL' },
                { 'rev', 'INT UNSIGNED NOT NULL DEFAULT 1' },
            },
            categories = {
                { 'rev', 'INT UNSIGNED NOT NULL DEFAULT 1' },
            },
            banners = {
                { 'rev', 'INT UNSIGNED NOT NULL DEFAULT 1' },
            },
            codes = {
                { 'rev', 'INT UNSIGNED NOT NULL DEFAULT 1' },
            },
            tiers = {
                { 'rev', 'INT UNSIGNED NOT NULL DEFAULT 1' },
            },
        },
        sql = {},
    },
}

-- พิมพ์ลง console พร้อมสี
local function say(color, msg)
    print(('^%s[Rxy_Store]^7 %s^7'):format(color, msg))
end

-- อ่านเวอร์ชัน DB ตอนนี้ ยังไม่เคยติดตั้งจะได้ 0
local function currentVersion()
    MySQL.query.await(DB.sql('CREATE TABLE IF NOT EXISTS {meta} (k VARCHAR(64) NOT NULL PRIMARY KEY, v TEXT NULL) ' .. TABLE))
    local v = MySQL.scalar.await(DB.sql('SELECT v FROM {meta} WHERE k = ?'), { 'db_version' })
    return tonumber(v) or 0
end

-- บันทึกค่าลงตาราง meta
local function setMeta(k, v)
    MySQL.query.await(DB.sql('INSERT INTO {meta} (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)'), { k, tostring(v) })
end

-- copy ตารางไว้ก่อนแก้ ชื่อเป็น rxy_store_bak_<ตาราง>_v<เวอร์ชันเดิม>
local function backup(tables, version)
    for _, name in ipairs(tables) do
        local src = DB.t(name)
        local dst = ('%sbak_%s_v%d'):format(DB.prefix, name, version)
        MySQL.query.await(('DROP TABLE IF EXISTS `%s`'):format(dst))
        MySQL.query.await(('CREATE TABLE `%s` LIKE `%s`'):format(dst, src))
        MySQL.query.await(('INSERT INTO `%s` SELECT * FROM `%s`'):format(dst, src))
        say('7', ('backup %s ไว้ที่ %s'):format(src, dst))
    end
end

-- ลบ backup ที่เก่าเกินจำนวนชุดที่ตั้งไว้
local function cleanBackups()
    if not Config.Backup.AutoClean then return end

    local like = (DB.prefix .. 'bak_'):gsub('_', '\\_') .. '%'
    local rows = MySQL.query.await('SHOW TABLES LIKE ?', { like })
    local byVersion, versions = {}, {}
    for _, row in ipairs(rows or {}) do
        local _, name = next(row)
        local v = tonumber(tostring(name):match('_v(%d+)$'))
        if v then
            if not byVersion[v] then
                byVersion[v] = {}
                versions[#versions + 1] = v
            end
            table.insert(byVersion[v], name)
        end
    end

    table.sort(versions, function(a, b) return a > b end)
    for i = (Config.Backup.Keep or 3) + 1, #versions do
        for _, name in ipairs(byVersion[versions[i]]) do
            MySQL.query.await(('DROP TABLE IF EXISTS `%s`'):format(name))
            say('7', ('ลบ backup เก่า %s'):format(name))
        end
    end
end

local function addColumn(name, column, definition)
    local exists = MySQL.scalar.await(
        'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        { DB.t(name), column }
    )
    if tonumber(exists) and tonumber(exists) > 0 then return end
    MySQL.query.await(('ALTER TABLE `%s` ADD COLUMN `%s` %s'):format(DB.t(name), column, definition))
end

-- รัน migration ที่ยังไม่ได้รันทีละเวอร์ชัน
local function migrate()
    local from = currentVersion()
    local target = #migrations

    if from > target then
        say('3', ('DB เป็นเวอร์ชัน %d แต่สคริปต์รู้จักแค่ถึง %d น่าจะใช้ไฟล์เก่ากว่าตอนติดตั้ง'):format(from, target))
        return true
    end

    for v = from + 1, target do
        local m = migrations[v]
        if from > 0 and #m.tables > 0 then
            backup(m.tables, v - 1)
        end
        for _, query in ipairs(m.sql) do
            MySQL.query.await(DB.sql(query))
        end
        for name, list in pairs(m.columns or {}) do
            for _, col in ipairs(list) do
                addColumn(name, col[1], col[2])
            end
        end
        setMeta('db_version', v)
        if v == 1 then setMeta('installed_at', DB.now()) end
        say('2', ('อัปเดต DB เป็นเวอร์ชัน %d แล้ว'):format(v))
    end

    if from < target then cleanBackups() end
    return currentVersion() == target
end

MySQL.ready(function()
    local ok, done = pcall(migrate)
    if not ok or not done then
        say('1', 'เตรียม DB ไม่สำเร็จ ร้านจะยังไม่เปิดให้ใช้ ดู error ด้านบน')
        if not ok then print(done) end
        return
    end
    DB.setReady()
end)
