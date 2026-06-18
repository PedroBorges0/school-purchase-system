"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "AUTORIZADO", label: "Autorizado", color: "text-green-700" },
  { value: "AUTORIZADO_COM_RECOMENDACOES", label: "Autorizado com Recomendações", color: "text-blue-700" },
  { value: "REPROGRAMAR", label: "Reprogramar", color: "text-orange-700" },
  { value: "NAO_AUTORIZADO", label: "Não Autorizado", color: "text-red-700" },
];

export default function VehicleReviewForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("AUTORIZADO");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setLoading(true);

    try {
      const res = await fetch(`/api/vehicle-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, managerComment: comment || undefined }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sessão expirada. Faça login novamente.");
          return;
        }
        const data = await res.json();
        toast.error(data?.error || "Erro ao registrar parecer.");
        return;
      }

      toast.success("Parecer registrado com sucesso!");
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm text-blue-600 font-medium hover:underline"
      >
        Registrar parecer →
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-3 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Parecer da gestão</p>

      <div className="grid sm:grid-cols-2 gap-3">
        {STATUS_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-2 cursor-pointer border rounded-lg px-3 py-2 text-sm transition-colors ${
              status === opt.value
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="radio"
              name="status"
              value={opt.value}
              checked={status === opt.value}
              onChange={() => setStatus(opt.value)}
              className="accent-blue-600"
            />
            <span className={opt.color}>{opt.label}</span>
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Observações <span className="text-slate-400 font-normal">(opcional)</span>
        </label>
        <textarea
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Recomendações, condições ou motivo da decisão..."
          disabled={loading}
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={loading}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Salvando..." : "Confirmar parecer"}
        </button>
      </div>
    </form>
  );
}
