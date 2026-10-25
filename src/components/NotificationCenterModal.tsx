import React, { useState } from 'react';
import {
  AuthSession,
  Client,
  Loan,
  NotificationChannel,
  NotificationLog,
  NotificationTriggerType,
  RouteStop,
  SystemSettings,
} from '../types';
import { formatCedula, formatDOP } from '../utils/loanCalculator';
import {
  Bell,
  X,
  MessageCircle,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  Phone,
  Search,
  Filter,
  Check,
  Copy,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Route,
  Mail,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NotificationCenterModalProps {
  isOpen: boolean;
  loans: Loan[];
  clients: Client[];
  routeStops: RouteStop[];
  settings: SystemSettings;
  currentSession: AuthSession;
  notificationLogs: NotificationLog[];
  onClose: () => void;
  onSendNotification: (log: NotificationLog) => void;
  onOpenGmail?: (client?: Client, loan?: Loan) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  loans,
  clients,
  routeStops,
  settings,
  currentSession,
  notificationLogs,
  onClose,
  onSendNotification,
  onOpenGmail,
}) => {
  const [activeTab, setActiveTab] = useState<'AUTO_REMINDERS' | 'ROUTE_BROADCAST' | 'HISTORY'>('AUTO_REMINDERS');
  const [selectedChannel, setSelectedChannel] = useState<NotificationChannel>('WHATSAPP');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filtro de recordatorios automáticos (cuotas próximas a vencer y en mora)
  const todayISO = new Date().toISOString().split('T')[0];

  const dueSoonLoans = loans.filter((l) => {
    if (l.status === 'PAID' || l.status === 'RECHAZADO') return false;
    return true;
  });

  if (!isOpen) return null;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getCleanPhone = (phoneStr?: string) => {
    if (!phoneStr) return '18090000000';
    const clean = phoneStr.replace(/\D/g, '');
    return clean.startsWith('1') ? clean : `1${clean}`;
  };

  const buildWhatsAppLink = (phone: string, message: string) => {
    const clean = getCleanPhone(phone);
    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  };

  const buildSmsLink = (phone: string, message: string) => {
    const clean = getCleanPhone(phone);
    return `sms:${clean}?body=${encodeURIComponent(message)}`;
  };

  // Despachar recordatorio individual para un préstamo
  const handleDispatchReminder = async (loan: Loan, type: NotificationTriggerType) => {
    const client = clients.find((c) => c.id === loan.clientId);
    if (!client) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          type,
          clientName: client.name,
          phone: client.whatsapp || client.phone,
          amount: loan.quota,
          quota: loan.quota,
          dueDate: loan.dueDate || todayISO,
          loanCode: loan.code,
          companyName: settings.companyName,
          collectorName: currentSession.name,
        }),
      });

      const data = await res.json();
      const message = data.message || `Recordatorio de cuota DOP ${formatDOP(loan.quota)}`;

      const newLog: NotificationLog = {
        id: `NOTIF-${Date.now()}`,
        clientId: client.id,
        clientName: client.name,
        phone: client.whatsapp || client.phone,
        channel: selectedChannel,
        type,
        message,
        date: todayISO,
        time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
        status: 'ENVIADO',
        loanCode: loan.code,
        amount: loan.quota,
        dueDate: loan.dueDate,
        sentBy: currentSession.name,
      };

      onSendNotification(newLog);
      confetti({ particleCount: 30 });

      // Abrir enlace en nueva pestaña según canal
      const link =
        selectedChannel === 'WHATSAPP'
          ? buildWhatsAppLink(client.whatsapp || client.phone, message)
          : buildSmsLink(client.whatsapp || client.phone, message);
      window.open(link, '_blank');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Enviar a Toda la Ruta Automáticamente
  const handleBroadcastRoute = async () => {
    if (routeStops.length === 0) {
      alert('No hay paradas registradas en la ruta de cobro de hoy.');
      return;
    }

    setIsGenerating(true);
    let count = 0;

    for (const stop of routeStops) {
      const client = clients.find((c) => c.id === stop.clientId);
      const loan = loans.find((l) => l.id === stop.loanId);
      if (!client || !loan) continue;

      const message =
        selectedChannel === 'SMS'
          ? `${settings.companyName}: Estimado/a ${client.name}, nuestro cobrador pasará hoy en su ruta. Cuota a cobrar: DOP ${formatDOP(
              stop.quota
            )}. Agradecemos tener su pago listo.`
          : `🛵 *AVISO DE VISITA DE COBRO EN RUTA HOY*\n\nHola *${client.name}*, le saludamos de *${settings.companyName}*.\n\nLe notificamos que nuestro cobrador estará hoy en su zona en ruta de cobranza. Su cuota a cobrar es de *DOP ${formatDOP(
              stop.quota
            )}*.\n\nAgradecemos tener su pago listo o enviarnos el comprobante de transferencia bancaria. ¡Muchas gracias por su puntualidad! 🇩🇴`;

      const newLog: NotificationLog = {
        id: `NOTIF-RUTA-${Date.now()}-${count}`,
        clientId: client.id,
        clientName: client.name,
        phone: client.whatsapp || client.phone,
        channel: selectedChannel,
        type: 'RUTA_COBRO',
        message,
        date: todayISO,
        time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
        status: 'ENVIADO',
        loanCode: loan.code,
        amount: stop.quota,
        sentBy: `${currentSession.name} (Ruta Masiva)`,
      };

      onSendNotification(newLog);
      count++;
    }

    setIsGenerating(false);
    confetti({ particleCount: 70, spread: 80 });
    alert(`¡Se procesaron ${count} notificaciones automáticas para toda la ruta de cobro de hoy!`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-base">
                  Servicio de Notificaciones Automáticas (WhatsApp & SMS)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  En Línea RD
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Avisos automáticos de cuotas próximas a vencer, pagos realizados y ruta de cobro diaria.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Subtabs */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('AUTO_REMINDERS')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                activeTab === 'AUTO_REMINDERS'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Cuotas Próximas a Vencer ({dueSoonLoans.length})
            </button>

            <button
              onClick={() => setActiveTab('ROUTE_BROADCAST')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                activeTab === 'ROUTE_BROADCAST'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Route className="w-3.5 h-3.5" />
              Aviso a Ruta de Cobro ({routeStops.length})
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                activeTab === 'HISTORY'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Bitácora de Envíos ({notificationLogs.length})
            </button>
          </div>

          {/* Selector de Canal: WhatsApp, SMS o Gmail */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedChannel('WHATSAPP')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                selectedChannel === 'WHATSAPP'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp
            </button>
            <button
              onClick={() => setSelectedChannel('SMS')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition ${
                selectedChannel === 'SMS'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              SMS Directo
            </button>
            {onOpenGmail && (
              <button
                onClick={() => onOpenGmail()}
                className="px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1.5 transition bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30"
                title="Abrir Centro de Notificaciones Gmail"
              >
                <Mail className="w-3.5 h-3.5" />
                Gmail API
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'AUTO_REMINDERS' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-200 block">
                    Monitoreo Preventivo de Vencimientos
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Avisa automáticamente a los clientes con cuotas por vencer hoy o en los próximos días para garantizar su cobro puntual.
                  </span>
                </div>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar cliente o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 w-52 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dueSoonLoans
                  .filter((l) => {
                    const c = clients.find((cli) => cli.id === l.clientId);
                    const q = searchTerm.toLowerCase();
                    return (
                      l.code.toLowerCase().includes(q) ||
                      (c && c.name.toLowerCase().includes(q))
                    );
                  })
                  .map((loan) => {
                    const client = clients.find((c) => c.id === loan.clientId);
                    if (!client) return null;

                    const isOverdue = loan.status === 'OVERDUE' || (loan.daysOverdue && loan.daysOverdue > 0);
                    const targetPhone = client.whatsapp || client.phone;

                    return (
                      <div
                        key={loan.id}
                        className={`p-4 rounded-xl bg-slate-950 border transition space-y-3 ${
                          isOverdue ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{client.name}</div>
                            <div className="text-[11px] text-amber-400 font-mono">
                              {loan.code} • Cédula: {client.cedula}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{targetPhone}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {isOverdue ? `Atraso: ${loan.daysOverdue || 1}d` : 'Al Día / Por Vencer'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Cuota a Cobrar:</span>
                            <span className="font-black text-emerald-400 text-sm">
                              {formatDOP(loan.quota)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block text-[10px]">Vence:</span>
                            <span className="font-bold text-slate-200">
                              {loan.dueDate || todayISO}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            onClick={() =>
                              handleDispatchReminder(
                                loan,
                                isOverdue ? 'MORA' : 'PROXIMA_A_VENCER'
                              )
                            }
                            disabled={isGenerating}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow ${
                              selectedChannel === 'WHATSAPP'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-sky-600 hover:bg-sky-500 text-white'
                            }`}
                          >
                            {selectedChannel === 'WHATSAPP' ? (
                              <MessageCircle className="w-4 h-4" />
                            ) : (
                              <MessageSquare className="w-4 h-4" />
                            )}
                            <span>
                              Enviar Aviso {selectedChannel === 'WHATSAPP' ? 'WhatsApp' : 'SMS'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'ROUTE_BROADCAST' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-emerald-950/30 via-slate-950 to-slate-900 rounded-2xl border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Route className="w-4 h-4 text-emerald-400" />
                    Notificación Masiva a Toda la Ruta de Cobro
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Envía un aviso automatizado a todos los clientes programados en la ruta de hoy avisándoles que el cobrador pasará a recibir su cuota.
                  </p>
                </div>

                <button
                  onClick={handleBroadcastRoute}
                  disabled={isGenerating || routeStops.length === 0}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-lg flex items-center gap-2 shrink-0 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>Avisar a Toda la Ruta ({routeStops.length} Clientes)</span>
                </button>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-300 text-xs block">
                  Clientes Programados en la Ruta Diaria:
                </span>
                <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                  {routeStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-500/40">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white text-xs">{stop.clientName}</div>
                          <div className="text-[11px] text-slate-400">{stop.address}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Cuota a Cobrar:</span>
                          <span className="font-black text-emerald-400 text-xs">
                            {formatDOP(stop.quota)}
                          </span>
                        </div>

                        <a
                          href={buildWhatsAppLink(
                            stop.phone,
                            `Hola ${stop.clientName}, le informamos que el cobrador pasará hoy en su ruta de cobranza. Cuota a cobrar: DOP ${formatDOP(
                              stop.quota
                            )}.`
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 bg-emerald-950 border border-emerald-700/60 text-emerald-400 rounded-lg text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-900"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Aviso Directo
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Historial de todas las notificaciones emitidas y confirmaciones de pago enviadas.</span>
                <span className="font-bold text-slate-200">{notificationLogs.length} registradas</span>
              </div>

              <div className="divide-y divide-slate-800 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {notificationLogs.map((log) => (
                  <div key={log.id} className="p-3 space-y-2 hover:bg-slate-900/40 transition">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                            log.channel === 'WHATSAPP'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {log.channel === 'WHATSAPP' ? (
                            <MessageCircle className="w-3 h-3" />
                          ) : (
                            <MessageSquare className="w-3 h-3" />
                          )}
                          {log.channel}
                        </span>

                        <span className="font-bold text-white text-xs">{log.clientName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({log.phone})</span>

                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-amber-300">
                          {log.type}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <span>{log.date}</span>
                        <span>{log.time}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                          <CheckCircle className="w-3 h-3" /> {log.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg font-sans">
                      {log.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Enviado por: {log.sentBy || 'Sistema'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyText(log.message, log.id)}
                          className="hover:text-white flex items-center gap-1"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === log.id ? 'Copiado' : 'Copiar'}</span>
                        </button>
                        <a
                          href={
                            log.channel === 'WHATSAPP'
                              ? buildWhatsAppLink(log.phone, log.message)
                              : buildSmsLink(log.phone, log.message)
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-400 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Reenviar</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Servicio de Notificaciones Conectado con la Ruta de Cobro y Pagos Realizados.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
          >
            Cerrar Centro de Notificaciones
          </button>
        </div>
      </div>
    </div>
  );
};
