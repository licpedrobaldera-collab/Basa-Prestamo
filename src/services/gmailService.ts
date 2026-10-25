import { getAccessToken } from './googleAuth';
import { Client, Loan, PaymentTransaction, SystemSettings } from '../types';
import { formatCedula, formatDOP } from '../utils/loanCalculator';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export interface GmailMessageItem {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  subject?: string;
  to?: string;
  from?: string;
  date?: string;
}

export interface GmailUserProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

// Convert string to URL-safe Base64 for Gmail API
function toBase64Url(str: string): string {
  // UTF-8 encoding support
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Send an email directly via the official Gmail REST API
 */
export async function sendGmailMessage(options: SendEmailOptions): Promise<{ id: string; threadId: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('No hay sesión de Google activa. Por favor inicie sesión con su cuenta de Google/Gmail.');
  }

  const { to, toName, subject, htmlBody, textBody } = options;
  const toHeader = toName ? `"${toName.replace(/"/g, '')}" <${to}>` : to;

  // Build RFC 2822 standard email message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;

  const emailLines = [
    `To: ${toHeader}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    htmlBody,
  ];

  const rawMessage = emailLines.join('\r\n');
  const encodedMessage = toBase64Url(rawMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Error en la API de Gmail: ${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  return {
    id: data.id,
    threadId: data.threadId,
  };
}

/**
 * Fetch profile information of the connected Gmail account
 */
export async function getGmailUserProfile(): Promise<GmailUserProfile> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token de Gmail no disponible');
  }

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Error al obtener perfil de Gmail');
  }

  return response.json();
}

/**
 * Fetch recently sent messages
 */
export async function getRecentSentMessages(maxResults = 8): Promise<GmailMessageItem[]> {
  const token = await getAccessToken();
  if (!token) {
    return [];
  }

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:sent&maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!listRes.ok) {
    return [];
  }

  const listData = await listRes.json();
  const messages: GmailMessageItem[] = [];

  if (listData.messages && Array.isArray(listData.messages)) {
    for (const msgRef of listData.messages) {
      try {
        const itemRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgRef.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=To&metadataHeaders=Date`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (itemRes.ok) {
          const detail = await itemRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'Sin asunto';
          const to = headers.find((h: any) => h.name === 'To')?.value || '';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          messages.push({
            id: detail.id,
            threadId: detail.threadId,
            snippet: detail.snippet,
            internalDate: detail.internalDate,
            subject,
            to,
            date,
          });
        }
      } catch (e) {
        console.warn('Error fetching message detail:', e);
      }
    }
  }

  return messages;
}

// ==========================================
// Dominican Financial Email HTML Templates
// ==========================================

export function generateDueSoonEmailHtml(
  client: Client,
  loan: Loan,
  settings: SystemSettings
): { subject: string; html: string } {
  const subject = `Recordatorio de Cuota: Préstamo ${loan.code} - ${settings.companyName}`;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #1e3a8a, #0284c7); padding: 28px 24px; text-align: center; color: #ffffff; }
    .content { padding: 28px 24px; }
    .amount-box { background: #f0f9ff; border: 2px dashed #0284c7; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount-val { font-size: 28px; font-weight: 800; color: #0369a1; }
    .table-info { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    .table-info td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .table-info td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
    .btn { display: inline-block; background: #0284c7; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 22px; letter-spacing: -0.5px;">${settings.companyName.toUpperCase()}</h2>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Aviso de Cuota Próxima a Vencer</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${client.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Le saludamos cordialmente para recordarle el próximo vencimiento de su cuota correspondiente a su facilidad de crédito <strong>${loan.code}</strong>.
      </p>

      <div class="amount-box">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #0284c7; font-weight: 700; margin-bottom: 4px;">Monto de la Cuota a Pagar</div>
        <div class="amount-val">${formatDOP(loan.quota)}</div>
        <div style="font-size: 13px; color: #0284c7; margin-top: 6px;">Fecha Límite: <strong>${loan.dueDate}</strong></div>
      </div>

      <table class="table-info">
        <tr>
          <td style="color: #64748b;">Cédula del Titular:</td>
          <td>${formatCedula(client.cedula)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Préstamo Ref.:</td>
          <td>${loan.code}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Frecuencia de Pago:</td>
          <td>${loan.frequency}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Balance Actual de la Cartera:</td>
          <td>${formatDOP(loan.balance)}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #475569; margin-top: 20px; line-height: 1.5;">
        Puede realizar su abono a través de nuestro cobrador asignado en su ruta, transferencia bancaria autorizada o directamente en nuestras oficinas.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>${settings.companyName}</strong> | RNC: ${settings.rnc}</p>
      <p style="margin: 4px 0 0;">${settings.address} | Teléfono: ${settings.phone}</p>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px;">Este es un mensaje institucional automatizado emitido con autorización del sistema financiero PrestDominicana.</p>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, html };
}

export function generateOverdueEmailHtml(
  client: Client,
  loan: Loan,
  settings: SystemSettings
): { subject: string; html: string } {
  const daysOverdue = loan.daysOverdue || 1;
  const lateFee = (loan.daysOverdue || 0) * settings.defaultLateFeePerDay;
  const totalDue = loan.quota + lateFee;
  const subject = `Notificación de Atraso: Préstamo ${loan.code} - ${settings.companyName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #fecaca; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #b91c1c, #dc2626); padding: 28px 24px; text-align: center; color: #ffffff; }
    .content { padding: 28px 24px; }
    .amount-box { background: #fef2f2; border: 2px dashed #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount-val { font-size: 28px; font-weight: 800; color: #b91c1c; }
    .table-info { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    .table-info td { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .table-info td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 22px;">${settings.companyName.toUpperCase()}</h2>
      <p style="margin: 6px 0 0; opacity: 0.95; font-size: 14px;">Departamento de Cobranzas y Recuperación</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${client.name}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Le notificamos que su cuota correspondiente al contrato <strong>${loan.code}</strong> presenta <strong>${daysOverdue} días de retraso</strong> (Venció el ${loan.dueDate}).
      </p>

      <div class="amount-box">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #b91c1c; font-weight: 700; margin-bottom: 4px;">Total Pendiente (Cuota + Mora)</div>
        <div class="amount-val">${formatDOP(totalDue)}</div>
        <div style="font-size: 13px; color: #7f1d1d; margin-top: 6px;">Cuota: ${formatDOP(loan.quota)} | Recargo por Mora: ${formatDOP(lateFee)}</div>
      </div>

      <table class="table-info">
        <tr>
          <td style="color: #64748b;">Cédula:</td>
          <td>${formatCedula(client.cedula)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Balance Total Pendiente:</td>
          <td>${formatDOP(loan.balance)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Contacto de Cobranza:</td>
          <td>${settings.phone}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #475569; margin-top: 20px; line-height: 1.5;">
        Le invitamos a regularizar su cuenta a la brevedad para evitar la afectación de su historial crediticio y cargos moratorios adicionales conforme a lo acordado en su pagaré notarial.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>${settings.companyName}</strong> | RNC: ${settings.rnc}</p>
      <p style="margin: 4px 0 0;">${settings.address} | Teléfono: ${settings.phone}</p>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, html };
}

export function generatePaymentReceiptEmailHtml(
  payment: PaymentTransaction,
  settings: SystemSettings
): { subject: string; html: string } {
  const subject = `Recibo Digital de Pago No. ${payment.receiptNumber} - ${settings.companyName}`;
  const balanceRemaining = payment.balanceAfter !== undefined ? payment.balanceAfter : 0;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #d1fae5; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #059669, #10b981); padding: 28px 24px; text-align: center; color: #ffffff; }
    .content { padding: 28px 24px; }
    .amount-box { background: #ecfdf5; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .amount-val { font-size: 28px; font-weight: 800; color: #065f46; }
    .table-info { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
    .table-info td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
    .table-info td:last-child { text-align: right; font-weight: 600; color: #0f172a; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 22px;">${settings.companyName.toUpperCase()}</h2>
      <p style="margin: 6px 0 0; opacity: 0.95; font-size: 14px;">Comprobante Digital Oficial de Cobro</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Estimado(a) <strong>${payment.clientName}</strong>,</p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Confirmamos la recepción conforme de su pago aplicado con éxito a su préstamo <strong>${payment.loanCode}</strong>.
      </p>

      <div class="amount-box">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #047857; font-weight: 700; margin-bottom: 4px;">Monto Total Pagado</div>
        <div class="amount-val">${formatDOP(payment.amount)}</div>
        <div style="font-size: 13px; color: #065f46; margin-top: 6px;">Recibo No.: <strong>${payment.receiptNumber}</strong> | Fecha: ${payment.date} ${payment.time}</div>
      </div>

      <table class="table-info">
        <tr>
          <td style="color: #64748b;">Abono a Capital:</td>
          <td>${formatDOP(payment.capitalPaid)}</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Interés Cobrado:</td>
          <td>${formatDOP(payment.interestPaid)}</td>
        </tr>
        ${payment.lateFeePaid > 0 ? `
        <tr>
          <td style="color: #64748b;">Recargo por Mora:</td>
          <td style="color: #b91c1c;">${formatDOP(payment.lateFeePaid)}</td>
        </tr>` : ''}
        <tr>
          <td style="color: #64748b;">Método de Pago:</td>
          <td>${payment.method} (${payment.paymentType})</td>
        </tr>
        <tr>
          <td style="color: #64748b;">Cobrador / Agente:</td>
          <td>${payment.collectorName}</td>
        </tr>
        <tr style="border-top: 2px solid #e2e8f0;">
          <td style="color: #0f172a; font-weight: 700;">Balance Restante de Cartera:</td>
          <td style="color: #0284c7; font-size: 16px;">${formatDOP(balanceRemaining)}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #475569; margin-top: 20px; line-height: 1.5;">
        Agradecemos su responsabilidad y puntualidad en el cumplimiento de sus compromisos financieros.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>${settings.companyName}</strong> | RNC: ${settings.rnc}</p>
      <p style="margin: 4px 0 0;">${settings.address} | Teléfono: ${settings.phone}</p>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 11px;">Comprobante de valor legal respaldado electrónicamente.</p>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, html };
}

export function generateAccountStatementEmailHtml(
  client: Client,
  loans: Loan[],
  settings: SystemSettings
): { subject: string; html: string } {
  const activeLoans = loans.filter((l) => l.clientId === client.id && l.status !== 'RECHAZADO');
  const totalBalance = activeLoans.reduce((acc, l) => acc + (l.status === 'PAID' ? 0 : l.balance), 0);
  const subject = `Estado de Cuenta Financiero - ${client.name} - ${settings.companyName}`;

  const rowsHtml = activeLoans
    .map(
      (l) => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9;"><strong>${l.code}</strong></td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9;">${l.type} (${l.frequency})</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatDOP(l.quota)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; color: #0284c7;">${formatDOP(l.balance)}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">
        <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background: ${l.status === 'PAID' ? '#dcfce7; color: #166534;' : l.status === 'OVERDUE' ? '#fee2e2; color: #991b1b;' : '#e0f2fe; color: #075985;'} font-weight: 600;">
          ${l.status}
        </span>
      </td>
    </tr>
  `
    )
    .join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: linear-gradient(135deg, #0f172a, #334155); padding: 28px 24px; text-align: center; color: #ffffff; }
    .content { padding: 28px 24px; }
    .balance-badge { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; margin: 16px 0; display: flex; justify-content: space-between; align-items: center; }
    .table-loans { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
    .table-loans th { background: #f8fafc; padding: 10px 8px; text-align: left; font-weight: 600; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    .footer { background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2 style="margin: 0; font-size: 22px;">${settings.companyName.toUpperCase()}</h2>
      <p style="margin: 6px 0 0; opacity: 0.9; font-size: 14px;">Estado de Cuenta Financiero al Día</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Titular: <strong>${client.name}</strong> | Cédula: <strong>${formatCedula(client.cedula)}</strong></p>
      
      <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 10px; padding: 16px; margin: 16px 0;">
        <div style="font-size: 13px; color: #166534; font-weight: 600;">Saldo Total Consolidado en Cartera</div>
        <div style="font-size: 26px; font-weight: 800; color: #15803d; margin-top: 4px;">${formatDOP(totalBalance)}</div>
      </div>

      <h4 style="margin: 20px 0 8px; color: #0f172a;">Detalle de Créditos Activos e Históricos:</h4>
      <table class="table-loans">
        <thead>
          <tr>
            <th>Préstamo</th>
            <th>Tipo</th>
            <th style="text-align: right;">Cuota</th>
            <th style="text-align: right;">Balance</th>
            <th style="text-align: center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 16px; color: #94a3b8;">No hay créditos registrados</td></tr>'}
        </tbody>
      </table>
    </div>
    <div class="footer">
      <p style="margin: 0;"><strong>${settings.companyName}</strong> | RNC: ${settings.rnc}</p>
      <p style="margin: 4px 0 0;">${settings.address} | Teléfono: ${settings.phone}</p>
    </div>
  </div>
</body>
</html>
  `;
  return { subject, html };
}
