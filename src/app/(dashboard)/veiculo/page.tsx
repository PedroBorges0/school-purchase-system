import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role, VehicleRequestStatus } from "@prisma/client";
import Link from "next/link";
import VehicleReviewForm from "./components/VehicleReviewForm";

const STATUS_LABELS: Record<VehicleRequestStatus, string> = {
  PENDENTE: "Pendente",
  AUTORIZADO: "Autorizado",
  AUTORIZADO_COM_RECOMENDACOES: "Autorizado com Recomendações",
  REPROGRAMAR: "Reprogramar",
  NAO_AUTORIZADO: "Não Autorizado",
};

const STATUS_COLORS: Record<VehicleRequestStatus, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-700",
  AUTORIZADO: "bg-green-100 text-green-700",
  AUTORIZADO_COM_RECOMENDACOES: "bg-blue-100 text-blue-700",
  REPROGRAMAR: "bg-orange-100 text-orange-700",
  NAO_AUTORIZADO: "bg-red-100 text-red-700",
};

export default async function VeiculoPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = session.user.role as Role;
  const isCompras = role === Role.COMPRAS || role === Role.ADMIN;

  const requests = await prisma.vehicleRequest.findMany({
    where: isCompras ? undefined : { requestedById: session.user.id },
    include: {
      requestedBy: { select: { name: true, department: true } },
      reviewedBy: { select: { name: true } },
    },
    orderBy: [{ travelDate: "asc" }, { departureTime: "asc" }],
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reserva de Veículo</h1>
          <p className="text-sm text-slate-500 mt-1">
            {isCompras
              ? "Todas as solicitações de reserva de veículo."
              : "Acompanhe suas solicitações de reserva."}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/veiculo/calendario"
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Calendário
          </Link>
          <Link
            href="/veiculo/nova"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Nova reserva
          </Link>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <p className="text-4xl mb-3">🚗</p>
          <p className="text-slate-400 text-lg font-medium">Nenhuma reserva encontrada</p>
          <p className="text-slate-400 text-sm mt-1">
            {isCompras
              ? "Ainda não há solicitações de reserva no sistema."
              : "Você ainda não criou nenhuma solicitação de reserva."}
          </p>
          <Link
            href="/veiculo/nova"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Criar primeira reserva
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-slate-200 rounded-xl p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900">
                      {new Date(req.travelDate).toLocaleDateString("pt-BR", {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    Saída: <strong>{req.departureTime}</strong> &nbsp;·&nbsp;
                    Devolução prevista: <strong>{req.returnTime}</strong>
                  </p>

                  <p className="text-sm text-slate-700 mt-2 line-clamp-2">
                    <span className="font-medium">Objetivo:</span> {req.objective}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-medium">Condutor:</span> {req.driver}
                    {req.otherParticipants && (
                      <> &nbsp;·&nbsp; <span className="font-medium">Demais:</span> {req.otherParticipants}</>
                    )}
                  </p>

                  {isCompras && (
                    <p className="text-xs text-slate-400 mt-1">
                      Solicitante: {req.requestedBy.name}
                      {req.requestedBy.department ? ` — ${req.requestedBy.department}` : ""}
                    </p>
                  )}
                </div>

                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                </div>
              </div>

              {req.managerComment && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-700">
                  <span className="font-medium">Parecer da gestão:</span>{" "}
                  {req.managerComment}
                  {req.reviewedBy && (
                    <span className="text-slate-400"> — {req.reviewedBy.name}</span>
                  )}
                </div>
              )}

              {isCompras && req.status === "PENDENTE" && (
                <VehicleReviewForm requestId={req.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
