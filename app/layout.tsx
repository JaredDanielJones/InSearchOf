import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ISO Dashboard",
  description: "Find what people want. Source it. Sell it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
