import { ReactNode, Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
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
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">

        {/* ESQUERDA */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-lg text-slate-800">
            Sistema de Compras
          </Link>

          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/dashboard" className="hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/solicitacoes" className="hover:text-blue-600">
              Solicitações
            </Link>
            {role !== "SOLICITANTE" && (
              <Link href="/pendentes" className="hover:text-blue-600">
                Pendentes
              </Link>
            )}
            <Link href="/veiculo" className="hover:text-blue-600">
              Veículo
            </Link>
            {role === "ADMIN" && (
              <Link href="/usuarios" className="hover:text-blue-600">
                Usuários
              </Link>
            )}
          </nav>
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <p className="font-medium text-slate-800">{name}</p>
            <p className="text-slate-500 text-xs">
              {roleLabels[role] ?? role}
            </p>
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

      {/* TOAST GLOBAL */}
      <Toaster position="top-right" richColors />
    </div>
  );
}