---
name: rubber-hose-ui
description: Build, change or wire in a UI control that is a 1930s rubber-hose cartoon character (a painted body with a face, noodle limbs drawn in code, white gloves, big shoes, squash and stretch, hand-lettered sound effects), using the Rubber Hose UI core. Use when asked to add one of the hose-* components to an app, to change how one reacts, or to make a new control in the same style. Covers the core's drawing helpers, the rules the set follows about hands, limbs and joins, and the frame-by-frame look that has to happen before calling it done.
---

# Rubber Hose UI

A Rubber Hose control is an ordinary control (a button, a switch, a slider) who is a cartoon character. The control is the character: the button is a red dome who gets bopped, the slider is a trombone whose slide is the track. A real control lies over the drawing, so it still works with a keyboard and a screen reader.

This skill is the workflow the set was made by. It comes with four things:

- `core.js` — the shared core: the clock, painted layers, noodle limbs, gloves, shoes, lettering, and `Base`, a custom-element base class.
- `starter.html` and `art/` — the smallest whole example, a favourite button who is a star. Copy it to start a new one.
- `look.mjs` — stops the clock, steps a reaction to chosen moments and saves the frames side by side, so you can read them.

If the job is only to put an existing component into an app, skip to **Wire it in** and **Check it**.

## 1. Decide four things before drawing

1. **The control.** It must still be that control with the drawing taken away: a real `<button>`, `<input>` or `role="switch"` inside, with keys and focus.
2. **Who he is.** Pick an object that already does the control's job, so the gag explains the control: a toaster for a toast, a thermometer for progress, a lightbulb for a switch. If you have to explain the joke, pick again.
3. **Two drawings.** Nearly every character needs a resting face and a reacting one (asleep and lit, grinning and squashed, straining and relieved). Decide which two before generating anything.
4. **What is painted and what is code.** Bodies, faces, gloves, shoes, props and lettering are painted layers. Limbs are code, because a rubber-hose limb is a thick ink line with no elbow and has to stretch as far as the control needs. Anything that tracks the value (a slide, a fill, a number) is code too.

## 2. The core

Load `core.js` and everything is on `window.RubberHose`:

- **The clock:** `now` (seconds), `calm` (reduced motion), `paused` and `advance(dt)` for stepping by hand. `FPS` is 24; count time since an event in drawings: `k = (t - at) * FPS`.
- **Motion:** `ring(k)` is a spring that has just been let go (1 at `k = 0`, ringing down to 0); use it for every squash, pop and landing. `beat(t, phase)` goes 0, 1, 0 once a beat; everything alive bounces to it, each character a little off it. `ease.out`, `ease.inOut`, `ease.back`.
- **Layers:** `addArt({ name: url })`, `art(name)`, and `place(g, layer, x, y, width, { ax, ay, rot, sx, sy, flip })`, which draws a layer with its anchor on a point and squashes it about that anchor.
- **Limbs:** `hose(g, x0, y0, x1, y1, sag, width, to)` is one limb. `arm(g, glove, ...)` is an arm with a hand; `reach()` and `hand()` are its two halves, for when the body has to be drawn between them. `leg(g, ...)` is a leg that goes into a shoe.
- **Gloves:** four of them, in the core: `palm` (open, from the inside), `glove` (open, from the back), `fist` (from the front, thumb across) and `knuckle` (from the back). `hand()` mirrors the layer so it is the correct left or right hand.
- **Effects:** `ticks()` (short ink strokes round a point), `burst()` (copies of a layer thrown out, leaving by shrinking), `sfx()` (lettering that lands a size too big, settles, shakes and leaves by shrinking).
- **Lettering:** `write(g, text, x, y, size)`, and `fitSize()` and `setType()` to shrink a label to fit. `FACE` is the hand-lettering face; `face` goes to 1 when it has loaded, so measure again then.
- **The base class:** extend `Base`, give it `render()` (the shadow HTML, with a `.hit` control over the drawing), `setup()` (listeners and state, and it sets `this.frame = (t, dt) => { ... }`), and optionally `size()` and `static css`. `this.g` is the canvas, 300 by 210 unless `size()` says otherwise; call `g.begin()` at the top of each frame. `this.say(text)` is the line he says. `static formAssociated = true` gets `this.internals` for forms.

## 3. The rules

These are the corrections that came up most, nearly all of them about joins. Check each one at four times the size.

- **Limbs start inside the body.** Begin every arm and leg well inside the body's outline and draw the body over it, so the root never shows. If a limb's first few pixels are visible beside the body, it looks detached.
- **Where the hand is in front of the body, split the arm.** Draw `reach()`, then the body, then `hand()`. For a hand on a hip or on something the character holds, this is the only order that works.
- **An arm goes into the cuff.** It ends inside the glove's cuff and arrives pointing along the hand, which `arm()` does for you. Arms are about a quarter of the glove's width.
- **Thumbs point at the body, or up.** A thumb on the outside is the wrong hand.
- **Show the right side of the hand.** An open hand held toward the viewer shows the palm (plain creases). A fist resting on a hip shows the back (three dart lines). A fist thrown up in the air has turned to face you.
- **Things go into things.** A leg goes into the opening of the shoe, not behind the shoe. A slide's tubes come out of the openings on the horn. Toast comes out of the slot, in front of the toaster's back rim. Draw the container first, then the part, cut off along the front edge of the opening.
- **A hand holds what it holds.** Give the thing a handle and wrap the fist round it, with the handle showing above and below the fingers. A hand lying on top of a thing is not holding it.
- **Everything drawn in code gets its ink line,** on every edge, open ends included.
- **Squash keeps volume,** and squashes about the feet, not the middle.
- **Things leave by shrinking,** not by fading. An effect's opacity does not change.
- **One sound-effect word per reaction,** on the hit: BOP!, CLICK!, TOOT!, SPLAT!, POP!, DING!, PHEW!, TWEET!. Keep it clear of anything the user reads.
- **Legs only where they help.** A character who has to travel along a field or lie on his side is better without them.
- **The film belongs to the page.** Grain, dust, flicker and gate weave are the gallery's, not the component's.
- **Reduced motion.** Read `fx.calm` in `frame()` and go straight to each end state. Make sure the state still changes.

## 4. Painting the layers

- Generate one concept sheet of the whole set first and use it as the style reference for every layer after, so they share a line and a palette.
- Ask for the body only: "NO arms, NO legs, NO hands and NO feet", isolated on a transparent background, no shadow, no motion lines, no text. Ask for the two drawings side by side in one image so they match.
- Ask for an object's openings and handles to be visible and empty (an empty slot, open tube ends), because that is where the code-drawn parts go in.
- Trim each layer to its pixels and scale it to about two and a half times the size it is drawn at. Then measure, on the layer, where the limbs attach and where the openings are, as fractions of the layer, and put those numbers in the code.
- The repo's [making-of](https://github.com/finktheartist/rubber-hose-ui/tree/main/making-of) has every prompt and the cutting script.

## 5. Look before you say it is done

A component that runs without errors has told you nothing about how it reacts or how its joins look.

1. Serve the folder and run `look.mjs` on the page, with `--act` to press, click or drag at the right moment:

   ```sh
   node look.mjs "http://localhost:8000/starter.html" --select fave-button --act "0:document.querySelector('fave-button').shadowRoot.querySelector('button').click()" --times 0,0.04,0.08,0.17,0.3,0.6
   ```

2. Open the sheet and read each frame: is the hit frame clear, does the lettering cover anything, does each effect leave by shrinking.
3. Run it again with `--zoom 3` on a resting frame and check every join against the rules above.
4. Fix what you see and look again. Expect several rounds.

## 6. Wire it in

- **One file per component.** Each component file carries a copy of the core between its `// >>> hose core` markers and its own layers between its `// >>> art` markers, so it works on its own; the first one loaded sets `window.RubberHose`, the rest reuse it. After changing the core or a layer, run `node tools/build.mjs` in the repo.
- **Load it with a plain script tag,** not as a module, and do not split or rewrite it.
- **Attributes and properties for state, events for what happened:** `change` for value controls (they also work in forms), `click` for the button, `hose:done` for progress.
- **Size it with CSS `width`.** The drawing scales to fit, hit area and text included.
- **Do not edit the drawing code to restyle someone else's component.** Say what needs to look different.

## 7. Check it

Use it the way a person would, in a real browser, and report each separately.

- **Pointer and touch:** real presses and drags sent through the DevTools protocol (`Input.dispatchTouchEvent`, `Input.dispatchMouseEvent`), not calls into the code. `tools/test.mjs` in the repo does this for every component.
- **Keyboard:** Tab to it, then the keys that should work it.
- **Two widths:** a desktop width and 390 pixels, with no sideways scroll.
- **Forms:** if it has a value, `new FormData(form)` should contain it.

## 8. Say what is true

- **What it does now.**
- **What you checked, and how.** "Stepped frame by frame with look.mjs" is not "watched it at real speed". Say which.
- **What is still weak.** Name the joins or beats that do not read.
