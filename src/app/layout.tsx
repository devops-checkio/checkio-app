import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Checkio App",
  description: "Employee management system",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" translate="no" className="notranslate">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
