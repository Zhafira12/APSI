import type { Metadata } from "next";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Daftar Akun | Apotek Sri Utama",
  description: "Daftarkan akun pelanggan Apotek Sri Utama.",
};

export default function RegisterPage() {
  return <RegisterForm/>;
}
