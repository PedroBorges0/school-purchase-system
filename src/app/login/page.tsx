"use client";
import { signIn } from "next-auth/react";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const submitting = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sessionStorage.clear();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("E-mail ou senha incorretos. Tente novamente.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F0F2F5" }}>
      {/* PAINEL ESQUERDO — identidade visual */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12"
        style={{
          background: "linear-gradient(135deg, #1E3A6E 0%, #2AACAC 100%)",
        }}
      >
        <div className="relative w-80 h-24">
          <Image
            src="/logo-conexao.png"
            alt="Colégio Conexão"
            fill
            className="object-contain"
            priority
          />
        </div>
        <p className="text-white text-center text-base font-light opacity-80 max-w-xs leading-relaxed mt-6">
          Sistema de gestão de requisições de compra
        </p>
        <div className="mt-8 flex gap-4 text-white opacity-50 text-sm tracking-widest uppercase">
          <span>conecta</span>
          <span>•</span>
          <span>ensina</span>
          <span>•</span>
          <span>transforma</span>
        </div>
      </div>

      {/* PAINEL DIREITO — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Logo só aparece no mobile (esconde o painel esquerdo) */}
        <div className="lg:hidden mb-8">
          <Image
            src="/logo-conexao.png"
            alt="Colégio Conexão"
            width={200}
            height={70}
            className="object-contain"
            priority
          />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "#1E3A6E" }}>
              Bem-vindo de volta
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Faça login para acessar o sistema de compras.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-50 transition-all"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:opacity-50 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white rounded-xl py-3 text-sm font-semibold transition-all disabled:opacity-60 mt-2"
              style={{ backgroundColor: "#2AACAC" }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
