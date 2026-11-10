import ApotekerDashboard from "./assistant-dashboard";
import { requireApoteker } from "@/lib/apoteker-access";
import { getApotekerDashboardData } from "@/lib/assistant-dashboard-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { apoteker } = await requireApoteker();
  const data = await getApotekerDashboardData();
  return <ApotekerDashboard data={data} name={apoteker.nama_pengguna} role={apoteker.role} />;
}
