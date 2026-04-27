import { Resend } from "resend";
import { ApprovalAction, RequestStatus, Role } from "@prisma/client";
import { STATUS_LABELS } from "./workflow";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "compras@colegio.edu.br";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

interface StatusChangeEmailProps {
  requestId: string;
  requestCode: string;
  requestTitle: string;
  requesterName: string;
  requesterEmail: string;
  newStatus: RequestStatus;
  action: ApprovalAction;
  comment?: string | null;
  actorName: string;
}

interface NewRequestEmailProps {
  requestId: string;
  requestCode: string;
  requestTitle: string;
  requesterName: string;
  recipientEmail: string;
  recipientName: string;
}

interface NextApproverEmailProps {
  requestId: string;
  requestCode: string;
  requestTitle: string;
  requesterName: string;
  recipientEmail: string;
  recipientName: string;
  newStatus: RequestStatus;
  role: Role;
}

function actionLabel(action: ApprovalAction): string {
  const labels: Record<ApprovalAction, string> = {
    APROVADO: "✅ Aprovada",
    RECUSADO: "❌ Recusada",
    DEVOLVIDO: "↩️ Devolvida",
    COMENTARIO: "💬 Comentário adicionado",
  };
  return labels[action];
}

function roleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    SOLICITANTE: "Solicitante",
    DIRETOR: "Diretor",
    COMPRAS: "Compras",
    FINANCEIRO: "Financeiro",
    CONTROLADORIA: "Controladoria",
    DIRETOR_GERAL: "Diretor Geral",
    ADMIN: "Administrador",
  };
  return labels[role];
}

async function safeSendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[EMAIL] RESEND_API_KEY não configurada. E-mail não enviado.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
  } catch (error) {
    console.error("[EMAIL] Erro ao enviar e-mail:", error);
  }
}

export async function sendStatusChangeEmail({
  requestId,
  requestCode,
  requestTitle,
  requesterName,
  requesterEmail,
  newStatus,
  action,
  comment,
  actorName,
}: StatusChangeEmailProps) {
  const subject = `[${requestCode}] Solicitação ${actionLabel(action)}`;
  const detailsUrl = `${APP_URL}/solicitacoes/${requestId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Sistema de Compras</h1>
      </div>

      <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p>Olá, <strong>${requesterName}</strong></p>
        <p>Sua solicitação <strong>${requestCode}</strong> - "${requestTitle}" teve uma atualização.</p>

        <div style="background: white; border-left: 4px solid #1e40af; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Ação:</strong> ${actionLabel(action)}</p>
          <p style="margin: 8px 0 0;"><strong>Novo status:</strong> ${STATUS_LABELS[newStatus]}</p>
          <p style="margin: 8px 0 0;"><strong>Por:</strong> ${actorName}</p>
          ${comment ? `<p style="margin: 8px 0 0;"><strong>Comentário:</strong> ${comment}</p>` : ""}
        </div>

        <p>
          <a href="${detailsUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
            Ver solicitação
          </a>
        </p>
      </div>
    </div>
  `;

  await safeSendEmail({
    to: requesterEmail,
    subject,
    html,
  });
}

export async function sendNewRequestEmail({
  requestId,
  requestCode,
  requestTitle,
  requesterName,
  recipientEmail,
  recipientName,
}: NewRequestEmailProps) {
  const subject = `[${requestCode}] Nova solicitação aguardando sua aprovação`;
  const detailsUrl = `${APP_URL}/solicitacoes/${requestId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1e40af; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Sistema de Compras</h1>
      </div>

      <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p>Olá, <strong>${recipientName}</strong></p>
        <p>Uma nova solicitação de compra aguarda sua análise:</p>

        <div style="background: white; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Código:</strong> ${requestCode}</p>
          <p style="margin: 8px 0 0;"><strong>Título:</strong> ${requestTitle}</p>
          <p style="margin: 8px 0 0;"><strong>Solicitado por:</strong> ${requesterName}</p>
        </div>

        <p>
          <a href="${detailsUrl}" style="display:inline-block;background:#1e40af;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
            Abrir solicitação
          </a>
        </p>
      </div>
    </div>
  `;

  await safeSendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}

export async function sendPendingActionEmail({
  requestId,
  requestCode,
  requestTitle,
  requesterName,
  recipientEmail,
  recipientName,
  newStatus,
  role,
}: NextApproverEmailProps) {
  const subject = `[${requestCode}] Solicitação aguardando ação de ${roleLabel(role)}`;
  const detailsUrl = `${APP_URL}/solicitacoes/${requestId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #0f766e; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">Sistema de Compras</h1>
      </div>

      <div style="padding: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p>Olá, <strong>${recipientName}</strong></p>
        <p>Uma solicitação foi encaminhada para sua etapa.</p>

        <div style="background: white; border-left: 4px solid #0f766e; padding: 16px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Código:</strong> ${requestCode}</p>
          <p style="margin: 8px 0 0;"><strong>Título:</strong> ${requestTitle}</p>
          <p style="margin: 8px 0 0;"><strong>Solicitante:</strong> ${requesterName}</p>
          <p style="margin: 8px 0 0;"><strong>Status:</strong> ${STATUS_LABELS[newStatus]}</p>
          <p style="margin: 8px 0 0;"><strong>Sua etapa:</strong> ${roleLabel(role)}</p>
        </div>

        <p>
          <a href="${detailsUrl}" style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;">
            Abrir solicitação
          </a>
        </p>
      </div>
    </div>
  `;

  await safeSendEmail({
    to: recipientEmail,
    subject,
    html,
  });
}