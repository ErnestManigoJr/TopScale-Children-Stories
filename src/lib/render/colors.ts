const COLOR_NAME_HEX: Record<string, string> = {
  "warm orange": "#F4A259",
  orange: "#F4A259",
  cream: "#FFF3D6",
  "soft red": "#E8735C",
  "pale blue": "#BEE3F4",
  white: "#FFFFFF",
  silver: "#D9DEE3",
  "golden yellow": "#F6C445",
  "soft yellow": "#FDE9A8",
  "soft brown stitching": "#B98452",
  "warm coral": "#F2836B",
  "soft teal": "#7FC7B8",
  "light blue": "#A9D8F0",
  "sky blue": "#8FCBEE",
};

function hashHex(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return hslToHex(hue, 65, 62);
}

function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function colorNameToHex(name: string): string {
  const key = name.trim().toLowerCase();
  return COLOR_NAME_HEX[key] ?? hashHex(key);
}

export function paletteToHex(palette: string[], fallbackSeed: string): { primary: string; secondary: string } {
  const primary = palette[0] ? colorNameToHex(palette[0]) : hashHex(fallbackSeed);
  const secondary = palette[1] ? colorNameToHex(palette[1]) : hashHex(`${fallbackSeed}-2`);
  return { primary, secondary };
}
