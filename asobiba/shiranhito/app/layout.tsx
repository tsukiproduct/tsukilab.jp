import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "知らん人のホームページ集",
  description: "どこか懐かしい、20人の架空の個人ホームページを巡るリンク集。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/asobiba/shiranhito/favicon.svg",
    shortcut: "/asobiba/shiranhito/favicon.svg",
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
