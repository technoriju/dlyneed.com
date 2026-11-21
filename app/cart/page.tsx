import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "View and manage items in your ShopMate shopping cart.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return <CartView />;
}
