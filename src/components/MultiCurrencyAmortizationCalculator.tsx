import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Printer,
  Download,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { exportToCSV, formatDOP } from '../utils/loanCalculator';

interface MultiCurrencyAmortizationCalculatorProps {
  initialAmount?: number;
  initialMonths?: number;
  initialRate?: number;
  initialMethod?: string;
  initialCurrency?: string;
  onOpenGmailDraft?: (draft: { subject: string; bodyHtml: string }) => void;
}

export const MultiCurrencyAmortizationCalculator: React.FC<
  MultiCurrencyAmortizationCalculatorProps
> = ({
  initialAmount = 100000,
  initialMonths = 12,
  initialRate = 2.5,
  initialMethod = 'Francés',
  initialCurrency = 'DOP',
  onOpenGmailDraft,
}) => {
  const [calcAmount, setCalcAmount] = useState<number | string>(initialAmount);
  const [calcMonths, setCalcMonths] = useState<number | string>(initialMonths);
  const [calcRate, setCalcRate] = useState<number | string>(initialRate);
  const [calcMethod, setCalcMethod] = useState<string>(initialMethod);
  const [calcCurrency, setCalcCurrency] = useState<string>(initialCurrency);
  const [exchangeRate, setExchangeRate] = useState<number>(60.25);

  // Real-time Amortization Calculation Engine
  const amortizationTable = useMemo(() => {
    const table = [];
    const amountNum = parseFloat(String(calcAmount)) || 0;
    let balanceRestante = amountNum;
    const n = parseInt(String(calcMonths)) || 1;
    const i = (parseFloat(String(calcRate)) || 0) / 100;

    if (balanceRestante <= 0 || n <= 0) return [];

    let cuotaTotal = 0;
    if (calcMethod === 'Francés') {
      cuotaTotal =
        i > 0
          ? (balanceRestante * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1)
          : balanceRestante / n;
    }

    for (let c = 1; c <= n; c++) {
      let interes = 0;
      let principal = 0;

      if (calcMethod === 'Francés') {
        interes = balanceRestante * i;
        principal = cuotaTotal - interes;
      } else if (calcMethod === 'Alemán') {
        principal = amountNum / n;
        interes = balanceRestante * i;
        cuotaTotal = principal + interes;
      } else if (calcMethod === 'Insoluto') {
        interes = balanceRestante * i;
        principal = amountNum / n;
        cuotaTotal = principal + interes;
      } else if (calcMethod === 'Fijo') {
        interes = amountNum * i;
        principal = amountNum / n;
        cuotaTotal = principal + interes;
      }

      balanceRestante -= principal;
      if (balanceRestante < 0) balanceRestante = 0;

      table.push({
        num: c,
        dueDate: new Date(Date.now() + c * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment: cuotaTotal,
        principal: principal,
        interest: interes,
        remainingBalance: balanceRestante,
      });
    }
    return table;
  }, [calcAmount, calcMonths, calcRate, calcMethod]);

  const totalInterests = useMemo(() => {
    return amortizationTable.reduce((acc, row) => acc + row.interest, 0);
  }, [amortizationTable]);

  const totalToPay = useMemo(() => {
    const amountNum = parseFloat(String(calcAmount)) || 0;
    return amountNum + totalInterests;
  }, [calcAmount, totalInterests]);

  const equivalentInDOP = useMemo(() => {
    const amountNum = parseFloat(String(calcAmount)) || 0;
    if (calcCurrency === 'USD') return amountNum * exchangeRate;
    if (calcCurrency === 'EUR') return amountNum * (exchangeRate * 1.08);
    return amountNum;
  }, [calcAmount, calcCurrency, exchangeRate]);

  const handleExportCSV = () => {
    const data = amortizationTable.map((row) => ({
      Cuota: row.num,
      'Fecha Vencimiento': row.dueDate,
      Divisa: calcCurrency,
      'Monto Cuota': row.payment.toFixed(2),
      'Abono Capital': row.principal.toFixed(2),
      Interés: row.interest.toFixed(2),
      'Balance Restante': row.remainingBalance.toFixed(2),
    }));
    exportToCSV(data, `Amortizacion_${calcMethod}_${calcCurrency}_${new Date().toISOString().split('T')[0]}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareGmail = () => {
    if (!onOpenGmailDraft) return;

    const rowsHtml = amortizationTable
      .map(
        (r) => `
      <tr>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: center;">${r.num}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0;">${r.dueDate}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">${calcCurrency} $${r.payment.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${calcCurrency} $${r.principal.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${calcCurrency} $${r.interest.toFixed(2)}</td>
        <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; text-align: right;">${calcCurrency} $${r.remainingBalance.toFixed(2)}</td>
      </tr>
    `
      )
      .join('');

    const bodyHtml = `
      <div style="font-family: sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b;">
        <h2 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 8px;">Plan de Amortización Financiera</h2>
        <p>A continuación se detalla la propuesta formal de amortización bajo el método <strong>${calcMethod}</strong>:</p>
        <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 16px 0;">
          <strong>Monto Capital:</strong> ${calcCurrency} $${Number(calcAmount).toLocaleString()} | 
          <strong>Plazo:</strong> ${calcMonths} Meses | 
          <strong>Tasa:</strong> ${calcRate}% Mensual | 
          <strong>Total a Pagar:</strong> ${calcCurrency} $${totalToPay.toFixed(2)}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #0284c7; color: white;">
              <th style="padding: 8px;">#</th>
              <th style="padding: 8px;">Vencimiento</th>
              <th style="padding: 8px; text-align: right;">Cuota</th>
              <th style="padding: 8px; text-align: right;">Capital</th>
              <th style="padding: 8px; text-align: right;">Interés</th>
              <th style="padding: 8px; text-align: right;">Saldo Restante</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;

    onOpenGmailDraft({
      subject: `Plan de Amortización Oficial - ${calcCurrency} $${Number(calcAmount).toLocaleString()} (${calcMethod})`,
      bodyHtml,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-400" />
            Motor Financiero de Amortización Multimoneda
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculo dinámico matemático exacto sobre cuotas fijas, amortización constante y saldos insolutos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGmailDraft && (
            <button
              onClick={handleShareGmail}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              Enviar por Gmail
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Inputs Configuration Grid */}
      <div className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
        <div>
          <label className="block font-medium text-slate-400 mb-1">Monto Capital</label>
          <input
            type="number"
            value={calcAmount}
            onChange={(e) => setCalcAmount(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-400 mb-1">Divisa</label>
          <select
            value={calcCurrency}
            onChange={(e) => setCalcCurrency(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="DOP">DOP ($ Peso Dominicano)</option>
            <option value="USD">USD ($ Dólar Americano)</option>
            <option value="EUR">EUR (€ Euro)</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-400 mb-1">Plazo (Meses)</label>
          <input
            type="number"
            value={calcMonths}
            onChange={(e) => setCalcMonths(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-400 mb-1">Tasa Mensual (%)</label>
          <input
            type="number"
            step="0.1"
            value={calcRate}
            onChange={(e) => setCalcRate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block font-medium text-slate-400 mb-1">Estructura / Método</label>
          <select
            value={calcMethod}
            onChange={(e) => setCalcMethod(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Francés">Francés (Cuota Fija)</option>
            <option value="Alemán">Alemán (Capital Fijo)</option>
            <option value="Insoluto">Sobre Saldo Insoluto</option>
            <option value="Fijo">Fijo Simple</option>
          </select>
        </div>

        <div>
          <label className="block font-medium text-slate-400 mb-1">Tasa Cambio (USD/DOP)</label>
          <input
            type="number"
            step="0.01"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 60.25)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Monto Financiado</span>
          <div className="text-xl font-extrabold text-white mt-1">
            {calcCurrency} ${Number(calcAmount).toLocaleString()}
          </div>
          {calcCurrency !== 'DOP' && (
            <div className="text-[11px] text-slate-400 mt-1">
              ≈ DOP ${equivalentInDOP.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Interés Total Proyectado</span>
          <div className="text-xl font-extrabold text-amber-400 mt-1">
            {calcCurrency} ${totalInterests.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1">
            Rentabilidad estimada: {((totalInterests / (parseFloat(String(calcAmount)) || 1)) * 100).toFixed(1)}%
          </div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Retorno Global</span>
          <div className="text-xl font-extrabold text-emerald-400 mt-1">
            {calcCurrency} ${totalToPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Capital + Intereses devengados</div>
        </div>

        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Cuota Promedio</span>
          <div className="text-xl font-extrabold text-indigo-400 mt-1">
            {calcCurrency} ${amortizationTable.length > 0 ? (totalToPay / amortizationTable.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-[11px] text-indigo-400/80 mt-1">
            {calcMonths} cuotas periódicas
          </div>
        </div>
      </div>

      {/* Generated Amortization Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <span className="font-bold text-sm text-white">
            Plan de Pagos Estructurado ({calcMethod} - {calcCurrency})
          </span>
          <span className="text-xs text-slate-400">
            {amortizationTable.length} cuotas proyectadas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 text-center">#</th>
                <th className="p-3">Fecha Vencimiento</th>
                <th className="p-3 text-right">Monto Cuota</th>
                <th className="p-3 text-right">Abono Capital</th>
                <th className="p-3 text-right">Interés Devengado</th>
                <th className="p-3 text-right">Balance Restante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {amortizationTable.map((row) => (
                <tr key={row.num} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-center text-slate-400 font-sans">{row.num}</td>
                  <td className="p-3 text-slate-300 font-sans">{row.dueDate}</td>
                  <td className="p-3 text-right font-bold text-white">
                    {calcCurrency} ${row.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-emerald-400">
                    {calcCurrency} ${row.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-amber-400">
                    {calcCurrency} ${row.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-3 text-right text-indigo-300 font-bold">
                    {calcCurrency} ${row.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
