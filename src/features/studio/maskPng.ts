/** Small grayscale PNG encoder with uncompressed DEFLATE; no Node/DOM globals. */
export function wallMaskPNG(
  wall: Uint8Array,
  width: number,
  height: number,
): Uint8Array {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width > 128 ||
    height > 128 ||
    wall.length !== width * height
  )
    throw new Error("Invalid photo mask size.");
  const u32 = (value: number) => [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ];
  const crc = (bytes: number[]) => {
    let value = 0xffffffff;
    for (const byte of bytes) {
      value ^= byte;
      for (let bit = 0; bit < 8; bit++)
        value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
    return (value ^ 0xffffffff) >>> 0;
  };
  const chunk = (name: string, data: number[]) => {
    const body = [...Array.from(name, (c) => c.charCodeAt(0)), ...data];
    return [...u32(data.length), ...body, ...u32(crc(body))];
  };
  const raw: number[] = [];
  for (let y = 0; y < height; y++) {
    raw.push(0);
    for (let x = 0; x < width; x++) raw.push(wall[y * width + x] ? 0 : 255);
  }
  let a = 1,
    b = 0;
  for (const value of raw) {
    a = (a + value) % 65521;
    b = (b + a) % 65521;
  }
  const length = raw.length;
  const deflate = [
    0x78,
    0x01,
    1,
    length & 255,
    (length >>> 8) & 255,
    ~length & 255,
    (~length >>> 8) & 255,
    ...raw,
    ...u32(((b << 16) | a) >>> 0),
  ];
  return Uint8Array.from([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...chunk("IHDR", [...u32(width), ...u32(height), 8, 0, 0, 0, 0]),
    ...chunk("IDAT", deflate),
    ...chunk("IEND", []),
  ]);
}
