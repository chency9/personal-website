# Background texture provenance

The user supplied `http://127.0.0.1:8124/index.html` on 2026-11-18 as the visual reference for this site's background.

- `aged-paper.jpg`: copied from the reference page's `hose/paper.jpg`.
- Film grain is generated at runtime by `public/vendor/hose-page/hose-page.js`, copied from the reference page's `hose/hose-page.js`. The old static tile is no longer used.

The parchment color, cream surfaces, brown ink, grain opacity, and vignette stops use the reference's `hose/hose-page.css`. A source copy is saved at `public/vendor/hose-page/reference.css`; only its background and film rules are integrated into the site's stylesheet.

The four film layers match the reference: grain (220 px tile, 12 fps, multiply at 0.66 opacity), canvas dust and scratches, vignette, and exposure variation. The content also gets the reference's subpixel gate weave. The layers are siblings of the content, with no isolated blend context, and cannot receive pointer events.

Integration adaptations: the film uses an independent clock because this page's only hose control is below the fold and its clock stops when offscreen; the visible pause control, reduced-motion preference, and hidden document stop motion; exposure changes are limited to 2 Hz with the original opacity range. All assets are served locally.
