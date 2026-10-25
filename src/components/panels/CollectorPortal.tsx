import React, { useState, useMemo } from 'react';
import { RouteStop, Loan, Client, PaymentTransaction } from '../../types';
import { formatDOP } from '../../utils/loanCalculator';
import { DominicanMap } from '../DominicanMap';
import {
  Navigation,
  Phone,
  MessageCircle,
  MessageSquare,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Lock,
  Printer,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileCheck,
  UserCheck,
} from 'lucide-react';

interface CollectorPortalProps {
  collectorName: string;
  stops: RouteStop[];
  loans: Loan[];
  clients: Client[];
  payments: PaymentTransaction[];
  onQuickPayment: (stop: RouteStop, amount: number, method: 'EFECTIVO' | 'TRANSFERENCIA') => void;
  onUpdateStopStatus: (
    stopId: string,
    status: RouteStop['status'],
    notes?: string,
    promiseDate?: string
  ) => void;
  onOpenReceipt: (payment: PaymentTransaction) => void;
}

export const CollectorPortal: React.FC<CollectorPortalProps> = ({
  collectorName,
  stops,
  loans,
  clients,
  payments,
  onQuickPayment,
  onUpdateStopStatus,
  onOpenReceipt,
}) => {
  const [activeDate, setActiveDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStop, setSelectedStop] = useState<RouteStop | null>(null);

  // Quick Payment Modal State
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TRANSFERENCIA'>('EFECTIVO');

  // Incident Modal State
  const [incidentStop, setIncidentStop] = useState<RouteStop | null>(null);
  const [incidentStatus, setIncidentStatus] = useState<RouteStop['status']>('AUSENTE');
  const [incidentNotes, setIncidentNotes] = useState<string>('');
  const [incidentPromiseDate, setIncidentPromiseDate] = useState<string>('');

  // Daily Cash Close Modal State
  const [isCashCloseOpen, setIsCashCloseOpen] = useState(false);
  const [cashCloseSuccess, setCashCloseSuccess] = useState(false);

  // Today's collections made by this collector
  const todayPayments = useMemo(() => {
    return payments.filter((p) => p.date === activeDate);
  }, [payments, activeDate]);

  const totalCollectedToday = todayPayments.reduce((s, p) => s + p.amount, 0);
  const cashCollectedToday = todayPayments
    .filter((p) => p.method === 'EFECTIVO')
    .reduce((s, p) => s + p.amount, 0);
  const transferCollectedToday = todayPayments
    .filter((p) => p.method === 'TRANSFERENCIA')
    .reduce((s, p) => s + p.amount, 0);

  const completedStopsCount = stops.filter((s) => s.status === 'PAGADO').length;
  const pendingStopsCount = stops.filter((s) => s.status === 'PENDIENTE').length;
  const absentStopsCount = stops.filter(
    (s) => s.status === 'AUSENTE' || s.status === 'INUBICABLE' || s.status === 'PROMESA'
  ).length;

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStop) return;
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      alert('Ingrese un monto válido a cobrar.');
      return;
    }
    onQuickPayment(selectedStop, amt, paymentMethod);
    setSelectedStop(null);
    setPaymentAmount('');
  };

  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentStop) return;
    onUpdateStopStatus(incidentStop.id, incidentStatus, incidentNotes, incidentPromiseDate);
    setIncidentStop(null);
    setIncidentNotes('');
    setIncidentPromiseDate('');
  };

  return (
    <div className="space-y-6">
      {/* Top Collector Header */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-900 border border-sky-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                Panel de Cobrador en Campo & Ruta Móvil
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                Cobrador: {collectorName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Gestión de Ruta & Recaudación Diaria
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registro de cuotas en calle, reporte de incidencias y cuadre de efectivo para entrega a caja general.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <Calendar className="w-4 h-4 text-sky-400" />
              <input
                type="date"
                value={activeDate}
                onChange={(e) => setActiveDate(e.target.value)}
                className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
              />
            </div>
            <button
              onClick={() => setIsCashCloseOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-950/40 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              Cierre & Cuadre Diario
            </button>
          </div>
        </div>

        {/* 4 KPIs for collector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Recaudado Hoy (Total)</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 block mt-1">
              {formatDOP(totalCollectedToday)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {todayPayments.length} recibos generados
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Efectivo en Mano</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 block mt-1">
              {formatDOP(cashCollectedToday)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Por entregar a caja
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Transferencias / Banco</span>
            <span className="text-xl sm:text-2xl font-black text-sky-400 block mt-1">
              {formatDOP(transferCollectedToday)}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Verificadas en ruta
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Efectividad de Ruta</span>
            <span className="text-xl sm:text-2xl font-black text-white block mt-1">
              {completedStopsCount} / {stops.length}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {pendingStopsCount} pendientes • {absentStopsCount} incidencias
            </span>
          </div>
        </div>
      </div>

      {/* Georeferenced Map of stops */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-sky-400" />
            Mapa Georreferenciado de Cobranza en Campo
          </h3>
          <span className="text-xs text-slate-400">
            {stops.length} paradas planificadas en Santo Domingo y zonas asignadas
          </span>
        </div>
        <DominicanMap stops={stops} onSelectStop={(stop) => setSelectedStop(stop)} />
      </div>

      {/* List of stops in route order */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400" />
            Secuencia de Clientes para Visita ({stops.length})
          </h3>
          <span className="text-xs text-slate-400">
            Toque en "Cobrar" para registrar pago inmediato
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stops.map((stop, idx) => {
            const cleanPhone = stop.phone.replace(/\D/g, '');
            const formattedPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
            const waMessage = `🛵 Hola ${stop.clientName}, le saluda su cobrador de PrestDominicana. Hoy estoy realizando la ruta de cobranza por su zona. Su cuota a cobrar es de DOP ${formatDOP(stop.quota)}. ¿Estará disponible para visitarle? ¡Muchas gracias!`;

            return (
              <div
                key={stop.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/40 transition space-y-4 shadow-xl"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">{stop.clientName}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        {stop.address}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      stop.status === 'PAGADO'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : stop.status === 'AUSENTE' || stop.status === 'INUBICABLE'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : stop.status === 'PROMESA'
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    }`}
                  >
                    {stop.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cuota a Cobrar:</span>
                    <span className="font-black text-emerald-400 text-base">
                      {formatDOP(stop.quota)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Balance Pendiente:</span>
                    <span className="font-bold text-amber-400 text-sm">{formatDOP(stop.balance)}</span>
                  </div>
                </div>

                {/* Direct Action Buttons: Tel, WhatsApp, SMS */}
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  <a
                    href={`tel:${stop.phone}`}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Phone className="w-3.5 h-3.5 text-sky-400" /> Llamar
                  </a>
                  <a
                    href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border border-emerald-800/40"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      setIncidentStop(stop);
                      setIncidentStatus(stop.status || 'AUSENTE');
                    }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Incidencia
                  </button>
                </div>

                {/* Primary Action Button: Registrar Pago */}
                <button
                  onClick={() => {
                    setSelectedStop(stop);
                    setPaymentAmount(stop.quota.toString());
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  Cobrar Cuota en Ruta
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: REGISTRO RÁPIDO DE PAGO EN RUTA */}
      {selectedStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-emerald-500/30 p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-white text-base">Cobro Rápido en Ruta</h3>
              </div>
              <button
                onClick={() => setSelectedStop(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl text-xs space-y-1">
              <span className="text-[10px] text-slate-500 block">Cliente:</span>
              <span className="font-bold text-white text-sm block">{selectedStop.clientName}</span>
              <span className="text-slate-400 block">{selectedStop.address}</span>
              <span className="text-amber-400 font-bold block mt-1">
                Cuota sugerida: {formatDOP(selectedStop.quota)}
              </span>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Monto Recibido (DOP)
                </label>
                <input
                  type="number"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-black text-xl focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('EFECTIVO')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === 'EFECTIVO'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFERENCIA')}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === 'TRANSFERENCIA'
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    📲 Transferencia
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Emitir Recibo & Registrar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPORTE DE INCIDENCIA EN CAMPO */}
      {incidentStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-amber-500/30 p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base">Reportar Incidencia en Ruta</h3>
              </div>
              <button
                onClick={() => setIncidentStop(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Cliente: <strong className="text-white">{incidentStop.clientName}</strong> ({incidentStop.address})
            </p>

            <form onSubmit={handleSaveIncident} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Tipo de Incidencia</label>
                <select
                  value={incidentStatus}
                  onChange={(e) => setIncidentStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:border-amber-500 outline-none"
                >
                  <option value="AUSENTE">Cliente Ausente (No se encontraba en el lugar)</option>
                  <option value="PROMESA">Promesa de Pago (Se comprometió a pagar en fecha)</option>
                  <option value="INUBICABLE">Negativa de Pago / Conflicto / Dirección Errónea</option>
                  <option value="PENDIENTE">Pendiente de re-visita hoy</option>
                </select>
              </div>

              {incidentStatus === 'PROMESA' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Fecha Prometida de Pago</label>
                  <input
                    type="date"
                    value={incidentPromiseDate}
                    onChange={(e) => setIncidentPromiseDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Notas u Observaciones del Cobrador</label>
                <textarea
                  rows={3}
                  placeholder="ej. El negocio estaba cerrado; un familiar indicó pasar después de las 4 PM."
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar Incidencia en Bitácora
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CIERRE DE CAJA DIARIO (CUADRE DE RUTA) */}
      {isCashCloseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-sky-500/30 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-sky-400" />
                <h3 className="font-black text-white text-lg">Cuadre & Cierre de Caja Diario</h3>
              </div>
              <button
                onClick={() => setIsCashCloseOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {cashCloseSuccess ? (
              <div className="p-6 text-center rounded-2xl bg-emerald-950/40 border border-emerald-500/40 space-y-3">
                <FileCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-black text-white text-lg">¡Cierre de Caja Registrado!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  El cuadre de efectivo por <strong className="text-emerald-400">{formatDOP(cashCollectedToday)}</strong> ha sido cerrado y registrado para entrega a la administración general.
                </p>
                <button
                  onClick={() => {
                    setIsCashCloseOpen(false);
                    setCashCloseSuccess(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
                >
                  Aceptar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Cobrador Responsable:</span>
                    <span className="font-bold text-white">{collectorName}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Fecha de Recaudación:</span>
                    <span className="font-bold text-white">{activeDate}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Recibos Emitidos:</span>
                    <span className="font-bold text-white">{todayPayments.length} comprobantes</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                    <span className="text-slate-300 font-semibold">Total en Efectivo Físico:</span>
                    <span className="font-black text-amber-400 text-base">{formatDOP(cashCollectedToday)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-semibold">Total en Transferencias:</span>
                    <span className="font-bold text-sky-400">{formatDOP(transferCollectedToday)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-black">
                    <span className="text-white">Total Recaudado en Ruta:</span>
                    <span className="text-emerald-400 text-lg">{formatDOP(totalCollectedToday)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCashCloseSuccess(true)}
                    className="flex-1 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Entrega de Efectivo a Administración
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 cursor-pointer"
                    title="Imprimir Hoja de Cuadre"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
