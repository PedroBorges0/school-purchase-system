"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type QuoteInput = {
  supplierName: string;
  totalValue: string;
  paymentTerms: string;
  deliveryDays: string;
  productUrl: string;
  notes: string;
};

const emptyQuote = (): QuoteInput => ({
  supplierName: "",
  totalValue: "",
  paymentTerms: "",
  deliveryDays: "",
  productUrl: "",
  notes: "",
});

export default function QuoteForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [quotes, setQuotes] = useState<QuoteInput[]>([emptyQuote()]);
  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  function updateQuote(index: number, field: keyof QuoteInput, value: string) {
    const next = [...quotes];
    next[index][field] = value;
    setQuotes(next);
  }

  function addQuote() {
    if (quotes.length >= 3) return;
    setQuotes([...quotes, emptyQuote()]);
  }

  function removeQuote(index: number) {
    const next = quotes.filter((_, i) => i !== index);
    setQuotes(next);
    if (selectedQuoteIndex >= next.length) {
      setSelectedQuoteIndex(Math.max(0, next.length - 1));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Proteção contra double click
    if (submitting.current) return;

    // Validação básica no frontend
    for (let i = 0; i < quotes.length; i++) {
      const q = quotes[i];
      if (!q.supplierName.trim()) {
        toast.error(`Informe o nome do fornecedor no orçamento ${i + 1}.`);
        return;
      }
      if (!q.totalValue || Number(q.totalValue) <= 0) {
        toast.error(`Informe um valor válido no orçamento ${i + 1}.`);
        return;
      }
    }

    submitting.current = true;
    setLoading(true);

    try {
      const payload = {
        quotes: quotes.map((q) => ({
          supplierName: q.supplierName.trim(),
          totalValue: Number(q.totalValue),
          paymentTerms: q.paymentTerms || undefined,
          deliveryDays: q.deliveryDays ? Number(q.deliveryDays) : undefined,
          productUrl: q.productUrl || undefined,
          notes: q.notes || undefined,
        })),
        selectedQuoteIndex,
        comment: comment || undefined,
      };

      const response = await fetch(`/api/purchase-requests/${requestId}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("Sua sessão expirou. Faça login novamente.");
          router.push("/login");
          return;
        }
        toast.error(data?.error || "Não foi possível salvar os orçamentos. Tente novamente.");
        return;
      }

      toast.success("Orçamentos registrados e enviados ao Financeiro!");
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
        Registrar orçamentos
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Adicione até 3 orçamentos e selecione a melhor opção antes de enviar ao Financeiro.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {quotes.map((quote, index) => (
          <div
            key={index}
            className={`border rounded-xl p-4 space-y-4 transition-colors ${
              selectedQuoteIndex === index
                ? "border-green-400 bg-green-50"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">
                Orçamento {index + 1}
                {selectedQuoteIndex === index && (
                  <span className="ml-2 text-xs text-green-700 font-normal">
                    ✓ Melhor opção selecionada
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                {selectedQuoteIndex !== index && (
                  <button
                    type="button"
                    onClick={() => setSelectedQuoteIndex(index)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Selecionar como melhor opção
                  </button>
                )}
                {quotes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuote(index)}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Fornecedor *
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do fornecedor"
                  value={quote.supplierName}
                  onChange={(e) => updateQuote(index, "supplierName", e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Valor total (R$) *
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  value={quote.totalValue}
                  onChange={(e) => updateQuote(index, "totalValue", e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Condição de pagamento
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 30/60 dias, à vista"
                  value={quote.paymentTerms}
                  onChange={(e) => updateQuote(index, "paymentTerms", e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  Prazo de entrega (dias)
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: 7"
                  value={quote.deliveryDays}
                  onChange={(e) => updateQuote(index, "deliveryDays", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Link do orçamento (opcional)
              </label>
              <input
                type="url"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://"
                value={quote.productUrl}
                onChange={(e) => updateQuote(index, "productUrl", e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">
                Observações
              </label>
              <textarea
                rows={2}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Informações adicionais sobre este orçamento"
                value={quote.notes}
                onChange={(e) => updateQuote(index, "notes", e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        ))}

        {quotes.length < 3 && (
          <button
            type="button"
            onClick={addQuote}
            disabled={loading}
            className="w-full border border-dashed border-slate-300 text-slate-500 px-4 py-3 rounded-xl text-sm hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50"
          >
            + Adicionar outro orçamento
          </button>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Comentário (opcional)
          </label>
          <textarea
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Observações gerais sobre os orçamentos coletados"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? "Salvando..." : "Enviar orçamentos ao Financeiro"}
          </button>
        </div>
      </form>
    </div>
  );
}