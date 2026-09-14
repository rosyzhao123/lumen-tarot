import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumen Tarot｜手绘塔罗抽牌",
  description: "选择适合问题的牌阵，以手绘塔罗与中文解读整理此刻的感受与视角。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
