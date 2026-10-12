# Practice image data

Add the practice images using these exact filenames:

- `quality/A.png`, `quality/B.png`
- `style/A.png`, `style/B.png`
- `style/references/01.png`, `02.png`, `03.png`
- `noise/A.png`, `noise/B.png`
- `artifacts/A.png`, `artifacts/B.png`
- `detail/A.png`, `detail/B.png`
- `prompt/A.png`, `prompt/B.png`
- `caption/A.png`, `caption/B.png`

Use realistic practice images that are completely separate from the main experiment.
Do not use any of the five evaluation artists or any image that appears in Sections 3 or 4.

The currently configured correct practice answers are:
- quality: A
- style: B
- noise: B (A should contain more noise)
- artifacts: B (A should contain more artifacts)
- detail: A
- prompt: B (prompt is "A snowy mountain.")
- caption: A (caption is "A red apple on a wooden table.")

If your chosen images imply different answers, update the `right` and `why` fields in
the `TRAIN` array in `app.js`.
