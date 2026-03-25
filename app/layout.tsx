import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agribridge — Farmers & buyers in Rwanda",
  description:
    "Bridge farmers with farmers and buyers across Rwanda — including rural areas like Nyabihu, Gakenke, Burera, and Rusizi — to sellers and markets everywhere.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-100 font-sans text-stone-900">
        <AppHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <SiteFooter />
        {/* Chatling.ai assistant — config must run before the embed script */}
        <Script id="chtl-config" strategy="beforeInteractive">
          {`window.chtlConfig = { chatbotId: "9836637727" };`}
        </Script>
        <Script
          id="chtl-script"
          src="https://chatling.ai/js/embed.js"
          strategy="afterInteractive"
          async
          data-id="9836637727"
        />
      </body>
    </html>
  );
}
