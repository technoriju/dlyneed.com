import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  AdminCouponItem,
  AdminCouponsView,
} from "@/components/admin/AdminCouponsView";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Coupons & Discounts | ShopMate Admin",
  robots: { index: false, follow: false },
};

async function CouponsContent() {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login?next=/admin/coupons");
  }

  const coupons = await db.coupon.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <AdminLayout username={admin.username}>
      <AdminCouponsView initialCoupons={coupons as AdminCouponItem[]} />
    </AdminLayout>
  );
}

export default function AdminCouponsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-xs">Loading coupons...</p>
        </div>
      }
    >
      <CouponsContent />
    </Suspense>
  );
}
