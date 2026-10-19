#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
CFG=json.loads((ROOT/'config.json').read_text(encoding='utf-8'))
BASE=ROOT/'data'/'artists'
methods=CFG['methods']; attacks=CFG['attacks']
errors=[]; warnings=[]

for artist in CFG['artists']:
    a=BASE/artist
    if not a.exists():
        errors.append(f'{artist}: artist folder missing')
        continue
    refs=list((a/'references').glob('*')) if (a/'references').exists() else []
    if len([p for p in refs if p.suffix.lower() in {'.png','.jpg','.jpeg','.webp'}]) < CFG.get('reference_count',6):
        errors.append(f'{artist}: fewer than {CFG.get("reference_count",6)} reference artworks')
    prompts_path=a/'prompts.json'
    if not prompts_path.exists():
        errors.append(f'{artist}: prompts.json missing')
        continue
    raw=json.loads(prompts_path.read_text(encoding='utf-8'))
    prompts=raw if isinstance(raw,list) else raw.get('prompts',[])
    ids=[str(p['id']).lower() for p in prompts]
    complete_eff=[]
    complete_rob={x:[] for x in ['no_attack']+attacks}
    for pid in ids:
        clean=a/'clean'/f'{pid}.png'
        if clean.exists() and all((a/'protected'/m/f'{pid}.png').exists() for m in methods):
            complete_eff.append(pid); complete_rob['no_attack'].append(pid)
        for attack in attacks:
            if all((a/'removed'/attack/m/f'{pid}.png').exists() for m in methods):
                complete_rob[attack].append(pid)
    if len(complete_eff)<CFG.get('effectiveness_prompt_count',4):
        errors.append(f'{artist}: only {len(complete_eff)} complete effectiveness prompts')
    for c,arr in complete_rob.items():
        if not arr: errors.append(f'{artist}: no complete robustness set for {c}')

    aq=a/'artwork_quality'
    if not aq.exists():
        errors.append(f'{artist}: artwork_quality folder missing')
    else:
        ids=set()
        for m in methods:
            d=aq/'protected'/m
            if d.exists():
                ids |= {p.stem.lower() for p in d.glob('*.png')}
        good=[]
        for qid in ids:
            original=(aq/'original'/f'{qid}.png')
            fallback=(a/'references'/f'{qid}.png')
            if (original.exists() or fallback.exists()) and all((aq/'protected'/m/f'{qid}.png').exists() for m in methods):
                good.append(qid)
        if len(good)<CFG.get('protected_artwork_trials',2):
            errors.append(f'{artist}: only {len(good)} complete protected-artwork quality sets')

print('Dataset check')
print('============')
for w in warnings: print('WARNING:',w)
for e in errors: print('ERROR:',e)
if errors:
    raise SystemExit(1)
print('OK: dataset satisfies the configured study requirements.')
