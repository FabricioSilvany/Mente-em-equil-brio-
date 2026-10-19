"use client";
 
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./login.module.css";
 
type Role = "cliente" | "profissional";
type Mode = "login" | "signup";
type Message = { text: string; type: "error" | "ok" } | null;
 
/* Ajuste os destinos para as rotas reais do seu projeto */
const ROUTES: Record<Role, string> = {
  cliente: "/cliente",
  profissional: "/profissional",
};
 
const SIDE_COPY: Record<Role, { title: string; text: string }> = {
  cliente: {
    title: "Cuidar da mente começa aqui.",
    text: "Acesse sua conta para acompanhar seu cuidado no seu ritmo.",
  },
  profissional: {
    title: "Atenda com mais tranquilidade.",
    text: "Entre para acompanhar seus clientes e organizar sua rotina.",
  },
};
 
const HEADINGS: Record<Mode, { title: string; sub: string }> = {
  login: { title: "Que bom ver você de novo", sub: "Entre com seu e-mail e senha." },
  signup: { title: "Crie sua conta", sub: "Leva menos de um minuto." },
};
 
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
 
function friendlyError(err: unknown): string {
  const m = (err instanceof Error ? err.message : "").toLowerCase();
  if (m.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (m.includes("already registered")) return "Este e-mail já tem cadastro. Use a aba Entrar.";
  if (m.includes("not confirmed")) return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde um instante e tente de novo.";
  if (m.includes("password")) return "A senha precisa ter pelo menos 8 caracteres.";
  if (m.includes("fetch") || m.includes("network")) return "Sem conexão. Verifique sua internet e tente novamente.";
  return "Não foi possível concluir. Tente novamente.";
}
 
export default function LoginForm() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
 
  const [role, setRole] = useState<Role>("cliente");
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [registro, setRegistro] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<Message>(null);
 
  const isSignup = mode === "signup";
  const isPro = role === "profissional";
 
  /* Já está logado? Vai direto para a área certa. */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const r = data.session?.user.user_metadata?.role as Role | undefined;
      if (r && ROUTES[r]) router.replace(ROUTES[r]);
    });
  }, [supabase, router]);
 
  const changeRole = (r: Role) => { setRole(r); setMsg(null); };
  const changeMode = (m: Mode) => { setMode(m); setMsg(null); };
 
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const mail = email.trim();
 
    if (!validEmail(mail)) return setMsg({ text: "Digite um e-mail válido.", type: "error" });
    if (!password) return setMsg({ text: "Digite sua senha.", type: "error" });
    if (isSignup) {
      if (!name.trim()) return setMsg({ text: "Digite seu nome completo.", type: "error" });
      if (isPro && !registro.trim()) return setMsg({ text: "Informe seu registro profissional.", type: "error" });
      if (password.length < 8) return setMsg({ text: "A senha precisa ter pelo menos 8 caracteres.", type: "error" });
      if (!terms) return setMsg({ text: "Aceite os termos para criar sua conta.", type: "error" });
    }
 
    setLoading(true);
    setMsg(null);
    try {
      if (!isSignup) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (error) throw error;
        const userRole = data.user.user_metadata?.role as Role | undefined;
        if (userRole && userRole !== role) {
          await supabase.auth.signOut();
          setMsg({ text: `Esta conta é de ${userRole}. Troque a opção no topo e tente de novo.`, type: "error" });
          return;
        }
        router.push(ROUTES[role]);
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: mail,
          password,
          options: {
            data: {
              role,
              full_name: name.trim(),
              registro_profissional: isPro ? registro.trim() : null,
            },
            emailRedirectTo: `${location.origin}${ROUTES[role]}`,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push(ROUTES[role]);
          router.refresh();
          return;
        }
        setMsg({ text: "Enviamos um link de confirmação para o seu e-mail. Abra-o para ativar a conta.", type: "ok" });
      }
    } catch (err) {
      setMsg({ text: friendlyError(err), type: "error" });
    } finally {
      setLoading(false);
    }
  }
 
  async function handleForgot() {
    const mail = email.trim();
    if (!validEmail(mail)) {
      return setMsg({ text: "Digite seu e-mail acima para receber o link de redefinição.", type: "error" });
    }
    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${location.origin}/redefinir-senha`,
    });
    if (error) return setMsg({ text: friendlyError(error), type: "error" });
    setMsg({ text: "Se este e-mail tiver cadastro, você receberá um link para criar uma nova senha.", type: "ok" });
  }
 
  const submitLabel = loading
    ? "Aguarde…"
    : `${isSignup ? "Criar conta de" : "Entrar como"} ${role}`;
 
  return (
    <div className={styles.page} data-role={role}>
      <aside className={styles.side}>
        <div className={styles.brand}>Mente em Equilíbrio</div>
        <div className={styles.sideCopy}>
          <h1 className={styles.sideTitle}>{SIDE_COPY[role].title}</h1>
          <p>{SIDE_COPY[role].text}</p>
        </div>
        <div className={styles.balance} aria-hidden="true">
          <i className={styles.c1} />
          <i className={styles.c2} />
        </div>
      </aside>
 
      <main className={styles.main}>
        <div className={styles.card}>
          <div className={styles.roles} role="radiogroup" aria-label="Tipo de acesso">
            <button type="button" role="radio" aria-checked={role === "cliente"} onClick={() => changeRole("cliente")}>
              Sou cliente
            </button>
            <button type="button" role="radio" aria-checked={role === "profissional"} onClick={() => changeRole("profissional")}>
              Sou profissional
            </button>
          </div>
 
          <div className={styles.tabs} role="tablist">
            <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => changeMode("login")}>
              Entrar
            </button>
            <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => changeMode("signup")}>
              Criar conta
            </button>
          </div>
 
          <h2 className={styles.title}>{HEADINGS[mode].title}</h2>
          <p className={styles.sub}>{HEADINGS[mode].sub}</p>
 
          {msg && (
            <div className={`${styles.msg} ${msg.type === "ok" ? styles.ok : styles.error}`} role="status" aria-live="polite">
              {msg.text}
            </div>
          )}
 
          <form onSubmit={handleSubmit} noValidate>
            {isSignup && (
              <div className={styles.field}>
                <label htmlFor="name">Nome completo</label>
                <input id="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
 
            {isSignup && isPro && (
              <div className={styles.field}>
                <label htmlFor="registro">Registro profissional</label>
                <input
                  id="registro"
                  type="text"
                  placeholder="Ex.: CRP 03/12345"
                  autoComplete="off"
                  value={registro}
                  onChange={(e) => setRegistro(e.target.value)}
                />
                <div className={styles.hint}>Usamos para validar seu cadastro antes de liberar o acesso.</div>
              </div>
            )}
 
            <div className={styles.field}>
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
 
            <div className={styles.field}>
              <label htmlFor="password">Senha</label>
              <div className={styles.pw}>
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-pressed={showPw}
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPw ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              {isSignup && <div className={styles.hint}>Mínimo de 8 caracteres.</div>}
            </div>
 
            {!isSignup && (
              <div className={styles.row}>
                <button type="button" className={styles.link} onClick={handleForgot}>
                  Esqueci minha senha
                </button>
              </div>
            )}
 
            {isSignup && (
              <label className={styles.check}>
                <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>Li e aceito os termos de uso e a política de privacidade.</span>
              </label>
            )}
 
            <button className={styles.submit} type="submit" disabled={loading}>
              {submitLabel}
            </button>
          </form>
 
          <p className={styles.foot}>
            Em crise ou precisando de ajuda agora? Ligue 188 (CVV), 24 horas, gratuito.
          </p>
        </div>
      </main>
    </div>
  );
}
 