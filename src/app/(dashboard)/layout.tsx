import { ReactNode, Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Toaster } from "sonner";
import SignOutButton from "./components/SignOutButton";

interface LayoutProps {
  children: ReactNode;
}

const roleLabels: Record<string, string> = {
  SOLICITANTE: "Solicitante",
  DIRETOR: "Diretor",
  COMPRAS: "Compras",
  FINANCEIRO: "Financeiro",
  CONTROLADORIA: "Controladoria",
  DIRETOR_GERAL: "Diretor Geral",
  ADMIN: "Administrador",
};

export default async function DashboardLayout({ children }: LayoutProps) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const name = session.user.name ?? "Usuário";

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F0F2F5" }}>

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm">

        {/* BARRA SUPERIOR COM COR DO CONEXÃO */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #1E3A6E 0%, #2AACAC 100%)" }} />

        <div className="px-6 py-3 flex items-center justify-between">

          {/* ESQUERDA — logo grande + nav */}
          <div className="flex items-center gap-10">
            <Link href="/dashboard">
              <Image
                src="/logo-conexao.png"
                alt="Colégio Conexão"
                width={160}
                height={54}
                className="object-contain"
                style={{ mixBlendMode: "multiply" }}
                priority
              />
            </Link>

            <nav className="flex gap-6 text-sm font-medium">
              {[
                { href: "/dashboard", label: "Dashboard", always: true },
                { href: "/solicitacoes", label: "Solicitações", always: true },
                { href: "/pendentes", label: "Pendentes", show: role !== "SOLICITANTE" },
                { href: "/veiculo", label: "Veículo", always: true },
                { href: "/usuarios", label: "Usuários", show: role === "ADMIN" },
              ]
                .filter((item) => item.always || item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative py-1 transition-colors hover:text-teal-600"
                    style={{ color: "#1E3A6E" }}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* DIREITA — usuário + sair */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: "#1E3A6E" }}>
                {name}
              </p>
              <p className="text-xs text-slate-400">{roleLabels[role] ?? role}</p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: "#2AACAC" }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Suspense fallback={<div className="text-sm text-slate-500">Carregando...</div>}>
          {children}
        </Suspense>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
}