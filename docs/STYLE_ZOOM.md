# Style, sizes and zoom

The photo studio keeps its dark palette and works in native SDK57 and the isolated SDK58 Expo Go companion. No new native dependencies.

- Style -> Image: luminance, contrast, saturation, warmth and hue, reset and room-tone suggestion. Every slider also has accessible plus/minus buttons for fine adjustment.
- Style -> Light: angle (-180 to180 degrees), softness (0 to40), intensity and offset, reset and Occlusion. Shadows are bounded layered 2D samples, shared by preview and PNG; they are not measured physical lighting.
- Style -> Frame: visual Bare, Slim, Classic, Float and Canvas presets, followed by colour, physical frame/mount widths and glazing controls. Float uses a dark gap. Canvas is a thin light edge treatment, not a reconstructed volumetric canvas.
- Artwork dimensions: enter width/height in cm. Proportions stay locked by default; unlock to edit independently, then Apply artwork size. This changes the design's artwork snapshot, not the original catalogue/import record. Oversized art fits the wall; the selected label shows its effective size. A wall photo still needs measured wall dimensions for real scale.
- Zoom room: pinch with two fingers, drag to pan, or use Room zoom (1x to4x). This is view-only and does not modify the wall, artwork or saved data. Reset view returns to the full room. Export temporarily uses the full-room rectangle regardless of zoom/pan.
- Zoom artwork: pinch with two fingers to resize the selected piece; one finger moves it. Artwork scale and corner handles remain available. This changes the saved design. Room zoom and artwork resize are separate modes.

Keep Save separate from PNG export. Camera, native pinch gestures, SVG filter fidelity and OS share require actual iPhone/Android retesting. Browser verification is not physical phone acceptance. Latest real checks and build status: PROGRESS.md and RELEASE.md.
