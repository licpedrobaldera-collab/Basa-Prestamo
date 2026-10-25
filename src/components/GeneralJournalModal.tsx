import React, { useState } from 'react';
import { AuthSession, JournalEntry } from '../types';
import { exportToCSV, formatDOP } from '../utils/loanCalculator';
import {
  X,
  BookOpen,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  ShieldCheck,
  FileText,
  PlusCircle,
  CheckCircle,
  Tag,
} from 'lucide-react';

interface GeneralJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  journalEntries: JournalEntry[];
  currentSession: AuthSession;
  onAddManualJournalEntry: (entry: JournalEntry) => void;
}

export const GeneralJournalModal: React.FC<GeneralJournalModalProps> = ({
  isOpen,
  onClose,
  journalEntries,
  currentSession,
  onAddManualJournalEntry,
}) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Manual Entry Form State
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEntityName, setManualEntityName] = useState('');
  const [manualEntityType, setManualEntityType] = useState<any>('AJUSTE_GENERAL');
  const [manualActionType, setManualActionType] = useState<any>('AJUSTE_SALDO');
  const [manualJustification, setManualJustification] = useState('');
  const [manualDebit, setManualDebit] = useState<number>(0);
  const [manualCredit, setManualCredit] = useState<number>(0);

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch =
      entry.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
      entry.entityName.toLowerCase().includes(search.toLowerCase()) ||
      entry.justification.toLowerCase().includes(search.toLowerCase()) ||
      entry.userName.toLowerCase().includes(search.toLowerCase()) ||
      entry.userIdentifier.includes(search);

    const matchesEntity = entityFilter === 'ALL' || entry.entityType === entityFilter;
    const matchesDate = !dateFilter || entry.date === dateFilter;

    return matchesSearch && matchesEntity && matchesDate;
  });

  const handleExportJournalCSV = () => {
    const exportData = filteredEntries.map((e) => ({
      'No. Asiento': e.entryNumber,
      'Fecha': e.date,
      'Hora': e.time,
      'Tipo de Entidad': e.entityType,
      'Entidad Afectada': e.entityName,
      'Acción Realizada': e.actionType,
      'Detalle o Justificación Obligatoria': e.justification,
      'Usuario Responsable': e.userName,
      'Cédula / Identificador': e.userIdentifier,
      'Rol del Usuario': e.userRole,
      'Resumen de Cambios': e.changesSummary || '',
      'Monto Débito (DOP)': e.debitAmount || 0,
      'Monto Crédito (DOP)': e.creditAmount || 0,
    }));

    exportToCSV(exportData, `Libro_Diario_General_RD_${new Date().toISOString().split('T')[0]}`);
  };

  const handleCreateManualEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualJustification.trim() || manualJustification.trim().length < 6) {
      alert('Debe ingresar un detalle o justificación obligatoria de al menos 6 caracteres.');
      return;
    }

    const newEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(
        Math.floor(Math.random() * 9000) + 1000
      )}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: manualEntityType,
      entityId: `MANUAL-${Date.now()}`,
      entityName: manualEntityName || 'Ajuste Contable General',
      actionType: manualActionType,
      justification: manualJustification.trim(),
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: currentSession.categoryLabel,
      changesSummary: `Asiento contable manual registrado por ${currentSession.name}`,
      debitAmount: Number(manualDebit) || 0,
      creditAmount: Number(manualCredit) || 0,
    };

    onAddManualJournalEntry(newEntry);
    setShowManualForm(false);
    setManualEntityName('');
    setManualJustification('');
    setManualDebit(0);
    setManualCredit(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Libro Diario General & Auditoría de Transacciones
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {filteredEntries.length} Asientos
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Histórico inmutable de todas las actualizaciones, ediciones, cobros, pasivos y justificaciones obligatorias del sistema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJournalCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
              title="Descargar libro diario a Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Excel</span>
            </button>
            <button
              onClick={() => setShowManualForm(!showManualForm)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{showManualForm ? 'Ver Lista' : 'Nuevo Asiento'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Manual Entry Form */}
        {showManualForm && (
          <div className="p-4 bg-slate-950 border-b border-amber-500/30">
            <h3 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-2 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4" /> Registrar Asiento Contable Manual en el Diario
            </h3>
            <form onSubmit={handleCreateManualEntry} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Entidad Afectada / Referencia
                  </label>
                  <input
                    type="text"
                    required
                    value={manualEntityName}
                    onChange={(e) => setManualEntityName(e.target.value)}
                    placeholder="Ej. Ajuste Caja Chica / Cliente Juan"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Tipo de Entidad
                  </label>
                  <select
                    value={manualEntityType}
                    onChange={(e) => setManualEntityType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="CLIENTE">Cliente</option>
                    <option value="PRESTAMO">Préstamo</option>
                    <option value="CUENTA_POR_PAGAR">Cuenta por Pagar</option>
                    <option value="PAGO">Pago / Cobro</option>
                    <option value="CARGO_EXTRA">Cargo Extra</option>
                    <option value="AJUSTE_GENERAL">Ajuste General Contable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Débito (DOP)
                  </label>
                  <input
                    type="number"
                    value={manualDebit || ''}
                    onChange={(e) => setManualDebit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Crédito (DOP)
                  </label>
                  <input
                    type="number"
                    value={manualCredit || ''}
                    onChange={(e) => setManualCredit(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1">
                  * Detalle o Justificación Obligatoria para el Libro Diario
                </label>
                <input
                  type="text"
                  required
                  value={manualJustification}
                  onChange={(e) => setManualJustification(e.target.value)}
                  placeholder="Escriba la justificación detallada de este movimiento contable..."
                  className="w-full px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow"
                >
                  Guardar Asiento en Diario
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="p-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] flex items-center bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por asiento, cliente, justificación, responsable..."
              className="bg-transparent text-xs text-white placeholder-slate-500 w-full focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="ALL">Todas las Entidades</option>
              <option value="CLIENTE">Clientes</option>
              <option value="PRESTAMO">Préstamos</option>
              <option value="CUENTA_POR_PAGAR">Cuentas por Pagar</option>
              <option value="PAGO">Pagos / Recibos</option>
              <option value="CARGO_EXTRA">Cargos Extras</option>
              <option value="AJUSTE_GENERAL">Ajustes Generales</option>
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
            />

            {(search || entityFilter !== 'ALL' || dateFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setEntityFilter('ALL');
                  setDateFilter('');
                }}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="p-3.5">No. Asiento / Fecha</th>
                <th className="p-3.5">Entidad & Acción</th>
                <th className="p-3.5">Detalle o Justificación Obligatoria</th>
                <th className="p-3.5">Responsable & Rol</th>
                <th className="p-3.5 text-right">Débito / Crédito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No se encontraron asientos en el Libro Diario con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-amber-400 text-xs">
                        {entry.entryNumber}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {entry.date} • {entry.time}
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-bold text-white text-xs">{entry.entityName}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-amber-300">
                          {entry.entityType}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-slate-300">
                          {entry.actionType}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 max-w-md">
                      <div className="text-slate-200 text-xs font-medium leading-relaxed bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                        {entry.justification}
                      </div>
                      {entry.changesSummary && (
                        <div className="text-[10px] text-slate-400 mt-1 italic">
                          Resumen: {entry.changesSummary}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200 text-xs">
                        {entry.userName}
                      </div>
                      <div className="text-[10px] text-amber-400 font-mono">
                        {entry.userIdentifier}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {entry.userRole}
                      </div>
                    </td>

                    <td className="p-3.5 text-right font-mono text-xs">
                      {entry.debitAmount ? (
                        <div className="text-emerald-400 font-bold">
                          D: {formatDOP(entry.debitAmount)}
                        </div>
                      ) : null}
                      {entry.creditAmount ? (
                        <div className="text-sky-400 font-bold">
                          C: {formatDOP(entry.creditAmount)}
                        </div>
                      ) : null}
                      {!entry.debitAmount && !entry.creditAmount && (
                        <span className="text-slate-600 text-[10px]">Sin importe</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Total de registros auditados: <strong className="text-white">{filteredEntries.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
          >
            Cerrar Libro Diario
          </button>
        </div>
      </div>
    </div>
  );
};
