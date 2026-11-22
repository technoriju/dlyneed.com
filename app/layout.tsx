import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import { CartProvider } from "@/components/cart/CartContext";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://shopmate.com"),
  title: { default: "ShopMate – Quality Products, Best Prices in India", template: "%s | ShopMate" },
  description: "Shop quality electronics, fashion, home essentials, beauty, and sports at ShopMate with fast India delivery.",
  alternates: {
    canonical: "./",
    languages: {
      "en-IN": "/",
    },
  },
  openGraph: {
    title: "ShopMate – Quality Products, Best Prices in India",
    description: "Shop quality electronics, fashion, home essentials, beauty, and sports at ShopMate with fast India delivery.",
    url: "https://shopmate.com",
    siteName: "ShopMate",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopMate – Quality Products, Best Prices in India",
    description: "Shop quality electronics, fashion, home essentials, beauty, and sports at ShopMate with fast India delivery.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col">
        <ToastProvider>
          <CartProvider>
            <Header />
            <main
              id="main"
              className="mx-auto w-full max-w-[1200px] flex-1 px-3.5 sm:px-4 pt-4 sm:pt-7 pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-16"
            >
              {children}
            </main>
            <Suspense fallback={null}>
              <BottomNav />
            </Suspense>
            <Footer />
          </CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
