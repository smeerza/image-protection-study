# Art Style Protection Study — redesigned GitHub Pages version

This version keeps the visual language and familiarization page from the previous website, shortens onboarding, reduces practice to four questions, adds direct protected-artwork quality evaluation with magnification, changes protection effectiveness to seven-image sets, and simplifies robustness to one style-removal question.

## Study flow

1. Consent
2. Cloudflare Turnstile human verification
3. Artist familiarization — six large reference artworks
4. Four short practice questions
5. Protected artwork quality — original + six protected versions, with hover magnifier and click-to-enlarge
6. Protection effectiveness — four prompts, each with 7 anonymous outputs (clean + six protection methods)
7. Robustness — four anonymous conditions internally: protected/no-removal, DiffPure, Noisy Upscaling, IMPRESS++; each page shows six protected-method outputs and asks one question: which image least resembles the reference artist's style?
8. Completion and Cloudflare response submission

No final AI-attitude questionnaire is included.

## Existing data hierarchy is preserved

Keep your current directories exactly as they are:

```text
data/artists/<artist>/
├── artist.json
├── prompts.json
├── references/
├── clean/
├── protected/
│   ├── glaze/
│   ├── mist/
│   ├── antidb/
│   ├── mirage/
│   ├── metacloak/
│   └── styleguard/
└── removed/
    ├── diffpure/
    ├── impress++/
    └── noisy_upscaling/
```

The only additional material needed for the **direct protected-artwork-quality task** is a sibling folder. Existing folders are not renamed or moved:

```text
data/artists/<artist>/artwork_quality/
├── original/
│   ├── p01.png
│   └── p02.png
└── protected/
    ├── glaze/p01.png ...
    ├── mist/p01.png ...
    ├── antidb/p01.png ...
    ├── mirage/p01.png ...
    ├── metacloak/p01.png ...
    └── styleguard/p01.png ...
```

If `artwork_quality/original/p01.png` is absent, the code falls back to `references/p01.png`. This means you can reuse a reference artwork as the original if it is the exact image that was protected.

## Practice-image paths

The previous practice hierarchy is also preserved. This redesign uses only these existing folders:

```text
data/practice/quality/A.png
data/practice/quality/B.png

data/practice/style/A.png
data/practice/style/B.png
data/practice/style/references/01.png
data/practice/style/references/02.png
data/practice/style/references/03.png

data/practice/prompt/A.png
data/practice/prompt/B.png
```

## Build the manifest

After placing your private `data/` folder next to `index.html`:

```bash
python3 scripts/check_dataset.py
python3 scripts/build_manifest.py
```

Then test locally:

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Cloudflare response collection

Your existing endpoint is preserved in `config.json`:

```json
"response_endpoint": "https://mirage-response-api.irfanmeerza00185.workers.dev/submit"
```

Responses are autosaved there during the study and submitted again at completion.

## Cloudflare Turnstile

`config.json` contains:

```json
"turnstile_site_key": "1x00000000000000000000AA",
"turnstile_verify_endpoint": ""
```

The included site key is Cloudflare's development/test key so the UI can be tested immediately. Replace it with your production Turnstile site key before recruitment.

The page gates study entry on a successful Turnstile callback. For production-grade verification, set `turnstile_verify_endpoint` to your Worker route that validates the token server-side. The browser sends:

```json
{
  "type": "turnstile_verify",
  "token": "...",
  "pid": "p_..."
}
```

and expects an HTTP 2xx response with JSON such as `{ "success": true }`.

## GitHub Pages

Commit the project files plus your data and generated `manifest.js`. In GitHub:

**Settings → Pages → Deploy from a branch → main → /(root)**

`.nojekyll` is included.

## Important blinding behavior

Participants never see protection-method names or robustness/removal-method names. Internally, the saved response JSON still records the true method and condition so the results can be analyzed later.


## Participant demographics restored

After consent + Turnstile verification and before artist familiarization, the site now collects:
- Optional name
- Optional profile image (compressed client-side)
- Art background
- Familiarity with visual-art evaluation
- Familiarity with generative AI
- Frequency of generative-AI use
- Familiarity with AI style mimicry
- Conditional artist-experience questions for art students/freelance/professional artists

The final attitudes questionnaire remains removed. These fields are included in the normal response payload sent to the configured Cloudflare endpoint.
