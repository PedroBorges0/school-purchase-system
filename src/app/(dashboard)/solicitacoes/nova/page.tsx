"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "MATERIAL_ESCRITORIO", label: "Material de escritório" },
  { value: "MATERIAL_LIMPEZA", label: "Material de limpeza" },
  { value: "EQUIPAMENTO_TI", label: "Tecnologia e informática" },
  { value: "MOBILIARIO", label: "Mobiliário" },
  { value: "MATERIAL_DIDATICO", label: "Material didático" },
  { value: "SERVICOS", label: "Serviços" },
  { value: "MANUTENCAO", label: "Manutenção" },
  { value: "OUTROS", label: "Outros" },
];

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const submitting = useRef(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("MATERIAL_ESCRITORIO");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("un");
  const [justification, setJustification] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");
  const [expectedUseDate, setExpectedUseDate] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (submitting.current) return;

    // Validações no frontend
    if (title.trim().length < 5) {
      toast.error("O nome da solicitação deve ter pelo menos 5 caracteres.");
      return;
    }
    if (description.trim().length < 10) {
      toast.error("A descrição deve ter pelo menos 10 caracteres.");
      return;
    }
    if (justification.trim().length < 10) {
      toast.error("A justificativa deve ter pelo menos 10 caracteres.");
      return;
    }
    if (quantity < 1) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }
    if (estimatedValue && Number(estimatedValue) <= 0) {
      toast.error("O valor estimado deve ser maior que zero.");
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const response = await fetch("/api/purchase-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          description: description.trim(),
          quantity: Number(quantity),
          unit: unit.trim() || "un",
          justification: justification.trim(),
          productUrl: productUrl || undefined,
          estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
          expectedUseDate: expectedUseDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push("/login");
          return;
        }
        toast.error(data?.error || "Não foi possível criar a solicitação. Tente novamente.");
        return;
      }

      toast.success("Solicitação criada e enviada para aprovação!");
      router.push("/solicitacoes");
    } catch {
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Nova solicitação de compra</h1>
        <p className="text-slate-500 mt-1 mb-6">
          Preencha os dados abaixo. Após o envio, a solicitação seguirá para aprovação do Diretor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nome da solicitação *
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Compra de toners para impressora HP"
              disabled={loading}
              required
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Categoria *
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição do item *
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o item com detalhes: modelo, especificações, marca preferencial, etc."
              disabled={loading}
              required
            />
          </div>

          {/* Quantidade + Unidade */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unidade *
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="un, caixa, pacote, resma..."
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Justificativa */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Por que este item é necessário? *
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique a necessidade e o impacto caso a compra não seja realizada"
              disabled={loading}
              required
            />
          </div>

          {/* Valor + Data */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor aproximado (R$)
              </label>
              <input
                type="number"
                min={0.01}
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0,00"
                disabled={loading}
              />
              <p className="text-xs text-slate-400 mt-1">
                Solicitações acima de R$ 5.000 passam por aprovação adicional.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data prevista para uso
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={expectedUseDate}
                onChange={(e) => setExpectedUseDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link do produto <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="url"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
              disabled={loading}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/solicitacoes")}
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
              {loading ? "Enviando..." : "Enviar solicitação"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}