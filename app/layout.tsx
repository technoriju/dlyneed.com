import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "ShopMate", template: "%s | ShopMate" },
  description: "Your one-stop shop for quality products at the best prices.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={jakarta.variable}>
      <body className="flex min-h-dvh flex-col">
        <Header />
        <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-4 pt-7 pb-[88px]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
