fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'Rxy_Store'
author 'likitinwzaaa'
description 'ร้านค้าในเกม จ่ายเงินจริงผ่าน PromptPay'
version '0.2.0'

shared_script 'config.lua'
client_script 'client/main.lua'
server_scripts {
    '@oxmysql/lib/MySQL.lua',
    'server/db.lua',
    'server/log.lua',
    'server/migrations.lua',
    'server/discord.lua',
    'server/bridge/esx.lua',
    'server/players.lua',
    'server/perms.lua',
    'server/requests.lua',
    'server/settings.lua',
    'server/catalog.lua',
    'server/pricing.lua',
    'server/shop.lua',
    'server/version.lua',
}

dependency 'oxmysql'

ui_page 'web/dist/index.html'

files {
    'web/dist/index.html',
    'web/dist/assets/*',
}
