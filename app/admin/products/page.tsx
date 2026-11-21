import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminProductsView } from "@/components/admin/AdminProductsView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Products Management | ShopMate Admin",
  robots: { index: false, follow: false },
};

async function ProductsContent() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login?next=/admin/products");
  }

  const [products, categories] = await Promise.all([
    db.product.findMany({
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const enriched = products.map((p) => ({
    ...p,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
  }));

  return (
    <AdminLayout username={admin.username}>
      <AdminProductsView initialProducts={enriched} categories={categories} />
    </AdminLayout>
  );
}

export default function AdminProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading products...</p>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
