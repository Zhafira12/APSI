import type { Metadata } from "next";
import ActorLogin from "@/app/components/actor-login";
import { login, logout } from "./actions";

export const metadata: Metadata = {
  title: "Login | Apotek Sri Utama",
  description: "Masuk ke sistem Apotek Sri Utama.",
};

export default function LoginPage() {
  return <ActorLogin action={login} logoutAction={logout} />;
}
