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
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#F0F2F5" }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-conexao.png"
            alt="Colégio Conexão"
            width={200}
            height={70}
            className="object-contain"
            priority
          />
        </div>

        <div className="mb-6">
          <h1 className="text-xl font-bold text-center" style={{ color: "#1E3A6E" }}>
            Sistema de Compras
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Faça login para acessar sua conta.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <input
              type="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
              style={{ outline: "none" }}
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px #2AACAC44"}
              onBlur={e => e.target.style.boxShadow = "none"}
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
              onFocus={e => e.target.style.boxShadow = "0 0 0 2px #2AACAC44"}
              onBlur={e => e.target.style.boxShadow = "none"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#2AACAC" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}