"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ValidationIssues = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

export default function NovaSolicitacaoPage() {
  const router = useRouter();

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
  const [error, setError] = useState("");
  const [issues, setIssues] = useState<ValidationIssues | null>(null);

  function getFieldError(field: string) {
    return issues?.fieldErrors?.[field]?.[0] ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setIssues(null);

    const payload = {
      title,
      category,
      description,
      quantity: Number(quantity),
      unit,
      justification,
      productUrl: productUrl.trim() || "",
      estimatedValue: estimatedValue ? Number(estimatedValue) : undefined,
      expectedUseDate: expectedUseDate || undefined,
    };

    const response = await fetch("/api/purchase-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data?.error || "Erro ao criar solicitação");
      if (data?.issues) {
        setIssues(data.issues);
      }
      console.log("Payload enviado:", payload);
      console.log("Resposta da API:", data);
      return;
    }

    router.push("/solicitacoes");
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-2xl font-bold text-slate-900">Nova solicitação</h1>
        <p className="text-slate-500 mt-1 mb-6">
          Preencha os dados da requisição de compra.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Título
            </label>
            <input
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Compra de toners para impressora"
              required
            />
            {getFieldError("title") && (
              <p className="text-sm text-red-600 mt-1">{getFieldError("title")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Categoria
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="MATERIAL_ESCRITORIO">Escritório</option>
              <option value="MATERIAL_LIMPEZA">Limpeza</option>
              <option value="EQUIPAMENTO_TI">Tecnologia</option>
              <option value="MOBILIARIO">Mobiliário</option>
              <option value="MATERIAL_DIDATICO">Material didático</option>
              <option value="SERVICOS">Serviços</option>
              <option value="MANUTENCAO">Manutenção</option>
              <option value="OUTROS">Outros</option>
            </select>
            {getFieldError("category") && (
              <p className="text-sm text-red-600 mt-1">{getFieldError("category")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Descrição
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o item que precisa ser comprado"
              required
            />
            {getFieldError("description") && (
              <p className="text-sm text-red-600 mt-1">{getFieldError("description")}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Quantidade
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
              />
              {getFieldError("quantity") && (
                <p className="text-sm text-red-600 mt-1">{getFieldError("quantity")}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unidade
              </label>
              <input
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="un, caixa, pacote..."
                required
              />
              {getFieldError("unit") && (
                <p className="text-sm text-red-600 mt-1">{getFieldError("unit")}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Justificativa
            </label>
            <textarea
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Explique por que essa compra é necessária"
              required
            />
            {getFieldError("justification") && (
              <p className="text-sm text-red-600 mt-1">{getFieldError("justification")}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Link do produto
            </label>
            <input
              type="url"
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
            />
            {getFieldError("productUrl") && (
              <p className="text-sm text-red-600 mt-1">{getFieldError("productUrl")}</p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor estimado
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="0,00"
              />
              {getFieldError("estimatedValue") && (
                <p className="text-sm text-red-600 mt-1">{getFieldError("estimatedValue")}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Previsão de uso
              </label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                value={expectedUseDate}
                onChange={(e) => setExpectedUseDate(e.target.value)}
              />
              {getFieldError("expectedUseDate") && (
                <p className="text-sm text-red-600 mt-1">{getFieldError("expectedUseDate")}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>

              {issues?.formErrors?.length ? (
                <ul className="mt-2 text-sm text-red-700 list-disc pl-5">
                  {issues.formErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Salvando..." : "Criar solicitação"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/solicitacoes")}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}