fx_version 'cerulean'
game 'gta5'
lua54 'yes'

name 'Rxy_Store'
author 'likitinwzaaa'
description 'ร้านค้าในเกม จ่ายเงินจริงผ่าน PromptPay'
version '0.2.0'

shared_script 'config.lua'
client_script 'client/main.lua'
server_script 'server/version.lua'

ui_page 'web/dist/index.html'

files {
    'web/dist/index.html',
    'web/dist/assets/*',
}
