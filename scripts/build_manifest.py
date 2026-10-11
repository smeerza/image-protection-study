#!/usr/bin/env python3
from pathlib import Path
import argparse, json, sys

ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = ROOT / 'data' / 'artists'
CONFIG_PATH = ROOT / 'config.json'
OUT_PATH = ROOT / 'manifest.js'
IMAGE_EXTS = {'.png','.jpg','.jpeg','.webp'}


def read_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def natural_key(s):
    import re
    return [int(x) if x.isdigit() else x.lower() for x in re.split(r'(\d+)', str(s))]


def image_files(folder):
    if not folder.exists(): return []
    return sorted([p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXTS], key=lambda p:natural_key(p.name))


def add_images(images, artist_dir):
    for p in sorted(artist_dir.rglob('*')):
        if not p.is_file() or p.suffix.lower() not in IMAGE_EXTS: continue
        rel = p.relative_to(artist_dir).as_posix()
        stem_key = str(Path(rel).with_suffix('')).replace('\\','/')
        if stem_key in images:
            raise RuntimeError(f'Duplicate image key with different extensions: {artist_dir.name}/{stem_key}')
        images[stem_key] = './data/artists/' + artist_dir.name + '/' + rel


def build(strict=True):
    if not CONFIG_PATH.exists(): raise RuntimeError(f'Missing {CONFIG_PATH}')
    cfg = read_json(CONFIG_PATH)
    required = ['artists','methods','attacks','comparison_count_per_method','reference_count']
    for k in required:
        if k not in cfg: raise RuntimeError(f'config.json missing key: {k}')

    errors=[]; warnings=[]; artists={}
    pair_count=int(cfg.get('comparison_count_per_method',2))

    for name in cfg['artists']:
        artist_dir=DATA_ROOT/name
        if not artist_dir.exists():
            errors.append(f'{name}: missing artist directory {artist_dir}')
            continue
        prompts_path=artist_dir/'prompts.json'
        artist_json=artist_dir/'artist.json'
        if not prompts_path.exists(): errors.append(f'{name}: missing prompts.json'); continue
        prompts=read_json(prompts_path)
        if not isinstance(prompts,list) or not prompts: errors.append(f'{name}: prompts.json is empty/invalid'); continue
        prompt_ids=[str(p.get('id','')).strip() for p in prompts]
        if any(not p for p in prompt_ids): errors.append(f'{name}: every prompt needs an id')
        if len(set(prompt_ids))!=len(prompt_ids): errors.append(f'{name}: duplicate prompt ids in prompts.json')
        meta=read_json(artist_json) if artist_json.exists() else {}
        display=cfg.get('artist_display_names',{}).get(name) or meta.get('display_name') or name.replace('wikiart_','').replace('-',' ').title()
        refs=image_files(artist_dir/'references')
        if len(refs)<int(cfg['reference_count']): errors.append(f'{name}: only {len(refs)} references; needs {cfg["reference_count"]}')
        images={}; add_images(images,artist_dir)

        # Pairwise: only clean + the corresponding protected method are required.
        for method in cfg['methods']:
            usable=[pid for pid in prompt_ids if f'clean/{pid}' in images and f'protected/{method}/{pid}' in images]
            if len(usable)<pair_count:
                errors.append(f'{name}: {method} has {len(usable)} usable pair prompts; needs {pair_count}')

        # Robustness: Section 4 contains only the six protected methods after removal; no clean control is required.
        for attack in cfg['attacks']:
            usable=[pid for pid in prompt_ids if all(f'removed/{attack}/{m}/{pid}' in images for m in cfg['methods'])]
            if not usable:
                errors.append(f'{name}: no complete robustness prompt for attack {attack}')

        # Captions are optional at runtime, but warn because the caption question is part of the intended protocol.
        if cfg.get('caption_question_enabled',True):
            missing_caps=[p.get('id','?') for p in prompts if not str(p.get('caption','')).strip()]
            if missing_caps:
                warnings.append(f'{name}: blank captions for {", ".join(missing_caps)}; caption question will be hidden for those trials')

        artists[name]={
            'display_name':display,
            'prompts':prompts,
            'references':['./data/artists/'+name+'/references/'+p.name for p in refs],
            'images':images,
        }

    manifest={'config':cfg,'artists':artists}
    OUT_PATH.write_text('window.MIRAGE_MANIFEST = '+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

    for w in warnings: print('WARNING:',w)
    for e in errors: print('ERROR:',e)
    print(f'Wrote {OUT_PATH}')
    print(f'Artists in manifest: {len(artists)}')
    if errors and strict:
        print(f'\nDataset validation failed with {len(errors)} error(s). Fix them before participant use.', file=sys.stderr)
        return 1
    return 0

if __name__=='__main__':
    ap=argparse.ArgumentParser(description='Build and validate the Mirage static-site manifest from data/artists.')
    ap.add_argument('--allow-incomplete',action='store_true',help='Write manifest and return success even when configured data are incomplete (debugging only).')
    args=ap.parse_args()
    raise SystemExit(build(strict=not args.allow_incomplete))
