import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STATUS_LABELS, STATUS_COLORS, getPendingStatusesForRole } from "@/lib/workflow";
import { Role, RequestStatus } from "@prisma/client";

export default async function PendentesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role as Role;
  const pendingStatuses = getPendingStatusesForRole(role);

  // Solicitante não tem nada pendente para aprovar
  if (role === Role.SOLICITANTE) redirect("/dashboard");

  const requests = await prisma.purchaseRequest.findMany({
    where: pendingStatuses.length > 0
      ? { status: { in: pendingStatuses } }
      : {},
    include: {
      requestedBy: {
        select: { name: true, department: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Aguardando minha ação
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {requests.length > 0
            ? `${requests.length} solicitação${requests.length > 1 ? "ões" : ""} aguardando sua análise — ordenadas por data de criação.`
            : "Nenhuma solicitação pendente no momento."}
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-slate-600 font-medium">Tudo em dia!</p>
          <p className="text-slate-400 text-sm mt-1">
            Não há solicitações aguardando sua ação no momento.
          </p>
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
                  Aguardando desde
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Etapa
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const color = STATUS_COLORS[req.status] ?? "gray";
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

                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-medium">
                      {req.code}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 line-clamp-1">{req.title}</p>
                      {req.estimatedValue && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          R$ {Number(req.estimatedValue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-slate-700">{req.requestedBy.name}</p>
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
                        className="bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Analisar →
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