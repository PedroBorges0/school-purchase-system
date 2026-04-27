# School Purchase Workflow System

Sistema web para gestão de requisições de compra com fluxo de aprovação multi-etapas, desenvolvido para digitalizar e padronizar o processo de compras em ambiente escolar.

---

## Contexto

O processo de requisições de compra em instituições de ensino frequentemente depende de comunicação informal (e-mails, formulários isolados), o que dificulta o controle, a rastreabilidade e a padronização das decisões.

Este projeto foi desenvolvido com o objetivo de centralizar e estruturar esse fluxo, garantindo maior controle operacional e transparência nas etapas de aprovação.

---

## Objetivo

Fornecer uma aplicação que permita:

* registro estruturado de solicitações de compra
* definição de fluxo de aprovação baseado em papéis
* rastreamento completo do histórico de decisões
* organização da etapa de orçamentos
* controle de acesso por perfil de usuário

---

## Fluxo de Aprovação

O sistema implementa um fluxo sequencial baseado em regras de negócio:

1. Solicitante cria a requisição
2. Diretor realiza a aprovação inicial
3. Setor de Compras registra os orçamentos
4. Financeiro realiza análise
5. Controladoria valida a requisição
6. Diretor Geral (quando necessário)
7. Compras executa a aquisição
8. Solicitação é concluída

---

## Funcionalidades

* Criação e gerenciamento de requisições de compra
* Workflow de aprovação baseado em estados
* Registro de múltiplos orçamentos por solicitação
* Seleção de proposta recomendada
* Histórico completo de ações (audit trail)
* Fila de tarefas por usuário ("pendentes para mim")
* Controle de acesso baseado em papéis (RBAC)

---

## Perfis de Usuário

* Solicitante
* Diretor
* Compras
* Financeiro
* Controladoria
* Diretor Geral
* Administrador

Cada perfil possui permissões específicas e acesso restrito às etapas correspondentes do fluxo.

---

## Tecnologias Utilizadas

* Next.js (App Router)
* Node.js
* Prisma ORM
* PostgreSQL
* NextAuth (autenticação)
* Zod (validação de dados)
* Tailwind CSS

---

## Arquitetura

O sistema foi estruturado com separação clara de responsabilidades:

* Camada de apresentação (Next.js)
* APIs REST para operações de negócio
* Camada de domínio responsável pelo workflow (`workflow.ts`)
* Persistência via Prisma ORM
* Módulos auxiliares para autenticação, auditoria e envio de e-mails

A lógica de fluxo de aprovação é centralizada e desacoplada, permitindo manutenção e evolução sem impacto nas demais camadas.

---

## Controle de Acesso

A aplicação implementa controle de acesso baseado em papéis (RBAC), garantindo que:

* usuários só visualizem solicitações relevantes
* ações sejam permitidas apenas na etapa correta
* o fluxo siga as regras definidas de negócio

---

## Ambiente de Desenvolvimento

### Pré-requisitos

* Node.js
* PostgreSQL

### Instalação

```bash
npm install
npm run dev
```

---

## Usuários de Teste

Senha padrão: `123456`

* [solicitante@teste.com](mailto:solicitante@teste.com)
* [diretor@teste.com](mailto:diretor@teste.com)
* [compras@teste.com](mailto:compras@teste.com)
* [financeiro@teste.com](mailto:financeiro@teste.com)
* [controladoria@teste.com](mailto:controladoria@teste.com)
* [dg@teste.com](mailto:dg@teste.com)
* [admin@teste.com](mailto:admin@teste.com)

---

## Status do Projeto

Em desenvolvimento contínuo.

As funcionalidades principais do fluxo de requisições e aprovação já estão implementadas. Melhorias futuras incluem otimizações de interface, notificações e recursos analíticos.

---

## Possíveis Evoluções

* Deploy em ambiente de produção
* Integração com serviços de e-mail em tempo real
* Painéis analíticos e relatórios gerenciais
* Integração com sistemas financeiros/ERP
* Notificações em tempo real (WebSocket)

---

## Autor

Pedro Borges
