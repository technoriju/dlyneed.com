import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/WishlistView";

export const metadata: Metadata = {
  title: "My Wishlist",
  description: "View and manage your saved products on ShopMate.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WishlistPage() {
  return <WishlistView />;
}
