"use client";

import { useEffect, useState } from "react";
import { createQrisQrDataUrl } from "@/lib/qris";

type QrisModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isConfirming?: boolean;
  medicineName: string;
  quantity: number;
  unit?: string;
  totalAmount: number;
  orderRef?: string;
};

const formatRupiah = (val: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

export default function QrisModal({
  isOpen,
  onClose,
  onConfirm,
  isConfirming = false,
  medicineName,
  quantity,
  unit,
  totalAmount,
  orderRef = "ASU",
}: QrisModalProps) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;
    setLoadingQr(true);

    createQrisQrDataUrl(totalAmount, orderRef)
      .then((url) => {
        if (isSubscribed) {
          setQrUrl(url);
          setLoadingQr(false);
        }
      })
      .catch((err) => {
        console.error("Error generating QR:", err);
        if (isSubscribed) setLoadingQr(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, totalAmount, orderRef]);

  if (!isOpen) return null;

  return (
    <div
      className="detail-backdrop"
      style={{ zIndex: 10000, background: "rgba(9, 34, 21, 0.72)", backdropFilter: "blur(6px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isConfirming) onClose();
      }}
    >
      <div
        className="qris-card"
        style={{
          width: "min(100%, 430px)",
          background: "#ffffff",
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: "0 24px 75px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          animation: "request-success-in 0.22s ease-out",
        }}
      >
        {/* Top QRIS Banner */}
        <div
          style={{
            background: "#e52329",
            padding: "14px 20px 12px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "3px solid #b81419",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontSize: "24px", fontWeight: "900", letterSpacing: "1px", lineHeight: 1 }}>QRIS</span>
            <span style={{ fontSize: "10px", opacity: 0.92, fontWeight: 500 }}>Pembayaran Digital Nasional</span>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 800,
              letterSpacing: "0.5px",
              background: "#ffffff",
              color: "#e52329",
              padding: "3px 8px",
              borderRadius: "5px",
            }}
          >
            GPN
          </span>
        </div>

        {/* Merchant & Order Details */}
        <div style={{ padding: "18px 22px 14px", textAlign: "center", borderBottom: "1px dashed #d8e4db" }}>
          <p style={{ margin: "0 0 2px", fontSize: "11px", color: "#6e8376", fontWeight: 650, letterSpacing: "0.04em" }}>
            MERCHANT RESMI
          </p>
          <h3 style={{ margin: "0 0 4px", fontSize: "19px", color: "#143c2b", fontWeight: 800 }}>
            APOTEK SRI UTAMA
          </h3>
          <p style={{ margin: 0, fontSize: "10px", color: "#8a9c92" }}>
            NMID: ID1020261111001 · Padang
          </p>
        </div>

        {/* QR Code Container */}
        <div style={{ padding: "18px 22px 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              padding: "12px",
              background: "#ffffff",
              borderRadius: "14px",
              border: "1.5px solid #d9e6de",
              boxShadow: "0 6px 18px rgba(0, 0, 0, 0.06)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "220px",
              minWidth: "220px",
            }}
          >
            {loadingQr || !qrUrl ? (
              <div style={{ color: "#087443", fontSize: "12px", fontWeight: 600 }}>Membuat Kode QR...</div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrUrl}
                alt="QRIS Apotek Sri Utama"
                width={210}
                height={210}
                style={{ display: "block", borderRadius: "8px" }}
              />
            )}
          </div>
          <span style={{ fontSize: "10px", color: "#617c6d", marginTop: "8px", fontWeight: 600 }}>
            Mendukung semua m-Banking & e-Wallet (BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay)
          </span>
        </div>

        {/* Bill Summary */}
        <div
          style={{
            margin: "0 20px 16px",
            padding: "12px 16px",
            background: "#f3f8f5",
            borderRadius: "10px",
            border: "1px solid #dce8e0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", color: "#546e5f" }}>Rincian Pembelian:</span>
            <span style={{ fontSize: "12px", color: "#1b3f2c", fontWeight: 700 }}>
              {medicineName} × {quantity} {unit ?? "unit"}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#1b3f2c", fontWeight: 700 }}>Total Pembayaran:</span>
            <span style={{ fontSize: "18px", color: "#087443", fontWeight: 800 }}>
              {formatRupiah(totalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming || loadingQr}
            className="medicine-action"
            style={{
              width: "100%",
              minHeight: "44px",
              fontSize: "13px",
              fontWeight: 750,
              borderRadius: "8px",
              background: "#087443",
              color: "#ffffff",
              cursor: isConfirming || loadingQr ? "not-allowed" : "pointer",
              opacity: isConfirming || loadingQr ? 0.75 : 1,
              border: 0,
              boxShadow: "0 6px 16px rgba(8, 116, 67, 0.2)",
            }}
          >
            {isConfirming ? "⏳ Sedang Mengonfirmasi Pembayaran..." : "✓ Konfirmasi Pembayaran"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            style={{
              background: "transparent",
              border: 0,
              color: "#6b7d72",
              fontSize: "11px",
              fontWeight: 650,
              cursor: isConfirming ? "not-allowed" : "pointer",
              padding: "4px",
            }}
          >
            ← Batal / Ubah Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}
