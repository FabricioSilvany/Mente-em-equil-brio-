import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

const body = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Área profissional · Mente em Equilíbrio",
};

export default function ProfissionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${display.variable} ${body.variable}`}>{children}</div>;
}