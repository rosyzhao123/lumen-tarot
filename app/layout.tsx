import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { sitePath } from "./site-path";

export const metadata: Metadata = {
  title: "Lumen Tarot｜手绘塔罗抽牌",
  description: "选择适合问题的牌阵，以手绘塔罗与中文解读整理此刻的感受与视角。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const style = {
    "--tarot-card-back-image": `url("${sitePath("/tarot-card-back.png")}")`,
  } as CSSProperties;

  return <html lang="zh-CN"><body style={style}>{children}</body></html>;
}
