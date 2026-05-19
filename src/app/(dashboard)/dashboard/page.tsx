import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { RequestStatus, Role } from "@prisma/client";
import { STATUS_LABELS, STATUS_COLORS, getPendingStatusesForRole } from "@/lib/workflow";
import Link from "next/link";

async function getDashboardStats(userId: string, role: string) {
  const [myTotal, myPending, myConcluded, myRejected, pendingApproval] =
    await Promise.all([
      prisma.purchaseRequest.count({ where: { requestedById: userId } }),
      prisma.purchaseRequest.count({
        where: {
          requestedById: userId,
          status: {
            notIn: [
              RequestStatus.CONCLUIDO,
              RequestStatus.RECUSADO,
              RequestStatus.CANCELADO,
            ],
          },
        },
      }),
      prisma.purchaseRequest.count({
        where: { requestedById: userId, status: RequestStatus.CONCLUIDO },
      }),
      prisma.purchaseRequest.count({
        where: { requestedById: userId, status: RequestStatus.RECUSADO },
      }),
      prisma.purchaseRequest.count({
        where: {
          status: { in: getPendingStatusesForRole(role as Role) },
        },
      }),
    ]);

  return { myTotal, myPending, myConcluded, myRejected, pendingApproval };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role as Role;
  const isSolicitante = role === Role.SOLICITANTE;

  const stats = await getDashboardStats(session.user.id, session.user.role);

  const recentRequests = await prisma.purchaseRequest.findMany({
    where: isSolicitante ? { requestedById: session.user.id } : undefined,
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      requestedBy: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Olá, {session.user.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Aqui está um resumo das solicitações de compra.
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

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Minhas solicitações"
          value={stats.myTotal}
          color="blue"
          icon="📋"
        />
        <StatCard
          label="Em andamento"
          value={stats.myPending}
          color="yellow"
          icon="⏳"
        />
        <StatCard
          label="Concluídas"
          value={stats.myConcluded}
          color="green"
          icon="✅"
        />
        {stats.pendingApproval > 0 ? (
          <StatCard
            label="Aguardando minha ação"
            value={stats.pendingApproval}
            color="red"
            icon="🔔"
            href="/pendentes"
          />
        ) : (
          <StatCard
            label="Recusadas"
            value={stats.myRejected}
            color="slate"
            icon="❌"
          />
        )}
      </div>

      {/* Tabela de solicitações recentes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">
            {isSolicitante ? "Minhas últimas solicitações" : "Últimas solicitações"}
          </h2>
          <Link
            href="/solicitacoes"
            className="text-sm text-blue-600 hover:underline"
          >
            Ver todas →
          </Link>
        </div>

        {recentRequests.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">Nenhuma solicitação criada ainda</p>
            <p className="text-sm mt-1">
              Quando você criar uma solicitação, ela aparecerá aqui.
            </p>
            {isSolicitante && (
              <Link
                href="/solicitacoes/nova"
                className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Criar primeira solicitação
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Código</th>
                <th className="px-6 py-3 text-left">Nome da solicitação</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Status</th>
                <th className="px-6 py-3 text-left hidden md:table-cell">Data</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRequests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-blue-700 font-medium">
                    {request.code}
                  </td>
                  <td className="px-6 py-4 text-slate-700 max-w-xs">
                    <p className="truncate font-medium">{request.title}</p>
                    {!isSolicitante && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {request.requestedBy.name}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs hidden md:table-cell">
                    {new Date(request.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/solicitacoes/${request.id}`}
                      className="text-blue-600 hover:underline text-xs font-medium"
                    >
                      Ver detalhes →
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

type CardColor = "blue" | "yellow" | "green" | "red" | "slate";

function StatCard({
  label,
  value,
  color,
  icon,
  href,
}: {
  label: string;
  value: number;
  color: CardColor;
  icon: string;
  href?: string;
}) {
  const colors: Record<CardColor, string> = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
    green: "bg-green-50 border-green-200 text-green-700",
    red: "bg-red-50 border-red-200 text-red-700",
    slate: "bg-slate-50 border-slate-200 text-slate-600",
  };

  const card = (
    <div className={`rounded-xl border p-5 ${colors[color]} ${href ? "hover:opacity-90 transition-opacity" : ""}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

function StatusBadge({ status }: { status: RequestStatus }) {
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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}