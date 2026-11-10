"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { LoginState } from "@/app/login/actions";

type ActorLoginProps = {
  subtitle?: string;
  brand?: string;
  action: (state: LoginState, formData: FormData) => Promise<LoginState>;
  logoutAction: () => Promise<void>;
  registered?: boolean;
};

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 17H5V5h12v5M9 12l-5 5 5 5M4 17h11a5 5 0 0 0 5-5v-1" />
    </svg>
  );
}

export default function ActorLogin({
  subtitle = "Silahkan Login Untuk Melanjutkan",
  brand = "APOTEK SRI UTAMA",
  action,
  logoutAction,
  registered = false,
}: ActorLoginProps) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <main className="login-shell">
      <section className="login-brand-panel" aria-label={brand}>
        <div className="login-brand-copy">
          <div className="login-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="8" width="14" height="8" rx="4" transform="rotate(-45 12 12)" />
              <path d="m9.2 14.8 5.6-5.6" />
            </svg>
          </div>
          <p>{brand}</p>
        </div>
        <div className="login-pharmacy-photo" role="img" aria-label="Interior apotek dengan rak obat yang tertata" />
        <p className="login-brand-tagline">Sehat Bersama, Setiap Saat</p>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-card-heading">
            <p className="login-eyebrow">APOTEK SRI UTAMA</p>
            <h1>SELAMAT DATANG</h1>
            <p className="login-subtitle">{subtitle}</p>
          </div>

          <form className="login-form" action={formAction}>
            <div className="login-field">
              <label htmlFor="username">
                USERNAME ATAU EMAIL <span aria-hidden="true">*</span>
              </label>
              <input
                autoComplete="username"
                id="username"
                name="username"
                placeholder="Masukkan username atau email"
                required
                type="text"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">
                PASSWORD <span aria-hidden="true">*</span>
              </label>
              <input
                autoComplete="current-password"
                id="password"
                name="password"
                placeholder="Masukkan password"
                required
                type="password"
              />
            </div>

            <p className="login-required-note"><span aria-hidden="true">*</span> Wajib diisi</p>
            {registered && <p className="register-success" role="status">Akun berhasil didaftarkan. Silakan login.</p>}
            {state?.error ? (
              <p className="login-error" role="alert">{state.error}</p>
            ) : null}
            <button className="login-submit" type="submit" disabled={pending}>
              {pending ? "MEMERIKSA..." : "LOGIN"}
            </button>
          </form>
          <p className="register-login-link">Belum memiliki akun? <Link href="/register">Daftar Sekarang</Link></p>
        </div>
      </section>

      <form action={logoutAction} className="login-logout-form">
        <button className="login-logout" type="submit" aria-label="Keluar">
          <LogoutIcon />
        </button>
      </form>
    </main>
  );
}
