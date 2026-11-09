import { Suspense } from "react";
import { connection } from "next/server";
import ApotekerDashboard from "./assistant-dashboard";
import { requireApoteker } from "@/lib/apoteker-access";
import { getApotekerDashboardData } from "@/lib/assistant-dashboard-data";

async function AuthenticatedHome() {
  await connection();
  const { apoteker } = await requireApoteker();
  const data = await getApotekerDashboardData();
  return <ApotekerDashboard data={data} name={apoteker.nama_pengguna}/>;
}

export default function Home() {
  return <Suspense fallback={<main className="pharmacist-app" aria-busy="true">Memuat dashboard Apoteker…</main>}><AuthenticatedHome/></Suspense>;
}
