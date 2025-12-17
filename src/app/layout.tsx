import "@ant-design/compatible";
import "antd/dist/reset.css"; // keep the CSS reset
import type { Metadata } from "next";
import "./globals.css";
import { AntdConfigProvider } from "@/components/AntdConfigProvider";
import { QueryProvider } from "@/components/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "AOSTP Admin Dashboard",
  description: "AOSTP Logistics Management System Admin Dashboard",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
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
