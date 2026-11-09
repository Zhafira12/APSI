export const medicineImages: Record<number, string> = {
  1: "/Obat/paracetamol.jpg",
  2: "/Obat/amoxycillin-500mg-capsule-1000x1000.webp",
  3: "/Obat/cetirizine%2010%20mg.jpg",
  4: "/Obat/omeprazole-20mg-domperidone-10mg-capsule-1000x1000.webp",
  5: "/Obat/vitacimin.jpeg",
  6: "/Obat/PARACETAMOL-750-MG-scaled.webp",
};

export function medicineImage(id: number) {
  return medicineImages[id];
}
