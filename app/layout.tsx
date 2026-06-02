import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quà bí mật 🎁",
  description: "Một món quà sinh nhật được giấu sau lớp mật khẩu nhỏ xíu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
