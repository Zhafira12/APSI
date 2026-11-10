"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { registerCustomer } from "./actions";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerCustomer, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  return <main className="login-shell register-shell">
    <section className="login-brand-panel register-brand-panel" aria-label="Apotek Sri Utama">
      <div className="register-brand-title">APOTEK SRI UTAMA</div>
      <div className="login-pharmacy-photo" role="img" aria-label="Interior apotek dengan rak obat yang tertata" />
    </section>
    <section className="login-form-panel register-form-panel">
      <div className="register-card">
        <header className="login-card-heading register-heading">
          <h1>DAFTAR AKUN</h1>
          <p className="login-subtitle">Daftar Untuk Menggunakan Layanan Apotek Sri Utama</p>
        </header>
        <form className="login-form register-form" action={formAction}>
          <div className="login-field"><label htmlFor="register-name">NAMA LENGKAP <span aria-hidden="true">*</span></label><input autoComplete="name" id="register-name" name="nama_pengguna" maxLength={100} placeholder="Masukkan nama lengkap Anda" required/></div>
          <div className="login-field"><label htmlFor="register-username">USERNAME <span aria-hidden="true">*</span></label><input autoComplete="username" id="register-username" name="username" minLength={3} maxLength={50} pattern="[A-Za-z0-9][A-Za-z0-9._-]{2,49}" placeholder="Buat username" required/><small>3–50 karakter: huruf, angka, titik, _ atau -</small></div>
          <div className="login-field"><label htmlFor="register-email">EMAIL <span aria-hidden="true">*</span></label><input autoComplete="email" id="register-email" name="email" type="email" maxLength={50} placeholder="Masukkan email aktif" required/></div>
          <div className="login-field"><label htmlFor="register-phone">NOMOR TELEPON <span aria-hidden="true">*</span></label><input autoComplete="tel" id="register-phone" name="no_hp" type="tel" inputMode="tel" maxLength={20} pattern="(\+62|62|0)8[1-9][0-9]{6,11}" placeholder="Masukkan nomor telepon aktif" required/></div>
          <div className="login-field"><label htmlFor="register-password">PASSWORD <span aria-hidden="true">*</span></label><div className="register-password-wrap"><input autoComplete="new-password" id="register-password" name="password" type={showPassword ? "text" : "password"} minLength={10} maxLength={72} placeholder="Minimal 10 karakter" required/><button type="button" className="password-visibility" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}>{showPassword ? "Sembunyikan" : "Lihat"}</button></div></div>
          <div className="login-field"><label htmlFor="register-confirm">KONFIRMASI PASSWORD <span aria-hidden="true">*</span></label><div className="register-password-wrap"><input autoComplete="new-password" id="register-confirm" name="konfirmasi_password" type={showConfirmation ? "text" : "password"} minLength={10} maxLength={72} placeholder="Masukkan kembali password" required/><button type="button" className="password-visibility" onClick={() => setShowConfirmation((value) => !value)} aria-label={showConfirmation ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}>{showConfirmation ? "Sembunyikan" : "Lihat"}</button></div></div>
          <p className="login-required-note"><span aria-hidden="true">*</span> Wajib diisi</p>
          {state?.error && <p className="login-error" role="alert">{state.error}</p>}
          <button className="login-submit" type="submit" disabled={pending}>{pending ? "MEMPROSES..." : "DAFTAR SEKARANG"}</button>
        </form>
        <p className="register-login-link">Sudah memiliki akun? <Link href="/login">Login</Link></p>
      </div>
    </section>
    <Link href="/login" className="login-logout register-back" aria-label="Kembali ke halaman login"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6M9 12h12"/></svg></Link>
  </main>;
}
