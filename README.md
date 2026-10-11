# Mirage Art Style Evaluation — fixed static webpage package

This package contains the webpage code only. **The `data/` folder is intentionally excluded.** Copy your existing `data/` directory into the project root before building the manifest.

## Expected data layout

For every configured artist:

```text
data/artists/<artist>/
├── artist.json
├── prompts.json
├── references/
├── clean/
│   ├── p01.png ... p04.png
├── protected/
│   ├── glaze/
│   ├── mist/
│   ├── antidb/
│   ├── mirage/
│   ├── metacloak/
│   └── styleguard/
└── removed/
    ├── diffpure/
    │   ├── glaze/ mist/ antidb/ mirage/ metacloak/ styleguard/
    ├── impress++/
    │   └── same six methods
    └── noisy_upscaling/
        └── same six methods
```

Section 4 uses only the six protected methods after removal. No clean image is shown in the robustness grid, and `removed/<attack>/clean/` is not required.

## What was fixed

- Uses the five WikiArt artist folders in `config.json`.
- Uses six protection methods: Glaze, Mist, AntiDB, Mirage, MetaCloak, StyleGuard.
- Uses three removal attacks: DiffPure, Impress++, Noisy Upscaling.
- Supports only four prompt IDs while still making **2 comparisons per method** by reusing prompts across methods.
- Produces **12 pairwise trials** (6 methods × 2 prompts) when all six methods are present.
- Produces **3 robustness grids**, one per removal method.
- Robustness grids use only `removed/<attack>/<method>/<prompt>` for the six configured protection methods.
- Image order and method order are randomized and blinded.
- The builder validates the exact dataset requirements and reports missing methods/prompts.
- Captions remain available for Section 3, but Section 4 uses exactly six robustness questions and does not add a caption-matching question.
- New local-storage/session version prevents stale assignments from the old broken webpage from being reused.
- Consent/evaluation counts are derived from the config instead of hard-coded old values.

## Setup

1. Put this package at your GitHub Pages repository root.
2. Copy your existing `data/` folder beside `index.html`.
3. Check the dataset:

```bash
python3 scripts/check_dataset.py
```

4. Build and validate the manifest:

```bash
python3 scripts/build_manifest.py
```

If a configured image set is missing, the command exits with an error and tells you exactly what is missing. For debugging only, you can still write an incomplete manifest with:

```bash
python3 scripts/build_manifest.py --allow-incomplete
```

5. Test locally:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

## Current intended study configuration

- 5 artists
- 6 protection methods
- 4 prompt IDs per artist
- 2 clean-vs-protected comparisons per method = 12 pairwise screens
- 3 robustness screens: DiffPure, Impress++, Noisy Upscaling
- 6 reference artworks shown for the assigned artist
- 15-second minimum familiarization

`prompts.json` controls prompt text and captions. Example:

```json
[
  {"id":"p01","text":"a mountain by sks","caption":"A mountain landscape."},
  {"id":"p02","text":"a piano by sks","caption":"A piano."},
  {"id":"p03","text":"a shoe by sks","caption":"A shoe."},
  {"id":"p04","text":"a candle by sks","caption":"A candle."}
]
```

If `caption` is empty, the webpage automatically omits the caption-matching question for that trial.

## Important for your current data

At the time this package was prepared, the uploaded dataset had populated Glaze, Mist, AntiDB, MetaCloak, and StyleGuard folders, but the configured **Mirage folders were empty**. Because Mirage is part of the six-method study design, `build_manifest.py` will correctly report this as incomplete until Mirage images are added under both `protected/mirage/` and every `removed/<attack>/mirage/` folder.

## Publishing

Commit these files plus your `data/` folder to the repository root and enable GitHub Pages from the `main` branch. `manifest.js` must be rebuilt whenever the data or config changes.

Responses remain in the participant browser unless `response_endpoint` is configured. Participants can download a JSON response file at completion.


## Section 3 questionnaire (v5)

The pairwise protection evaluation now asks four questions: artist-style similarity, prompt matching, overall visual quality, and visible artifacts/distortions. Each question includes Image A, About the same, and Image B. Pairwise images are displayed as square 512×512 panels. A Back button is available during the main evaluation and final questionnaire so participants can revisit the preceding evaluation screen.

## Section 4 questionnaire (v6)

The robustness evaluation now shows **only the six protected methods** after each removal attack. The clean image is not included in Section 4. The six blinded images correspond to Glaze, Mist, AntiDB, Mirage, MetaCloak, and StyleGuard, with their positions randomized independently for each robustness screen.

Section 4 asks the following six deliberately protection-oriented questions:

1. Which image contains the most visible noise?
2. Which image contains the most visible artifacts or distortions?
3. Which image has the least clear visual details?
4. Which image matches the generation prompt the least?
5. Which image has the lowest overall visual quality?
6. Ignoring overall image quality, which image least resembles the reference artist's style?

The final question is the primary direct comparison of style-protection strength after removal. The other five questions help distinguish style suppression from general image degradation.

Section 4 uses a three-column desktop grid rather than the previous four-column grid. Every image panel is square and preserves the native 512×512 aspect ratio, with a maximum displayed size of 512×512. The grid becomes two columns on medium screens and one column on small screens.

The manifest builder validates robustness using only `removed/<attack>/<method>/<prompt>` for all six configured methods; it no longer requires a clean image for the Section 4 grid.
