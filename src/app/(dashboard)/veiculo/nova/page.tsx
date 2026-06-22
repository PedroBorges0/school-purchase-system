"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function NovaReservaVeiculoPage() {
  const router = useRouter();
  const submitting = useRef(false);

  const [travelDate, setTravelDate] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [objective, setObjective] = useState("");
  const [driver, setDriver] = useState("");
  const [otherParticipants, setOtherParticipants] = useState("");
  const [loading, setLoading] = useState(false);
  const [diretrizOpen, setDiretrizOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;

    if (!travelDate) {
      toast.error("Informe a data da viagem.");
      return;
    }
    if (!departureTime) {
      toast.error("Informe o horário de saída.");
      return;
    }
    if (!returnTime) {
      toast.error("Informe o horário previsto de devolução.");
      return;
    }
    if (objective.trim().length < 10) {
      toast.error("O objetivo/atividades deve ter pelo menos 10 caracteres.");
      return;
    }
    if (driver.trim().length < 2) {
      toast.error("Informe o nome do condutor.");
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const res = await fetch("/api/vehicle-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          travelDate,
          departureTime,
          returnTime,
          objective: objective.trim(),
          driver: driver.trim(),
          otherParticipants: otherParticipants.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push("/login");
          return;
        }
        toast.error(data?.error || "Não foi possível criar a solicitação.");
        return;
      }

      toast.success("Solicitação de reserva enviada! A gestão será notificada.");
      router.push("/veiculo");
    } catch {
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Diretriz — accordion */}
      <div className="border border-blue-200 rounded-xl overflow-hidden mb-6">
        <button
          type="button"
          onClick={() => setDiretrizOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-left"
        >
          <span className="text-sm font-semibold text-blue-800">
            Diretriz de uso do veículo institucional
          </span>
          <span className="text-blue-600 text-lg leading-none select-none">
            {diretrizOpen ? "▲" : "▼"}
          </span>
        </button>

        {diretrizOpen && (
          <div className="bg-blue-50 border-t border-blue-200 px-4 py-3">
            <ul className="text-sm text-blue-700 space-y-1.5 list-disc list-inside">
              <li>A reserva deve ser solicitada com antecedência mínima de 24 horas.</li>
              <li>O veículo deve ser utilizado exclusivamente para fins institucionais.</li>
              <li>O condutor deve possuir habilitação válida e compatível com a categoria do veículo.</li>
              <li>O veículo deve ser devolvido limpo, abastecido e no horário previsto.</li>
              <li>Danos ou ocorrências devem ser comunicados imediatamente ao setor de Compras.</li>
              <li>A autorização do setor de Compras é obrigatória antes do uso.</li>
            </ul>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Nova reserva de veículo</h1>
        <p className="text-slate-500 mt-1 mb-6">
          Preencha os dados abaixo. O setor de Compras será notificado e dará o parecer.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Data + Horários */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data da viagem *
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Horário de saída *
              </label>
              <input
                type="time"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Devolução prevista *
              </label>
              <input
                type="time"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Objetivo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Objetivo / Atividades *
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Descreva o objetivo da viagem e as atividades a serem realizadas..."
              disabled={loading}
              required
            />
          </div>

          {/* Condutor */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Condutor *
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="Nome completo do condutor"
              disabled={loading}
              required
            />
          </div>

          {/* Demais participantes */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Demais participantes{" "}
              <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={otherParticipants}
              onChange={(e) => setOtherParticipants(e.target.value)}
              placeholder="Liste os demais passageiros, se houver..."
              disabled={loading}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/veiculo")}
              disabled={loading}
              className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="ml-auto bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? "Enviando..." : "Solicitar reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
