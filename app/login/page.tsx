import type { Metadata } from "next";
import ActorLogin from "@/app/components/actor-login";
import { login, logout } from "./actions";

export const metadata: Metadata = {
  title: "Login | Apotek Sri Utama",
  description: "Masuk ke sistem Apotek Sri Utama.",
};

type Props = { searchParams: Promise<{ registered?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  return <ActorLogin action={login} logoutAction={logout} registered={params.registered === "1"} />;
}
