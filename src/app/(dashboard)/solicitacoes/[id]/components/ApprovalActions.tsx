"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalAction, RequestStatus } from "@prisma/client";
import { toast } from "sonner";
import { STATUS_LABELS } from "@/lib/workflow";

const ACTION_LABELS: Record<ApprovalAction, string> = {
  APROVADO: "Aprovar solicitação",
  RECUSADO: "Recusar",
  DEVOLVIDO: "Devolver para revisão",
  COMENTARIO: "Comentar",
};

const ACTION_SUCCESS: Record<ApprovalAction, string> = {
  APROVADO: "Solicitação aprovada com sucesso!",
  RECUSADO: "Solicitação recusada.",
  DEVOLVIDO: "Solicitação devolvida para revisão.",
  COMENTARIO: "Comentário adicionado.",
};

export default function ApprovalActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: RequestStatus;
}) {
  const router = useRouter();
  const submitting = useRef(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmAction, setConfirmAction] = useState<ApprovalAction | null>(null);

  async function handleAction(action: ApprovalAction) {
    // Proteção contra double click
    if (submitting.current) return;

    // Pede confirmação para ações destrutivas
    if ((action === ApprovalAction.RECUSADO || action === ApprovalAction.DEVOLVIDO) && confirmAction !== action) {
      setConfirmAction(action);
      return;
    }

    submitting.current = true;
    setLoading(true);
    setConfirmAction(null);

    try {
      const response = await fetch(`/api/purchase-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push("/login");
          return;
        }
        toast.error(data?.error || "Não foi possível processar a ação. Tente novamente.");
        return;
      }

      toast.success(ACTION_SUCCESS[action]);
      setComment("");
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">
        Ações da etapa
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Status atual:{" "}
        <strong className="text-slate-700">{STATUS_LABELS[currentStatus]}</strong>
      </p>

      <textarea
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={loading}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        placeholder="Comentário (obrigatório para recusar ou devolver)"
      />

      {/* Modal de confirmação inline */}
      {confirmAction && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800 mb-3">
            {confirmAction === ApprovalAction.RECUSADO
              ? "Tem certeza que deseja recusar esta solicitação?"
              : "Tem certeza que deseja devolver esta solicitação para revisão?"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(confirmAction)}
              className="bg-red-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-red-700"
            >
              Sim, confirmar
            </button>
            <button
              onClick={() => setConfirmAction(null)}
              className="bg-white border border-slate-300 text-slate-700 text-sm px-4 py-2 rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {/* Recusar — menos destaque, à esquerda */}
        <button
          onClick={() => handleAction(ApprovalAction.RECUSADO)}
          disabled={loading}
          className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {ACTION_LABELS.RECUSADO}
        </button>

        {/* Devolver */}
        <button
          onClick={() => handleAction(ApprovalAction.DEVOLVIDO)}
          disabled={loading}
          className="border border-yellow-300 text-yellow-700 px-4 py-2 rounded-lg text-sm hover:bg-yellow-50 disabled:opacity-50 transition-colors"
        >
          {ACTION_LABELS.DEVOLVIDO}
        </button>

        {/* Comentar */}
        <button
          onClick={() => handleAction(ApprovalAction.COMENTARIO)}
          disabled={loading}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {ACTION_LABELS.COMENTARIO}
        </button>

        {/* Aprovar — mais destaque, à direita */}
        <button
          onClick={() => handleAction(ApprovalAction.APROVADO)}
          disabled={loading}
          className="ml-auto bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando..." : ACTION_LABELS.APROVADO}
        </button>
      </div>
    </div>
  );
}