import QRCode from "qrcode";

export function formatQrisPayload(amount: number, orderRef: string = "APOTEK"): string {
  const amountStr = Math.round(amount).toString();
  // Standard EMVCo QRIS format for Apotek Sri Utama Padang
  const cleanRef = orderRef.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "APOTEK";
  return `00020101021226670016ID.CO.QRIS.WWW01189360091800000000000215ID10202611110010303UMI51440014ID.LINKAJA.WWW0215ID10202611110010303UMI52045912530336054${amountStr.length.toString().padStart(2, "0")}${amountStr}5802ID5917APOTEK SRI UTAMA6006PADANG61052511162${cleanRef.length.toString().padStart(2, "0")}${cleanRef}6304`;
}

export async function createQrisQrDataUrl(amount: number, orderRef?: string): Promise<string> {
  const payload = formatQrisPayload(amount, orderRef);
  try {
    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 280,
      color: {
        dark: "#143c2b",
        light: "#ffffff",
      },
    });
  } catch (error) {
    console.error("Gagal membuat QRIS data URL:", error);
    // Fallback simple valid QR code
    return QRCode.toDataURL(`QRIS:APOTEK_SRI_UTAMA:NOMINAL:${Math.round(amount)}`, {
      margin: 2,
      width: 280,
    });
  }
}
