import React, { useState, useEffect } from 'react';
import { AmortizationRow, Loan, LoanFrequency, LoanType, SystemSettings } from '../types';
import {
  exportToCSV,
  formatDOP,
  generateAmortizationSchedule,
} from '../utils/loanCalculator';
import {
  FileSpreadsheet,
  Printer,
  Download,
  X,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';

interface AmortizationScheduleModalProps {
  loan?: Loan | null;
  clientName?: string;
  settings: SystemSettings;
  onClose: () => void;
}

export const AmortizationScheduleModal: React.FC<AmortizationScheduleModalProps> = ({
  loan,
  clientName,
  settings,
  onClose,
}) => {
  // Simulator state if no loan provided or allow live adjustments
  const [principal, setPrincipal] = useState<number>(loan?.amount || 50000);
  const [rate, setRate] = useState<number>(loan?.rate || 10);
  const [terms, setTerms] = useState<number>(loan?.terms || 12);
  const [frequency, setFrequency] = useState<LoanFrequency>(loan?.frequency || 'MENSUAL');
  const [method, setMethod] = useState<LoanType>(loan?.type || 'FIXED');
  const [startDate, setStartDate] = useState<string>(
    loan?.createdDate || new Date().toISOString().split('T')[0]
  );

  // Recalculate schedule
  const [scheduleData, setScheduleData] = useState<{
    schedule: AmortizationRow[];
    quota: number;
    totalWithInterest: number;
    totalInterest: number;
  }>({
    schedule: loan?.schedule || [],
    quota: loan?.quota || 0,
    totalWithInterest: loan?.totalWithInterest || 0,
    totalInterest: (loan?.totalWithInterest || 0) - (loan?.amount || 0),
  });

  useEffect(() => {
    // If loan is provided and not in custom edit mode, we can use its values or generate
    const result = generateAmortizationSchedule(
      principal,
      rate,
      terms,
      frequency,
      method,
      startDate
    );
    setScheduleData(result);
  }, [principal, rate, terms, frequency, method, startDate]);

  const handleExportExcel = () => {
    const filename = `Tabla_Amortizacion_${clientName ? clientName.replace(/\s+/g, '_') : 'Prestamo'}_${frequency}`;
    const headers = [
      'Cuota #',
      'Fecha Vencimiento',
      'Monto Cuota (DOP)',
      'Abono a Capital (DOP)',
      'Interés (DOP)',
      'Saldo Pendiente (DOP)',
      'Estado',
    ];

    const rows = scheduleData.schedule.map((row) => [
      row.installmentNumber,
      row.dueDate,
      row.quota,
      row.capital,
      row.interest,
      row.balanceRemaining,
      row.status,
    ]);

    exportToCSV(filename, headers, rows);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">
                Tabla Detallada de Amortización & Calendario de Pagos
              </h3>
              <p className="text-[11px] text-slate-400">
                {loan ? (
                  <span>
                    Préstamo Ref: <strong className="text-amber-400">{loan.code}</strong> • Cliente:{' '}
                    <strong className="text-slate-200">{clientName || 'Cliente'}</strong>
                  </span>
                ) : (
                  <span>Simulador Financiero en Tiempo Real</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow"
              title="Descargar tabla en formato Excel CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition border border-slate-700"
              title="Imprimir tabla de amortización"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs bg-slate-950/40">
          {/* Controls Bar for Advisor Customization */}
          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-400">
                <Layers className="w-4 h-4" />
                Parámetros de Cálculo y Amortización Seleccionados por el Asesor
              </span>
              <span className="text-[10px] text-slate-500 uppercase">
                Sistema Financiero RD
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Monto Principal (DOP)</label>
                <input
                  type="number"
                  value={principal}
                  onChange={(e) => setPrincipal(Number(e.target.value))}
                  step="1000"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Tasa Mensual (%)</label>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  step="0.5"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Plazo / Cuotas</label>
                <input
                  type="number"
                  value={terms}
                  onChange={(e) => setTerms(Number(e.target.value))}
                  min="1"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Frecuencia de Pago</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as LoanFrequency)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs"
                >
                  <option value="DIARIO">Diario (Comercial)</option>
                  <option value="SEMANAL">Semanal</option>
                  <option value="QUINCENAL">Quincenal</option>
                  <option value="MENSUAL">Mensual</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Método de Amortización</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as LoanType)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs"
                >
                  <option value="FIXED">Francés (Cuotas Fijas)</option>
                  <option value="INTEREST_ONLY">Solo Interés (San / Redondeo)</option>
                  <option value="GERMAN">Alemán (Capital Fijo Decreciente)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Fecha Primer Pago</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs"
                />
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Cuota Periódica Estimada
              </span>
              <div className="text-lg font-black text-emerald-400">
                {formatDOP(scheduleData.quota)}
              </div>
              <p className="text-[10px] text-slate-500">
                {method === 'GERMAN' ? 'Primera cuota (decrece progresivamente)' : `${terms} cuotas programadas`}
              </p>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Capital Desembolsado
              </span>
              <div className="text-lg font-black text-slate-200">
                {formatDOP(principal)}
              </div>
              <p className="text-[10px] text-slate-500">Monto total financiado</p>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Total Intereses a Cobrar
              </span>
              <div className="text-lg font-black text-amber-400">
                {formatDOP(scheduleData.totalInterest)}
              </div>
              <p className="text-[10px] text-slate-500">Margen financiero proyectado</p>
            </div>

            <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Total Global a Pagar
              </span>
              <div className="text-lg font-black text-sky-400">
                {formatDOP(scheduleData.totalWithInterest)}
              </div>
              <p className="text-[10px] text-slate-500">Principal + Intereses</p>
            </div>
          </div>

          {/* Printable Document View with Full Table */}
          <div
            id="printable-amortization"
            className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
          >
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-white text-sm">Cronograma Oficial de Amortización</h4>
                <p className="text-[11px] text-slate-400">
                  Método:{' '}
                  <strong className="text-amber-400">
                    {method === 'FIXED' && 'Francés (Cuotas Iguales)'}
                    {method === 'INTEREST_ONLY' && 'Solo Interés (San / Redondeo)'}
                    {method === 'GERMAN' && 'Alemán (Cuotas Decrecientes)'}
                  </strong>{' '}
                  • Frecuencia: <strong className="text-slate-200">{frequency}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{scheduleData.schedule.length} cuotas generadas</span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 sticky top-0 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3 text-center"># Cuota</th>
                    <th className="p-3">Fecha Vencimiento</th>
                    <th className="p-3 text-right">Monto Cuota</th>
                    <th className="p-3 text-right">Abono a Capital</th>
                    <th className="p-3 text-right">Interés Devengado</th>
                    <th className="p-3 text-right">Saldo Restante</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {scheduleData.schedule.map((row) => (
                    <tr
                      key={row.installmentNumber}
                      className="hover:bg-slate-800/40 transition font-mono text-[11px]"
                    >
                      <td className="p-3 text-center font-bold text-amber-400">
                        {row.installmentNumber}
                      </td>
                      <td className="p-3 text-slate-300 font-sans">{row.dueDate}</td>
                      <td className="p-3 text-right font-black text-emerald-400">
                        {formatDOP(row.quota)}
                      </td>
                      <td className="p-3 text-right text-slate-200 font-semibold">
                        {formatDOP(row.capital)}
                      </td>
                      <td className="p-3 text-right text-amber-400 font-semibold">
                        {formatDOP(row.interest)}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-300">
                        {formatDOP(row.balanceRemaining)}
                      </td>
                      <td className="p-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'PAGADO'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : row.status === 'ATRASADO'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer Totals */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex flex-wrap justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-sans font-bold">
                Totales Consolidados del Crédito:
              </span>
              <div className="flex gap-4">
                <span>
                  Capital:{' '}
                  <strong className="text-slate-200">{formatDOP(principal)}</strong>
                </span>
                <span>
                  Intereses:{' '}
                  <strong className="text-amber-400">
                    {formatDOP(scheduleData.totalInterest)}
                  </strong>
                </span>
                <span>
                  Total Final:{' '}
                  <strong className="text-emerald-400">
                    {formatDOP(scheduleData.totalWithInterest)}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
