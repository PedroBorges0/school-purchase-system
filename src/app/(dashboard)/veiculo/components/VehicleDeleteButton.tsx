"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function VehicleDeleteButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (submitting.current) return;

    if (!confirming) {
      setConfirming(true);
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const response = await fetch(`/api/vehicle-requests/${requestId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push("/login");
          return;
        }
        toast.error(data?.error || "Não foi possível remover a reserva.");
        return;
      }

      toast.success("Reserva removida com sucesso.");
      router.refresh();
    } catch {
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-600">Remover?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium text-white bg-red-600 px-2.5 py-1 rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Removendo..." : "Sim"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline"
    >
      Remover
    </button>
  );
}

