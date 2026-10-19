#!/usr/bin/env python3
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data' / 'artists'
CONFIG = json.loads((ROOT/'config.json').read_text(encoding='utf-8'))
IMG_EXTS={'.png','.jpg','.jpeg','.webp'}


def rel(p: Path):
    return './' + p.relative_to(ROOT).as_posix()

def scan_images(base: Path):
    out={}
    if not base.exists(): return out
    for p in base.rglob('*'):
        if p.is_file() and p.suffix.lower() in IMG_EXTS:
            key=p.relative_to(base).with_suffix('').as_posix()
            out[key]=rel(p)
    return out

def natural_key(s):
    import re
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', s)]

artists={}
for artist_name in CONFIG.get('artists',[]):
    base=DATA/artist_name
    if not base.exists():
        print(f'WARNING: missing artist folder: {base}')
        continue
    prompts_path=base/'prompts.json'
    prompts=[]
    if prompts_path.exists():
        raw=json.loads(prompts_path.read_text(encoding='utf-8'))
        if isinstance(raw, list): prompts=raw
        elif isinstance(raw, dict):
            prompts=raw.get('prompts',[])
    images=scan_images(base)
    refs=[v for k,v in sorted(images.items(),key=lambda kv:natural_key(kv[0])) if k.startswith('references/')]
    display=CONFIG.get('artist_display_names',{}).get(artist_name,artist_name.replace('_',' ').replace('-',' ').title())
    artist_json=base/'artist.json'
    if artist_json.exists():
        try:
            aj=json.loads(artist_json.read_text(encoding='utf-8'))
            display=aj.get('display_name',display)
        except Exception: pass
    artists[artist_name]={
        'display_name':display,
        'prompts':prompts,
        'references':refs,
        'images':images
    }

manifest={'config':CONFIG,'artists':artists}
(ROOT/'manifest.js').write_text('window.MIRAGE_MANIFEST = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print(f'Wrote {ROOT/"manifest.js"} with {len(artists)} artists.')
