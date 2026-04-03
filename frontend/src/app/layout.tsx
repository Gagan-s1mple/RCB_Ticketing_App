import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "RCB Ticket Monitor",
  description: "Real-time RCB ticket availability tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
