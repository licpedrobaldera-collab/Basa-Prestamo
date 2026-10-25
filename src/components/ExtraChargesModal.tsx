import React, { useState } from 'react';
import { Client, ExtraCharge, Loan } from '../types';
import { exportToCSV, formatDOP } from '../utils/loanCalculator';
import {
  DollarSign,
  PlusCircle,
  CheckCircle,
  XCircle,
  Gift,
  ShieldCheck,
  Search,
  Filter,
  Download,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ExtraChargesModalProps {
  extraCharges: ExtraCharge[];
  loans: Loan[];
  clients: Client[];
  authorizedUserName: string;
  onClose: () => void;
  onAddCharge: (charge: ExtraCharge) => void;
  onSettleCharge: (chargeId: string) => void;
  onExonerateCharge: (chargeId: string, reason: string) => void;
}

export const ExtraChargesModal: React.FC<ExtraChargesModalProps> = ({
  extraCharges,
  loans,
  clients,
  authorizedUserName,
  onClose,
  onAddCharge,
  onSettleCharge,
  onExonerateCharge,
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE'>('LIST');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDIENTE' | 'PAGADO' | 'EXONERADO'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Exonerate modal state
  const [exoneratingCharge, setExoneratingCharge] = useState<ExtraCharge | null>(null);
  const [exonerateReason, setExonerateReason] = useState('');

  // Form State for New Charge
  const [selectedLoanId, setSelectedLoanId] = useState<string>(loans[0]?.id || '');
  const [concept, setConcept] = useState<string>('Gasto Notarial y Legalización');
  const [customConcept, setCustomConcept] = useState('');
  const [amount, setAmount] = useState<number>(1000);
  const [isCapitalized, setIsCapitalized] = useState<boolean>(false);
  const [notes, setNotes] = useState('');

  const handleCreateChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || amount <= 0) {
      alert('Por favor seleccione un préstamo y un monto válido.');
      return;
    }

    const loan = loans.find((l) => l.id === selectedLoanId);
    const client = clients.find((c) => c.id === loan?.clientId);
    const finalConcept = concept === 'OTRO' && customConcept ? customConcept : concept;

    const newCharge: ExtraCharge = {
      id: `CHG-${Date.now()}`,
      loanId: selectedLoanId,
      loanCode: loan?.code || 'PR-2026',
      clientId: client?.id || '',
      clientName: client?.name || 'Cliente',
      concept: finalConcept,
      amount: Number(amount),
      isCapitalized,
      status: 'PENDIENTE',
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: authorizedUserName,
      notes,
    };

    onAddCharge(newCharge);
    alert(
      `¡Cargo extra de ${formatDOP(amount)} por concepto de "${finalConcept}" agregado con éxito!\n` +
      (isCapitalized
        ? 'Se ha capitalizado al balance del préstamo.'
        : 'Se ha registrado como cargo único independiente.')
    );
    setActiveTab('LIST');
  };

  const handleConfirmExoneration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exoneratingCharge || !exonerateReason) {
      alert('Por favor ingrese el motivo de exoneración o condonación.');
      return;
    }

    onExonerateCharge(exoneratingCharge.id, exonerateReason);
    alert(`¡Cargo de ${formatDOP(exoneratingCharge.amount)} exonerado / condonado correctamente!`);
    setExoneratingCharge(null);
    setExonerateReason('');
  };

  const filteredCharges = extraCharges.filter((c) => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        c.clientName.toLowerCase().includes(term) ||
        c.loanCode.toLowerCase().includes(term) ||
        c.concept.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const totalPending = extraCharges
    .filter((c) => c.status === 'PENDIENTE')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalExonerated = extraCharges
    .filter((c) => c.status === 'EXONERADO')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalSettled = extraCharges
    .filter((c) => c.status === 'PAGADO')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleExportExcel = () => {
    const headers = [
      'ID Cargo',
      'Código Préstamo',
      'Cliente',
      'Concepto',
      'Monto DOP',
      'Tipo (Capitalizado / Único)',
      'Estado',
      'Registrado Por',
      'Fecha',
      'Exonerado / Condonado Por',
      'Motivo Exoneración',
    ];
    const rows = extraCharges.map((c) => [
      c.id,
      c.loanCode,
      c.clientName,
      c.concept,
      c.amount,
      c.isCapitalized ? 'Capitalizado al Balance' : 'Cargo Único',
      c.status,
      c.createdBy,
      c.createdDate,
      c.exemptedBy || 'N/A',
      c.exemptReason || 'N/A',
    ]);
    exportToCSV(`CARGOS_EXTRAS_${new Date().toISOString().split('T')[0]}`, headers, rows);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                Gestión de Cargos Extras al Balance (GPS, Notaría, Visitas & Exoneración)
              </h3>
              <p className="text-[11px] text-slate-400">
                Permite agregar cargos extras al cliente (capitalizables o únicos), y saldarlos o exonerarlos con autorización del cobrador/administrador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-950/60 border-b border-slate-800 text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-amber-500/30">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Cargos Pendientes</span>
            <div className="text-base font-black text-amber-400 mt-0.5">{formatDOP(totalPending)}</div>
            <span className="text-[10px] text-slate-500">
              {extraCharges.filter((c) => c.status === 'PENDIENTE').length} cargo(s) por cobrar
            </span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-emerald-500/30">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Saldados / Cobrados</span>
            <div className="text-base font-black text-emerald-400 mt-0.5">{formatDOP(totalSettled)}</div>
            <span className="text-[10px] text-slate-500">
              {extraCharges.filter((c) => c.status === 'PAGADO').length} cargo(s) liquidados
            </span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/30">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Total Exonerados / Condonados</span>
            <div className="text-base font-black text-purple-400 mt-0.5">{formatDOP(totalExonerated)}</div>
            <span className="text-[10px] text-slate-500">
              {extraCharges.filter((c) => c.status === 'EXONERADO').length} cargo(s) perdonados
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-950 px-4 pt-3 border-b border-slate-800 gap-2 font-bold text-xs">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`py-2 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'LIST'
                ? 'border-purple-500 text-purple-400 bg-purple-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Listado de Cargos Registrados ({extraCharges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('CREATE')}
            className={`py-2 px-4 border-b-2 transition flex items-center gap-2 ${
              activeTab === 'CREATE'
                ? 'border-amber-500 text-amber-400 bg-amber-950/20 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agregar Nuevo Cargo Extra</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs bg-slate-950/40">
          {activeTab === 'LIST' && (
            <div className="space-y-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 font-bold mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Estado:
                  </span>
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'ALL'
                        ? 'bg-slate-700 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Todos ({extraCharges.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PENDIENTE')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'PENDIENTE'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pendientes ({extraCharges.filter((c) => c.status === 'PENDIENTE').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('PAGADO')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'PAGADO'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Pagados ({extraCharges.filter((c) => c.status === 'PAGADO').length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('EXONERADO')}
                    className={`px-3 py-1 rounded-xl font-bold text-[11px] transition ${
                      statusFilter === 'EXONERADO'
                        ? 'bg-purple-600 text-white shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white'
                    }`}
                  >
                    Exonerados ({extraCharges.filter((c) => c.status === 'EXONERADO').length})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar cliente, préstamo, concepto..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Cliente / Préstamo</th>
                        <th className="p-3">Concepto del Cargo</th>
                        <th className="p-3">Monto (DOP)</th>
                        <th className="p-3">Tipo de Imputación</th>
                        <th className="p-3">Estado</th>
                        <th className="p-3">Detalle / Exoneración</th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredCharges.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-900/60 transition">
                          <td className="p-3">
                            <div className="font-bold text-white text-sm">{c.clientName}</div>
                            <span className="text-[10px] font-mono text-sky-400 font-bold">{c.loanCode}</span>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-slate-200">{c.concept}</div>
                            <div className="text-[10px] text-slate-400">
                              Registrado por {c.createdBy} el {c.createdDate}
                            </div>
                          </td>

                          <td className="p-3 font-mono font-bold text-amber-400 text-sm">
                            {formatDOP(c.amount)}
                          </td>

                          <td className="p-3">
                            {c.isCapitalized ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Capitalizado al Balance
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                Cargo Único
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {c.status === 'PENDIENTE' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-max">
                                <DollarSign className="w-3 h-3" /> Pendiente
                              </span>
                            )}
                            {c.status === 'PAGADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-max">
                                <CheckCircle className="w-3 h-3" /> Pagado
                              </span>
                            )}
                            {c.status === 'EXONERADO' && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-max">
                                <Gift className="w-3 h-3" /> Exonerado
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            {c.status === 'EXONERADO' ? (
                              <div className="space-y-0.5">
                                <div className="text-[10px] text-purple-300 font-bold">
                                  Por: {c.exemptedBy || 'Admin'} ({c.exemptedDate})
                                </div>
                                <div className="text-[10px] text-slate-400 italic">
                                  "{c.exemptReason || 'Condonado por política interna'}"
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400">
                                {c.notes || 'Sin observaciones'}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            {c.status === 'PENDIENTE' && (
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => onSettleCharge(c.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                                  title="Marcar como cobrado y saldado"
                                >
                                  Saldar
                                </button>
                                <button
                                  onClick={() => setExoneratingCharge(c)}
                                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow flex items-center gap-1"
                                  title="Exonerar o condonar este cargo al cliente"
                                >
                                  <Gift className="w-3 h-3" />
                                  <span>Exonerar</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AGREGAR NUEVO CARGO EXTRA */}
          {activeTab === 'CREATE' && (
            <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 max-w-xl mx-auto space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Registrar Cargo Extra al Balance del Cliente
                </h4>
                <p className="text-[11px] text-slate-400">
                  Agregue gastos notariales, cuotas de rastreador GPS, notificaciones o cargos de cobranza.
                </p>
              </div>

              <form onSubmit={handleCreateChargeSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Seleccionar Préstamo / Cliente *</label>
                  <select
                    value={selectedLoanId}
                    onChange={(e) => setSelectedLoanId(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-medium"
                  >
                    {loans.map((l) => {
                      const client = clients.find((c) => c.id === l.clientId);
                      return (
                        <option key={l.id} value={l.id}>
                          {l.code} - {client?.name || 'Cliente'} (Saldo: {formatDOP(l.balance)})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Concepto del Cargo Extra *</label>
                  <select
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  >
                    <option value="Gasto Notarial y Legalización">Gasto Notarial y Legalización de Pagaré</option>
                    <option value="Instalación Rastreador GPS">Instalación y Servicio Rastreador GPS</option>
                    <option value="Notificación Legal / Acto Alguacil">Notificación Legal / Acto de Alguacil</option>
                    <option value="Visita Extraordinaria de Cobranza">Visita Extraordinaria de Cobranza de Calle</option>
                    <option value="Seguro de Cobertura de Deuda">Seguro de Cobertura de Deuda</option>
                    <option value="Penalidad Administrativa por Mora">Penalidad Administrativa por Mora</option>
                    <option value="OTRO">Otro Concepto Específico</option>
                  </select>
                </div>

                {concept === 'OTRO' && (
                  <div>
                    <label className="text-slate-400 block mb-1 font-semibold">Especifique el Concepto</label>
                    <input
                      type="text"
                      value={customConcept}
                      onChange={(e) => setCustomConcept(e.target.value)}
                      placeholder="Ej. Duplicado de contrato, cargo por cheque devuelto, etc."
                      required
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                    />
                  </div>
                )}

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Monto del Cargo (DOP) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-mono font-black text-sm"
                  />
                </div>

                {/* Capitalizable vs Cargo Único Switch */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Modalidad de Imputación:</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isCapitalized}
                        onChange={(e) => setIsCapitalized(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-900 border-slate-700"
                      />
                      <span className="font-bold text-amber-400 text-xs">Capitalizar al Saldo</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {isCapitalized
                      ? '⭐ Se sumará al capital del préstamo y se amortizará junto con el balance deudor.'
                      : 'ℹ️ Se registrará como cargo único independiente que el cliente podrá pagar en su próxima cuota o liquidar por separado.'}
                  </p>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Notas u Observaciones</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Detalles sobre el cargo o factura externa..."
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('LIST')}
                    className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow"
                  >
                    Guardar Cargo Extra
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* EXONERATION CONFIRMATION MODAL */}
      {exoneratingCharge && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-md p-5 space-y-4 text-xs shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-purple-400 text-sm flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Exonerar / Condonar Cargo Extra
              </h4>
              <button onClick={() => setExoneratingCharge(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold text-white">{exoneratingCharge.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Concepto:</span>
                <span className="font-bold text-slate-200">{exoneratingCharge.concept}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto a Condonar:</span>
                <span className="font-mono font-bold text-purple-400 text-sm">
                  {formatDOP(exoneratingCharge.amount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Autorizado Por:</span>
                <span className="text-amber-400 font-semibold">{authorizedUserName}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmExoneration} className="space-y-3">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  Motivo de la Exoneración / Justificación *
                </label>
                <textarea
                  value={exonerateReason}
                  onChange={(e) => setExonerateReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Ej. Cortesía comercial por pago puntual adelantado, arreglo formal de pago, exonerado por Lic. Pedro Baldera..."
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setExoneratingCharge(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow"
                >
                  Confirmar Exoneración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
