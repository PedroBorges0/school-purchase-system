import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-2xl shadow p-8 max-w-xl w-full text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          Sistema de Requisição de Compras
        </h1>

        <p className="text-slate-600 mb-6">
          O projeto está rodando.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Ir para login
          </Link>

          <Link
            href="/dashboard"
            className="bg-slate-200 text-slate-900 px-4 py-2 rounded-lg"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}