import type { Metadata } from "next";
import { ConvexClientProvider } from "./convex-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Reminder System",
  description: "A CSV-first Notion-style reminder dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
