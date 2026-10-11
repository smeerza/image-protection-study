#!/usr/bin/env python3
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'/'artists'
CFG=json.loads((ROOT/'config.json').read_text())
EXTS={'.png','.jpg','.jpeg','.webp'}
for artist in CFG['artists']:
    a=DATA/artist
    print('\n'+'='*90+'\n'+artist+'\n'+'='*90)
    if not a.exists(): print('MISSING artist folder'); continue
    for rel in ['clean','protected','removed','references']:
        p=a/rel
        if not p.exists(): print('MISSING',rel)
    prompts=json.loads((a/'prompts.json').read_text()) if (a/'prompts.json').exists() else []
    ids=[p.get('id') for p in prompts]
    print('prompts:',ids)
    print('references:',len([p for p in (a/'references').iterdir() if p.is_file() and p.suffix.lower() in EXTS]) if (a/'references').exists() else 0)
    for m in CFG['methods']:
        p=a/'protected'/m
        n=len([x for x in p.iterdir() if x.is_file() and x.suffix.lower() in EXTS]) if p.exists() else 0
        print(f'protected/{m}: {n}')
    for attack in CFG['attacks']:
        for m in CFG['methods']:
            p=a/'removed'/attack/m
            n=len([x for x in p.iterdir() if x.is_file() and x.suffix.lower() in EXTS]) if p.exists() else 0
            print(f'removed/{attack}/{m}: {n}')
