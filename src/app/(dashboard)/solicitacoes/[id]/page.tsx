import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  STATUS_COLORS,
  STATUS_LABELS,
  canUserActOnRequest,
} from "@/lib/workflow";
import { notFound, redirect } from "next/navigation";
import ApprovalActions from "./components/ApprovalActions";
import QuoteForm from "./components/QuoteForm";

export default async function SolicitacaoDetalhePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const request = await prisma.purchaseRequest.findUnique({
    where: { id: params.id },
    include: {
      requestedBy: true,
      approvals: {
        orderBy: { createdAt: "asc" },
        include: { user: true },
      },
      quotes: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!request) notFound();

  const isOwner = request.requestedById === session.user.id;

  if (!isOwner && session.user.role === "SOLICITANTE") {
    redirect("/solicitacoes");
  }

  const canAct = canUserActOnRequest(session.user.role, request.status);

  const shouldShowQuoteForm =
    request.status === "EM_ORCAMENTO" &&
    (session.user.role === "COMPRAS" || session.user.role === "ADMIN");

  const shouldShowApprovalActions =
    canAct && request.status !== "EM_ORCAMENTO";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{request.code}</p>

            <h1 className="text-2xl font-bold text-slate-900">
              {request.title}
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Solicitado por {request.requestedBy.name} •{" "}
              {request.requestedBy.department || "Sem setor"}
            </p>
          </div>

          <StatusBadge status={request.status} />
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-6 text-sm">
          <Info label="Categoria" value={request.category} />
          <Info label="Quantidade" value={`${request.quantity} ${request.unit}`} />
          <Info
            label="Valor estimado"
            value={
              request.estimatedValue
                ? `R$ ${Number(request.estimatedValue).toFixed(2)}`
                : "Não informado"
            }
          />
          <Info
            label="Previsão de uso"
            value={
              request.expectedUseDate
                ? new Date(request.expectedUseDate).toLocaleDateString("pt-BR")
                : "Não informado"
            }
          />
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-slate-900 mb-2">Descrição</h2>
          <p className="text-slate-700 whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold text-slate-900 mb-2">Justificativa</h2>
          <p className="text-slate-700 whitespace-pre-wrap">
            {request.justification}
          </p>
        </div>

        {request.productUrl && (
          <div className="mt-6">
            <a
              href={request.productUrl}
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Abrir link do produto
            </a>
          </div>
        )}
      </div>

      {shouldShowQuoteForm && <QuoteForm requestId={request.id} />}

      {shouldShowApprovalActions && (
        <ApprovalActions
          requestId={request.id}
          currentStatus={request.status}
        />
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Histórico de aprovações
        </h2>

        <div className="space-y-4">
          {request.approvals.length === 0 && (
            <p className="text-sm text-slate-500">
              Ainda não há movimentações.
            </p>
          )}

          {request.approvals.map((item) => (
            <div key={item.id} className="border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-900">{item.stepName}</p>
                  <p className="text-sm text-slate-500">
                    {item.user.name} • {item.user.role}
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </div>
              </div>

              <p className="text-sm mt-2 text-slate-700">
                <strong>Ação:</strong> {item.action}
              </p>

              {item.comment && (
                <p className="text-sm mt-2 text-slate-700 whitespace-pre-wrap">
                  <strong>Comentário:</strong> {item.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {request.quotes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Orçamentos
          </h2>

          <div className="space-y-3">
            {request.quotes.map((quote) => (
              <div key={quote.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-slate-900">
                      {quote.supplierName}
                    </p>

                    <p className="text-sm text-slate-600">
                      Total: R$ {Number(quote.totalValue).toFixed(2)}
                    </p>

                    {quote.paymentTerms && (
                      <p className="text-sm text-slate-600">
                        Pagamento: {quote.paymentTerms}
                      </p>
                    )}

                    {quote.deliveryTime && (
                      <p className="text-sm text-slate-600">
                        Entrega: {quote.deliveryTime}
                      </p>
                    )}
                  </div>

                  {quote.isSelected && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                      Melhor opção
                    </span>
                  )}
                </div>

                {quote.productUrl && (
                  <a
                    href={quote.productUrl}
                    target="_blank"
                    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Abrir link do orçamento
                  </a>
                )}

                {quote.notes && (
                  <p className="text-sm text-slate-600 mt-3 whitespace-pre-wrap">
                    {quote.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900 mt-1">
        {value}
      </p>
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
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorMap[color]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}