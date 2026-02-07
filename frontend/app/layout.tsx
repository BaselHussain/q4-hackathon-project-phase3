import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import AppProvider from "@/components/AppProvider";
import { Toaster } from "sonner";
import { RootLayoutClient } from "./RootLayoutClient";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AppProvider>
          <RootLayoutClient>
            {children}
          </RootLayoutClient>
        </AppProvider>
        <Toaster
          position="top-right"
          richColors
          closeButton
        />
        {/* Load ChatKit web component from OpenAI CDN */}
        <Script
          src="https://cdn.platform.openai.com/deployments/chatkit/chatkit.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
