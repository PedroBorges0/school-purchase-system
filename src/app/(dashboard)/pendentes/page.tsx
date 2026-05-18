import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/workflow";
import { Role, RequestStatus } from "@prisma/client";

export default async function PendentesPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const role = session.user.role;

  const where = getPendingFilter(role);

  const requests = await prisma.purchaseRequest.findMany({
    where,
    include: {
      requestedBy: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Pendentes para mim
        </h1>
        <p className="text-sm text-slate-500">
          Solicitações que aguardam sua ação
        </p>
      </div>

      {requests.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-slate-500">
            Nenhuma solicitação pendente para você.
          </p>
        </div>
      )}

      {requests.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">Código</th>
                <th className="text-left px-4 py-3">Título</th>
                <th className="text-left px-4 py-3">Solicitante</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Ação</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((req) => (
                <tr
                  key={req.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {req.code}
                  </td>

                  <td className="px-4 py-3 text-slate-700">
                    {req.title}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {req.requestedBy.name}
                  </td>

                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/solicitacoes/${req.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getPendingFilter(role: Role) {
  switch (role) {
    case Role.DIRETOR:
      return {
        status: RequestStatus.EM_APROVACAO_DIRETOR,
      };

    case Role.COMPRAS:
      return {
        status: {
          in: [
            RequestStatus.EM_ORCAMENTO,
          ],
        },
      };

    case Role.FINANCEIRO:
      return {
        status: RequestStatus.EM_ANALISE_FINANCEIRA,
      };

    case Role.CONTROLADORIA:
      return {
        status: RequestStatus.EM_CONTROLADORIA,
      };

    case Role.DIRETOR_GERAL:
      return {
        status: RequestStatus.EM_APROVACAO_DIRETOR_GERAL,
      };

    case Role.ADMIN:
      return {}; // vê tudo

    default:
      return {
        requestedById: "___none___", // ninguém
      };
  }
}

function StatusBadge({
  status,
}: {
  status: keyof typeof STATUS_LABELS;
}) {
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

  const color = STATUS_COLORS[status] ?? "gray";

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}