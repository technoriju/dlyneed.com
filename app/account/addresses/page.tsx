import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { AddressesView } from "@/components/account/AddressesView";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Addresses | ShopMate",
  description: "Manage your saved delivery addresses on ShopMate.",
  robots: {
    index: false,
    follow: false,
  },
};

async function AccountAddressesContent() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/account/addresses");
  }

  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return (
    <AccountShell user={user}>
      <AddressesView initialAddresses={addresses} />
    </AccountShell>
  );
}

export default function AccountAddressesPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading addresses...</p>
        </div>
      }
    >
      <AccountAddressesContent />
    </Suspense>
  );
}
