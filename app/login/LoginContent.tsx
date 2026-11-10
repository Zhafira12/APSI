"use client";

import { useSearchParams } from "next/navigation";
import ActorLogin from "@/app/components/actor-login";
import { login, logout } from "./actions";

export default function LoginContent() {
  const searchParams = useSearchParams();

  return (
    <ActorLogin
      action={login}
      logoutAction={logout}
      registered={searchParams.get("registered") === "1"}
    />
  );
}
