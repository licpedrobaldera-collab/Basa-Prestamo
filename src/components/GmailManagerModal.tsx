import React, { useState, useEffect } from 'react';
import {
  AuthSession,
  Client,
  Loan,
  NotificationLog,
  PaymentTransaction,
  SystemSettings,
} from '../types';
import { formatCedula, formatDOP } from '../utils/loanCalculator';
import {
  googleSignIn,
  googleLogout,
  getAccessToken,
  getCurrentGoogleUser,
  initAuth,
} from '../services/googleAuth';
import {
  sendGmailMessage,
  getRecentSentMessages,
  getGmailUserProfile,
  generateDueSoonEmailHtml,
  generateOverdueEmailHtml,
  generatePaymentReceiptEmailHtml,
  generateAccountStatementEmailHtml,
  GmailMessageItem,
  GmailUserProfile,
} from '../services/gmailService';
import { User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import {
  Mail,
  X,
  Send,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  Edit3,
  Calendar,
  DollarSign,
  UserCheck,
  ShieldCheck,
  LogOut,
  Sparkles,
  Inbox,
  Clock,
  ArrowRight,
  ExternalLink,
  Info,
  Check,
} from 'lucide-react';

interface GmailManagerModalProps {
  isOpen: boolean;
  clients: Client[];
  loans: Loan[];
  payments: PaymentTransaction[];
  settings: SystemSettings;
  currentSession: AuthSession;
  initialDraft?: {
    clientId?: string;
    loanId?: string;
    paymentId?: string;
    templateType?: 'DUE_SOON' | 'OVERDUE' | 'RECEIPT' | 'STATEMENT' | 'CUSTOM';
    recipientEmail?: string;
    customSubject?: string;
  };
  onClose: () => void;
  onLogNotification: (log: NotificationLog) => void;
}

type TemplateType = 'DUE_SOON' | 'OVERDUE' | 'RECEIPT' | 'STATEMENT' | 'CUSTOM';

export const GmailManagerModal: React.FC<GmailManagerModalProps> = ({
  isOpen,
  clients,
  loans,
  payments,
  settings,
  currentSession,
  initialDraft,
  onClose,
  onLogNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'COMPOSE' | 'SENT_HISTORY' | 'BATCH_REMINDERS'>('COMPOSE');

  // Google Auth State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [gmailProfile, setGmailProfile] = useState<GmailUserProfile | null>(null);

  // Email Compose State
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedLoanId, setSelectedLoanId] = useState<string>('');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [templateType, setTemplateType] = useState<TemplateType>('DUE_SOON');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'EDIT' | 'PREVIEW'>('PREVIEW');

  // Sending & Confirmation State
  const [isSending, setIsSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sent History from Gmail
  const [recentSent, setRecentSent] = useState<GmailMessageItem[]>([]);
  const [isLoadingSent, setIsLoadingSent] = useState(false);

  // Initialize Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setHasToken(!!token);
      },
      () => {
        setGoogleUser(getCurrentGoogleUser());
        setHasToken(false);
      }
    );

    // Initial token check
    getAccessToken().then((token) => {
      setHasToken(!!token);
      setGoogleUser(getCurrentGoogleUser());
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Sync draft or pre-selected parameters
  useEffect(() => {
    if (!isOpen) return;

    if (initialDraft?.clientId) {
      setSelectedClientId(initialDraft.clientId);
    } else if (clients.length > 0 && !selectedClientId) {
      setSelectedClientId(clients[0].id);
    }

    if (initialDraft?.loanId) {
      setSelectedLoanId(initialDraft.loanId);
    }

    if (initialDraft?.paymentId) {
      setSelectedPaymentId(initialDraft.paymentId);
    }

    if (initialDraft?.templateType) {
      setTemplateType(initialDraft.templateType);
    }

    if (initialDraft?.recipientEmail) {
      setRecipientEmail(initialDraft.recipientEmail);
    }
  }, [isOpen, initialDraft, clients]);

  // Load Gmail profile and sent messages when authenticated
  useEffect(() => {
    if (hasToken && isOpen) {
      getGmailUserProfile()
        .then((profile) => setGmailProfile(profile))
        .catch((err) => console.warn('Could not fetch Gmail profile:', err));

      loadSentMessages();
    }
  }, [hasToken, isOpen]);

  // Update recipient email and generate template when client/loan/template changes
  useEffect(() => {
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    setRecipientName(client.name);
    // Prioritize existing draft recipientEmail if provided, else client's email
    if (!initialDraft?.recipientEmail || selectedClientId !== initialDraft.clientId) {
      setRecipientEmail(client.email || '');
    }

    // Auto-select first loan of client if none selected
    const clientLoans = loans.filter((l) => l.clientId === client.id);
    let targetLoan = clientLoans.find((l) => l.id === selectedLoanId);
    if (!targetLoan && clientLoans.length > 0) {
      targetLoan = clientLoans[0];
      setSelectedLoanId(targetLoan.id);
    }

    // Generate template
    generateTemplateContent(templateType, client, targetLoan);
  }, [selectedClientId, selectedLoanId, selectedPaymentId, templateType]);

  const generateTemplateContent = (type: TemplateType, client?: Client, loan?: Loan) => {
    const activeClient = client || clients.find((c) => c.id === selectedClientId);
    if (!activeClient) return;

    const activeLoan = loan || loans.find((l) => l.id === selectedLoanId);

    if (type === 'DUE_SOON' && activeLoan) {
      const { subject: s, html } = generateDueSoonEmailHtml(activeClient, activeLoan, settings);
      setSubject(s);
      setHtmlContent(html);
    } else if (type === 'OVERDUE' && activeLoan) {
      const { subject: s, html } = generateOverdueEmailHtml(activeClient, activeLoan, settings);
      setSubject(s);
      setHtmlContent(html);
    } else if (type === 'RECEIPT') {
      const payment = payments.find((p) => p.id === selectedPaymentId) || payments[0];
      if (payment) {
        const { subject: s, html } = generatePaymentReceiptEmailHtml(payment, settings);
        setSubject(s);
        setHtmlContent(html);
      } else if (activeLoan) {
        const { subject: s, html } = generateDueSoonEmailHtml(activeClient, activeLoan, settings);
        setSubject(s);
        setHtmlContent(html);
      }
    } else if (type === 'STATEMENT') {
      const { subject: s, html } = generateAccountStatementEmailHtml(activeClient, loans, settings);
      setSubject(s);
      setHtmlContent(html);
    } else if (type === 'CUSTOM') {
      setSubject(`Comunicado Oficial: ${activeClient.name} - ${settings.companyName}`);
      setHtmlContent(`
<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
  <h2 style="color: #0284c7;">${settings.companyName}</h2>
  <p>Estimado(a) <strong>${activeClient.name}</strong>,</p>
  <p>Esperamos que se encuentre bien. Le escribimos con relación a su facilidad de crédito registrada en nuestra entidad financiera.</p>
  <p>Quedamos a su entera disposición ante cualquier consulta.</p>
  <br>
  <hr style="border: none; border-top: 1px solid #e2e8f0;">
  <p style="font-size: 12px; color: #64748b;">${settings.companyName} | Tel: ${settings.phone}</p>
</div>
      `);
    }
  };

  const loadSentMessages = async () => {
    setIsLoadingSent(true);
    try {
      const sent = await getRecentSentMessages(10);
      setRecentSent(sent);
    } catch (e) {
      console.warn('Error loading sent messages:', e);
    } finally {
      setIsLoadingSent(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setHasToken(true);
        confetti({ particleCount: 30, spread: 60 });
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Error al autenticar con Google');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleLogout();
    setGoogleUser(null);
    setHasToken(false);
    setGmailProfile(null);
    setRecentSent([]);
  };

  // Open confirmation modal before dispatching
  const handleInitiateSend = () => {
    setErrorMessage(null);
    setSendSuccessMessage(null);

    if (!recipientEmail || !recipientEmail.includes('@')) {
      setErrorMessage('Por favor ingrese una dirección de correo electrónico válida para el destinatario.');
      return;
    }

    if (!subject.trim()) {
      setErrorMessage('El asunto del correo no puede estar vacío.');
      return;
    }

    // MANDATORY USER CONFIRMATION PER SKILL
    setShowConfirmModal(true);
  };

  // Execute actual send after user confirmation
  const handleConfirmAndSend = async () => {
    setShowConfirmModal(false);
    setIsSending(true);
    setErrorMessage(null);

    try {
      const result = await sendGmailMessage({
        to: recipientEmail,
        toName: recipientName,
        subject,
        htmlBody: htmlContent,
      });

      // Log notification
      const activeClient = clients.find((c) => c.id === selectedClientId);
      const activeLoan = loans.find((l) => l.id === selectedLoanId);

      const log: NotificationLog = {
        id: `LOG-GM-${Date.now()}`,
        clientId: selectedClientId || 'CLI-00',
        clientName: recipientName || 'Cliente',
        phone: activeClient?.phone || 'N/A',
        email: recipientEmail,
        subject,
        channel: 'GMAIL',
        type:
          templateType === 'DUE_SOON'
            ? 'PROXIMA_A_VENCER'
            : templateType === 'OVERDUE'
            ? 'MORA'
            : templateType === 'RECEIPT'
            ? 'PAGO_REALIZADO'
            : 'PERSONALIZADO',
        message: `Correo enviado vía Gmail a ${recipientEmail}: "${subject}" (ID: ${result.id})`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
        status: 'ENVIADO',
        loanCode: activeLoan?.code,
        sentBy: currentSession.name,
      };

      onLogNotification(log);
      confetti({ particleCount: 50, spread: 70 });
      setSendSuccessMessage(`¡Correo enviado con éxito a ${recipientEmail} a través de Gmail!`);

      // Refresh sent list
      loadSentMessages();
    } catch (error: any) {
      console.error('Error sending Gmail:', error);
      setErrorMessage(error?.message || 'Error al enviar el correo a través de la API de Gmail.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const clientLoans = loans.filter((l) => l.clientId === selectedClientId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-slate-100">
        
        {/* Modal Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Centro de Notificaciones Gmail & Google Workspace
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  Gmail API 1P
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Envío oficial de avisos de cobro, contratos, recibos digitales y estados de cuenta certificados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasToken && googleUser ? (
              <div className="flex items-center gap-2 bg-slate-800/80 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs">
                {googleUser.photoURL ? (
                  <img
                    src={googleUser.photoURL}
                    alt={googleUser.displayName || 'Google'}
                    className="w-5 h-5 rounded-full border border-emerald-400"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {googleUser.displayName?.[0] || 'G'}
                  </div>
                )}
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-emerald-300 truncate max-w-[140px]">
                    {googleUser.email}
                  </span>
                  <span className="text-[10px] text-emerald-400/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Gmail Conectado
                  </span>
                </div>
                <button
                  onClick={handleGoogleLogout}
                  title="Desconectar cuenta de Google"
                  className="ml-1 p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 gap-2">
          <button
            onClick={() => setActiveTab('COMPOSE')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'COMPOSE'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            Redactar y Enviar Correo
          </button>
          <button
            onClick={() => setActiveTab('BATCH_REMINDERS')}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'BATCH_REMINDERS'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Asistente de Cobro en Lote
          </button>
          <button
            onClick={() => {
              setActiveTab('SENT_HISTORY');
              if (hasToken) loadSentMessages();
            }}
            className={`px-4 py-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'SENT_HISTORY'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Inbox className="w-4 h-4" />
            Envíos Recientes de Gmail
          </button>
        </div>

        {/* Connection Notice / Banner if not connected */}
        {!hasToken && (
          <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Conexión con Google Workspace requerida
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Para despachar notificaciones legales, recibos y avisos por correo electrónico desde su propia cuenta de Gmail institucional, inicie sesión con Google.
                </p>
              </div>
            </div>

            {/* Official GSI Button Style as specified in workspace-integration */}
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="gsi-material-button shadow-md shrink-0 cursor-pointer"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isAuthenticating ? 'Conectando...' : 'Iniciar sesión con Google'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Success or Error alerts */}
        {sendSuccessMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{sendSuccessMessage}</span>
            </div>
            <button
              onClick={() => setSendSuccessMessage(null)}
              className="text-emerald-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'COMPOSE' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* Form Controls Column */}
              <div className="lg:col-span-5 space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-red-400" />
                  Destinatario & Préstamo
                </h4>

                {/* Client Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cliente Seleccionado
                  </label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({formatCedula(c.cedula)}) {c.email ? `• ${c.email}` : '• [Sin email]'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Correo Electrónico del Destinatario</span>
                    {!recipientEmail && (
                      <span className="text-[10px] text-amber-400">Requerido</span>
                    )}
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="cliente@ejemplo.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Si el cliente no tiene correo registrado, puede escribirlo manualmente aquí.
                  </p>
                </div>

                {/* Loan Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Préstamo Vinculado
                  </label>
                  {clientLoans.length > 0 ? (
                    <select
                      value={selectedLoanId}
                      onChange={(e) => setSelectedLoanId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      {clientLoans.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.code} • Cuota: {formatDOP(l.quota)} • Saldo: {formatDOP(l.balance)} ({l.status})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
                      Este cliente no tiene préstamos activos. Se enviará estado general.
                    </div>
                  )}
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Plantilla Financiera Automatizada
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateType('DUE_SOON')}
                      className={`p-2 rounded-lg text-left text-xs border transition ${
                        templateType === 'DUE_SOON'
                          ? 'bg-blue-950/60 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      📅 Cuota Próxima
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateType('OVERDUE')}
                      className={`p-2 rounded-lg text-left text-xs border transition ${
                        templateType === 'OVERDUE'
                          ? 'bg-red-950/60 border-red-500 text-red-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      ⚠️ Aviso de Mora
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateType('RECEIPT')}
                      className={`p-2 rounded-lg text-left text-xs border transition ${
                        templateType === 'RECEIPT'
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      🧾 Recibo de Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateType('STATEMENT')}
                      className={`p-2 rounded-lg text-left text-xs border transition ${
                        templateType === 'STATEMENT'
                          ? 'bg-purple-950/60 border-purple-500 text-purple-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      📊 Estado de Cuenta
                    </button>
                  </div>
                </div>

                {/* If Receipt template, select payment */}
                {templateType === 'RECEIPT' && payments.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Comprobante de Pago a Adjuntar
                    </label>
                    <select
                      value={selectedPaymentId}
                      onChange={(e) => setSelectedPaymentId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {payments.map((p) => (
                        <option key={p.id} value={p.id}>
                          Recibo #{p.receiptNumber} • {formatDOP(p.amount)} ({p.date}) • {p.clientName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subject Line */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Asunto del Correo
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    onClick={handleInitiateSend}
                    disabled={isSending || !hasToken}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition ${
                      hasToken
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 cursor-pointer shadow-red-500/20'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    {isSending
                      ? 'Procesando envío con Gmail...'
                      : hasToken
                      ? 'Enviar Correo Oficial vía Gmail'
                      : 'Inicie sesión con Google para Enviar'}
                  </button>
                  {!hasToken && (
                    <p className="text-[11px] text-amber-400/90 text-center mt-2">
                      Haga clic arriba en &quot;Iniciar sesión con Google&quot; para autorizar el envío.
                    </p>
                  )}
                </div>
              </div>

              {/* Preview & Code Column */}
              <div className="lg:col-span-7 flex flex-col bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Vista del Correo
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                      HTML Responsivo
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setPreviewMode('PREVIEW')}
                      className={`px-3 py-1 rounded-md transition ${
                        previewMode === 'PREVIEW'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1" />
                      Vista Previa
                    </button>
                    <button
                      onClick={() => setPreviewMode('EDIT')}
                      className={`px-3 py-1 rounded-md transition ${
                        previewMode === 'EDIT'
                          ? 'bg-slate-800 text-white font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5 inline mr-1" />
                      Código HTML
                    </button>
                  </div>
                </div>

                <div className="flex-1 mt-3 min-h-[380px] max-h-[500px] overflow-hidden rounded-lg border border-slate-800 bg-white">
                  {previewMode === 'PREVIEW' ? (
                    <iframe
                      title="Email Preview"
                      srcDoc={htmlContent}
                      className="w-full h-full border-none"
                      sandbox="allow-same-origin"
                    />
                  ) : (
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="w-full h-full p-3 font-mono text-xs bg-slate-950 text-slate-200 resize-none focus:outline-none"
                    />
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Batch Reminders Assistant */}
          {activeTab === 'BATCH_REMINDERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Asistente Inteligente de Cobros y Vencimientos
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Clientes de la cartera con cuotas próximas a vencer o en mora listos para recibir notificación por correo.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/40 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">Cédula</th>
                      <th className="p-3">Correo Electrónico</th>
                      <th className="p-3">Préstamo</th>
                      <th className="p-3 text-right">Cuota</th>
                      <th className="p-3">Vencimiento</th>
                      <th className="p-3 text-center">Estado</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loans
                      .filter((l) => l.status !== 'PAID' && l.status !== 'RECHAZADO')
                      .map((loan) => {
                        const client = clients.find((c) => c.id === loan.clientId);
                        if (!client) return null;
                        const isOverdue = loan.status === 'OVERDUE' || (loan.daysOverdue || 0) > 0;

                        return (
                          <tr key={loan.id} className="hover:bg-slate-900/40 transition">
                            <td className="p-3 font-semibold text-white">{client.name}</td>
                            <td className="p-3 text-slate-400">{formatCedula(client.cedula)}</td>
                            <td className="p-3">
                              {client.email ? (
                                <span className="text-blue-400 flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {client.email}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic">No registrado</span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-slate-300">{loan.code}</td>
                            <td className="p-3 text-right font-bold text-amber-400">
                              {formatDOP(loan.quota)}
                            </td>
                            <td className="p-3 text-slate-300">{loan.dueDate}</td>
                            <td className="p-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isOverdue
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {isOverdue ? `En Mora (${loan.daysOverdue || 1}d)` : 'Por Vencer'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  setSelectedLoanId(loan.id);
                                  setTemplateType(isOverdue ? 'OVERDUE' : 'DUE_SOON');
                                  setActiveTab('COMPOSE');
                                }}
                                className="px-3 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 cursor-pointer shadow"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                Preparar Gmail
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Recent Sent Messages via Gmail */}
          {activeTab === 'SENT_HISTORY' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Inbox className="w-4 h-4 text-red-400" />
                    Bandeja de Elementos Enviados (Gmail API)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Historial de correos despachados sincronizados directamente con su buzón de Gmail.
                  </p>
                </div>
                <button
                  onClick={loadSentMessages}
                  disabled={isLoadingSent || !hasToken}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSent ? 'animate-spin' : ''}`} />
                  Actualizar Buzón
                </button>
              </div>

              {!hasToken ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  <Mail className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>Inicie sesión con su cuenta de Google para sincronizar sus envíos de Gmail.</p>
                </div>
              ) : recentSent.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  <Clock className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p>No se encontraron correos enviados recientes en esta cuenta.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSent.map((msg) => (
                    <div
                      key={msg.id}
                      className="p-3.5 bg-slate-950/50 hover:bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between transition gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-white">
                            {msg.subject || 'Sin Asunto'}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Para: <span className="text-slate-300 font-mono">{msg.to}</span>
                          </div>
                          {msg.snippet && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {msg.snippet}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-slate-400 block">{msg.date}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 mt-1 inline-block">
                          Entregado
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Integración Oficial Google Workspace (OAuth2 + Gmail REST API)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>

      {/* ========================================================
          MANDATORY CONFIRMATION MODAL FOR DESTRUCTIVE / DISPATCH OPERATION
          (As strictly required by the Google Workspace integration skill)
          ======================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-red-500/40 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">
                  Confirmación de Envío por Gmail
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Se dispone a enviar un correo formal desde su cuenta de Google. Por favor verifique los datos antes de continuar:
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Destinatario:</span>
                <span className="font-semibold text-white">{recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Correo destino:</span>
                <span className="font-mono text-red-400 font-semibold">{recipientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Asunto:</span>
                <span className="font-medium text-slate-200 text-right max-w-[240px] truncate">{subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cuenta remitente:</span>
                <span className="font-mono text-emerald-400">{googleUser?.email}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Al confirmar, el mensaje será enviado inmediatamente a través de la API oficial de Gmail y quedará registrado en su libro diario y registro de auditoría.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAndSend}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-red-600/30 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Confirmar y Enviar Correo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
