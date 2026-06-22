"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  AUTORIZADO: "Autorizado",
  AUTORIZADO_COM_RECOMENDACOES: "Aut. c/ Rec.",
  REPROGRAMAR: "Reprogramar",
  NAO_AUTORIZADO: "Não Autorizado",
};

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  AUTORIZADO: "bg-green-100 text-green-800 border-green-200",
  AUTORIZADO_COM_RECOMENDACOES: "bg-blue-100 text-blue-800 border-blue-200",
  REPROGRAMAR: "bg-orange-100 text-orange-800 border-orange-200",
  NAO_AUTORIZADO: "bg-red-100 text-red-800 border-red-200",
};

interface VehicleRequest {
  id: string;
  travelDate: string;
  departureTime: string;
  returnTime: string;
  objective: string;
  driver: string;
  status: string;
  requestedBy: { name: string };
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function VeiculoCalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [requests, setRequests] = useState<VehicleRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicle-requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  function getRequestsForDay(day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return requests.filter((r) => r.travelDate.startsWith(dateStr));
  }

  const isToday = (day: number) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendário de Reservas</h1>
          <p className="text-sm text-slate-500 mt-1">Visualize as reservas de veículo por dia.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/veiculo"
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Lista
          </Link>
          <Link
            href="/veiculo/nova"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Nova reserva
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold text-slate-800">
            {MONTHS[month]} {year}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
          >
            →
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Carregando...</div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {cells.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50" />;
              }
              const dayRequests = getRequestsForDay(day);
              return (
                <div
                  key={day}
                  className={`min-h-[100px] p-2 flex flex-col gap-1 ${
                    isToday(day) ? "bg-blue-50" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-semibold self-end w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday(day)
                        ? "bg-blue-600 text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {day}
                  </span>
                  {dayRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`text-xs rounded border px-1.5 py-1 leading-tight ${STATUS_COLORS[req.status]}`}
                    >
                      <p className="font-medium truncate">{req.requestedBy.name}</p>
                      <p className="opacity-75">
                        {req.departureTime} – {req.returnTime}
                      </p>
                      <p className="opacity-60">{STATUS_LABELS[req.status]}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <span
            key={key}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[key]}`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
