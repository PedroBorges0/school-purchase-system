import { RequestStatus, Role, ApprovalAction } from "@prisma/client";

export interface WorkflowStep {
  status: RequestStatus;
  label: string;
  stepNumber: number;
  allowedRoles: Role[];
  nextStatus: RequestStatus;
  prevStatus?: RequestStatus;
  canReject: boolean;
  canReturn: boolean;
  requiresCommentOnApprove?: boolean;
  requiresCommentOnReject?: boolean;
  requiresCommentOnReturn?: boolean;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    status: RequestStatus.EM_APROVACAO_DIRETOR,
    label: "Aprovação do Diretor",
    stepNumber: 1,
    allowedRoles: [Role.DIRETOR, Role.ADMIN],
    nextStatus: RequestStatus.EM_ORCAMENTO,
    canReject: true,
    canReturn: false,
    requiresCommentOnApprove: false,
    requiresCommentOnReject: true,
    requiresCommentOnReturn: false,
  },
  {
    status: RequestStatus.EM_ORCAMENTO,
    label: "Registro de Orçamentos",
    stepNumber: 2,
    allowedRoles: [Role.COMPRAS, Role.ADMIN],
    nextStatus: RequestStatus.EM_ANALISE_FINANCEIRA,
    prevStatus: RequestStatus.EM_APROVACAO_DIRETOR,
    canReject: false,
    canReturn: true,
    requiresCommentOnApprove: false,
    requiresCommentOnReject: false,
    requiresCommentOnReturn: true,
  },
  {
    status: RequestStatus.EM_ANALISE_FINANCEIRA,
    label: "Análise Financeira",
    stepNumber: 3,
    allowedRoles: [Role.FINANCEIRO, Role.ADMIN],
    nextStatus: RequestStatus.EM_CONTROLADORIA,
    prevStatus: RequestStatus.EM_ORCAMENTO,
    canReject: true,
    canReturn: true,
    requiresCommentOnApprove: true,
    requiresCommentOnReject: true,
    requiresCommentOnReturn: true,
  },
  {
    status: RequestStatus.EM_CONTROLADORIA,
    label: "Controladoria / Procuradoria",
    stepNumber: 4,
    allowedRoles: [Role.CONTROLADORIA, Role.ADMIN],
    nextStatus: RequestStatus.APROVADO_PARA_COMPRA,
    prevStatus: RequestStatus.EM_ANALISE_FINANCEIRA,
    canReject: true,
    canReturn: true,
    requiresCommentOnApprove: false,
    requiresCommentOnReject: true,
    requiresCommentOnReturn: true,
  },
  {
    status: RequestStatus.EM_APROVACAO_DIRETOR_GERAL,
    label: "Aprovação do Diretor Geral",
    stepNumber: 5,
    allowedRoles: [Role.DIRETOR_GERAL, Role.ADMIN],
    nextStatus: RequestStatus.APROVADO_PARA_COMPRA,
    prevStatus: RequestStatus.EM_CONTROLADORIA,
    canReject: true,
    canReturn: true,
    requiresCommentOnApprove: false,
    requiresCommentOnReject: true,
    requiresCommentOnReturn: true,
  },
  {
    status: RequestStatus.APROVADO_PARA_COMPRA,
    label: "Execução da Compra",
    stepNumber: 6,
    allowedRoles: [Role.COMPRAS, Role.ADMIN],
    nextStatus: RequestStatus.CONCLUIDO,
    canReject: false,
    canReturn: false,
    requiresCommentOnApprove: false,
    requiresCommentOnReject: false,
    requiresCommentOnReturn: false,
  },
];

export function getWorkflowStep(status: RequestStatus): WorkflowStep | null {
  return WORKFLOW_STEPS.find((s) => s.status === status) ?? null;
}

export function canUserActOnRequest(userRole: Role, status: RequestStatus): boolean {
  const step = getWorkflowStep(status);
  if (!step) return false;
  return step.allowedRoles.includes(userRole);
}

export function validateActionForStep(
  status: RequestStatus,
  action: ApprovalAction
): { valid: boolean; message?: string } {
  const step = getWorkflowStep(status);
  if (!step) return { valid: false, message: "Etapa inválida" };

  if (action === ApprovalAction.APROVADO) {
    return { valid: true };
  }

  if (action === ApprovalAction.RECUSADO) {
    return step.canReject
      ? { valid: true }
      : { valid: false, message: "Esta etapa não permite recusa" };
  }

  if (action === ApprovalAction.DEVOLVIDO) {
    return step.canReturn
      ? { valid: true }
      : { valid: false, message: "Esta etapa não permite devolução" };
  }

  if (action === ApprovalAction.COMENTARIO) {
    return { valid: true };
  }

  return { valid: false, message: "Ação inválida" };
}

export function isCommentRequired(
  status: RequestStatus,
  action: ApprovalAction
): boolean {
  const step = getWorkflowStep(status);
  if (!step) return false;

  if (action === ApprovalAction.APROVADO) {
    return !!step.requiresCommentOnApprove;
  }

  if (action === ApprovalAction.RECUSADO) {
    return !!step.requiresCommentOnReject;
  }

  if (action === ApprovalAction.DEVOLVIDO) {
    return !!step.requiresCommentOnReturn;
  }

  if (action === ApprovalAction.COMENTARIO) {
    return true;
  }

  return false;
}

export function shouldAdvanceStep(action: ApprovalAction): boolean {
  return action === ApprovalAction.APROVADO;
}

export function shouldReturnStep(action: ApprovalAction): boolean {
  return action === ApprovalAction.DEVOLVIDO;
}

export function resolveNextStatus(
  currentStatus: RequestStatus,
  action: ApprovalAction,
  requiresDG: boolean
): RequestStatus {
  if (action === ApprovalAction.COMENTARIO) {
    return currentStatus;
  }

  if (action === ApprovalAction.RECUSADO) {
    return RequestStatus.RECUSADO;
  }

  if (action === ApprovalAction.DEVOLVIDO) {
    const step = getWorkflowStep(currentStatus);
    return step?.prevStatus ?? currentStatus;
  }

  if (
    currentStatus === RequestStatus.EM_CONTROLADORIA &&
    action === ApprovalAction.APROVADO &&
    requiresDG
  ) {
    return RequestStatus.EM_APROVACAO_DIRETOR_GERAL;
  }

  const step = getWorkflowStep(currentStatus);
  return step?.nextStatus ?? currentStatus;
}

export const DG_VALUE_THRESHOLD = 5000;

export function checkRequiresDG(estimatedValue?: number | null): boolean {
  if (!estimatedValue) return false;
  return estimatedValue >= DG_VALUE_THRESHOLD;
}

export function getPendingStatusesForRole(role: Role): RequestStatus[] {
  const map: Record<Role, RequestStatus[]> = {
    SOLICITANTE: [],
    DIRETOR: [RequestStatus.EM_APROVACAO_DIRETOR],
    COMPRAS: [RequestStatus.EM_ORCAMENTO, RequestStatus.APROVADO_PARA_COMPRA],
    FINANCEIRO: [RequestStatus.EM_ANALISE_FINANCEIRA],
    CONTROLADORIA: [RequestStatus.EM_CONTROLADORIA],
    DIRETOR_GERAL: [RequestStatus.EM_APROVACAO_DIRETOR_GERAL],
    ADMIN: [
      RequestStatus.EM_APROVACAO_DIRETOR,
      RequestStatus.EM_ORCAMENTO,
      RequestStatus.EM_ANALISE_FINANCEIRA,
      RequestStatus.EM_CONTROLADORIA,
      RequestStatus.EM_APROVACAO_DIRETOR_GERAL,
      RequestStatus.APROVADO_PARA_COMPRA,
    ],
  };

  return map[role] ?? [];
}

export function getRoleForStatus(status: RequestStatus): Role | null {
  const step = getWorkflowStep(status);
  if (!step) return null;
  return step.allowedRoles[0] ?? null;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  RASCUNHO: "Rascunho",
  EM_APROVACAO_DIRETOR: "Aguardando Diretor",
  EM_ORCAMENTO: "Em Orçamento",
  EM_ANALISE_FINANCEIRA: "Análise Financeira",
  EM_CONTROLADORIA: "Controladoria",
  EM_APROVACAO_DIRETOR_GERAL: "Aguardando Diretor Geral",
  APROVADO_PARA_COMPRA: "Aprovado para Compra",
  CONCLUIDO: "Concluído",
  RECUSADO: "Recusado",
  CANCELADO: "Cancelado",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  RASCUNHO: "gray",
  EM_APROVACAO_DIRETOR: "yellow",
  EM_ORCAMENTO: "blue",
  EM_ANALISE_FINANCEIRA: "purple",
  EM_CONTROLADORIA: "indigo",
  EM_APROVACAO_DIRETOR_GERAL: "orange",
  APROVADO_PARA_COMPRA: "green",
  CONCLUIDO: "emerald",
  RECUSADO: "red",
  CANCELADO: "slate",
};