import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { ProfileView } from "@/components/account/ProfileView";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Profile | ShopMate",
  description: "View and edit your ShopMate profile.",
  robots: {
    index: false,
    follow: false,
  },
};

async function AccountContent() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/account");
  }

  const orderCount = await db.order.count({
    where: { userId: user.id },
  });

  return (
    <AccountShell user={user}>
      <ProfileView initialUser={user} orderCount={orderCount} />
    </AccountShell>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading profile...</p>
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
