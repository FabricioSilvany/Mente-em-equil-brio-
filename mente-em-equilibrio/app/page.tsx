import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import LoginForm from "./LoginForm";
 
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
  title: "Entrar · Mente em Equilíbrio",
};
 
export default function LoginPage() {
  return (
    <div className={`${display.variable} ${body.variable}`}>
      <LoginForm />
    </div>
  );
}