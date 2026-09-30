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
      <header className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between shadow-sm">

        {/* ESQUERDA — logo + nav */}
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image
              src="/logo-conexao.png"
              alt="Colégio Conexão"
              width={140}
              height={48}
              className="object-contain"
              priority
            />
          </Link>

          <nav className="flex gap-5 text-sm font-medium" style={{ color: "#1E3A6E" }}>
            <Link href="/dashboard" className="hover:opacity-70 transition-opacity">
              Dashboard
            </Link>
            <Link href="/solicitacoes" className="hover:opacity-70 transition-opacity">
              Solicitações
            </Link>
            {role !== "SOLICITANTE" && (
              <Link href="/pendentes" className="hover:opacity-70 transition-opacity">
                Pendentes
              </Link>
            )}
            <Link href="/veiculo" className="hover:opacity-70 transition-opacity">
              Veículo
            </Link>
            {role === "ADMIN" && (
              <Link href="/usuarios" className="hover:opacity-70 transition-opacity">
                Usuários
              </Link>
            )}
          </nav>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="font-semibold" style={{ color: "#1E3A6E" }}>{name}</p>
            <p className="text-xs text-slate-400">{roleLabels[role] ?? role}</p>
          </div>
          <SignOutButton />
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