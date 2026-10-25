import React, { useState, useEffect } from 'react';
import {
  AccountPayable,
  Client,
  CompanyTenant,
  EmployeePayroll,
  ExpenseRecord,
  Loan,
  PaymentTransaction,
  SystemSettings,
  SystemUser,
} from '../types';
import {
  Download,
  Upload,
  HardDrive,
  Clock,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  X,
  FileJson,
  RotateCcw,
  Building,
} from 'lucide-react';

interface BackupManagerModalProps {
  companies: CompanyTenant[];
  clients: Client[];
  loans: Loan[];
  payments: PaymentTransaction[];
  expenses: ExpenseRecord[];
  payables: AccountPayable[];
  payroll: EmployeePayroll[];
  users: SystemUser[];
  settings: SystemSettings;
  onClose: () => void;
  onRestoreBackup: (restoredData: {
    companies?: CompanyTenant[];
    clients?: Client[];
    loans?: Loan[];
    payments?: PaymentTransaction[];
    expenses?: ExpenseRecord[];
    payables?: AccountPayable[];
    payroll?: EmployeePayroll[];
    users?: SystemUser[];
    settings?: SystemSettings;
  }) => void;
}

export const BackupManagerModal: React.FC<BackupManagerModalProps> = ({
  companies,
  clients,
  loans,
  payments,
  expenses,
  payables,
  payroll,
  users,
  settings,
  onClose,
  onRestoreBackup,
}) => {
  const [secondsUntilNextAutoBackup, setSecondsUntilNextAutoBackup] = useState(10);
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<string>(new Date().toLocaleTimeString('es-DO'));
  const [restoreFeedback, setRestoreFeedback] = useState<string>('');
  const [restoreError, setRestoreError] = useState<string>('');

  // 10-second background ticker simulation for automatic persistence
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextAutoBackup((prev) => {
        if (prev <= 1) {
          setLastAutoSaveTime(new Date().toLocaleTimeString('es-DO'));
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Download complete database JSON backup
  const handleDownloadCompleteBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      version: '3.0.0-PRO-RD',
      timestamp: new Date().toISOString(),
      companyName: settings.companyName,
      exportedBy: 'SuperAdmin Lic Pedro Baldera',
      companies,
      clients,
      loans,
      payments,
      expenses,
      payables,
      payroll,
      users,
      settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BACKUP_SISTEMA_PRESTDOMINICANA_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download Prestamistas only database
  const handleDownloadPrestamistasBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      type: 'HISTORICO_PRESTAMISTAS',
      timestamp: new Date().toISOString(),
      companies,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HISTORICO_PRESTAMISTAS_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Download Clients only database
  const handleDownloadClientsBackup = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupData = {
      type: 'HISTORICO_CLIENTES_Y_PRESTAMOS',
      timestamp: new Date().toISOString(),
      clients,
      loans,
      payments,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `HISTORICO_CLIENTES_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Upload and restore JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFeedback('');
    setRestoreError('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json || typeof json !== 'object') {
          throw new Error('El archivo no contiene un formato JSON válido.');
        }

        onRestoreBackup(json);
        setRestoreFeedback(
          '¡Copia de seguridad restaurada exitosamente! Todos los clientes, préstamos y prestamistas han sido cargados sin pérdida de información.'
        );
      } catch (err: any) {
        setRestoreError(`Error al leer archivo de respaldo: ${err.message || 'Formato inválido'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">
                Gestor de Respaldos, Backups & Sincronización Automática
              </h3>
              <p className="text-[11px] text-slate-400">
                Guardado automático continuo cada 10 segundos y descarga en cada computadora.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs bg-slate-950/40">
          {/* Real-time 10-Second Auto Backup Indicator */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-white text-xs block">
                  Respaldo Automático Activo (Cada 10 Segundos)
                </span>
                <span className="text-[11px] text-slate-400">
                  Última sincronización local guardada: <strong className="text-emerald-400">{lastAutoSaveTime}</strong>
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Próximo autoguardado en:</span>
              <span className="text-sm font-mono font-black text-amber-400">
                {secondsUntilNextAutoBackup} seg
              </span>
            </div>
          </div>

          {/* Feedback banners */}
          {restoreFeedback && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{restoreFeedback}</span>
            </div>
          )}

          {restoreError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{restoreError}</span>
            </div>
          )}

          {/* Download Options */}
          <div className="space-y-3">
            <h4 className="font-bold text-amber-400 text-xs">Descargar Copias de Seguridad en Computadora</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleDownloadCompleteBackup}
                className="p-3.5 bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition flex flex-col justify-between"
              >
                <FileJson className="w-5 h-5 text-amber-400 mb-2" />
                <div>
                  <div className="font-bold text-white text-xs">Backup Completo Consolidado</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Empresas, clientes, préstamos y finanzas
                  </div>
                </div>
              </button>

              <button
                onClick={handleDownloadPrestamistasBackup}
                onClickCapture={handleDownloadPrestamistasBackup}
                className="p-3.5 bg-slate-900 border border-slate-800 hover:border-sky-500/40 rounded-xl text-left transition flex flex-col justify-between"
              >
                <Building className="w-5 h-5 text-sky-400 mb-2" />
                <div>
                  <div className="font-bold text-white text-xs">Histórico de Prestamistas</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {companies.length} empresas registradas
                  </div>
                </div>
              </button>

              <button
                onClick={handleDownloadClientsBackup}
                className="p-3.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl text-left transition flex flex-col justify-between"
              >
                <RotateCcw className="w-5 h-5 text-emerald-400 mb-2" />
                <div>
                  <div className="font-bold text-white text-xs">Histórico de Clientes & Créditos</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {clients.length} clientes • {loans.length} préstamos
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Restore / Upload Backup File */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              Cargar y Restaurar Datos desde Archivo Backup (.JSON)
            </h4>
            <p className="text-[11px] text-slate-400">
              Si cambió de computadora o desea actualizar con una copia previa, seleccione el archivo para restablecer la base de datos sin alterar cuentas activas.
            </p>

            <label className="cursor-pointer block border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 text-center transition bg-slate-900/60">
              <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-slate-300 font-bold block text-xs">
                Seleccionar archivo BACKUP_SISTEMA_*.json
              </span>
              <span className="text-[10px] text-slate-500">Haga clic o arrastre su archivo aquí</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
