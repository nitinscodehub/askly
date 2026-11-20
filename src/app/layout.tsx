import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Askly — RAG Knowledge Assistant",
  description:
    "Ask questions about your documents and get streaming AI answers with cited sources, powered by Neon AI Gateway.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
