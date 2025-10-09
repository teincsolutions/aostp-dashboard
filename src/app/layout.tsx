import "@ant-design/compatible";
import "antd/dist/reset.css"; // keep the CSS reset
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AntdConfigProvider } from "@/components/AntdConfigProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AOSTP Admin Dashboard",
  description: "AOSTP Logistics Management System Admin Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <QueryProvider>
          <AntdConfigProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AntdConfigProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
