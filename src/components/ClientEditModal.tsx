import React, { useState } from 'react';
import { AuthSession, Client, JournalEntry } from '../types';
import { formatCedula } from '../utils/loanCalculator';
import {
  X,
  User,
  ShieldCheck,
  Building,
  CreditCard,
  FileText,
  AlertTriangle,
  Trash2,
  Save,
  CheckCircle,
  Lock,
} from 'lucide-react';

interface ClientEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  currentSession: AuthSession;
  onSaveClient: (updatedClient: Client, journalEntry: JournalEntry) => void;
  onDeleteClient?: (clientId: string, journalEntry: JournalEntry) => void;
}

export const DOMINICAN_BANKS = [
  'Banco de Reservas (Banreservas)',
  'Banco Popular Dominicano',
  'Banco BHD',
  'Banco Santa Cruz',
  'Asociación Popular de Ahorros y Préstamos (APAP)',
  'Asociación Cibao de Ahorros y Préstamos (ACAP)',
  'Banco Promerica',
  'Scotiabank República Dominicana',
  'Banco Caribe',
  'Banco BACC',
  'Banco Agrícola de la Rep. Dominicana',
  'Asociación La Nacional de Ahorros y Préstamos (ALNAP)',
  'Otro Banco / Cooperativa RD',
];

export const ClientEditModal: React.FC<ClientEditModalProps> = ({
  isOpen,
  onClose,
  client,
  currentSession,
  onSaveClient,
  onDeleteClient,
}) => {
  if (!isOpen || !client) return null;

  // Form State
  const [name, setName] = useState(client.name || '');
  const [cedula, setCedula] = useState(client.cedula || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [whatsapp, setWhatsapp] = useState(client.whatsapp || '');
  const [email, setEmail] = useState(client.email || '');
  const [occupation, setOccupation] = useState(client.occupation || '');
  const [monthlyIncome, setMonthlyIncome] = useState(client.monthlyIncome || 0);
  const [address, setAddress] = useState(client.address || '');

  // Guarantor & Co-debtor (Categoría 4 y 5)
  const [guarantor, setGuarantor] = useState(client.guarantor || '');
  const [guarantorCedula, setGuarantorCedula] = useState(client.guarantorCedula || '');
  const [guarantorPhone, setGuarantorPhone] = useState(client.guarantorPhone || '');
  const [guarantorRelation, setGuarantorRelation] = useState(client.guarantorRelation || '');

  const [coDebtor, setCoDebtor] = useState(client.coDebtor || '');
  const [coDebtorCedula, setCoDebtorCedula] = useState(client.coDebtorCedula || '');
  const [coDebtorPhone, setCoDebtorPhone] = useState(client.coDebtorPhone || '');
  const [coDebtorRelation, setCoDebtorRelation] = useState(client.coDebtorRelation || '');

  // Bank Info
  const [bankName, setBankName] = useState(client.bankName || DOMINICAN_BANKS[0]);
  const [bankAccountType, setBankAccountType] = useState<'AHORROS' | 'CORRIENTE'>(
    client.bankAccountType || 'AHORROS'
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(client.bankAccountNumber || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(
    client.bankAccountHolder || client.name
  );

  // Collateral & Notes
  const [collateralType, setCollateralType] = useState(client.collateralType || 'OTRO');
  const [collateralDesc, setCollateralDesc] = useState(client.collateralDesc || '');
  const [notes, setNotes] = useState(client.notes || '');

  // MANDATORY JOURNAL ENTRY JUSTIFICATION
  const [justification, setJustification] = useState('');
  const [justificationError, setJustificationError] = useState('');

  // Deletion confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteJustification, setDeleteJustification] = useState('');

  // Check roles:
  // Categoría 1 = Administrador (Lic. Pedro Baldera) -> Can edit, modify OR delete
  // Categoría 2 = Prestamista / Gerente o Propietario -> Can edit, modify data (delete restricted to Admin)
  const isAdmin = currentSession.category === 1;
  const isManagerOrOwner = currentSession.category === 2;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!justification.trim() || justification.trim().length < 6) {
      setJustificationError(
        '⚠️ El registro de diario requiere un detalle o justificación obligatoria (mínimo 6 caracteres) explicando el motivo de la actualización.'
      );
      return;
    }

    setJustificationError('');

    // Summary of changes
    const changes: string[] = [];
    if (name !== client.name) changes.push(`Nombre: ${client.name} ➔ ${name}`);
    if (phone !== client.phone) changes.push(`Teléfono: ${client.phone} ➔ ${phone}`);
    if (monthlyIncome !== client.monthlyIncome)
      changes.push(`Ingresos: DOP ${client.monthlyIncome} ➔ DOP ${monthlyIncome}`);
    if (address !== client.address) changes.push(`Dirección actualizada`);
    if (guarantor !== client.guarantor) changes.push(`Garante: ${guarantor}`);
    if (coDebtor !== client.coDebtor) changes.push(`Co-deudor: ${coDebtor}`);
    if (bankAccountNumber !== client.bankAccountNumber)
      changes.push(`Cuenta Banco: ${bankName} (${bankAccountNumber})`);

    const changesText = changes.length > 0 ? changes.join(' | ') : 'Actualización de expediente y datos generales';

    const updatedClient: Client = {
      ...client,
      name,
      cedula,
      phone,
      whatsapp,
      email,
      occupation,
      monthlyIncome: Number(monthlyIncome),
      address,
      guarantor,
      guarantorCedula,
      guarantorPhone,
      guarantorRelation,
      coDebtor,
      coDebtorCedula,
      coDebtorPhone,
      coDebtorRelation,
      bankName,
      bankAccountType,
      bankAccountNumber,
      bankAccountHolder,
      collateralType,
      collateralDesc,
      notes,
    };

    const journalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'CLIENTE',
      entityId: client.id,
      entityName: client.name,
      actionType: 'MODIFICACION',
      justification: justification.trim(),
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: isAdmin
        ? 'Administrador (Lic. Pedro Baldera)'
        : isManagerOrOwner
        ? 'Gerente o Propietario'
        : currentSession.categoryLabel,
      changesSummary: changesText,
      previousState: JSON.stringify({
        name: client.name,
        cedula: client.cedula,
        phone: client.phone,
        monthlyIncome: client.monthlyIncome,
        bankAccount: client.bankAccountNumber,
      }),
      newState: JSON.stringify({
        name,
        cedula,
        phone,
        monthlyIncome,
        bankAccount: bankAccountNumber,
      }),
    };

    onSaveClient(updatedClient, journalEntry);
    onClose();
  };

  const handleDelete = () => {
    if (!isAdmin) {
      alert('Solo el Administrador (Categoría 1: Lic. Pedro Baldera) tiene permisos para eliminar clientes.');
      return;
    }

    if (!deleteJustification.trim() || deleteJustification.trim().length < 8) {
      alert('Debe indicar una justificación detallada para el Libro Diario al eliminar el cliente (mínimo 8 caracteres).');
      return;
    }

    const journalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'CLIENTE',
      entityId: client.id,
      entityName: client.name,
      actionType: 'ELIMINACION',
      justification: deleteJustification.trim(),
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: 'Administrador (Lic. Pedro Baldera)',
      changesSummary: `Eliminación de cliente ${client.name} (Cédula: ${client.cedula}) del registro central`,
      previousState: JSON.stringify(client),
    };

    if (onDeleteClient) {
      onDeleteClient(client.id, journalEntry);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">
                  Editar Datos del Deudor
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {client.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rol actual: <strong className="text-amber-400">{currentSession.categoryLabel}</strong> • Modificación auditada en Libro Diario
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Permission Notice */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300">
              <p className="font-bold text-white mb-0.5">
                Regla de Seguridad Contable:
              </p>
              <p>
                {isAdmin
                  ? 'Como Administrador (Lic. Pedro Baldera), usted tiene permisos plenos para EDITAR, MODIFICAR o BORRAR registros.'
                  : 'Como Gerente o Propietario, usted tiene rol para EDITAR y MODIFICAR datos. Cada cambio se asienta con su justificación obligatoria en el Libro Diario.'}
              </p>
            </div>
          </div>

          {/* Section 1: Personal Data */}
          <div>
            <h3 className="text-xs uppercase font-extrabold text-amber-400 tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4" /> 1. Información Personal & Contacto
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cédula de Identidad RD *
                </label>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => setCedula(formatCedula(e.target.value))}
                  placeholder="001-0000000-0"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Teléfono Móvil *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  WhatsApp (con código país)
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Correo Electrónico (para recuperación de clave)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ocupación / Tipo de Negocio
                </label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Ingreso Mensual Estimado (DOP)
                </label>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Dirección Residencial / Sector
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dominican Bank Details for Disbursement */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-sky-900/50">
            <h3 className="text-xs uppercase font-extrabold text-sky-400 tracking-wider mb-3 flex items-center gap-1.5">
              <Building className="w-4 h-4" /> 2. Datos Bancarios para Desembolsos y Transferencias
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Banco Dominicano
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {DOMINICAN_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Tipo de Cuenta Bancaria
                </label>
                <select
                  value={bankAccountType}
                  onChange={(e) => setBankAccountType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="AHORROS">Cuenta de Ahorros</option>
                  <option value="CORRIENTE">Cuenta Corriente</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Número de Cuenta Bancaria
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Ej. 960-238491-0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={(e) => setBankAccountHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Garante y Co-deudor */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-purple-900/50">
            <h3 className="text-xs uppercase font-extrabold text-purple-400 tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> 3. Garante Solidario (Cat. 4) & Co-Deudor (Cat. 5)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre Garante (Categoría 4)
                </label>
                <input
                  type="text"
                  value={guarantor}
                  onChange={(e) => setGuarantor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cédula Garante
                </label>
                <input
                  type="text"
                  value={guarantorCedula}
                  onChange={(e) => setGuarantorCedula(formatCedula(e.target.value))}
                  placeholder="001-0000000-0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nombre Co-Deudor Solidario (Categoría 5)
                </label>
                <input
                  type="text"
                  value={coDebtor}
                  onChange={(e) => setCoDebtor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cédula Co-Deudor
                </label>
                <input
                  type="text"
                  value={coDebtorCedula}
                  onChange={(e) => setCoDebtorCedula(formatCedula(e.target.value))}
                  placeholder="001-0000000-0"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: MANDATORY JOURNAL ENTRY JUSTIFICATION */}
          <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <label className="text-xs font-black text-amber-300 uppercase tracking-wide">
                * Detalle o Justificación Obligatoria para el Libro Diario (Asiento Contable)
              </label>
            </div>
            <p className="text-[11px] text-slate-300 mb-2.5">
              Por norma del sistema, cada actualización de cliente solo se permite con un registro en el diario explicando el motivo (ej. cambio de número verificado, actualización de cuenta bancaria para desembolso, nuevo aval o rectificación de dirección).
            </p>
            <textarea
              required
              rows={3}
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value);
                if (justificationError) setJustificationError('');
              }}
              placeholder="Escriba aquí el detalle o justificación obligatoria que quedará asentada en el Libro Diario..."
              className="w-full px-3 py-2 bg-slate-950 border border-amber-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            {justificationError && (
              <p className="text-xs text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {justificationError}
              </p>
            )}
          </div>

          {/* Delete Section (Admin Only) */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-800">
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-950/20 border border-rose-900/40">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400">
                      Zona de Administración: Eliminar Cliente
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Solo el Lic. Pedro Baldera puede eliminar registros maestros de clientes con justificación en diario.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Borrar Cliente
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-600 space-y-3">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ¿Está completamente seguro de eliminar a &ldquo;{client.name}&rdquo;?
                  </div>
                  <p className="text-[11px] text-rose-200">
                    Esta acción eliminará el registro maestro. Se requiere una justificación detallada para el Libro Diario.
                  </p>
                  <input
                    type="text"
                    value={deleteJustification}
                    onChange={(e) => setDeleteJustification(e.target.value)}
                    placeholder="Justificación del borrado para el Diario..."
                    className="w-full px-3 py-2 bg-slate-950 border border-rose-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Confirmar Borrado con Asiento en Diario
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isAdmin && isManagerOrOwner && (
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                <span>Borrado permanente de clientes restringido exclusivamente al Administrador.</span>
              </div>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded font-bold text-slate-300">
                Rol: Gerente / Propietario (Edición Activa)
              </span>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950 transition"
            >
              <Save className="w-4 h-4" />
              Guardar Actualización con Asiento en Diario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
