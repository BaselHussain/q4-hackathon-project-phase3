import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Taskflow — Modern Task Manager",
  description: "Elegant task management with authentication",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AppProvider>
          {children}
        </AppProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="dark"
        />
      </body>
    </html>
  );
}
