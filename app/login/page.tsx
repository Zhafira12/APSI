import type { Metadata } from "next";
import { Suspense } from "react";
import LoginContent from "./LoginContent";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login | Apotek Sri Utama",
  description: "Masuk ke sistem Apotek Sri Utama.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Memuat halaman login...</div>}>
      <LoginContent />
    </Suspense>
  );
}
