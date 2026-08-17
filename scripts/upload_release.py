import urllib.request
import json
import os
import sys

TOKEN = os.environ.get('GITHUB_TOKEN', '')
REPO = 'Xinatory501/rp-assistant-releases'
TAG = 'v1.1.0'

url = f'https://api.github.com/repos/{REPO}/releases'
headers = {
    'Authorization': f'Bearer {TOKEN}',
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'RP-Assistant-Uploader',
    'X-GitHub-Api-Version': '2022-11-28'
}

data = {
    'tag_name': TAG,
    'target_commitish': 'main',
    'name': 'RP Assistant v1.1.0 — Custom Installer & Minimalist Claude Icon',
    'body': 'Официальный релиз RP Assistant v1.1.0 для Amazing Online.\n\n### Что нового в v1.1.0:\n- 🎨 Новая минималистичная иконка в тёплом стиле Claude\n- 📁 Кастомный мастер установки NSIS с возможностью выбора любой папки\n- 🔄 Автоматическое завершение процесса при обновлении без блокировки файлов\n- 💾 Сохранение биндов, ключей KeyAuth и настроек при обновлении\n\n### Файлы для загрузки:\n- **RP-Assistant-Setup-v1.1.exe** (71 МБ) — Установщик с выбором пути и авто-обновлением.\n- **RP-Assistant-v1.1-Portable.zip** (112 МБ) — Портативная версия (распаковать и играть).',
    'draft': False,
    'prerelease': False
}

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        release = json.loads(resp.read().decode('utf-8'))
        print('Created release ID:', release['id'])
except urllib.error.HTTPError as e:
    if e.code == 422:
        req = urllib.request.Request(f'https://api.github.com/repos/{REPO}/releases/tags/{TAG}', headers=headers)
        with urllib.request.urlopen(req) as resp:
            release = json.loads(resp.read().decode('utf-8'))
            print('Found existing release ID:', release['id'])
    else:
        print('HTTP Error:', e.code, e.read().decode('utf-8'))
        sys.exit(1)

upload_url_template = release['upload_url'].split('{')[0]
print('Upload URL:', upload_url_template)

# Delete existing assets if any with same name
req = urllib.request.Request(f'https://api.github.com/repos/{REPO}/releases/{release["id"]}/assets', headers=headers)
with urllib.request.urlopen(req) as resp:
    assets = json.loads(resp.read().decode('utf-8'))
    for a in assets:
        del_req = urllib.request.Request(a['url'], headers=headers, method='DELETE')
        urllib.request.urlopen(del_req)
        print('Deleted old asset:', a['name'])

def upload_asset(file_path, asset_name, content_type):
    print(f'Uploading {asset_name} ({os.path.getsize(file_path)} bytes)...')
    with open(file_path, 'rb') as f:
        file_data = f.read()
    
    upload_url = f'{upload_url_template}?name={asset_name}'
    asset_headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': content_type,
        'User-Agent': 'RP-Assistant-Uploader',
        'X-GitHub-Api-Version': '2022-11-28'
    }
    req = urllib.request.Request(upload_url, data=file_data, headers=asset_headers, method='POST')
    with urllib.request.urlopen(req) as resp:
        asset = json.loads(resp.read().decode('utf-8'))
        print(f'SUCCESS {asset_name}:', asset.get('browser_download_url'))

upload_asset('/Users/mac/Documents/amazing launch/rp-assistant/release/RP Assistant-1.1.0-win.zip', 'RP-Assistant-v1.1-Portable.zip', 'application/zip')
upload_asset('/Users/mac/Documents/amazing launch/rp-assistant/release/RP Assistant Setup 1.1.0.exe', 'RP-Assistant-Setup-v1.1.exe', 'application/vnd.microsoft.portable-executable')
