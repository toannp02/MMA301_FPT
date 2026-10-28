export const cleanName = (value: string) =>
  value
    .trim()
    .replace(/[\u0000-\u001f]/g, "")
    .slice(0, 60);
export const positiveDimension = (n: number) =>
  Number.isFinite(n) && n > 0 && n <= 1000;
