"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Role } from "@prisma/client";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  active: boolean;
  createdAt: Date | string;
};

type FormData = {
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
};

const ROLE_LABELS: Record<Role, string> = {
  SOLICITANTE: "Solicitante",
  DIRETOR: "Diretor",
  COMPRAS: "Compras",
  FINANCEIRO: "Financeiro",
  CONTROLADORIA: "Controladoria",
  DIRETOR_GERAL: "Diretor Geral",
  ADMIN: "Administrador",
};

const emptyForm = (): FormData => ({
  name: "",
  email: "",
  password: "",
  role: Role.SOLICITANTE,
  department: "",
});

export default function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm());
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  function openCreate() {
    setEditingUser(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(user: User) {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      department: user.department || "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting.current) return;

    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (!editingUser && form.password.length < 6) {
      toast.error("Senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (editingUser && form.password && form.password.length < 6) {
      toast.error("Nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    submitting.current = true;
    setLoading(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : "/api/users";
      const method = editingUser ? "PATCH" : "POST";

      const body: any = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        department: form.department.trim() || undefined,
      };

      if (!editingUser) {
        body.password = form.password;
      } else if (form.password) {
        body.password = form.password;
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || "Não foi possível salvar. Tente novamente.");
        return;
      }

      if (editingUser) {
        setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? data : u)));
        toast.success("Usuário atualizado com sucesso!");
      } else {
        setUsers((prev) => [...prev, data]);
        toast.success("Usuário criado com sucesso!");
      }

      closeModal();
    } catch {
      toast.error("Erro inesperado. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
      submitting.current = false;
    }
  }

  async function handleToggle(user: User) {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !user.active }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.error || "Não foi possível alterar o status.");
        return;
      }

      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)));
      toast.success(
        data.active ? "Usuário ativado com sucesso!" : "Usuário desativado."
      );
    } catch {
      toast.error("Erro inesperado. Tente novamente.");
    }
  }

  const active = users.filter((u) => u.active);
  const inactive = users.filter((u) => !u.active);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500 mt-1">
            {active.length} usuário{active.length !== 1 ? "s" : ""} ativo{active.length !== 1 ? "s" : ""}
            {inactive.length > 0 && ` · ${inactive.length} inativo${inactive.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          + Novo usuário
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Nome
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                E-mail
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">
                Setor
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Perfil
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr
                key={user.id}
                className={`hover:bg-slate-50 transition-colors ${!user.active ? "opacity-50" : ""}`}
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {user.name}
                </td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                  {user.department || "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.active
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {user.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-blue-600 text-xs font-medium hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleToggle(user)}
                      className={`text-xs font-medium hover:underline ${
                        user.active ? "text-red-500" : "text-green-600"
                      }`}
                    >
                      {user.active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              {editingUser ? "Editar usuário" : "Novo usuário"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nome completo *
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Maria Silva"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="maria@escola.com.br"
                  disabled={loading}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {editingUser ? "Nova senha (deixe em branco para manter)" : "Senha *"}
                </label>
                <input
                  type="password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  disabled={loading}
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Perfil *
                </label>
                <select
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                  disabled={loading}
                >
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Setor <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Ex: Administrativo, Pedagógico..."
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
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
                  {loading ? "Salvando..." : editingUser ? "Salvar alterações" : "Criar usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}