import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { WishlistView } from "@/components/wishlist/WishlistView";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "My Wishlist | ShopMate",
  description: "View and manage your saved products on ShopMate.",
  robots: {
    index: false,
    follow: false,
  },
};

async function WishlistContent() {
  const user = await getSessionUser();

  if (user) {
    return (
      <AccountShell user={user}>
        <WishlistView />
      </AccountShell>
    );
  }

  return <WishlistView />;
}

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-ink-500">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-brand-100 border-t-brand-600" />
          <p className="mt-3 text-sm">Loading wishlist...</p>
        </div>
      }
    >
      <WishlistContent />
    </Suspense>
  );
}
