"use client";

export default function PrintButton() {
  return <button className="pharmacist-button primary print-button" type="button" onClick={() => window.print()}>Cetak bukti</button>;
}
