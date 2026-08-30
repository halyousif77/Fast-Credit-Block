import type { Metadata } from "next";
import GlobalFilter from "@/components/GlobalFilter";
import Header from "@/components/Header";
import { Toaster } from "sonner";
import { Geist, Geist_Mono } from "next/font/google";
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
        <Toaster
          position="top-right"
          richColors
          closeButton
        />

        <Header />

        <GlobalFilter />

        {children}
      </body>
    </html>
  );
}