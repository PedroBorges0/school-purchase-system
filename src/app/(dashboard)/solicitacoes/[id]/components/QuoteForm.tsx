"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type QuoteInput = {
  supplierName: string;
  totalValue: string;
  paymentTerms: string;
  deliveryTime: string;
  productUrl: string;
  notes: string;
};

export default function QuoteForm({ requestId }: { requestId: string }) {
  const router = useRouter();

  const [quotes, setQuotes] = useState<QuoteInput[]>([
    {
      supplierName: "",
      totalValue: "",
      paymentTerms: "",
      deliveryTime: "",
      productUrl: "",
      notes: "",
    },
  ]);

  const [selectedQuoteIndex, setSelectedQuoteIndex] = useState<number | null>(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateQuote(index: number, field: keyof QuoteInput, value: string) {
    const next = [...quotes];
    next[index][field] = value;
    setQuotes(next);
  }

  function addQuote() {
    if (quotes.length >= 3) return;

    setQuotes([
      ...quotes,
      {
        supplierName: "",
        totalValue: "",
        paymentTerms: "",
        deliveryTime: "",
        productUrl: "",
        notes: "",
      },
    ]);
  }

  function removeQuote(index: number) {
    const next = quotes.filter((_, i) => i !== index);
    setQuotes(next);

    if (selectedQuoteIndex === index) {
      setSelectedQuoteIndex(next.length ? 0 : null);
    } else if (selectedQuoteIndex !== null && selectedQuoteIndex > index) {
      setSelectedQuoteIndex(selectedQuoteIndex - 1);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const payload = {
      quotes: quotes.map((q) => ({
        supplierName: q.supplierName,
        totalValue: Number(q.totalValue),
        paymentTerms: q.paymentTerms || undefined,
        deliveryTime: q.deliveryTime || undefined,
        productUrl: q.productUrl || "",
        notes: q.notes || undefined,
      })),
      selectedQuoteIndex: selectedQuoteIndex ?? undefined,
      comment,
    };

    try {
      const response = await fetch(
        `/api/purchase-requests/${requestId}/quotes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const text = await response.text();

      let data: any = null;

      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        console.error("Resposta não era JSON:", text);
      }

      if (!response.ok) {
        const message = data?.details || data?.error || text || "Erro ao salvar orçamentos";
        setError(
          `Status ${response.status}: ${message}`
        );

        console.error("Erro ao salvar:", {
          status: response.status,
          data,
          text,
        });

        return;
      }

      router.refresh();
    } catch (err) {
      console.error("Erro inesperado:", err);
      setError("Erro inesperado ao enviar orçamentos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">
        Registrar orçamentos
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {quotes.map((quote, index) => (
          <div
            key={index}
            className="border border-slate-200 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">
                Orçamento {index + 1}
              </h3>

              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600 flex items-center gap-2">
                  <input
                    type="radio"
                    name="selectedQuote"
                    checked={selectedQuoteIndex === index}
                    onChange={() => setSelectedQuoteIndex(index)}
                  />
                  Melhor opção
                </label>

                {quotes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuote(index)}
                    className="text-sm text-red-600"
                  >
                    Remover
                  </button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Fornecedor"
                value={quote.supplierName}
                onChange={(e) =>
                  updateQuote(index, "supplierName", e.target.value)
                }
                required
              />

              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Valor total"
                value={quote.totalValue}
                onChange={(e) =>
                  updateQuote(index, "totalValue", e.target.value)
                }
                required
              />

              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Condição de pagamento"
                value={quote.paymentTerms}
                onChange={(e) =>
                  updateQuote(index, "paymentTerms", e.target.value)
                }
              />

              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                placeholder="Prazo / entrega"
                value={quote.deliveryTime}
                onChange={(e) =>
                  updateQuote(index, "deliveryTime", e.target.value)
                }
              />
            </div>

            <input
              type="url"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Link do orçamento"
              value={quote.productUrl}
              onChange={(e) =>
                updateQuote(index, "productUrl", e.target.value)
              }
            />

            <textarea
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Observações"
              value={quote.notes}
              onChange={(e) =>
                updateQuote(index, "notes", e.target.value)
              }
            />
          </div>
        ))}

        {quotes.length < 3 && (
          <button
            type="button"
            onClick={addQuote}
            className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg"
          >
            + Adicionar orçamento
          </button>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Comentário da etapa
          </label>
          <textarea
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Salvando..." : "Salvar e enviar ao Financeiro"}
        </button>
      </form>
    </div>
  );
}