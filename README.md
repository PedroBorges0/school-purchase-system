# 🏫 Sistema de Requisição de Compras — Colégio

Sistema web profissional para gerenciamento de solicitações de compras com fluxo de aprovação multi-etapa.

---

## 🚀 Stack

| Camada | Tecnologia |
|---|---|
| Frontend + Backend | Next.js 15 (App Router) + TypeScript |
| Banco de dados | PostgreSQL via Supabase |
| ORM | Prisma |
| Autenticação | NextAuth v5 (email/senha + Google) |
| E-mail | Resend |
| Storage | Supabase Storage |
| UI | Tailwind CSS + shadcn/ui |
| Hospedagem | Vercel |

---

## ⚡ Setup rápido

### 1. Clone e instale
```bash
git clone <repo>
cd purchase-system
npm install
```

### 2. Configure variáveis de ambiente
```bash
cp .env.example .env.local
# Edite .env.local com suas credenciais
```

### 3. Configure o banco
```bash
npm run db:push       # Cria as tabelas no Supabase
npm run db:seed       # Cria usuários iniciais
```

### 4. Rode o servidor
```bash
npm run dev
# Acesse: http://localhost:3000
```

---

## 🔑 Usuários de teste (seed)

| E-mail | Senha | Papel |
|---|---|---|
| admin@colegio.edu.br | admin123 | Administrador |
| solicitante@colegio.edu.br | senha123 | Solicitante |
| diretor@colegio.edu.br | senha123 | Diretor |
| compras@colegio.edu.br | senha123 | Compras |
| financeiro@colegio.edu.br | senha123 | Financeiro |
| controladoria@colegio.edu.br | senha123 | Controladoria |
| diretorgeral@colegio.edu.br | senha123 | Diretor Geral |

---

## 🔄 Fluxo de Aprovação

```
Solicitante cria → EM_APROVACAO_DIRETOR
                         ↓ aprovado
                    EM_ORCAMENTO (Compras registra orçamentos)
                         ↓
                    EM_ANALISE_FINANCEIRA
                         ↓
                    EM_CONTROLADORIA
                         ↓ (se valor ≥ R$5.000)
                    EM_APROVACAO_DIRETOR_GERAL
                         ↓
                    APROVADO_PARA_COMPRA (Compras executa)
                         ↓
                    CONCLUIDO
```

**Qualquer etapa pode:**
- ✅ Aprovar (avança)
- ❌ Recusar (status RECUSADO)
- ↩️ Devolver (volta etapa anterior)

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/login/          # Tela de login
│   ├── (dashboard)/
│   │   ├── dashboard/         # Dashboard principal
│   │   ├── solicitacoes/      # Lista e detalhes
│   │   ├── pendentes/         # Fila de aprovação
│   │   └── admin/             # Painel admin
│   └── api/
│       ├── auth/              # NextAuth routes
│       └── purchase-requests/ # API REST
├── lib/
│   ├── workflow.ts            # Motor de fluxo
│   ├── auth.ts                # NextAuth config
│   ├── email.ts               # Templates de e-mail
│   ├── audit.ts               # Helper de auditoria
│   └── prisma.ts              # Client Prisma
└── middleware.ts              # Proteção de rotas
```

---

## 🛡️ Segurança

- Autenticação obrigatória em todas as rotas (exceto `/login`)
- RBAC: cada papel só pode agir na sua etapa
- Middleware de proteção no edge
- Senhas com hash bcrypt (12 rounds)
- Validação de dados com Zod em todas as rotas
- Auditoria completa de todas as ações

---

## 📊 Regras de Negócio

- Valor estimado ≥ R$ 5.000 → exige aprovação do Diretor Geral
- Orçamentos: mínimo 1, recomendado 3 fornecedores
- Comentário obrigatório para devoluções
- Código único gerado automaticamente (SC-XXXX)
- E-mails automáticos em cada mudança de etapa

---

## 🔮 Melhorias Futuras

- [ ] Upload de anexos (Supabase Storage)
- [ ] Relatórios em PDF
- [ ] Dashboard gerencial com gráficos
- [ ] Notificações push / Slack
- [ ] App mobile
- [ ] Integração com sistema financeiro
- [ ] SLA por etapa com alertas de prazo
- [ ] Aprovação em lote
- [ ] Templates de solicitação recorrente
