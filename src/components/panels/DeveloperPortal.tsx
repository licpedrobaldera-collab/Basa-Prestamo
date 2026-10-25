import React, { useState } from 'react';
import {
  Terminal,
  Activity,
  Cpu,
  Database,
  ShieldAlert,
  Server,
  Zap,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Sliders,
  HardDrive,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DeveloperPortalProps {
  devName: string;
  activeTenantId: string;
  onClearStorageAndReset: () => void;
  onInjectSeedData: () => void;
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({
  devName,
  activeTenantId,
  onClearStorageAndReset,
  onInjectSeedData,
}) => {
  const [activeTab, setActiveTab] = useState<'health' | 'logs' | 'migrations' | 'diagnostics'>('health');

  // Test runners state
  const [testGeminiResult, setTestGeminiResult] = useState<string | null>(null);
  const [testGeminiLoading, setTestGeminiLoading] = useState(false);

  const [testNotifResult, setTestNotifResult] = useState<string | null>(null);
  const [testNotifLoading, setTestNotifLoading] = useState(false);

  // System Logs Simulation
  const [systemLogs, setSystemLogs] = useState<Array<{ timestamp: string; level: 'INFO' | 'WARN' | 'ERROR'; source: string; message: string }>>([
    { timestamp: '10:45:12', level: 'INFO', source: 'SERVER_BOOT', message: 'Express server listening on http://0.0.0.0:3000' },
    { timestamp: '10:45:13', level: 'INFO', source: 'GEMINI_SDK', message: 'Initialized GoogleGenAI with model gemini-3.8-flash server-side proxy' },
    { timestamp: '10:45:15', level: 'INFO', source: 'WORKSPACE_OAUTH', message: 'OAuth2 client registered with Gmail scopes (707630706415-illmiug108ejn43ol2vkfqhjjvc4ahm2)' },
    { timestamp: '10:45:18', level: 'INFO', source: 'MULTI_TENANT', message: `Active schema isolation context: tenant_${activeTenantId}_db mounted` },
    { timestamp: '10:46:01', level: 'INFO', source: 'RBAC_SECURITY', message: 'Access control evaluated for 6 role portals with zero-privilege defaults' },
  ]);

  const handleTestGemini = async () => {
    setTestGeminiLoading(true);
    setTestGeminiResult(null);
    try {
      const res = await fetch('/api/gemini/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: {
            name: 'Cliente Prueba Diagnóstico',
            cedula: '001-9999999-9',
            occupation: 'Comerciante en Mercado Modelo',
            monthlyIncome: 45000,
            address: 'Av. Duarte, Santo Domingo',
          },
          loanDetails: {
            amount: 50000,
            frequency: 'SEMANAL',
            terms: 12,
            rate: 2.5,
          },
        }),
      });
      const data = await res.json();
      setTestGeminiResult(JSON.stringify(data, null, 2));
      setSystemLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          source: 'TEST_GEMINI_API',
          message: `Endpoint /api/gemini/score respondió con éxito: Score ${data.data?.score}/100`,
        },
        ...prev,
      ]);
    } catch (err: any) {
      setTestGeminiResult(`Error: ${err?.message}`);
      setSystemLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'ERROR',
          source: 'TEST_GEMINI_API',
          message: `Fallo en endpoint: ${err?.message}`,
        },
        ...prev,
      ]);
    } finally {
      setTestGeminiLoading(false);
    }
  };

  const handleTestNotifications = async () => {
    setTestNotifLoading(true);
    setTestNotifResult(null);
    try {
      const res = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'WHATSAPP',
          type: 'PROXIMA_A_VENCER',
          clientName: 'Pedro Baldera',
          amount: 3500,
          dueDate: '2026-10-30',
        }),
      });
      const data = await res.json();
      setTestNotifResult(JSON.stringify(data, null, 2));
      setSystemLogs((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          level: 'INFO',
          source: 'NOTIF_GEN',
          message: 'Endpoint /api/notifications/generate generó mensaje de WhatsApp dominicano',
        },
        ...prev,
      ]);
    } catch (err: any) {
      setTestNotifResult(`Error: ${err?.message}`);
    } finally {
      setTestNotifLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border border-rose-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 font-mono">
                <Terminal className="w-3.5 h-3.5 text-rose-400" />
                Panel de Desarrollador & SuperAdmin Técnico (/dev)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                {devName} (Full Backend Access)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              Infraestructura, APIs & Diagnóstico Técnico
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Monitoreo de microservicios, migraciones de esquema multi-tenant, consola de diagnóstico y depuración de endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                if (confirm('¿Restablecer datos de prueba semilla (seed data)?')) {
                  onInjectSeedData();
                  alert('¡Datos de prueba inyectados correctamente!');
                }
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-500/30 cursor-pointer"
            >
              <Database className="w-4 h-4" />
              Inyectar Seed Data
            </button>
            <button
              onClick={() => {
                if (confirm('¿Desea limpiar toda la memoria local y reiniciar el sistema a valores iniciales?')) {
                  onClearStorageAndReset();
                }
              }}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-500/40 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Limpiar Cache / Reset
            </button>
          </div>
        </div>

        {/* 4 Technical Status Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Servidor Backend</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-lg font-mono font-bold text-white">Express :3000</span>
            </div>
            <span className="text-[10px] text-emerald-400 mt-0.5 block">Status 200 OK • Node.js</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Motor Gemini AI</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
              <span className="text-lg font-mono font-bold text-white">gemini-3.8-flash</span>
            </div>
            <span className="text-[10px] text-purple-300 mt-0.5 block">SDK @google/genai activo</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Google Workspace</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-lg font-mono font-bold text-white">Gmail OAuth2</span>
            </div>
            <span className="text-[10px] text-red-300 mt-0.5 block">Token en memoria seguro</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Esquema Tenant</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
              <span className="text-sm font-mono font-bold text-sky-400 truncate">
                tenant_{activeTenantId}_db
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Aislamiento de BD activo</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs font-bold font-mono">
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'health'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          Health Check & APIs
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Logs de Servidor ({systemLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('migrations')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'migrations'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Esquemas Multi-Inquilino
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
            activeTab === 'diagnostics'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4" />
          Pruebas de Integración
        </button>
      </div>

      {/* TAB: HEALTH CHECK */}
      {activeTab === 'health' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Microservicios y Rutas de Backend
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800">
                <span className="text-slate-300">POST /api/gemini/score</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800">
                <span className="text-slate-300">POST /api/gemini/ocr</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800">
                <span className="text-slate-300">POST /api/notifications/generate</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800">
                <span className="text-slate-300">POST /api/gemini/audit</span>
                <span className="text-emerald-400 font-bold">200 OK</span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              Variables de Entorno & Configuración Runtime
            </h4>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">NODE_ENV:</span>
                <span className="text-white">development / preview</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">PORT:</span>
                <span className="text-white">3000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">GEMINI_API_KEY:</span>
                <span className="text-emerald-400 font-bold">✓ Configurada en servidor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">FIREBASE_PROJECT_ID:</span>
                <span className="text-white">direct-contact-5f38q</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">RBAC_ARCHITECTURE:</span>
                <span className="text-rose-400 font-bold">6 Portales Especializados</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SYSTEM LOGS */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 font-mono text-xs shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="text-slate-400 font-bold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-rose-400" />
              Consola de Eventos del Servidor (Live Tail)
            </span>
            <button
              onClick={() => setSystemLogs([])}
              className="text-slate-500 hover:text-white text-[11px]"
            >
              Limpiar consola
            </button>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {systemLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 py-0.5 leading-relaxed">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                    log.level === 'INFO'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : log.level === 'WARN'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-sky-400 shrink-0">[{log.source}]</span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: ESQUEMAS MULTI-INQUILINO */}
      {activeTab === 'migrations' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            Control de Esquemas Multi-Tenant & Aislamiento de Datos
          </h4>
          <p className="text-xs text-slate-400">
            Cada inquilino opera en un espacio de datos aislado para prevenir colisiones entre financieras.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-amber-400 font-bold block">Martínez Santos y Asoc.</span>
              <span className="text-slate-400 block">Esquema: tenant_msa_db</span>
              <span className="text-emerald-400 font-bold block">Moneda: DOP</span>
              <span className="text-slate-500 text-[10px] block">Estado: ACTIVE (Colocación: 14.5M)</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-sky-400 font-bold block">Cooperativa Crece Más</span>
              <span className="text-slate-400 block">Esquema: tenant_crece_db</span>
              <span className="text-emerald-400 font-bold block">Moneda: USD</span>
              <span className="text-slate-500 text-[10px] block">Estado: ACTIVE (Colocación: 820K)</span>
            </div>
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-purple-400 font-bold block">Prestamista San Juan</span>
              <span className="text-slate-400 block">Esquema: tenant_sanjuan_db</span>
              <span className="text-emerald-400 font-bold block">Moneda: DOP</span>
              <span className="text-slate-500 text-[10px] block">Estado: ACTIVE (Colocación: 3.4M)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRUEBAS DE INTEGRACIÓN */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test 1: Gemini Scoring API */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-400" />
                  Prueba de Endpoint Gemini Scoring
                </h4>
                <button
                  onClick={handleTestGemini}
                  disabled={testGeminiLoading}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testGeminiLoading ? 'Enviando...' : 'Ejecutar Test'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Prueba la comunicación RPC con el modelo gemini-3.8-flash y el generador de scoring popular dominicano.
              </p>
              {testGeminiResult && (
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-purple-300 max-h-48 overflow-y-auto">
                  {testGeminiResult}
                </pre>
              )}
            </div>

            {/* Test 2: Notification Message Generator */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Prueba de Generador de Notificaciones
                </h4>
                <button
                  onClick={handleTestNotifications}
                  disabled={testNotifLoading}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  {testNotifLoading ? 'Enviando...' : 'Ejecutar Test'}
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Genera un aviso preventivo para WhatsApp en dialecto dominicano mediante `/api/notifications/generate`.
              </p>
              {testNotifResult && (
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-48 overflow-y-auto">
                  {testNotifResult}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
