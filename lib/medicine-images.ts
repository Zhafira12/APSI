export const medicineImages: Record<number, string> = {
  1: "/Obat/paracetamol.jpg",
  2: "/Obat/amoxycillin-500mg-capsule-1000x1000.webp",
  3: "/Obat/vitamin-c.png",
  4: "/Obat/obh.png",
  5: "/Obat/promag.png",
  6: "/Obat/betadine.png",
};

export const medicineImagesByName: { pattern: RegExp; image: string }[] = [
  { pattern: /paracetamol/i, image: "/Obat/paracetamol.jpg" },
  { pattern: /amoxicillin|amoxycillin/i, image: "/Obat/amoxycillin-500mg-capsule-1000x1000.webp" },
  { pattern: /vitamin\s*c/i, image: "/Obat/vitamin-c.png" },
  { pattern: /obh/i, image: "/Obat/obh.png" },
  { pattern: /promag/i, image: "/Obat/promag.png" },
  { pattern: /betadine/i, image: "/Obat/betadine.png" },
];

export function medicineImage(
  idOrName?: number | string | null,
  name?: string | null
): string | undefined {
  if (name) {
    const match = medicineImagesByName.find((item) => item.pattern.test(name));
    if (match) return match.image;
  }

  if (typeof idOrName === "string") {
    const match = medicineImagesByName.find((item) => item.pattern.test(idOrName));
    if (match) return match.image;
  }

  if (typeof idOrName === "number" && medicineImages[idOrName]) {
    return medicineImages[idOrName];
  }

  return undefined;
}
