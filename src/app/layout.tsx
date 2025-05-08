import "./globals.css";

import type { Metadata } from "next";
import QueryProvider from "@/providers/QueryProvider";
import { ChatSocketProvider } from "@/components/Chat/ChatSocketProvider";
import { AuthProvider } from "@/lib/auth/context";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "DapDip - სოციალური პლატფორმა",
  description: "ქართული სოციალური მედიის პლატფორმა",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <QueryProvider>
        <html lang="ka">
          <body className="bg-background text-white">
            <ChatSocketProvider>
              <Header />
              <div className="mt-16">
                {children}
              </div>
            </ChatSocketProvider>
          </body>
        </html>
      </QueryProvider>
    </AuthProvider>
  );
}