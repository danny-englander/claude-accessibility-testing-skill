# Accessibility: manual checks

The automated tests (`npm run test:a11y`) cover what a machine can judge. This list covers the rest. Go through it in a real browser at about 390px and 1280px wide, in every theme, before a release or after a redesign. Skip lines for things the site doesn't have, and add lines for its own components.

## Keyboard

- [ ] Put the mouse away and use every page with Tab, Shift+Tab, Enter, Space, Escape and the arrow keys.
- [ ] The Tab order follows the reading order; nothing jumps around the page.
- [ ] The focus ring is easy to see on every control, in every theme, and over images.
- [ ] Every menu, dialog and drawer: focus moves in when it opens and back to its button when it closes; Escape closes it; the page behind can't be reached while a modal is open.
- [ ] Nothing traps focus, and nothing needs a mouse: hover-only menus, drag-only sliders, custom controls.

## Screen reader

Use VoiceOver (macOS: Cmd+F5) or NVDA (Windows, free) on the main pages.

- [ ] The headings list (VoiceOver rotor, NVDA's H key) reads as an outline of the page, with one `h1`.
- [ ] Landmarks (header, nav, main, footer) are there and named where there are two of a kind.
- [ ] Every image's alt text says what it shows or why it is there; decorative images are skipped.
- [ ] Links and buttons make sense out of context ("Read more about pricing", not "Read more").
- [ ] Form fields read their label, whether they are required, and their error.
- [ ] Changes without a page load (results filtered, item added, message sent) are announced.
- [ ] Each page's title is unique and says where you are.

## Seeing

- [ ] Zoom to 200% and to 400% (1280px wide): nothing is cut off or overlaps, and only long tables or code scroll sideways.
- [ ] Text spacing: with line height 1.5, paragraph spacing 2em, letter spacing 0.12em and word spacing 0.16em (a "text spacing" bookmarklet), no text is cut off.
- [ ] Color is never the only signal: errors, links in text, required fields, chart series and status also have text, an icon or an underline.
- [ ] Items axe marked "needs review" (`axe-needs-review.json` in the test report), such as text over images or gradients, have enough contrast.
- [ ] Forced colors (Windows High Contrast, or Chrome DevTools > Rendering > Emulate forced-colors): icons, focus rings, borders and selected states still show.
- [ ] Every theme: reloading shows no flash of the wrong theme; logos and images work on the dark background.

## Motion, time and media

- [ ] With Reduce Motion on (macOS: System Settings > Accessibility > Display), nothing slides, zooms or loops.
- [ ] Anything that moves, blinks or scrolls by itself for more than 5 seconds can be paused.
- [ ] Nothing flashes more than three times a second.
- [ ] Video has captions; audio has a transcript; nothing plays sound by itself.
- [ ] Time limits (sessions, carts, quizzes) can be turned off or extended.

## Touch and pointer

- [ ] On a phone, every control is easy to hit (at least 24 by 24px, better 44) and not crowded.
- [ ] Nothing needs a multi-finger or path gesture without a simple alternative.
- [ ] The page works in both portrait and landscape.

## Forms

- [ ] Every field has a visible label, not only a placeholder.
- [ ] Errors say what is wrong and how to fix it, next to the field, and focus goes to the first one.
- [ ] Fields for personal data have the right `autocomplete` value (name, email, address).
- [ ] Nothing important is lost on an error or a timeout.
