import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { STATUS_COLORS, STATUS_LABELS, getPendingStatusesForRole } from "@/lib/workflow";

export default async function PendentesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const pendingStatuses = getPendingStatusesForRole(session.user.role);

  const requests = await prisma.purchaseRequest.findMany({
    where: {
      status: {
        in: pendingStatuses,
      },
    },
    include: {
      requestedBy: {
        select: {
          name: true,
          department: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pendentes para mim</h1>
        <p className="text-slate-500 mt-1">
          Solicitações aguardando sua ação nesta etapa do fluxo.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {requests.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-base">Nenhuma solicitação pendente para você.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Código</th>
                <th className="px-6 py-3 text-left">Título</th>
                <th className="px-6 py-3 text-left">Solicitante</th>
                <th className="px-6 py-3 text-left">Setor</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Criada em</th>
                <th className="px-6 py-3 text-left"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-mono font-medium text-blue-700">
                    {request.code}
                  </td>

                  <td className="px-6 py-4 text-slate-800 max-w-sm truncate">
                    {request.title}
                  </td>

                  <td className="px-6 py-4 text-slate-700">
                    {request.requestedBy.name}
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {request.requestedBy.department || "Sem setor"}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge status={request.status} />
                  </td>

                  <td className="px-6 py-4 text-slate-500">
                    {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="px-6 py-4">
                    <Link
                      href={`/solicitacoes/${request.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: keyof typeof STATUS_LABELS }) {
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
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}