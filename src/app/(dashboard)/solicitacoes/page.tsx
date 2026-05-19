import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { RequestStatus, Role } from "@prisma/client";
import { STATUS_COLORS, STATUS_LABELS, getPendingStatusesForRole } from "@/lib/workflow";

const colorMap: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  yellow: "bg-yellow-100 text-yellow-700",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  indigo: "bg-indigo-100 text-indigo-700",
  orange: "bg-orange-100 text-orange-700",
  green: "bg-green-100 text-green-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-700",
};

export default async function SolicitacoesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role as Role;
  const userId = session.user.id;
  const isSolicitante = role === Role.SOLICITANTE;

  const requests = await prisma.purchaseRequest.findMany({
    where: isSolicitante ? { requestedById: userId } : undefined,
    include: {
      requestedBy: {
        select: { name: true, department: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Solicitações de compra</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isSolicitante
              ? "Acompanhe suas solicitações enviadas."
              : "Todas as solicitações do sistema."}
          </p>
        </div>
        {isSolicitante && (
          <Link
            href="/solicitacoes/nova"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Nova solicitação
          </Link>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <p className="text-slate-400 text-lg font-medium">Nenhuma solicitação encontrada</p>
          <p className="text-slate-400 text-sm mt-1">
            {isSolicitante
              ? "Você ainda não criou nenhuma solicitação."
              : "Ainda não há solicitações no sistema."}
          </p>
          {isSolicitante && (
            <Link
              href="/solicitacoes/nova"
              className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Criar primeira solicitação
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Código
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Solicitação
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Solicitante
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                  Data
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const color = STATUS_COLORS[req.status] ?? "gray";
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">
                      {req.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 line-clamp-1">{req.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{req.category}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-600">
                      <p>{req.requestedBy.name}</p>
                      <p className="text-xs text-slate-400">{req.requestedBy.department || "—"}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                      {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}>
                        {STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/solicitacoes/${req.id}`}
                        className="text-blue-600 text-xs font-medium hover:underline"
                      >
                        Ver detalhes →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}