# Purchase Workflow System

Sistema web para gestão de requisições de compra com fluxo de aprovação multi-etapas, desenvolvido e implantado em ambiente escolar real. A aplicação digitaliza e padroniza o processo de compras, substituindo comunicação informal por um fluxo estruturado, rastreável e auditável.

🔗 **[Ver aplicação em produção](https://school-purchase-system.vercel.app)**

---

## Sobre o Projeto

Instituições de ensino frequentemente gerenciam compras por e-mail e formulários isolados, o que dificulta o controle, a rastreabilidade e a padronização das decisões. Este sistema foi desenvolvido para resolver esse problema de forma concreta: centraliza todo o processo em uma única plataforma, com controle de acesso por perfil, histórico completo de decisões e notificações automáticas por e-mail a cada etapa.

O projeto está em uso real, com usuários ativos e deploy contínuo via Vercel.

---

## Funcionalidades

- Criação e acompanhamento de requisições de compra
- Fluxo de aprovação sequencial com até 7 etapas configuráveis
- Aprovação do Diretor Geral ativada automaticamente para valores acima de R$ 5.000
- Registro de múltiplos orçamentos com seleção da melhor proposta
- Histórico completo de ações com data, responsável e comentário (audit trail)
- Fila de tarefas personalizada por perfil ("Aguardando minha ação")
- Notificações automáticas por e-mail a cada mudança de status
- Controle de acesso baseado em papéis (RBAC)
- Dashboard com métricas por usuário
- Proteção contra ações duplicadas e race conditions em aprovações simultâneas

---

## Fluxo de Aprovação

```
Solicitante → Diretor → Compras (orçamentos) → Financeiro → Controladoria
                                                                    ↓
                                                         [valor ≥ R$ 5.000]
                                                                    ↓
                                                           Diretor Geral
                                                                    ↓
                                                      Compras (execução) → Concluído
```

Cada etapa suporta as ações: **Aprovar**, **Recusar**, **Devolver para revisão** e **Comentar**. Toda ação é registrada no histórico com usuário, data e comentário.

---

## Perfis de Usuário

| Perfil | Responsabilidade |
|---|---|
| Solicitante | Cria e acompanha suas requisições |
| Diretor | Aprovação inicial |
| Compras | Coleta de orçamentos e execução da compra |
| Financeiro | Análise financeira |
| Controladoria | Validação e conformidade |
| Diretor Geral | Aprovação para valores acima do limite |
| Administrador | Acesso completo ao sistema |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 15 (App Router) |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL (Supabase) |
| ORM | Prisma |
| Autenticação | NextAuth v5 |
| Validação | Zod |
| Estilização | Tailwind CSS |
| E-mail | Resend |
| Deploy | Vercel |

---

## Arquitetura

O projeto foi estruturado com separação clara de responsabilidades:

```
src/
├── app/
│   ├── (dashboard)/        # Páginas protegidas (layout com auth)
│   │   ├── dashboard/      # Visão geral e métricas
│   │   ├── solicitacoes/   # Listagem, criação e detalhes
│   │   └── pendentes/      # Fila de tarefas por perfil
│   ├── api/                # Rotas REST
│   │   └── purchase-requests/
│   └── login/
└── lib/
    ├── workflow.ts          # Lógica de negócio do fluxo (desacoplada)
    ├── email.ts             # Templates e envio de notificações
    ├── audit.ts             # Registro de histórico
    └── auth.ts              # Configuração de autenticação
```

A lógica do workflow é completamente desacoplada da camada de apresentação e das APIs, o que facilita manutenção, testes e evolução das regras de negócio sem impacto nas demais camadas.

---

## Decisões Técnicas

**Workflow centralizado em `workflow.ts`** — toda a lógica de transição de estados, validação de permissões e regras de negócio está em um único módulo. As APIs consomem essa lógica sem duplicá-la.

**Proteção contra race conditions** — aprovações simultâneas são tratadas com verificação de status antes de qualquer atualização no banco, evitando inconsistências.

**Emails não bloqueantes** — o envio de notificações é feito de forma isolada após a transação principal, garantindo que uma falha no envio não afete a operação.

**Audit trail completo** — toda ação no sistema gera um registro imutável com usuário, timestamp, estado anterior e posterior.

---

## Instalação local

**Pré-requisitos:** Node.js 18+, PostgreSQL

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/purchase-system.git
cd purchase-system

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Execute as migrations
npx prisma migrate dev

# Inicie o servidor
npm run dev
```

**Variáveis necessárias:**
```env
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=
```

---

## Autor

**Pedro Borges**
Desenvolvimento fullstack — Next.js, TypeScript, Node.js, PostgreSQL

[![LinkedIn](https://img.shields.io/badge/LinkedIn-blue?style=flat&logo=linkedin)](https://linkedin.com/in/pedro-borges-23b0b825b)
[![GitHub](https://img.shields.io/badge/GitHub-black?style=flat&logo=github)](https://github.com/PedroBorges0)
