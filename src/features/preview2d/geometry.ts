export interface PreviewViewport { width: number; height: number }
export interface PreviewPose { x: number; y: number; scale: number }
export const initialPreviewPose: PreviewPose = { x: 0.5, y: 0.5, scale: 1 };
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

// Coordinates are fractions of the screen, never real-world measurements.
export function previewBounds(viewport: PreviewViewport, ratio: number, pose: PreviewPose) {
  if (viewport.width <= 0 || viewport.height <= 0 || !Number.isFinite(ratio) || ratio <= 0)
    return { left: 0, top: 0, width: 0, height: 0 };
  const baseWidth = Math.min(viewport.width * 0.45, viewport.height * 0.5 * ratio);
  const width = baseWidth * clamp(pose.scale, 0.5, 2);
  const height = width / ratio;
  return {
    width, height,
    left: clamp(pose.x * viewport.width - width / 2, 0, viewport.width - width),
    top: clamp(pose.y * viewport.height - height / 2, 0, viewport.height - height),
  };
}

export function constrainPreview(viewport: PreviewViewport, ratio: number, pose: PreviewPose): PreviewPose {
  const bounds = previewBounds(viewport, ratio, pose);
  return {
    x: viewport.width > 0 ? (bounds.left + bounds.width / 2) / viewport.width : 0.5,
    y: viewport.height > 0 ? (bounds.top + bounds.height / 2) / viewport.height : 0.5,
    scale: clamp(pose.scale, 0.5, 2),
  };
}
