import "./globals.css";

import type { Metadata } from "next";
import QueryProvider from "@/providers/QueryProvider";
import { ChatSocketProvider } from "@/components/Chat/ChatSocketProvider";
import { AuthProvider } from "@/lib/auth/context";

export const metadata: Metadata = {
  title: "Lama Dev X Clone",
  description: "Next.js social media application project",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <QueryProvider>
        <html lang="en">
          <body>
            <ChatSocketProvider>
              {children}
            </ChatSocketProvider>
          </body>
        </html>
      </QueryProvider>
    </AuthProvider>
  );
}