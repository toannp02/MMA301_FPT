import { constrainPreview, initialPreviewPose, previewBounds } from "../../src/features/preview2d/geometry";

test.each([0.1, 2 / 3, 1, 3, 10])("2D artwork ratio %s fits the viewport at every supported size", (ratio) => {
  const viewport = { width: 390, height: 360 };
  for (const scale of [0.5, 1, 2]) {
    const bounds = previewBounds(viewport, ratio, { ...initialPreviewPose, scale });
    expect(bounds.width / bounds.height).toBeCloseTo(ratio);
    expect(bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.height).toBeLessThanOrEqual(viewport.height);
  }
});

test("dragging beyond either screen edge remains visible", () => {
  const viewport = { width: 390, height: 360 };
  for (const direction of [-10, 10]) {
    const pose = constrainPreview(viewport, 2 / 3, { x: direction, y: direction, scale: 1 });
    const bounds = previewBounds(viewport, 2 / 3, pose);
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.left + bounds.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds.top + bounds.height).toBeLessThanOrEqual(viewport.height);
  }
});

test("size is clamped and resizing after edge placement cannot hide artwork", () => {
  const viewport = { width: 390, height: 360 };
  const pose = constrainPreview(viewport, 2 / 3, { x: 1, y: 1, scale: 9 });
  expect(pose.scale).toBe(2);
  expect(previewBounds(viewport, 2 / 3, pose).left).toBeCloseTo(150);
  expect(constrainPreview(viewport, 2 / 3, { ...pose, scale: -1 }).scale).toBe(0.5);
});

test("unmeasured stage produces no infinite or negative coordinates", () => {
  expect(previewBounds({ width: 0, height: 0 }, 2 / 3, initialPreviewPose)).toEqual({ left: 0, top: 0, width: 0, height: 0 });
  expect(constrainPreview({ width: 0, height: 0 }, 2 / 3, initialPreviewPose)).toEqual(initialPreviewPose);
});
