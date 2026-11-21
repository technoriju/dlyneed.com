import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminInventoryView,
  AdminVariantItem,
} from "@/components/admin/AdminInventoryView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Inventory & Stock | ShopMate Admin",
  robots: { index: false, follow: false },
};

async function InventoryContent() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login?next=/admin/inventory");
  }

  const variants = await db.variant.findMany({
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          isActive: true,
          optionName: true,
          category: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: [{ stock: "asc" }, { sku: "asc" }],
  });

  return (
    <AdminLayout username={admin.username}>
      <AdminInventoryView initialVariants={variants as AdminVariantItem[]} />
    </AdminLayout>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading inventory...</p>
        </div>
      }
    >
      <InventoryContent />
    </Suspense>
  );
}
