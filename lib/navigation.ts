export type SidebarMenuItem = {
  label: string;
  href: string;
  icon: "home" | "prescription" | "medicine" | "report" | "stock" | "search" | "history" | "logout";
  tab?: string;
};

export const SIDEBAR_MENU_BY_ROLE: {
  apoteker: readonly SidebarMenuItem[];
  pelanggan: readonly SidebarMenuItem[];
} = {
  apoteker: [
    { label: "Beranda", href: "/", icon: "home" },
    { label: "Validasi Resep", href: "/apoteker/resep", icon: "prescription" },
    { label: "Data Obat", href: "/apoteker/obat", icon: "medicine" },
    { label: "Laporan", href: "/apoteker/laporan", icon: "report" },
    { label: "Stok Obat", href: "/apoteker/stok", icon: "stock" },
  ],
  pelanggan: [
    { label: "Beranda", href: "/pelanggan", icon: "home", tab: "Beranda" },
    { label: "Cari Obat", href: "/pelanggan?tab=Cari%20Obat", icon: "search", tab: "Cari Obat" },
    { label: "Resep Saya", href: "/pelanggan?tab=Resep%20Saya", icon: "prescription", tab: "Resep Saya" },
    { label: "Riwayat Transaksi", href: "/pelanggan?tab=Riwayat%20Transaksi", icon: "history", tab: "Riwayat Transaksi" },
  ],
} as const;
