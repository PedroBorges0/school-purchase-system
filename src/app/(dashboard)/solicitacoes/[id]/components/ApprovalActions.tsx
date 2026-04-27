"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApprovalAction, RequestStatus } from "@prisma/client";

export default function ApprovalActions({
  requestId,
  currentStatus,
}: {
  requestId: string;
  currentStatus: RequestStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  async function handleAction(action: ApprovalAction) {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/purchase-requests/${requestId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || "Erro ao processar ação");
        return;
      }

      setComment("");
      router.refresh();
    } catch {
      setError("Erro inesperado ao processar ação");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-2">
        Ações da etapa
      </h2>

      <p className="text-sm text-slate-500 mb-4">
        Status atual: <strong>{currentStatus}</strong>
      </p>

      <textarea
        rows={4}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-4"
        placeholder="Comentário"
      />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => handleAction(ApprovalAction.APROVADO)}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Aprovar
        </button>

        <button
          onClick={() => handleAction(ApprovalAction.RECUSADO)}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Recusar
        </button>

        <button
          onClick={() => handleAction(ApprovalAction.DEVOLVIDO)}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
        >
          Devolver
        </button>

        <button
          onClick={() => handleAction(ApprovalAction.COMENTARIO)}
          disabled={loading}
          className="bg-slate-700 text-white px-4 py-2 rounded-lg"
        >
          Comentar
        </button>
      </div>
    </div>
  );
}