import type { Metadata, Viewport } from "next";
import GlobalFilter from "@/components/GlobalFilter";
import Header from "@/components/Header";
import MobileRedirect from "@/components/MobileRedirect";
import { Toaster } from "sonner";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
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
  title: "Credit With Route Block",
  description: "Credit Management System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Credit Dashboard",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#071d5c",
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
      <body className="min-h-screen bg-slate-100">
        <I18nProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
          />

          <MobileRedirect />

          <Header />

          <GlobalFilter />

          {children}
        </I18nProvider>
      </body>
    </html>
  );
}