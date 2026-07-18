import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知らん人のホームページ集",
  description: "二十人の、まるで知らない人たちが残した個人ホームページを巡る架空のリンク集。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
