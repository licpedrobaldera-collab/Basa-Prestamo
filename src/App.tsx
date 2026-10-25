import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  AccountPayable,
  AuthSession,
  Client,
  CompanyTenant,
  EmployeePayroll,
  ExpenseRecord,
  ExtraCharge,
  Loan,
  LoanFrequency,
  LoanType,
  PaymentMethod,
  PaymentTransaction,
  PaymentType,
  PaymentVoucherVerification,
  PortfolioBucket,
  RouteStop,
  SystemSettings,
  SystemUser,
  UserCategory,
  UserRole,
  JournalEntry,
  SecretPasswordVaultRecord,
  NotificationLog,
  AppRole,
} from './types';
import {
  initialClients,
  initialCompanies,
  initialExpenses,
  initialExtraCharges,
  initialJournalEntries,
  initialLoans,
  initialNotifications,
  initialPayables,
  initialPayments,
  initialPayroll,
  initialSecretVaultRecords,
  initialSettings,
  initialUsers,
  initialVouchers,
} from './data/initialData';
import {
  exportToCSV,
  formatCedula,
  formatDOP,
  generateAmortizationSchedule,
} from './utils/loanCalculator';
import { DominicanMap } from './components/DominicanMap';
import { ReceiptModal } from './components/ReceiptModal';
import { ContractModal } from './components/ContractModal';
import { ClientApplicationModal } from './components/ClientApplicationModal';
import { PaymentModal } from './components/PaymentModal';
import { RefinanceModal } from './components/RefinanceModal';
import { WhatsAppAssistantModal } from './components/WhatsAppAssistantModal';
import { AmortizationScheduleModal } from './components/AmortizationScheduleModal';
import { UserManagementModal } from './components/UserManagementModal';
import { SuperAdminLicensingModal } from './components/SuperAdminLicensingModal';
import { SmartAuthModal } from './components/SmartAuthModal';
import { BackupManagerModal } from './components/BackupManagerModal';
import { ClientIndividualHistoryModal } from './components/ClientIndividualHistoryModal';
import { VoucherVerificationModal } from './components/VoucherVerificationModal';
import { ExtraChargesModal } from './components/ExtraChargesModal';
import { ClientEditModal } from './components/ClientEditModal';
import { ClientMovementDetailModal } from './components/ClientMovementDetailModal';
import { PayableMovementModal } from './components/PayableMovementModal';
import { GeneralJournalModal } from './components/GeneralJournalModal';
import { InitialBalanceOnboardingModal } from './components/InitialBalanceOnboardingModal';
import { SecretPasswordVaultModal } from './components/SecretPasswordVaultModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { GmailManagerModal } from './components/GmailManagerModal';
import {
  LoanWorkflowPipeline,
  WorkflowLoan,
  TenantInfo,
  ROLES_PERMISSIONS,
} from './components/LoanWorkflowPipeline';
import { MultiCurrencyAmortizationCalculator } from './components/MultiCurrencyAmortizationCalculator';
import { FiscalInvoiceReceiptModule } from './components/FiscalInvoiceReceiptModule';
import { RoleNavigationBar } from './components/RoleNavigationBar';
import { ClientPortal } from './components/panels/ClientPortal';
import { CollectorPortal } from './components/panels/CollectorPortal';
import { LoanOfficerPortal } from './components/panels/LoanOfficerPortal';
import { ManagerPortal } from './components/panels/ManagerPortal';
import { AdminPortal } from './components/panels/AdminPortal';
import { DeveloperPortal } from './components/panels/DeveloperPortal';

import {
  LayoutDashboard,
  Users,
  HandCoins,
  Route,
  Receipt,
  FileSpreadsheet,
  Building,
  Building2,
  Brain,
  Settings,
  PlusCircle,
  DollarSign,
  RefreshCw,
  Printer,
  Search,
  Phone,
  MessageCircle,
  MessageSquare,
  FileText,
  Calendar,
  AlertTriangle,
  MapPin,
  Sparkles,
  Download,
  Menu,
  X,
  Briefcase,
  CheckCircle,
  Filter,
  UserCheck,
  ShieldCheck,
  HardDrive,
  Lock,
  Clock,
  History,
  Key,
  BookOpen,
  Edit,
  Trash2,
  RotateCcw,
  Scale,
  Unlock,
  Bell,
  Mail,
  Calculator,
  Terminal,
} from 'lucide-react';

const INITIAL_TENANTS: TenantInfo[] = [
  {
    id: 't1',
    name: 'Martínez Santos y Asoc.',
    dbSchema: 'tenant_msa_db',
    currency: 'DOP',
    status: 'ACTIVE',
    balance: 14580000,
  },
  {
    id: 't2',
    name: 'Cooperativa Crece Más',
    dbSchema: 'tenant_crece_db',
    currency: 'USD',
    status: 'ACTIVE',
    balance: 820000,
  },
  {
    id: 't3',
    name: 'Prestamista San Juan',
    dbSchema: 'tenant_sanjuan_db',
    currency: 'DOP',
    status: 'ACTIVE',
    balance: 3450000,
  },
];

const INITIAL_PIPELINE_LOANS: Record<string, WorkflowLoan[]> = {
  t1: [
    {
      id: 'L-MSA-2026-001',
      clientName: 'Carlos Eduardo Peña',
      clientId: '001-1827364-2',
      amount: 250000,
      currency: 'DOP',
      termMonths: 12,
      rate: 2.5,
      method: 'Francés',
      stage: 'PRE_EVALUACION',
      clientEmail: 'carlos.pena@gmail.com',
      logs: [{ date: '2026-10-20', user: 'Oficial María', text: 'Solicitud creada en esquema master.' }],
    },
    {
      id: 'L-MSA-2026-002',
      clientName: 'Distribuidora del Norte SRL',
      clientId: '1-30-88273-1',
      amount: 1500000,
      currency: 'DOP',
      termMonths: 24,
      rate: 1.8,
      method: 'Insoluto',
      stage: 'VERIFICACION_BURÓ',
      clientEmail: 'contacto@distribuidoranorte.com',
      logs: [{ date: '2026-10-21', user: 'Oficial Juan', text: 'En verificación de score de buró.' }],
    },
    {
      id: 'L-MSA-2026-003',
      clientName: 'Ramón Antonio Castillo',
      clientId: '001-0492812-3',
      amount: 300000,
      currency: 'DOP',
      termMonths: 6,
      rate: 3.0,
      method: 'Fijo',
      stage: 'DESEMBOLSADO',
      clientEmail: 'ramon.castillo@gmail.com',
      logs: [{ date: '2026-09-01', user: 'Gerente Pedro', text: 'Préstamo desembolsado y activo.' }],
    },
  ],
  t2: [
    {
      id: 'L-CCM-2026-001',
      clientName: 'Ana Sofia Gómez',
      clientId: '402-9812733-9',
      amount: 15000,
      currency: 'USD',
      termMonths: 18,
      rate: 1.5,
      method: 'Alemán',
      stage: 'APROBACION_GERENCIAL',
      clientEmail: 'ana.gomez@gmail.com',
      logs: [{ date: '2026-10-18', user: 'Oficial Inquilino 2', text: 'Validado por supervisor internacional.' }],
    },
    {
      id: 'L-CCM-2026-002',
      clientName: 'John Fletcher Corp',
      clientId: '3-102-99281',
      amount: 85000,
      currency: 'USD',
      termMonths: 36,
      rate: 1.2,
      method: 'Francés',
      stage: 'VERIFICACION_BURÓ',
      clientEmail: 'jfletcher@corp.com',
      logs: [{ date: '2026-10-22', user: 'Auditor Ext', text: 'Pendiente documentación corporativa.' }],
    },
  ],
  t3: [
    {
      id: 'L-PSJ-2026-001',
      clientName: 'María Elena Reyes',
      clientId: '002-9982716-1',
      amount: 75000,
      currency: 'DOP',
      termMonths: 10,
      rate: 4.0,
      method: 'Francés',
      stage: 'PRE_EVALUACION',
      clientEmail: 'maria.reyes@gmail.com',
      logs: [{ date: '2026-10-24', user: 'Oficial Local', text: 'Solicitud urgente recibida en sucursal.' }],
    },
  ],
};

export interface TenantRouteItem {
  id: number;
  client: string;
  address: string;
  amount: number;
  phone: string;
  status: 'En Ruta' | 'Pagado' | 'Pendiente';
  lat: number;
  lng: number;
}

export interface TenantExpenseItem {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
}

const INITIAL_ROUTES_DATA: Record<string, TenantRouteItem[]> = {
  t1: [
    { id: 1, client: 'Roberto Martínez', address: 'Av. 27 de Febrero #104, Ens. Naco', amount: 4500, phone: '809-555-0192', status: 'En Ruta', lat: 18.471, lng: -69.923 },
    { id: 2, client: 'Supermercado La Fe', address: 'C/ El Conde #45, Zona Colonial', amount: 12500, phone: '809-555-0344', status: 'Pagado', lat: 18.473, lng: -69.882 },
    { id: 3, client: 'Juan Antonio Peña', address: 'Av. Winston Churchill #88', amount: 3200, phone: '829-555-8812', status: 'Pendiente', lat: 18.465, lng: -69.941 },
  ],
  t2: [
    { id: 4, client: 'Miami Logistics Center', address: 'Brickell Ave #402', amount: 1200, phone: '+1 305-555-0199', status: 'En Ruta', lat: 25.761, lng: -80.191 },
  ],
  t3: [
    { id: 5, client: 'Colmado San Juan', address: 'Calle Duarte #12, Centro Pueblo', amount: 1500, phone: '809-555-9922', status: 'Pendiente', lat: 18.801, lng: -71.231 },
  ],
};

const INITIAL_EXPENSES_DATA: Record<string, TenantExpenseItem[]> = {
  t1: [
    { id: 1, date: '2026-10-24', category: 'Nómina', description: 'Pago quincena oficiales de crédito', amount: 185000 },
    { id: 2, date: '2026-10-23', category: 'Servicios Publicos', description: 'Factura de energía eléctrica oficina central', amount: 24500 },
    { id: 3, date: '2026-10-22', category: 'Combustible', description: 'Asignación ruta mensajeros/cobradores', amount: 12000 },
  ],
  t2: [
    { id: 4, date: '2026-10-24', category: 'Alquiler', description: 'Renta oficina corporativa Miami', amount: 3500 },
  ],
  t3: [
    { id: 5, date: '2026-10-20', category: 'Suministros', description: 'Papelería e impresión de contratos', amount: 4500 },
  ],
};

export default function App() {
  // Navigation & Role states
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [currentAppRole, setCurrentAppRole] = useState<AppRole>(() => {
    const saved = localStorage.getItem('prest_app_role');
    return (saved as AppRole) || 'ADMIN';
  });
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Core Data with LocalStorage Persistence
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('prest_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [companies, setCompanies] = useState<CompanyTenant[]>(() => {
    const saved = localStorage.getItem('prest_companies');
    return saved ? JSON.parse(saved) : initialCompanies;
  });

  // Active Session State (Categorías 1, 2, 3, 4, 5)
  const [currentSession, setCurrentSession] = useState<AuthSession>(() => {
    const saved = localStorage.getItem('prest_session');
    if (saved) return JSON.parse(saved);
    return {
      id: 'ADMIN-MASTER',
      identifier: initialSettings.adminCedula,
      name: 'Lic Pedro Baldera',
      email: initialSettings.adminEmail,
      category: 1,
      categoryLabel: 'Categoría 1: Administrador',
    };
  });

  const [users, setUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('prest_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('prest_clients');
    return saved ? JSON.parse(saved) : initialClients;
  });

  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem('prest_loans');
    return saved ? JSON.parse(saved) : initialLoans;
  });

  const [payments, setPayments] = useState<PaymentTransaction[]>(() => {
    const saved = localStorage.getItem('prest_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => {
    const saved = localStorage.getItem('prest_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  const [payables, setPayables] = useState<AccountPayable[]>(() => {
    const saved = localStorage.getItem('prest_payables');
    return saved ? JSON.parse(saved) : initialPayables;
  });

  const [payroll, setPayroll] = useState<EmployeePayroll[]>(() => {
    const saved = localStorage.getItem('prest_payroll');
    return saved ? JSON.parse(saved) : initialPayroll;
  });

  // Comprobantes de Depósito Bancario & Verificación
  const [vouchers, setVouchers] = useState<PaymentVoucherVerification[]>(() => {
    const saved = localStorage.getItem('prest_vouchers');
    return saved ? JSON.parse(saved) : initialVouchers;
  });

  // Cargos Extras al Balance (GPS, Notaría, Visitas)
  const [extraCharges, setExtraCharges] = useState<ExtraCharge[]>(() => {
    const saved = localStorage.getItem('prest_extra_charges');
    return saved ? JSON.parse(saved) : initialExtraCharges;
  });

  // Libro Diario General & Auditoría Inmutable de Transacciones
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('prest_journal_entries');
    return saved ? JSON.parse(saved) : initialJournalEntries;
  });

  // Modal States
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanForPayment, setSelectedLoanForPayment] = useState<Loan | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [currentReceiptPayment, setCurrentReceiptPayment] = useState<PaymentTransaction | null>(null);

  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [selectedLoanForContract, setSelectedLoanForContract] = useState<Loan | null>(null);

  const [isRefinanceModalOpen, setIsRefinanceModalOpen] = useState(false);
  const [selectedLoanForRefinance, setSelectedLoanForRefinance] = useState<Loan | null>(null);

  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [selectedLoanForWhatsApp, setSelectedLoanForWhatsApp] = useState<string>('');

  const [isAmortizationModalOpen, setIsAmortizationModalOpen] = useState(false);
  const [selectedLoanForAmortization, setSelectedLoanForAmortization] = useState<Loan | null>(null);

  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isLicensingModalOpen, setIsLicensingModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isExtraChargesModalOpen, setIsExtraChargesModalOpen] = useState(false);
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);

  // New Modals for Editing & Movement Tracking with Mandatory Journal Entry
  const [isClientEditModalOpen, setIsClientEditModalOpen] = useState(false);
  const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);

  const [isClientMovementModalOpen, setIsClientMovementModalOpen] = useState(false);
  const [selectedClientForMovement, setSelectedClientForMovement] = useState<Client | null>(null);

  const [isPayableMovementModalOpen, setIsPayableMovementModalOpen] = useState(false);
  const [selectedPayableForMovement, setSelectedPayableForMovement] = useState<AccountPayable | null>(null);

  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isInitialBalanceModalOpen, setIsInitialBalanceModalOpen] = useState(false);
  const [isSecretVaultModalOpen, setIsSecretVaultModalOpen] = useState(false);
  const [secretVaultRecords, setSecretVaultRecords] = useState<SecretPasswordVaultRecord[]>(() => {
    const saved = localStorage.getItem('prest_secret_vault');
    return saved ? JSON.parse(saved) : initialSecretVaultRecords;
  });

  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('prest_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Multi-Tenant Isolation & RBAC Workflow States
  const [activeTenant, setActiveTenant] = useState<TenantInfo>(INITIAL_TENANTS[0]);
  const [currentApprovalRole, setCurrentApprovalRole] = useState<string>('Gerente');
  const [allPipelineLoans, setAllPipelineLoans] = useState<Record<string, WorkflowLoan[]>>(() => {
    const saved = localStorage.getItem('prest_pipeline_loans');
    return saved ? JSON.parse(saved) : INITIAL_PIPELINE_LOANS;
  });

  const [allTenantRoutes, setAllTenantRoutes] = useState<Record<string, TenantRouteItem[]>>(() => {
    const saved = localStorage.getItem('prest_tenant_routes');
    return saved ? JSON.parse(saved) : INITIAL_ROUTES_DATA;
  });

  const [allTenantExpenses, setAllTenantExpenses] = useState<Record<string, TenantExpenseItem[]>>(() => {
    const saved = localStorage.getItem('prest_tenant_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES_DATA;
  });

  // Inputs para registrar nuevo gasto de inquilino
  const [newExpCat, setNewExpCat] = useState('Nómina');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpAmt, setNewExpAmt] = useState('');

  // Gmail Manager Modal State
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [activeGmailDraft, setActiveGmailDraft] = useState<
    | {
        clientId?: string;
        loanId?: string;
        paymentId?: string;
        templateType?: 'DUE_SOON' | 'OVERDUE' | 'RECEIPT' | 'STATEMENT' | 'CUSTOM';
        recipientEmail?: string;
        customSubject?: string;
      }
    | undefined
  >(undefined);

  // Cartera de Antigüedad Filters (0-30, 31-60, 61-90, MAS_90)
  const [clientAgingBucket, setClientAgingBucket] = useState<PortfolioBucket>('ALL');
  const [payableAgingBucket, setPayableAgingBucket] = useState<PortfolioBucket>('ALL');

  // Background 10-second automatic save feedback
  const [autoSaveTicker, setAutoSaveTicker] = useState<number>(10);

  // Comprehensive Filters for Advisors & Managers
  const [loanStatusFilter, setLoanStatusFilter] = useState<string>('ALL');
  const [selectedAdvisorFilter, setSelectedAdvisorFilter] = useState<string>('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('ALL');
  const [dateStartFilter, setDateStartFilter] = useState<string>('');
  const [dateEndFilter, setDateEndFilter] = useState<string>('');
  const [loanSearch, setLoanSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [routeDate, setRouteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('prest_settings', JSON.stringify(settings));
    localStorage.setItem('prest_companies', JSON.stringify(companies));
    localStorage.setItem('prest_session', JSON.stringify(currentSession));
    localStorage.setItem('prest_users', JSON.stringify(users));
    localStorage.setItem('prest_clients', JSON.stringify(clients));
    localStorage.setItem('prest_loans', JSON.stringify(loans));
    localStorage.setItem('prest_payments', JSON.stringify(payments));
    localStorage.setItem('prest_expenses', JSON.stringify(expenses));
    localStorage.setItem('prest_payables', JSON.stringify(payables));
    localStorage.setItem('prest_payroll', JSON.stringify(payroll));
    localStorage.setItem('prest_vouchers', JSON.stringify(vouchers));
    localStorage.setItem('prest_extra_charges', JSON.stringify(extraCharges));
    localStorage.setItem('prest_journal_entries', JSON.stringify(journalEntries));
    localStorage.setItem('prest_secret_vault', JSON.stringify(secretVaultRecords));
    localStorage.setItem('prest_notifications', JSON.stringify(notificationLogs));
    localStorage.setItem('prest_pipeline_loans', JSON.stringify(allPipelineLoans));
    localStorage.setItem('prest_tenant_routes', JSON.stringify(allTenantRoutes));
    localStorage.setItem('prest_tenant_expenses', JSON.stringify(allTenantExpenses));
    localStorage.setItem('prest_app_role', currentAppRole);
  }, [settings, companies, currentSession, users, clients, loans, payments, expenses, payables, payroll, vouchers, extraCharges, journalEntries, secretVaultRecords, notificationLogs, allPipelineLoans, allTenantRoutes, allTenantExpenses, currentAppRole]);

  // Background 10-second automatic backup timer
  useEffect(() => {
    const timer = setInterval(() => {
      setAutoSaveTicker((prev) => {
        if (prev <= 1) {
          // Automatic save point reached
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request user geolocation for street route
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setUserLocation({ lat: 18.4861, lng: -69.9312 }); // Default Santo Domingo
        }
      );
    }
  }, []);

  // Financial Core Totals
  const totalDisbursed = loans.reduce((acc, l) => acc + l.amount, 0);
  const totalClosingFees = loans.reduce((acc, l) => acc + (l.closingFee || 0), 0);
  const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);
  const totalCapitalPaid = payments.reduce((acc, p) => acc + p.capitalPaid, 0);
  const totalInterestPaid = payments.reduce((acc, p) => acc + p.interestPaid, 0);
  const totalLateFeesPaid = payments.reduce((acc, p) => acc + p.lateFeePaid, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalPayablesAmount = payables.reduce((acc, p) => acc + p.balance, 0);

  const availableCash =
    settings.initialCash - totalDisbursed + totalCollected - totalExpenses + totalClosingFees;

  // Loan Status Breakdown Counts
  const approvedLoansCount = loans.filter((l) => l.status === 'APROBADO' || l.status === 'ACTIVE').length;
  const pendingLoans = loans.filter((l) => l.status === 'EN_TRAMITE');
  const rejectedLoans = loans.filter((l) => l.status === 'RECHAZADO');
  const activeLoans = loans.filter((l) => l.status === 'ACTIVE');
  const overdueLoans = loans.filter((l) => l.status === 'OVERDUE');
  const paidLoans = loans.filter((l) => l.status === 'PAID');

  const totalPortfolioBalance = loans
    .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
    .reduce((acc, l) => acc + l.balance, 0);

  const overdueBalance = overdueLoans.reduce((acc, l) => acc + l.balance, 0);

  // Today collections
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = payments.filter((p) => p.date === todayStr);
  const todayCollected = todayPayments.reduce((acc, p) => acc + p.amount, 0);

  // Financial statement summaries
  const totalIncome = totalInterestPaid + totalClosingFees + totalLateFeesPaid;
  const netProfit = totalIncome - totalExpenses;
  const totalAssets = availableCash + totalPortfolioBalance;
  const totalLiabilities = totalPayablesAmount;
  const equity = totalAssets - totalLiabilities;

  // Filtered Loans for Dashboard & Reports
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const client = clients.find((c) => c.id === l.clientId);
      const clientName = client?.name || '';
      const clientCedula = client?.cedula || '';

      // Status Filter
      if (loanStatusFilter !== 'ALL') {
        if (loanStatusFilter === 'APROBADO') {
          if (l.status !== 'APROBADO' && l.status !== 'ACTIVE') return false;
        } else if (l.status !== loanStatusFilter) {
          return false;
        }
      }

      // Advisor Filter
      if (selectedAdvisorFilter !== 'ALL') {
        if (l.advisorId !== selectedAdvisorFilter && l.advisorName !== selectedAdvisorFilter) {
          return false;
        }
      }

      // Frequency Filter
      if (frequencyFilter !== 'ALL' && l.frequency !== frequencyFilter) {
        return false;
      }

      // Date Range Filter
      if (dateStartFilter && l.createdDate < dateStartFilter) return false;
      if (dateEndFilter && l.createdDate > dateEndFilter) return false;

      // Text Search
      if (loanSearch) {
        const query = loanSearch.toLowerCase();
        const matchesCode = l.code.toLowerCase().includes(query);
        const matchesClient = clientName.toLowerCase().includes(query) || clientCedula.includes(query);
        if (!matchesCode && !matchesClient) return false;
      }

      return true;
    });
  }, [
    loans,
    clients,
    loanStatusFilter,
    selectedAdvisorFilter,
    frequencyFilter,
    dateStartFilter,
    dateEndFilter,
    loanSearch,
  ]);

  // Route Stops (Integrando préstamos activos y paradas asignadas del inquilino seleccionado)
  const routeStops: RouteStop[] = useMemo(() => {
    const loanStops: RouteStop[] = loans
      .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
      .map((loan, idx) => {
        const client = clients.find((c) => c.id === loan.clientId) || {
          name: 'Cliente',
          address: 'Santo Domingo',
          phone: '',
          gpsLat: 18.4861,
          gpsLng: -69.9312,
        };
        const hasPaidToday = payments.some((p) => p.loanId === loan.id && p.date === routeDate);

        let stopStatus: RouteStop['status'] = 'PENDIENTE';
        if (hasPaidToday) stopStatus = 'PAGADO';
        else if (loan.status === 'OVERDUE') stopStatus = 'AUSENTE';

        return {
          id: `STOP-${loan.id}`,
          loanId: loan.id,
          clientId: loan.clientId,
          clientName: client.name,
          address: client.address,
          phone: client.phone,
          gpsLat: client.gpsLat || 18.4861 + idx * 0.005,
          gpsLng: client.gpsLng || -69.9312 + idx * 0.004,
          quota: loan.quota,
          balance: loan.balance,
          frequency: loan.frequency,
          status: stopStatus,
        };
      });

    const tenantStops: RouteStop[] = (allTenantRoutes[activeTenant.id] || []).map((tr) => {
      let st: RouteStop['status'] = 'PENDIENTE';
      if (tr.status === 'Pagado') st = 'PAGADO';
      else if (tr.status === 'En Ruta') st = 'PENDIENTE';

      return {
        id: `TENANT-STOP-${tr.id}`,
        loanId: `L-TENANT-${tr.id}`,
        clientId: `C-TENANT-${tr.id}`,
        clientName: tr.client,
        address: tr.address,
        phone: tr.phone,
        gpsLat: tr.lat,
        gpsLng: tr.lng,
        quota: tr.amount,
        balance: tr.amount * 3,
        frequency: 'SEMANAL',
        status: st,
        notes: `Inquilino: ${activeTenant.name}`,
      };
    });

    return [...tenantStops, ...loanStops];
  }, [loans, clients, payments, routeDate, allTenantRoutes, activeTenant]);

  // Active Company Tenant Info for current logged-in user
  const activeCompanyTenant = useMemo(() => {
    if (currentSession?.category === 2 && currentSession.companyId) {
      return companies.find((c) => c.id === currentSession.companyId);
    }
    return null;
  }, [currentSession, companies]);

  // Trial countdown helper
  const getDemoDaysLeft = (endDate?: string) => {
    if (!endDate) return 0;
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  // Operations
  const handleOpenPayment = (loanId: string) => {
    const l = loans.find((item) => item.id === loanId);
    if (!l) return;
    setSelectedLoanForPayment(l);
    setIsPaymentModalOpen(true);
  };

  const handleApproveLoan = (loanId: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'ACTIVE',
              contractSigned: true,
              notes: `${l.notes || ''} [Aprobado por Asesor en tiempo real]`,
            }
          : l
      )
    );
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleRejectLoan = (loanId: string) => {
    const reason = prompt('Ingrese el motivo del rechazo del préstamo:');
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'RECHAZADO',
              notes: `${l.notes || ''} [Rechazado: ${reason || 'Políticas de crédito'}]`,
            }
          : l
      )
    );
  };

  const handleOpenAmortization = (loan?: Loan) => {
    setSelectedLoanForAmortization(loan || null);
    setIsAmortizationModalOpen(true);
  };

  const handleExportLoansExcel = () => {
    const filename = `Reporte_Cartera_Prestamos_${new Date().toISOString().split('T')[0]}`;
    const headers = [
      'Código Préstamo',
      'Cliente',
      'Cédula RD',
      'Asesor Responsable',
      'Fecha Desembolso',
      'Frecuencia',
      'Método Amortización',
      'Monto Principal (DOP)',
      'Tasa Mensual (%)',
      'Cuota Periódica (DOP)',
      'Saldo Pendiente (DOP)',
      'Total Pagado (DOP)',
      'Estado',
      'Días de Atraso',
    ];

    const rows = filteredLoans.map((l) => {
      const c = clients.find((cli) => cli.id === l.clientId);
      return [
        l.code,
        c?.name || 'Cliente',
        c?.cedula || '001-0000000-0',
        l.advisorName,
        l.createdDate,
        l.frequency,
        l.type === 'FIXED' ? 'Francés (Cuota Fija)' : l.type === 'GERMAN' ? 'Alemán' : 'Solo Interés (San)',
        l.amount,
        `${l.rate}%`,
        l.quota,
        l.balance,
        l.totalPaid,
        l.status,
        l.daysOverdue || 0,
      ];
    });

    exportToCSV(filename, headers, rows);
  };

  const handleExportLoansPDF = () => {
    window.print();
  };

  const handleProcessPayment = (data: {
    loanId: string;
    amount: number;
    capitalPaid: number;
    interestPaid: number;
    lateFeePaid: number;
    paymentType: PaymentType;
    method: PaymentMethod;
    proofPhoto?: string;
    notes?: string;
  }) => {
    const targetLoan = loans.find((l) => l.id === data.loanId);
    if (!targetLoan) return;

    const targetClient = clients.find((c) => c.id === targetLoan.clientId);
    const newBalance = Math.max(0, targetLoan.balance - data.amount);
    const newCapitalBalance = Math.max(0, (targetLoan.capitalBalance || 0) - data.capitalPaid);
    const newStatus =
      newBalance === 0 ? 'PAID' : targetLoan.status === 'OVERDUE' ? 'ACTIVE' : targetLoan.status;

    const updatedLoans = loans.map((l) => {
      if (l.id === data.loanId) {
        return {
          ...l,
          balance: newBalance,
          capitalBalance: newCapitalBalance,
          totalPaid: l.totalPaid + data.amount,
          status: newStatus,
          daysOverdue: newStatus === 'PAID' ? 0 : l.daysOverdue,
        };
      }
      return l;
    });

    const newReceiptNumber = `REC-${new Date().getFullYear()}-${String(
      payments.length + 101
    ).padStart(4, '0')}`;
    const newPayment: PaymentTransaction = {
      id: `PAY-${Date.now()}`,
      receiptNumber: newReceiptNumber,
      loanId: targetLoan.id,
      loanCode: targetLoan.code,
      clientId: targetLoan.clientId,
      clientName: targetClient?.name || 'Cliente',
      amount: data.amount,
      capitalPaid: data.capitalPaid,
      interestPaid: data.interestPaid,
      lateFeePaid: data.lateFeePaid,
      paymentType: data.paymentType,
      method: data.method,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      proofPhoto: data.proofPhoto,
      collectorName: role === 'OPERATIVO' ? 'Cobrador de Calle' : settings.technicalSupportName,
      balanceAfter: newBalance,
      notes: data.notes,
    };

    // Registrar asiento contable en el Libro Diario
    const paymentJournalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'PAGO',
      entityId: targetLoan.id,
      entityName: `${targetClient?.name || 'Cliente'} (${targetLoan.code})`,
      actionType: newBalance === 0 ? 'PAGO_TOTAL' : 'ABONO',
      justification: data.notes || `Cobro de cuota recibo ${newReceiptNumber} procesado en caja/calle`,
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: currentSession.categoryLabel,
      changesSummary: `Abono capital DOP ${data.capitalPaid}, interés DOP ${data.interestPaid}. Saldo restante: DOP ${newBalance}`,
      debitAmount: data.amount,
      creditAmount: data.amount,
    };

    // Generar automáticamente la notificación de pago realizado para el cliente
    const paymentNotifMessage = `✅ *COMPROBANTE DE PAGO APLICADO*\n\nEstimado/a *${
      targetClient?.name || 'Cliente'
    }*, confirmamos su pago de *DOP ${formatDOP(data.amount)}* aplicado al préstamo *${
      targetLoan.code
    }*.\n\n📄 *Recibo No.:* ${newReceiptNumber}\n💰 *Capital abonado:* DOP ${formatDOP(
      data.capitalPaid
    )}\n📈 *Interés abonado:* DOP ${formatDOP(data.interestPaid)}\n💼 *Balance restante:* DOP ${formatDOP(
      newBalance
    )}\n\n¡Gracias por su puntualidad con ${settings.companyName}! 🇩🇴`;

    const paymentNotification: NotificationLog = {
      id: `NOTIF-PAY-${Date.now()}`,
      clientId: targetLoan.clientId,
      clientName: targetClient?.name || 'Cliente',
      phone: targetClient?.whatsapp || targetClient?.phone || '809-000-0000',
      channel: 'WHATSAPP',
      type: 'PAGO_REALIZADO',
      message: paymentNotifMessage,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      status: 'ENVIADO',
      loanCode: targetLoan.code,
      receiptNumber: newReceiptNumber,
      amount: data.amount,
      sentBy: role === 'OPERATIVO' ? 'Cobrador de Calle' : settings.technicalSupportName,
    };

    setLoans(updatedLoans);
    setPayments([newPayment, ...payments]);
    setJournalEntries((prev) => [paymentJournalEntry, ...prev]);
    setNotificationLogs((prev) => [paymentNotification, ...prev]);
    setIsPaymentModalOpen(false);

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    setCurrentReceiptPayment(newPayment);
    setIsReceiptModalOpen(true);
  };

  // Handlers para Edición & Borrado de Clientes con Libro Diario Obligatorio
  const handleSaveClientEdit = (updatedClient: Client, journalEntry: JournalEntry) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    setJournalEntries((prev) => [journalEntry, ...prev]);
    setIsClientEditModalOpen(false);
    confetti({ particleCount: 40 });
    alert(`¡Datos del cliente "${updatedClient.name}" actualizados y registrados en el Libro Diario!`);
  };

  const handleDeleteClient = (clientId: string, journalEntry: JournalEntry) => {
    if (currentSession.category !== 1) {
      alert('Solo el Administrador (Lic. Pedro Baldera) tiene autorización para borrar clientes.');
      return;
    }

    setClients((prev) => prev.filter((c) => c.id !== clientId));
    setJournalEntries((prev) => [journalEntry, ...prev]);
    setIsClientEditModalOpen(false);
    setIsClientMovementModalOpen(false);
    alert('¡Cliente eliminado del sistema y baja asentada en el Libro Diario!');
  };

  const handleQuickClientAdjustment = (loanId: string, signedAmount: number, justification: string) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;

    const targetClient = clients.find((c) => c.id === targetLoan.clientId);
    const newBalance = Math.max(0, targetLoan.balance + signedAmount);
    const newCapitalBalance = Math.max(0, (targetLoan.capitalBalance || 0) + signedAmount);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              balance: newBalance,
              capitalBalance: newCapitalBalance,
              status: newBalance === 0 ? 'PAID' : l.status,
            }
          : l
      )
    );

    const adjustmentJournalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'PRESTAMO',
      entityId: targetLoan.id,
      entityName: `${targetClient?.name || 'Cliente'} (${targetLoan.code})`,
      actionType: 'AJUSTE_SALDO',
      justification: justification,
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: currentSession.categoryLabel,
      changesSummary: `Ajuste inmediato de balance de DOP ${targetLoan.balance} a DOP ${newBalance} (Diferencia: DOP ${signedAmount})`,
      debitAmount: signedAmount > 0 ? signedAmount : 0,
      creditAmount: signedAmount < 0 ? Math.abs(signedAmount) : 0,
    };

    setJournalEntries((prev) => [adjustmentJournalEntry, ...prev]);
  };

  const handleUpdatePayable = (updatedPayable: AccountPayable, journalEntry: JournalEntry) => {
    setPayables((prev) => prev.map((p) => (p.id === updatedPayable.id ? updatedPayable : p)));
    setJournalEntries((prev) => [journalEntry, ...prev]);
    alert(`¡Cuenta por pagar "${updatedPayable.creditor}" actualizada con asiento en el Libro Diario!`);
  };

  const handlePayablePayment = (payableId: string, amount: number, justification: string) => {
    const target = payables.find((p) => p.id === payableId);
    if (!target) return;

    const newBalance = Math.max(0, target.balance - amount);
    const isPaid = newBalance === 0;

    setPayables((prev) =>
      prev.map((p) =>
        p.id === payableId
          ? {
              ...p,
              balance: newBalance,
              status: isPaid ? 'PAGADO' : 'PENDIENTE',
              lastPaymentDate: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );

    const journalEntry: JournalEntry = {
      id: `ASIENTO-${Date.now()}`,
      entryNumber: `ASIENTO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'CUENTA_POR_PAGAR',
      entityId: target.id,
      entityName: target.creditor,
      actionType: isPaid ? 'PAGO_TOTAL' : 'ABONO',
      justification,
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: currentSession.categoryLabel,
      changesSummary: `Pago de pasivo por DOP ${amount}. Saldo anterior DOP ${target.balance} ➔ Nuevo saldo DOP ${newBalance}`,
      debitAmount: amount,
      creditAmount: amount,
    };

    setJournalEntries((prev) => [journalEntry, ...prev]);
    confetti({ particleCount: 40 });
    alert(`¡Pago a "${target.creditor}" aplicado con éxito y registrado en el Libro Diario!`);
  };

  const handleCompleteInitialBalanceOnboarding = (data: {
    client: Client;
    loan: Loan;
    initialPayments: PaymentTransaction[];
    journalEntry: JournalEntry;
  }) => {
    setClients((prev) => [data.client, ...prev]);
    setLoans((prev) => [data.loan, ...prev]);
    if (data.initialPayments.length > 0) {
      setPayments((prev) => [...data.initialPayments, ...prev]);
    }
    setJournalEntries((prev) => [data.journalEntry, ...prev]);
    alert(
      `¡Cliente "${data.client.name}" registrado con balance inicial de ${formatDOP(
        data.loan.balance
      )} y listo para operar en sistema!`
    );
  };

  const handleLockAccount = (
    accountType: 'USER' | 'COMPANY' | 'CLIENT',
    id: string,
    identifier: string
  ) => {
    if (accountType === 'USER') {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, isLocked: true, failedAttempts: 3, status: 'BLOQUEADO' } : u
        )
      );
    } else if (accountType === 'COMPANY') {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isLocked: true, failedAttempts: 3 } : c))
      );
    } else if (accountType === 'CLIENT') {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isLocked: true, failedAttempts: 3 } : c))
      );
    }

    const newRecord: SecretPasswordVaultRecord = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      userId: id,
      userName: `Cuenta Bloqueada (${identifier})`,
      userRole: accountType === 'USER' ? 'COBRADOR' : accountType === 'COMPANY' ? 'GERENTE' : 'CLIENTE',
      identifier,
      secretPassword: '[BLOQUEADA - 3 INTENTOS FALLIDOS]',
      action: 'REASIGNACION_DESBLOQUEO',
      changedAt: new Date().toLocaleString('es-DO'),
      changedBy: 'Sistema Anti-Intrusión (3 Intentos Erróneos)',
      failedAttemptsBeforeReset: 3,
      notes: 'Bloqueo automático de seguridad tras 3 intentos fallidos consecutivos.',
    };
    setSecretVaultRecords((prev) => [newRecord, ...prev]);
  };

  const handleIncrementFailedAttempt = (
    accountType: 'USER' | 'COMPANY' | 'CLIENT',
    id: string
  ) => {
    if (accountType === 'USER') {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, failedAttempts: (u.failedAttempts || 0) + 1 } : u))
      );
    } else if (accountType === 'COMPANY') {
      setCompanies((prev) =>
        prev.map((c) => (c.id === id ? { ...c, failedAttempts: (c.failedAttempts || 0) + 1 } : c))
      );
    } else if (accountType === 'CLIENT') {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, failedAttempts: (c.failedAttempts || 0) + 1 } : c))
      );
    }
  };

  const handleUpdateUser = (updatedUser: SystemUser, reason: string) => {
    setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
    if (updatedUser.password) {
      const newSecret: SecretPasswordVaultRecord = {
        id: `SEC-${Date.now().toString().slice(-4)}`,
        userId: updatedUser.id,
        userName: updatedUser.name,
        userRole: (updatedUser.role as any) || 'COBRADOR',
        identifier: updatedUser.cedula || updatedUser.id,
        secretPassword: updatedUser.password,
        action: updatedUser.isLocked ? 'CAMBIO_CLAVE' : 'REASIGNACION_DESBLOQUEO',
        changedAt: new Date().toLocaleString('es-DO'),
        changedBy: currentSession.name,
        notes: reason,
      };
      setSecretVaultRecords((prev) => [newSecret, ...prev]);
    }
  };

  const handleUpdateUserPassword = (params: {
    userId: string;
    newPassword: string;
    reason: string;
  }) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === params.userId
          ? { ...u, password: params.newPassword, isLocked: false, failedAttempts: 0, status: 'ACTIVO' }
          : u
      )
    );
    const target = users.find((u) => u.id === params.userId);
    const newRecord: SecretPasswordVaultRecord = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      userId: params.userId,
      userName: target?.name || 'Usuario',
      userRole: (target?.role as any) || 'COBRADOR',
      identifier: target?.cedula || params.userId,
      secretPassword: params.newPassword,
      action: 'REASIGNACION_DESBLOQUEO',
      changedAt: new Date().toLocaleString('es-DO'),
      changedBy: currentSession.name,
      notes: params.reason,
    };
    setSecretVaultRecords((prev) => [newRecord, ...prev]);
  };

  const handleUpdateCompanyPassword = (params: {
    companyId: string;
    newPassword: string;
    reason: string;
  }) => {
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === params.companyId
          ? { ...c, password: params.newPassword, isLocked: false, failedAttempts: 0 }
          : c
      )
    );
    const target = companies.find((c) => c.id === params.companyId);
    const newRecord: SecretPasswordVaultRecord = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      userId: params.companyId,
      userName: target?.name || 'Empresa',
      userRole: 'GERENTE',
      identifier: target?.rncOrCedula || '',
      secretPassword: params.newPassword,
      action: 'REASIGNACION_DESBLOQUEO',
      changedAt: new Date().toLocaleString('es-DO'),
      changedBy: currentSession.name,
      notes: params.reason,
    };
    setSecretVaultRecords((prev) => [newRecord, ...prev]);
  };

  const handleUpdateClientPassword = (params: {
    clientId: string;
    newPassword: string;
    reason: string;
  }) => {
    setClients((prev) =>
      prev.map((cli) =>
        cli.id === params.clientId
          ? { ...cli, password: params.newPassword, isLocked: false, failedAttempts: 0 }
          : cli
      )
    );
    const target = clients.find((c) => c.id === params.clientId);
    const newRecord: SecretPasswordVaultRecord = {
      id: `SEC-${Date.now().toString().slice(-4)}`,
      userId: params.clientId,
      userName: target?.name || 'Cliente',
      userRole: 'CLIENTE',
      identifier: target?.cedula || '',
      secretPassword: params.newPassword,
      action: 'REASIGNACION_DESBLOQUEO',
      changedAt: new Date().toLocaleString('es-DO'),
      changedBy: currentSession.name,
      notes: params.reason,
    };
    setSecretVaultRecords((prev) => [newRecord, ...prev]);
  };

  const handleUnlockAccount = (params: {
    accountType: 'USER' | 'COMPANY' | 'CLIENT';
    id: string;
    newPassword?: string;
    justification: string;
  }) => {
    if (params.accountType === 'USER') {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === params.id
            ? {
                ...u,
                isLocked: false,
                failedAttempts: 0,
                status: 'ACTIVO',
                password: params.newPassword || u.password,
              }
            : u
        )
      );
    } else if (params.accountType === 'COMPANY') {
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === params.id
            ? {
                ...c,
                isLocked: false,
                failedAttempts: 0,
                password: params.newPassword || c.password,
              }
            : c
        )
      );
    } else if (params.accountType === 'CLIENT') {
      setClients((prev) =>
        prev.map((c) =>
          c.id === params.id
            ? {
                ...c,
                isLocked: false,
                failedAttempts: 0,
                password: params.newPassword || c.password,
              }
            : c
        )
      );
    }
  };

  const handleCreateExpense = () => {
    const desc = prompt('Descripción del gasto operacional (Combustible, notaría, mensajería, etc.):');
    if (!desc) return;
    const amountStr = prompt('Monto del gasto (DOP):', '1500');
    if (!amountStr) return;
    const amount = Number(amountStr) || 0;
    const category = (prompt(
      'Categoría: Combustible, Nómina, Alquiler, Servicios, Notaría / Legal, Mantenimiento, Otros',
      'Otros'
    ) || 'Otros') as any;

    const newExpense: ExpenseRecord = {
      id: `EXP-${Date.now()}`,
      category,
      amount,
      description: desc,
      date: new Date().toISOString().split('T')[0],
      registeredBy: currentSession.name,
    };
    setExpenses([newExpense, ...expenses]);
    alert(`¡Gasto de ${formatDOP(amount)} registrado exitosamente en el sistema!`);
  };

  const handleSettlePayable = (payableId: string) => {
    const target = payables.find((p) => p.id === payableId);
    if (!target) return;
    if (window.confirm(`¿Confirmar pago y liquidación de cuenta por pagar a "${target.creditor}" por ${formatDOP(target.balance)}?`)) {
      setPayables((prev) =>
        prev.map((p) => (p.id === payableId ? { ...p, status: 'PAGADO', balance: 0 } : p))
      );
      alert('¡Pasivo pagado y saldo liquidado en el balance!');
    }
  };

  const handleCreateOnlineApplication = (
    clientData: Partial<Client>,
    loanData: Partial<Loan>
  ) => {
    let clientId = '';
    const existingClient = clients.find(
      (c) => c.cedula.replace(/\D/g, '') === clientData.cedula?.replace(/\D/g, '')
    );

    if (existingClient) {
      clientId = existingClient.id;
    } else {
      clientId = `CLI-${String(clients.length + 1).padStart(3, '0')}`;
      const newClient: Client = {
        id: clientId,
        name: clientData.name || 'Cliente Nuevo',
        cedula: clientData.cedula || '001-0000000-0',
        phone: clientData.phone || '',
        whatsapp: clientData.whatsapp || '',
        occupation: clientData.occupation || 'Independiente',
        monthlyIncome: clientData.monthlyIncome || 30000,
        address: clientData.address || 'Santo Domingo, RD',
        bankName: clientData.bankName || 'Banco de Reservas (Banreservas)',
        bankAccountType: clientData.bankAccountType || 'AHORROS',
        bankAccountNumber: clientData.bankAccountNumber || '',
        bankAccountHolder: clientData.bankAccountHolder || clientData.name,
        guarantor: clientData.guarantor,
        guarantorPhone: clientData.guarantorPhone,
        collateralType: clientData.collateralType || 'VEHICULO',
        collateralDesc: clientData.collateralDesc || 'Garantía prendaria',
        collateralPhotos: clientData.collateralPhotos || [],
        idPhotoFront: clientData.idPhotoFront,
        idPhotoBack: clientData.idPhotoBack,
        reputation: 'Originado por Solicitud Digital Online',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setClients([newClient, ...clients]);
    }

    const newLoanCode = `PR-${new Date().getFullYear()}-${String(loans.length + 1).padStart(
      2,
      '0'
    )}`;
    const scheduleRes = generateAmortizationSchedule(
      loanData.amount || 20000,
      loanData.rate || 10,
      loanData.terms || 20,
      loanData.frequency || 'DIARIO',
      loanData.type || 'FIXED'
    );

    const newLoan: Loan = {
      id: `LN-${Date.now()}`,
      code: newLoanCode,
      clientId: clientId,
      amount: loanData.amount || 20000,
      closingFee: loanData.closingFee || 500,
      netDisbursed: (loanData.amount || 20000) - (loanData.closingFee || 500),
      rate: loanData.rate || 10,
      frequency: loanData.frequency || 'DIARIO',
      type: loanData.type || 'FIXED',
      terms: loanData.terms || 20,
      quota: scheduleRes.quota,
      totalWithInterest: scheduleRes.totalWithInterest,
      balance: scheduleRes.totalWithInterest,
      capitalBalance: loanData.amount || 20000,
      interestBalance: scheduleRes.totalWithInterest - (loanData.amount || 20000),
      totalPaid: 0,
      status: loanData.status || 'ACTIVE',
      advisorId: 'USR-01',
      advisorName: settings.technicalSupportName,
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contractSigned: false,
      disbursementBank: loanData.disbursementBank || clientData.bankName || 'Banco de Reservas',
      disbursementAccount: loanData.disbursementAccount || clientData.bankAccountNumber,
      disbursementAccountType: loanData.disbursementAccountType || clientData.bankAccountType,
      disbursementConfirmed: true,
      schedule: scheduleRes.schedule,
      daysOverdue: 0,
      notes: 'Solicitud aprobada y registrada en plataforma.',
    };

    setLoans([newLoan, ...loans]);
    confetti({ particleCount: 70, spread: 80 });

    setSelectedLoanForContract(newLoan);
    setIsContractModalOpen(true);
  };

  // Handlers for Voucher Verification & Bank Approval
  const handleSubmitNewVoucher = (newVoucher: PaymentVoucherVerification) => {
    setVouchers([newVoucher, ...vouchers]);
  };

  const handleApproveVoucher = (
    voucher: PaymentVoucherVerification,
    deductions: {
      capitalPaid: number;
      interestPaid: number;
      lateFeePaid: number;
      extraChargesPaid: number;
      adminFeePaid: number;
      totalAmount: number;
    }
  ) => {
    const targetLoan = loans.find((l) => l.id === voucher.loanId);
    if (!targetLoan) return;

    const targetClient = clients.find((c) => c.id === targetLoan.clientId);
    const newBalance = Math.max(0, targetLoan.balance - voucher.amountPaid);
    const newCapitalBalance = Math.max(0, (targetLoan.capitalBalance || 0) - deductions.capitalPaid);
    const newInterestBalance = Math.max(0, (targetLoan.interestBalance || 0) - deductions.interestPaid);
    const newStatus =
      newBalance === 0 ? 'PAID' : targetLoan.status === 'OVERDUE' ? 'ACTIVE' : targetLoan.status;

    // Update schedule installments marked as paid
    let remainingToMark = voucher.amountPaid;
    const updatedSchedule = targetLoan.schedule.map((row) => {
      if (row.status !== 'PAGADO' && remainingToMark >= row.quota) {
        remainingToMark -= row.quota;
        return { ...row, status: 'PAGADO' as const };
      }
      return row;
    });

    const updatedLoans = loans.map((l) => {
      if (l.id === targetLoan.id) {
        return {
          ...l,
          balance: newBalance,
          capitalBalance: newCapitalBalance,
          interestBalance: newInterestBalance,
          totalPaid: l.totalPaid + voucher.amountPaid,
          status: newStatus,
          daysOverdue: newStatus === 'PAID' ? 0 : l.daysOverdue,
          schedule: updatedSchedule,
        };
      }
      return l;
    });

    // If extra charges were paid, mark them as settled
    if (deductions.extraChargesPaid > 0) {
      let chargeBudget = deductions.extraChargesPaid;
      setExtraCharges((prev) =>
        prev.map((chg) => {
          if (chg.loanId === targetLoan.id && chg.status === 'PENDIENTE' && chargeBudget >= chg.amount) {
            chargeBudget -= chg.amount;
            return {
              ...chg,
              status: 'PAGADO' as const,
              settledDate: new Date().toISOString().split('T')[0],
              settledBy: currentSession.name,
            };
          }
          return chg;
        })
      );
    }

    // Mark voucher as approved
    const updatedVouchers = vouchers.map((v) =>
      v.id === voucher.id
        ? {
            ...v,
            status: 'APROBADO' as const,
            reviewedBy: currentSession.name,
            reviewedDate: new Date().toISOString().split('T')[0],
          }
        : v
    );

    const newReceiptNumber = `REC-DEP-${new Date().getFullYear()}-${String(
      payments.length + 101
    ).padStart(4, '0')}`;

    const newPayment: PaymentTransaction = {
      id: `PAY-DEP-${Date.now()}`,
      receiptNumber: newReceiptNumber,
      loanId: targetLoan.id,
      loanCode: targetLoan.code,
      clientId: targetLoan.clientId,
      clientName: targetClient?.name || 'Cliente',
      amount: voucher.amountPaid,
      capitalPaid: deductions.capitalPaid,
      interestPaid: deductions.interestPaid,
      lateFeePaid: deductions.lateFeePaid,
      extraChargesPaid: deductions.extraChargesPaid,
      paymentType: 'REGULAR',
      method: 'TRANSFERENCIA',
      bankReference: voucher.referenceNumber,
      voucherVerificationId: voucher.id,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      proofPhoto: voucher.proofPhotoUrl,
      collectorName: currentSession.name,
      balanceAfter: newBalance,
      notes: `Depósito verificado en banco: ${voucher.bankName} (Ref: ${voucher.referenceNumber}). Deducción: Cap ${formatDOP(deductions.capitalPaid)}, Int ${formatDOP(deductions.interestPaid)}, Mora ${formatDOP(deductions.lateFeePaid)}`,
    };

    setLoans(updatedLoans);
    setVouchers(updatedVouchers);
    setPayments([newPayment, ...payments]);
    setIsVoucherModalOpen(false);

    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    setCurrentReceiptPayment(newPayment);
    setIsReceiptModalOpen(true);
  };

  const handleRejectVoucher = (voucherId: string, reason: string) => {
    setVouchers((prev) =>
      prev.map((v) =>
        v.id === voucherId
          ? {
              ...v,
              status: 'RECHAZADO' as const,
              reviewedBy: currentSession.name,
              reviewedDate: new Date().toISOString().split('T')[0],
              rejectionReason: reason,
            }
          : v
      )
    );
  };

  // Handlers for Extra Charges (GPS, Notaría, Visitas & Exoneración)
  const handleAddExtraCharge = (newCharge: ExtraCharge) => {
    setExtraCharges([newCharge, ...extraCharges]);

    // If capitalized, add directly to loan balance and capital balance
    if (newCharge.isCapitalized) {
      setLoans((prev) =>
        prev.map((l) => {
          if (l.id === newCharge.loanId) {
            return {
              ...l,
              balance: l.balance + newCharge.amount,
              capitalBalance: (l.capitalBalance || 0) + newCharge.amount,
              extraChargesTotal: (l.extraChargesTotal || 0) + newCharge.amount,
            };
          }
          return l;
        })
      );
    }
  };

  const handleSettleExtraCharge = (chargeId: string) => {
    setExtraCharges((prev) =>
      prev.map((c) =>
        c.id === chargeId
          ? {
              ...c,
              status: 'PAGADO' as const,
              settledDate: new Date().toISOString().split('T')[0],
              settledBy: currentSession.name,
            }
          : c
      )
    );
  };

  const handleExonerateExtraCharge = (chargeId: string, reason: string) => {
    const charge = extraCharges.find((c) => c.id === chargeId);
    if (!charge) return;

    // If capitalized, deduct amount back from loan balance
    if (charge.isCapitalized) {
      setLoans((prev) =>
        prev.map((l) => {
          if (l.id === charge.loanId) {
            return {
              ...l,
              balance: Math.max(0, l.balance - charge.amount),
              capitalBalance: Math.max(0, (l.capitalBalance || 0) - charge.amount),
              extraChargesTotal: Math.max(0, (l.extraChargesTotal || 0) - charge.amount),
            };
          }
          return l;
        })
      );
    }

    setExtraCharges((prev) =>
      prev.map((c) =>
        c.id === chargeId
          ? {
              ...c,
              status: 'EXONERADO' as const,
              exemptedDate: new Date().toISOString().split('T')[0],
              exemptedBy: currentSession.name,
              exemptReason: reason,
            }
          : c
      )
    );
  };

  const handleRefinanceConfirm = (oldLoanId: string, newLoanData: Partial<Loan>) => {
    const oldLoan = loans.find((l) => l.id === oldLoanId);
    if (!oldLoan) return;

    const updatedLoans = loans.map((l) => {
      if (l.id === oldLoanId) {
        return {
          ...l,
          balance: 0,
          status: 'PAID' as const,
          notes: `${l.notes || ''} [Saldado por Reenganche]`,
        };
      }
      return l;
    });

    const newLoanCode = `RG-${new Date().getFullYear()}-${String(loans.length + 1).padStart(
      2,
      '0'
    )}`;
    const scheduleRes = generateAmortizationSchedule(
      newLoanData.amount || 30000,
      newLoanData.rate || 10,
      newLoanData.terms || 20,
      newLoanData.frequency || 'DIARIO',
      'FIXED'
    );

    const newlyRefinancedLoan: Loan = {
      id: `LN-${Date.now()}`,
      code: newLoanCode,
      clientId: oldLoan.clientId,
      amount: newLoanData.amount || 30000,
      closingFee: newLoanData.closingFee || 500,
      netDisbursed: newLoanData.netDisbursed || 15000,
      rate: newLoanData.rate || 10,
      frequency: newLoanData.frequency || 'DIARIO',
      type: 'FIXED',
      terms: newLoanData.terms || 20,
      quota: scheduleRes.quota,
      totalWithInterest: scheduleRes.totalWithInterest,
      balance: scheduleRes.totalWithInterest,
      capitalBalance: newLoanData.amount || 30000,
      interestBalance: scheduleRes.totalWithInterest - (newLoanData.amount || 30000),
      totalPaid: 0,
      status: 'ACTIVE',
      advisorId: 'USR-01',
      advisorName: settings.technicalSupportName,
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contractSigned: false,
      schedule: scheduleRes.schedule,
      daysOverdue: 0,
      notes: newLoanData.notes,
    };

    setLoans([newlyRefinancedLoan, ...updatedLoans]);
    confetti({ particleCount: 60, spread: 70 });
    setSelectedLoanForContract(newlyRefinancedLoan);
    setIsContractModalOpen(true);
  };

  const handleSaveSignature = (loanId: string, signatureData: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              contractSigned: true,
              contractSignatureData: signatureData,
              contractSignedDate: new Date().toISOString().split('T')[0],
            }
          : l
      )
    );
  };

  const handleRegisterNewCompany = (newCompanyData: Partial<CompanyTenant>) => {
    const newCompany: CompanyTenant = {
      id: `COMP-${String(companies.length + 1).padStart(3, '0')}`,
      name: newCompanyData.name || 'Nueva Financiera',
      rncOrCedula: newCompanyData.rncOrCedula || '001-0000000-0',
      ownerName: newCompanyData.ownerName || 'Propietario',
      email: newCompanyData.email || '',
      phone: newCompanyData.phone || '',
      password: newCompanyData.password || '123456',
      passwordHistory: [
        {
          id: `PWD-${Date.now()}`,
          passwordHash: newCompanyData.password || '123456',
          changedAt: new Date().toLocaleString('es-DO'),
          changedBy: 'Registro Web',
          reason: 'Creación de cuenta con solicitud de 7 días demo',
        },
      ],
      status: 'PENDIENTE_APROBACION',
      trialStartDate: '',
      trialEndDate: '',
      membershipPlan: 'DEMO_7_DIAS',
      membershipExpirationDate: '',
      membershipPrice: 0,
      approvedBy: '',
      approvedAt: '',
      notes: 'Solicitud en espera de aprobación por Lic. Pedro Baldera',
    };

    setCompanies([newCompany, ...companies]);
  };

  const handleRestoreBackup = (restored: any) => {
    if (restored.companies) setCompanies(restored.companies);
    if (restored.clients) setClients(restored.clients);
    if (restored.loans) setLoans(restored.loans);
    if (restored.payments) setPayments(restored.payments);
    if (restored.expenses) setExpenses(restored.expenses);
    if (restored.payables) setPayables(restored.payables);
    if (restored.payroll) setPayroll(restored.payroll);
    if (restored.users) setUsers(restored.users);
    if (restored.settings) setSettings(restored.settings);
    confetti({ particleCount: 70 });
  };

  // Helper functions for Aging Buckets & Portfolio Calculations
  const getClientOverdueInfo = (clientId: string) => {
    const cLoans = loans.filter((l) => l.clientId === clientId && l.status !== 'PAID');
    const maxDays = cLoans.length > 0 ? Math.max(0, ...cLoans.map((l) => l.daysOverdue || 0)) : 0;
    const totalBal = cLoans.reduce((sum, l) => sum + l.balance, 0);

    let bucket: '0_30' | '31_60' | '61_90' | 'MAS_90' = '0_30';
    let label = '0 a 30 días: Vigente';
    let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

    if (maxDays > 90) {
      bucket = 'MAS_90';
      label = 'Más de 90 días (Castigada)';
      badgeClass = 'bg-rose-600/25 text-rose-300 border-rose-500/40';
    } else if (maxDays >= 61) {
      bucket = '61_90';
      label = '61 a 90 días (Cobro Judicial)';
      badgeClass = 'bg-orange-500/25 text-orange-300 border-orange-500/40';
    } else if (maxDays >= 31) {
      bucket = '31_60';
      label = '31 a 60 días (Vencido)';
      badgeClass = 'bg-amber-500/25 text-amber-300 border-amber-500/40';
    }

    return { maxDays, totalBal, bucket, label, badgeClass, activeLoansCount: cLoans.length };
  };

  const getPayableOverdueInfo = (payable: AccountPayable) => {
    const days = payable.daysOverdue || 0;
    let bucket: '0_30' | '31_60' | '61_90' | 'MAS_90' = '0_30';
    let label = '0 a 30 días: Vigente / Por Vencer';
    let badgeClass = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';

    if (days > 90) {
      bucket = 'MAS_90';
      label = 'Más de 90 días: Crítico';
      badgeClass = 'bg-rose-600/25 text-rose-300 border-rose-500/40';
    } else if (days >= 61) {
      bucket = '61_90';
      label = '61 a 90 días: En Mora';
      badgeClass = 'bg-orange-500/25 text-orange-300 border-orange-500/40';
    } else if (days >= 31) {
      bucket = '31_60';
      label = '31 a 60 días: Vencido';
      badgeClass = 'bg-amber-500/25 text-amber-300 border-amber-500/40';
    }

    return { days, bucket, label, badgeClass };
  };

  const handleExportAgingPortfolioCSV = () => {
    const exportData = clients.map((c) => {
      const info = getClientOverdueInfo(c.id);
      return {
        'ID Cliente': c.id,
        'Nombre Completo': c.name,
        'Cédula RD': c.cedula,
        'Teléfono': c.phone,
        'WhatsApp': c.whatsapp,
        'Ocupación': c.occupation,
        'Dirección': c.address,
        'Cartera Antigüedad': info.label,
        'Días de Atraso Máx': info.maxDays,
        'Balance Pendiente (DOP)': info.totalBal,
        'Préstamos Activos': info.activeLoansCount,
        'Banco Desembolso': c.bankName || 'N/A',
        'No. Cuenta': c.bankAccountNumber || 'N/A',
        'Tipo Cuenta': c.bankAccountType || 'N/A',
        'Garante (Cat 4)': c.guarantor || 'N/A',
        'Tel Fiador': c.guarantorPhone || 'N/A',
        'Co-deudor (Cat 5)': c.coDebtor || 'N/A',
        'Tel Co-deudor': c.coDebtorPhone || 'N/A',
      };
    });

    exportToCSV(exportData, `Cartera_Historica_Clientes_Antiguedad_RD_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPayablesAgingCSV = () => {
    const exportData = payables.map((p) => {
      const info = getPayableOverdueInfo(p);
      return {
        'ID Pasivo': p.id,
        'Acreedor / Inversionista': p.creditor,
        'Categoría': p.category || 'INVERSIONISTA',
        'Monto Original (DOP)': p.amount,
        'Balance Pendiente (DOP)': p.balance,
        'Fecha Vencimiento': p.dueDate,
        'Días de Antigüedad / Mora': info.days,
        'Rango Antigüedad': info.label,
        'Estado': p.status,
        'Notas': p.notes || '',
      };
    });

  // --- ROLE-BASED PORTALS HANDLERS ---
  const handleClientRequestLoan = (data: {
    amount: number;
    terms: number;
    frequency: 'MENSUAL' | 'QUINCENAL' | 'SEMANAL';
    purpose: string;
  }) => {
    const targetClient = currentSession.client || clients[0];
    const newLoan: Loan = {
      id: `LN-REQ-${Date.now()}`,
      code: `PR-${String(loans.length + 101).padStart(3, '0')}`,
      clientId: targetClient.id,
      amount: data.amount,
      balance: data.amount,
      rate: settings.defaultRate || 2.5,
      terms: data.terms,
      frequency: data.frequency,
      type: 'FIXED',
      quota: Math.round((data.amount * 0.025 * Math.pow(1.025, data.terms)) / (Math.pow(1.025, data.terms) - 1)),
      status: 'EN_TRAMITE',
      advisorName: 'Auto-Solicitud Web',
      createdDate: new Date().toISOString().split('T')[0],
      startDate: new Date().toISOString().split('T')[0],
      notes: `Solicitud en línea: ${data.purpose}`,
    };
    setLoans((prev) => [newLoan, ...prev]);
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleCollectorQuickPayment = (
    stop: RouteStop,
    amount: number,
    method: 'EFECTIVO' | 'TRANSFERENCIA'
  ) => {
    const targetLoan = loans.find((l) => l.id === stop.loanId) || loans[0];
    const targetClient = clients.find((c) => c.id === stop.clientId) || clients[0];
    const newBal = Math.max(0, targetLoan.balance - amount);
    const newReceiptNum = `REC-RUTA-${new Date().getFullYear()}-${String(payments.length + 101).padStart(4, '0')}`;

    const newPayment: PaymentTransaction = {
      id: `PAY-RUTA-${Date.now()}`,
      receiptNumber: newReceiptNum,
      loanId: targetLoan.id,
      loanCode: targetLoan.code,
      clientId: targetClient.id,
      clientName: targetClient.name,
      amount,
      capitalPaid: Math.round(amount * 0.8),
      interestPaid: Math.round(amount * 0.2),
      lateFeePaid: 0,
      paymentType: 'REGULAR',
      method,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      collectorName: currentSession.name,
      balanceAfter: newBal,
      notes: `Cobro en ruta por ${currentSession.name} (${method})`,
    };

    setLoans((prev) =>
      prev.map((l) =>
        l.id === targetLoan.id
          ? {
              ...l,
              balance: newBal,
              status: newBal === 0 ? 'PAID' : l.status,
            }
          : l
      )
    );

    setPayments((prev) => [newPayment, ...prev]);
    setCurrentReceiptPayment(newPayment);
    setIsReceiptModalOpen(true);
    confetti({ particleCount: 40, spread: 60 });
  };

  const handleCollectorUpdateStatus = (
    stopId: string,
    newStatus: RouteStop['status'],
    notes?: string,
    promiseDate?: string
  ) => {
    alert(`Estado de parada actualizado a "${newStatus}"${promiseDate ? ` (Promesa para ${promiseDate})` : ''}`);
  };

  const handleForwardToManager = (loanId: string, notes: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              notes: `${l.notes || ''} [Remitido al Gerente: ${notes}]`,
            }
          : l
      )
    );
    alert('¡Expediente remitido a la bandeja de decisión del Gerente!');
  };

  const handleOfficePayment = (
    loanId: string,
    amount: number,
    method: 'EFECTIVO' | 'TRANSFERENCIA'
  ) => {
    const targetLoan = loans.find((l) => l.id === loanId);
    if (!targetLoan) return;
    const targetClient = clients.find((c) => c.id === targetLoan.clientId) || clients[0];
    const newBal = Math.max(0, targetLoan.balance - amount);
    const newReceiptNum = `REC-OFI-${new Date().getFullYear()}-${String(payments.length + 101).padStart(4, '0')}`;

    const newPayment: PaymentTransaction = {
      id: `PAY-OFI-${Date.now()}`,
      receiptNumber: newReceiptNum,
      loanId: targetLoan.id,
      loanCode: targetLoan.code,
      clientId: targetClient.id,
      clientName: targetClient.name,
      amount,
      capitalPaid: Math.round(amount * 0.8),
      interestPaid: Math.round(amount * 0.2),
      lateFeePaid: 0,
      paymentType: 'REGULAR',
      method,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      collectorName: currentSession.name,
      balanceAfter: newBal,
      notes: `Cobro en ventanilla de oficina por ${currentSession.name}`,
    };

    setLoans((prev) =>
      prev.map((l) =>
        l.id === targetLoan.id
          ? {
              ...l,
              balance: newBal,
              status: newBal === 0 ? 'PAID' : l.status,
            }
          : l
      )
    );

    setPayments((prev) => [newPayment, ...prev]);
    setCurrentReceiptPayment(newPayment);
    setIsReceiptModalOpen(true);
    confetti({ particleCount: 50, spread: 60 });
  };

  const handleManagerDiscount = (loanId: string, discountAmount: number, justification: string) => {
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id === loanId) {
          const newBal = Math.max(0, l.balance - discountAmount);
          return {
            ...l,
            balance: newBal,
            notes: `${l.notes || ''} [Descuento Gerencial de DOP ${formatDOP(discountAmount)}: ${justification}]`,
          };
        }
        return l;
      })
    );

    const newEntry: JournalEntry = {
      id: `JRN-DISC-${Date.now()}`,
      entryNumber: `ASIENTO-DISC-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'PRESTAMO',
      entityId: loanId,
      entityName: 'Descuento Gerencial',
      actionType: 'AJUSTE_SALDO',
      justification,
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: 'Gerente Operativo',
      creditAmount: discountAmount,
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    alert(`¡Descuento de DOP ${formatDOP(discountAmount)} aplicado con éxito!`);
  };

  const handleManagerWaiveExtra = (chargeId: string, justification: string) => {
    handleExonerateExtraCharge(chargeId, justification);
    alert('¡Cargo exonerado formalmente con registro en el Libro Diario!');
  };

  const handleAdminDailyClose = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySum = payments.filter((p) => p.date === today).reduce((s, p) => s + p.amount, 0);
    const newEntry: JournalEntry = {
      id: `JRN-CLOSE-${Date.now()}`,
      entryNumber: `CIERRE-${today}`,
      date: today,
      time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      entityType: 'AJUSTE_GENERAL',
      entityId: `CLOSE-${today}`,
      entityName: `Cierre Diario de Operaciones (${today})`,
      actionType: 'AJUSTE_SALDO',
      justification: `Cierre diario ejecutado por ${currentSession.name}. Total recaudado hoy: DOP ${formatDOP(todaySum)}`,
      userIdentifier: currentSession.identifier,
      userName: currentSession.name,
      userRole: 'Administrador General',
      debitAmount: todaySum,
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    confetti({ particleCount: 60, spread: 70 });
  };

  const handleAdminDownloadBackup = () => {
    const backupData = {
      companies,
      clients,
      loans,
      payments,
      expenses,
      payables,
      payroll,
      users,
      settings,
      journalEntries,
      secretVaultRecords,
      allPipelineLoans,
      allTenantRoutes,
      allTenantExpenses,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_PrestDominicana_PRO_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAdminRestoreBackup = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      handleRestoreBackup(parsed);
      alert('¡Respaldo JSON restaurado correctamente en la base de datos!');
    } catch (err: any) {
      alert(`Error al procesar el archivo JSON: ${err?.message}`);
    }
  };

  const handleDevInjectSeedData = () => {
    setCompanies(initialCompanies);
    setClients(initialClients);
    setLoans(initialLoans);
    setPayments(initialPayments);
    setExpenses(initialExpenses);
    setPayables(initialPayables);
    setPayroll(initialPayroll);
    setUsers(initialUsers);
    setJournalEntries(initialJournalEntries);
    setSecretVaultRecords(initialSecretVaultRecords);
    confetti({ particleCount: 60, spread: 70 });
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* BARRA SUPERIOR DE ACCESO RÁPIDO A LOS 6 PANELES POR ROL (RBAC) */}
      <RoleNavigationBar
        currentRole={currentAppRole}
        onSelectRole={(r) => {
          setCurrentAppRole(r);
          localStorage.setItem('prest_app_role', r);
          if (r === 'CLIENTE') setActiveTab('portal-cliente');
          else if (r === 'COBRADOR') setActiveTab('portal-cobrador');
          else if (r === 'AUXILIAR') setActiveTab('portal-auxiliar');
          else if (r === 'GERENTE') setActiveTab('portal-gerente');
          else if (r === 'ADMIN') setActiveTab('portal-admin');
          else if (r === 'DEV') setActiveTab('portal-dev');
        }}
        currentSession={currentSession}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR NAVIGATION */}
        <aside
          className={`fixed md:relative z-40 h-full w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between transition-transform duration-300 backdrop-blur-xl ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Logo / Brand Header */}
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20">
                  RD
                </div>
                <div className="overflow-hidden">
                  <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                    {settings.companyName}
                  </h1>
                  <p className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                    Gestión Integral & Cobros RD
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Items (Role & Category Filtered) */}
            <div className="p-3 space-y-1 overflow-y-auto flex-1">
              {/* 6 PANELES POR ROL RBAC */}
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                <span>Paneles por Rol (RBAC)</span>
              </div>

              <button
                onClick={() => {
                  setCurrentAppRole('CLIENTE');
                  setActiveTab('portal-cliente');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'portal-cliente' || currentAppRole === 'CLIENTE'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>1. Panel Cliente (/cliente)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">CLI</span>
              </button>

              <button
                onClick={() => {
                  setCurrentAppRole('COBRADOR');
                  setActiveTab('portal-cobrador');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'portal-cobrador'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Route className="w-4 h-4 text-emerald-400" />
                  <span>2. Cobrador (/cobrador)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">RUTA</span>
              </button>

              <button
                onClick={() => {
                  setCurrentAppRole('AUXILIAR');
                  setActiveTab('portal-auxiliar');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'portal-auxiliar'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                  <span>3. Auxiliar Préstamos (/auxiliar)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">OFI</span>
              </button>

              <button
                onClick={() => {
                  setCurrentAppRole('GERENTE');
                  setActiveTab('portal-gerente');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'portal-gerente'
                    ? 'bg-purple-600/20 text-purple-400 border border-purple-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>4. Panel Gerente (/gerente)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">GER</span>
              </button>

              <button
                onClick={() => {
                  setCurrentAppRole('ADMIN');
                  setActiveTab('portal-admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'portal-admin'
                    ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-rose-400" />
                  <span>5. Administrador (/admin)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">ADM</span>
              </button>

              <button
                onClick={() => {
                  setCurrentAppRole('DEV');
                  setActiveTab('portal-dev');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'portal-dev'
                    ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 font-bold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span>6. Desarrollador (/dev)</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">DEV</span>
              </button>

              <div className="border-t border-slate-800 my-2 pt-2">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                  <span>Operación Integral RD</span>
                  <span className="text-amber-400 font-mono">Cat. {currentSession.category}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'dashboard'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-400" />
                <span>[ 📊 Dashboard General ]</span>
              </button>

            {/* Feature: Workflow por Fases (Multi-Level RBAC) */}
            <button
              onClick={() => {
                setActiveTab('pipeline');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'pipeline'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>[ ⏳ Workflow por Fases ]</span>
              </div>
              <span className="px-1.5 py-0.2 bg-indigo-600 text-white rounded text-[10px] font-bold">
                {(allPipelineLoans[activeTenant.id] || []).filter((l) => l.stage !== 'DESEMBOLSADO').length}
              </span>
            </button>

            {/* Feature: Motor Amortización Multimoneda */}
            <button
              onClick={() => {
                setActiveTab('amortizator');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'amortizator'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>[ 🧮 Motor Amortización ]</span>
            </button>

            {/* Feature: Facturación Fiscal */}
            <button
              onClick={() => {
                setActiveTab('invoice');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'invoice'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>[ 🧾 Facturación Fiscal ]</span>
            </button>

            {/* Feature: Gmail & Notificaciones */}
            <button
              onClick={() => {
                setIsGmailModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-red-300 bg-red-500/15 border border-red-500/40 hover:bg-red-500/25 transition shadow"
            >
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-red-400" />
                <span>[ ✉️ Notificaciones Gmail ]</span>
              </div>
              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[9px] font-black uppercase">
                1P
              </span>
            </button>

            {/* Feature 1 Navigation: Detailed Loan Amortization Schedule */}
            <button
              onClick={() => {
                handleOpenAmortization();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>[ 📑 Tabla de Amortización ]</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('clients');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'clients'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>[ 📋 Clientes & Expediente ]</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('loans');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'loans'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <HandCoins className="w-4 h-4 text-amber-400" />
              <span>[ 📁 Cartera de Préstamos ]</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('routes');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'routes'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Route className="w-4 h-4 text-amber-400" />
              <span>[ 🗺️ Ruta de Cobro & GPS ]</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('payments-history');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'payments-history'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>[ 💵 Cobros & Recibos Emitidos ]</span>
            </button>

            {/* Admin Only & SuperAdmin SaaS Sections */}
            {role === 'ADMIN' && (
              <>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 pt-3">
                  Licencias SaaS & Finanzas RD
                </div>

                {/* Master SaaS Approval Panel (Lic Pedro Baldera) */}
                <button
                  onClick={() => {
                    setIsLicensingModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition shadow"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>[ 🔐 Licencias & 7d Demo ]</span>
                </button>

                {/* Entrada de Clientes con Balance Inicial & Ficha Histórica */}
                <button
                  onClick={() => {
                    setIsInitialBalanceModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/40 hover:bg-emerald-500/25 transition shadow"
                >
                  <Scale className="w-4 h-4 text-emerald-400" />
                  <span>[ ⚖️ Balance Inicial & Ficha ]</span>
                </button>

                {/* Archivo Histórico Secreto de Claves (Solo Administrador Pedro Baldera) */}
                <button
                  onClick={() => {
                    setIsSecretVaultModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/15 border border-rose-500/40 hover:bg-rose-500/25 transition shadow"
                >
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-rose-400" />
                    <span>[ 🗝️ Archivo Secreto de Claves ]</span>
                  </div>
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded text-[9px] font-black uppercase">
                    Admin
                  </span>
                </button>

                {/* Libro Diario General & Transacciones Históricas */}
                <button
                  onClick={() => {
                    setIsJournalModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/40 hover:bg-amber-500/25 transition shadow"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    <span>[ 📖 Libro Diario & Transacciones ]</span>
                  </div>
                  <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black">
                    {journalEntries.length}
                  </span>
                </button>

                {/* User & Advisor Management */}
                <button
                  onClick={() => {
                    setIsUserManagementModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 transition"
                >
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>[ 👥 Asesores & Cobradores ]</span>
                </button>

                {/* Backup Manager */}
                <button
                  onClick={() => {
                    setIsBackupModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition"
                >
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>[ 💾 Backups (Cada 10s) ]</span>
                </button>

                {/* Verificación de Depósitos Bancarios */}
                <button
                  onClick={() => {
                    setIsVoucherModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-sky-300 hover:bg-sky-500/10 border border-sky-500/20 transition"
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-4 h-4 text-sky-400" />
                    <span>[ 🏦 Depósitos Bancarios ]</span>
                  </div>
                  {vouchers.filter((v) => v.status === 'PENDIENTE_VERIFICACION').length > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                      {vouchers.filter((v) => v.status === 'PENDIENTE_VERIFICACION').length}
                    </span>
                  )}
                </button>

                {/* Cargos Extras & Exoneración */}
                <button
                  onClick={() => {
                    setIsExtraChargesModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 transition"
                >
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span>[ ➕ Cargos Extras & Exonerar ]</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('expenses');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'expenses'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4 text-rose-400" />
                  <span>[ 🏷️ Gastos G&A y Operación ]</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('payables');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'payables'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-purple-400" />
                  <span>[ 💸 Cuentas por Pagar (Pasivos) ]</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reports');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'reports'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4 text-sky-400" />
                  <span>[ 📑 Estados Financieros (P&L) ]</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('payroll');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                    activeTab === 'payroll'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>[ 👥 Nómina de Cobradores ]</span>
                </button>
              </>
            )}

            {/* AI Assistant Module */}
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 pt-3">
              Inteligencia Artificial
            </div>
            <button
              onClick={() => {
                setActiveTab('ai-hub');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'ai-hub'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Brain className="w-4 h-4 text-amber-400" />
              <span>[ 🤖 Gemini AI Studio Hub ]</span>
            </button>

            {/* Servicio de Notificaciones Automáticas WhatsApp & SMS */}
            <button
              onClick={() => {
                setIsNotificationModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition shadow"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>[ 📲 Notificaciones WA & SMS ]</span>
              </div>
              <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[10px] font-black">
                {notificationLogs.length}
              </span>
            </button>

            {role === 'ADMIN' && (
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  activeTab === 'settings'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>[ ⚙️ Multi-Empresa & Soporte ]</span>
              </button>
            )}
          </div>

          {/* User Session & Technical Support Footer */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-950/70 text-xs space-y-2">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Sesión Activa:</span>
                <span className="font-bold text-white text-[11px] truncate block max-w-[130px]">
                  {currentSession.name}
                </span>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px]"
                title="Cambiar de usuario o identificarse con Cédula/RNC"
              >
                Cambiar
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Soporte Lic. Baldera:</span>
              <a
                href={`https://wa.me/${settings.technicalSupportPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-amber-400 hover:underline"
              >
                {settings.technicalSupportPhone}
              </a>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header Navigation */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-4 flex items-center justify-between backdrop-blur-md z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm sm:text-base text-white truncate max-w-xs sm:max-w-md">
                  {settings.companyName}
                </h2>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono font-bold">
                  Cat. {currentSession.category}
                </span>

                {/* 10-Second Auto Save Live Indicator */}
                <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AutoBackup ({autoSaveTicker}s)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Usuario activo: {currentSession.name} ({currentSession.identifier})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* WORKSPACE MULTI-TENANT SWITCHER */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-indigo-500/30 text-xs">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <select
                value={activeTenant.id}
                onChange={(e) => {
                  const found = INITIAL_TENANTS.find((t) => t.id === e.target.value);
                  if (found) setActiveTenant(found);
                }}
                className="bg-transparent font-bold text-slate-200 outline-none cursor-pointer pr-1 text-xs"
                title="Entorno / Inquilino Multi-Tenant aislado"
              >
                {INITIAL_TENANTS.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name} ({t.currency})
                  </option>
                ))}
              </select>
              <span className="hidden xl:inline text-[9px] font-mono text-indigo-400 px-1 bg-indigo-500/10 rounded">
                {activeTenant.dbSchema}
              </span>
            </div>

            {/* RBAC ROLE APPROVAL SWITCHER */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-xl border border-amber-500/30 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={currentApprovalRole}
                onChange={(e) => setCurrentApprovalRole(e.target.value)}
                className="bg-transparent font-bold text-amber-400 outline-none cursor-pointer text-xs"
                title="Rol de Aprobación RBAC para el Workflow de Créditos"
              >
                {Object.keys(ROLES_PERMISSIONS).map((r) => (
                  <option key={r} value={r} className="bg-slate-900 text-amber-300">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* GMAIL NOTIFICATIONS QUICK ACCESS BUTTON */}
            <button
              onClick={() => setIsGmailModalOpen(true)}
              className="p-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 rounded-xl text-xs font-bold transition border border-red-500/30 flex items-center gap-1.5 cursor-pointer shadow"
              title="Centro Oficial de Notificaciones Gmail & Google Workspace"
            >
              <Mail className="w-4 h-4 text-red-400" />
              <span className="hidden xl:inline">Gmail</span>
            </button>

            {/* Demo / Membership Status Alert if Prestamista */}
            {activeCompanyTenant && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px]">
                {activeCompanyTenant.status === 'DEMO_ACTIVO' && (
                  <span className="text-sky-400 font-bold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Demo: {getDemoDaysLeft(activeCompanyTenant.trialEndDate)} días restantes
                  </span>
                )}
                {activeCompanyTenant.status === 'DEMO_VENCIDO' && (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Demo Vencido - Active Plan
                  </span>
                )}
                {activeCompanyTenant.status === 'PAGADO_ACTIVO' && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Licencia Activa ({activeCompanyTenant.membershipPlan})
                  </span>
                )}
              </div>
            )}

            {/* SuperAdmin Master Access Button */}
            <button
              onClick={() => setIsLicensingModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold transition border border-amber-500/30 flex items-center gap-1.5"
              title="Aprobación de Empresas & Membresías (Lic. Pedro Baldera)"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline">Licencias SaaS</span>
            </button>

            {/* Backups Button */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold transition border border-emerald-500/30 flex items-center gap-1.5"
              title="Descargar o Restaurar Backup"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span className="hidden xl:inline">Backup</span>
            </button>

            {/* Depósitos Bancarios Button */}
            <button
              onClick={() => setIsVoucherModalOpen(true)}
              className="relative p-2 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-bold transition border border-sky-500/30 flex items-center gap-1.5"
              title="Verificación de Depósitos Bancarios y Comprobantes en Línea"
            >
              <Building className="w-4 h-4 text-sky-400" />
              <span className="hidden xl:inline">Depósitos</span>
              {vouchers.filter((v) => v.status === 'PENDIENTE_VERIFICACION').length > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                  {vouchers.filter((v) => v.status === 'PENDIENTE_VERIFICACION').length}
                </span>
              )}
            </button>

            {/* Cargos Extras Button */}
            <button
              onClick={() => setIsExtraChargesModalOpen(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-400 rounded-xl text-xs font-bold transition border border-purple-500/30 flex items-center gap-1.5"
              title="Gestión de Cargos Extras (GPS, Notaría, Visitas & Exoneración)"
            >
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="hidden xl:inline">Cargos Extras</span>
            </button>

            {/* Quick Action: New Loan */}
            <button
              onClick={() => setIsApplicationModalOpen(true)}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-amber-950"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Préstamo</span>
              <span className="sm:hidden">Nuevo</span>
            </button>

            {/* Role Switcher */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setRole('ADMIN')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  role === 'ADMIN'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setRole('OPERATIVO')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  role === 'OPERATIVO'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Cobrador
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-6">
          {/* Demo Expired Warning Banner if active company has expired trial */}
          {activeCompanyTenant && activeCompanyTenant.status === 'DEMO_VENCIDO' && (
            <div className="p-4 rounded-2xl bg-rose-950/70 border-2 border-rose-600 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0 animate-bounce" />
                <div>
                  <h3 className="font-extrabold text-white text-sm sm:text-base">
                    Período de Prueba de 7 Días Finalizado ({activeCompanyTenant.name})
                  </h3>
                  <p className="text-xs text-rose-200">
                    Toda su información, clientes y créditos se encuentran respaldados de forma segura. Para reactivar el acceso completo con mensualidad fija o membresía de 6 meses, 1, 2 o 3 años, comuníquese con el Lic. Pedro Baldera al <strong>1829771790</strong>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLicensingModalOpen(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shrink-0 shadow-lg"
              >
                Renovar Licencia con Lic. Baldera
              </button>
            </div>
          )}

          {/* =========================================================================
              PANELES ESPECIALIZADOS DE ARQUITECTURA RBAC (6 ROLES DIFERENCIADOS)
             ========================================================================= */}

          {/* 1. Panel de Cliente (/cliente) */}
          {(activeTab === 'portal-cliente' || currentAppRole === 'CLIENTE') && (
            <ClientPortal
              client={currentSession.client || clients[0]}
              loans={loans}
              payments={payments}
              onRequestNewLoan={handleClientRequestLoan}
              onUploadVoucher={(voucherData) => {
                handleSubmitNewVoucher(voucherData);
                alert('¡Comprobante enviado a verificación exitosamente!');
              }}
              onOpenReceipt={(payment) => {
                setCurrentReceiptPayment(payment);
                setIsReceiptModalOpen(true);
              }}
            />
          )}

          {/* 2. Panel de Mensajero / Cobrador (/cobrador o /mensajero) */}
          {activeTab === 'portal-cobrador' && currentAppRole !== 'CLIENTE' && (
            <CollectorPortal
              collectorName={currentSession.name}
              stops={routeStops}
              loans={loans}
              clients={clients}
              payments={payments}
              onQuickPayment={handleCollectorQuickPayment}
              onUpdateStopStatus={handleCollectorUpdateStatus}
              onOpenReceipt={(payment) => {
                setCurrentReceiptPayment(payment);
                setIsReceiptModalOpen(true);
              }}
            />
          )}

          {/* 3. Panel de Auxiliar de Préstamos (/auxiliar) */}
          {activeTab === 'portal-auxiliar' && currentAppRole !== 'CLIENTE' && (
            <LoanOfficerPortal
              officerName={currentSession.name}
              clients={clients}
              loans={loans}
              payments={payments}
              onRegisterClient={(newClient) => {
                const fullClient: Client = {
                  id: `CLI-${String(clients.length + 101).padStart(3, '0')}`,
                  name: newClient.name || 'Nuevo Cliente',
                  cedula: newClient.cedula || '001-0000000-0',
                  phone: newClient.phone || '809-000-0000',
                  address: newClient.address || 'Santo Domingo, RD',
                  businessName: newClient.businessName || '',
                  monthlyIncome: newClient.monthlyIncome || 35000,
                  maxCreditLimit: newClient.maxCreditLimit || 100000,
                  bankName: newClient.bankName || 'Banco de Reservas',
                  bankAccountNumber: newClient.bankAccountNumber || '',
                  bankAccountType: newClient.bankAccountType || 'CORRIENTE',
                  rating: 5,
                  ...newClient,
                };
                setClients((prev) => [fullClient, ...prev]);
                confetti({ particleCount: 50 });
              }}
              onCreateLoanApplication={(loanData) => {
                const sched = generateAmortizationSchedule(
                  loanData.amount,
                  loanData.rate,
                  loanData.terms,
                  loanData.frequency,
                  loanData.type || 'FIXED'
                );
                const newL: Loan = {
                  id: `LN-APP-${Date.now()}`,
                  code: `PR-${String(loans.length + 101).padStart(3, '0')}`,
                  clientId: loanData.clientId,
                  amount: loanData.amount,
                  balance: sched.totalWithInterest,
                  capitalBalance: loanData.amount,
                  interestBalance: sched.totalWithInterest - loanData.amount,
                  rate: loanData.rate,
                  terms: loanData.terms,
                  frequency: loanData.frequency,
                  type: loanData.type || 'FIXED',
                  quota: sched.quota,
                  totalWithInterest: sched.totalWithInterest,
                  totalPaid: 0,
                  status: 'EN_TRAMITE',
                  advisorName: currentSession.name,
                  createdDate: new Date().toISOString().split('T')[0],
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  contractSigned: false,
                  schedule: sched.schedule,
                  daysOverdue: 0,
                  notes: loanData.notes || 'Solicitud ingresada por auxiliar de créditos',
                };
                setLoans((prev) => [newL, ...prev]);
                confetti({ particleCount: 60 });
              }}
              onForwardToManager={handleForwardToManager}
              onOfficePayment={handleOfficePayment}
            />
          )}

          {/* 4. Panel de Gerente (/gerente) */}
          {activeTab === 'portal-gerente' && currentAppRole !== 'CLIENTE' && (
            <ManagerPortal
              managerName={currentSession.name}
              loans={loans}
              clients={clients}
              payments={payments}
              extraCharges={extraCharges}
              onApproveLoan={(loanId, notes) => {
                handleApproveLoan(loanId);
                if (notes) {
                  setLoans((prev) =>
                    prev.map((l) => (l.id === loanId ? { ...l, notes: `${l.notes || ''} [Gerente: ${notes}]` } : l))
                  );
                }
              }}
              onRejectLoan={handleRejectLoan}
              onWaiveExtraCharge={handleManagerWaiveExtra}
              onApplyDiscount={handleManagerDiscount}
            />
          )}

          {/* 5. Panel de Administrador (/admin) */}
          {activeTab === 'portal-admin' && currentAppRole !== 'CLIENTE' && (
            <AdminPortal
              adminName={currentSession.name}
              users={users}
              settings={settings}
              journalEntries={journalEntries}
              companies={companies}
              secretVault={secretVaultRecords}
              onUpdateSettings={(newSettings) => {
                setSettings(newSettings);
                localStorage.setItem('prest_settings', JSON.stringify(newSettings));
                alert('¡Parámetros actualizados exitosamente!');
              }}
              onAddUser={(newUser) => {
                setUsers((prev) => [newUser, ...prev]);
                confetti({ particleCount: 50 });
              }}
              onUpdateUser={(userId, partial) => {
                setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...partial } : u)));
              }}
              onDeleteUser={(userId) => {
                setUsers((prev) => prev.filter((u) => u.id !== userId));
              }}
              onDownloadBackup={handleAdminDownloadBackup}
              onRestoreBackup={handleAdminRestoreBackup}
              onExecuteDailyClose={handleAdminDailyClose}
            />
          )}

          {/* 6. Panel de Desarrollador / SuperAdmin Técnico (/dev) */}
          {activeTab === 'portal-dev' && currentAppRole !== 'CLIENTE' && (
            <DeveloperPortal
              devName={currentSession.name}
              activeTenantId={activeTenant.id}
              onClearStorageAndReset={() => {
                localStorage.clear();
                window.location.reload();
              }}
              onInjectSeedData={handleDevInjectSeedData}
            />
          )}

          {/* TAB: WORKFLOW MAESTRO DE EVALUACIÓN Y VALIDACIONES RBAC */}
          {activeTab === 'pipeline' && currentAppRole !== 'CLIENTE' && (
            <LoanWorkflowPipeline
              activeTenant={activeTenant}
              currentRole={currentApprovalRole}
              loans={allPipelineLoans[activeTenant.id] || []}
              onUpdateLoans={(updater) => {
                setAllPipelineLoans((prev) => {
                  const currentTenantLoans = prev[activeTenant.id] || [];
                  const updated = updater(currentTenantLoans);
                  return { ...prev, [activeTenant.id]: updated };
                });
              }}
              onOpenGmailDraft={(draft) => {
                setActiveGmailDraft({
                  recipientEmail: draft.recipientEmail,
                  customSubject: draft.subject,
                  templateType: 'CUSTOM',
                });
                setIsGmailModalOpen(true);
              }}
            />
          )}

          {/* TAB: MOTOR FINANCIERO DE AMORTIZACIÓN MULTIMONEDA */}
          {activeTab === 'amortizator' && currentAppRole !== 'CLIENTE' && (
            <MultiCurrencyAmortizationCalculator
              initialCurrency={activeTenant.currency}
              onOpenGmailDraft={(draft) => {
                setActiveGmailDraft({
                  customSubject: draft.subject,
                  templateType: 'CUSTOM',
                });
                setIsGmailModalOpen(true);
              }}
            />
          )}

          {/* TAB: FACTURACIÓN Y COMPROBANTES FISCALES */}
          {activeTab === 'invoice' && currentAppRole !== 'CLIENTE' && (
            <FiscalInvoiceReceiptModule
              activeTenant={activeTenant}
              loans={allPipelineLoans[activeTenant.id] || []}
              onOpenGmailDraft={(draft) => {
                setActiveGmailDraft({
                  recipientEmail: draft.recipientEmail,
                  customSubject: draft.subject,
                  templateType: 'CUSTOM',
                });
                setIsGmailModalOpen(true);
              }}
            />
          )}

          {/* TAB 1: DASHBOARD ADMINISTRATIVO COMPLETO */}
          {activeTab === 'dashboard' && currentAppRole !== 'CLIENTE' && (
            <div className="space-y-6">
              {/* Header Title with Export Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-amber-400" />
                    Panel Administrativo de Cartera & Reportes en Tiempo Real
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control de créditos aprobados, en trámite, rechazados, al día, en mora y saldados con filtros avanzados y exportación.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportLoansExcel}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Exportar cartera filtrada a formato Excel (.CSV)"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar a Excel</span>
                  </button>

                  <button
                    onClick={handleExportLoansPDF}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
                    title="Exportar o imprimir informe en formato PDF"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Exportar a PDF</span>
                  </button>

                  <button
                    onClick={() => setIsLicensingModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Aprobar Empresas (7d Demo)</span>
                  </button>
                </div>
              </div>

              {/* Status Overview Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => setLoanStatusFilter('ALL')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    loanStatusFilter === 'ALL'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400">Todos</div>
                  <div className="text-xl font-black text-white mt-1">{loans.length}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {formatDOP(loans.reduce((acc, l) => acc + l.amount, 0))}
                  </div>
                </button>

                <button
                  onClick={() => setLoanStatusFilter('EN_TRAMITE')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    loanStatusFilter === 'EN_TRAMITE'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400">En Trámite</span>
                    {pendingLoans.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-xl font-black text-amber-400 mt-1">
                    {pendingLoans.length}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Por evaluar</div>
                </button>

                <button
                  onClick={() => setLoanStatusFilter('ACTIVE')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    loanStatusFilter === 'ACTIVE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Al Día / Aprobados</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {activeLoans.length}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {formatDOP(activeLoans.reduce((acc, l) => acc + l.balance, 0))}
                  </div>
                </button>

                <button
                  onClick={() => setLoanStatusFilter('OVERDUE')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    loanStatusFilter === 'OVERDUE'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-rose-400">En Mora</div>
                  <div className="text-xl font-black text-rose-400 mt-1">{overdueLoans.length}</div>
                  <div className="text-[10px] text-rose-300/80 truncate">
                    {formatDOP(overdueBalance)}
                  </div>
                </button>

                <button
                  onClick={() => setLoanStatusFilter('RECHAZADO')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    loanStatusFilter === 'RECHAZADO'
                      ? 'bg-slate-800 border-slate-500 text-slate-200'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-slate-400">Rechazados</div>
                  <div className="text-xl font-black text-slate-400 mt-1">
                    {rejectedLoans.length}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">Sin desembolso</div>
                </button>

                <button
                  onClick={() => setLoanStatusFilter('PAID')}
                  className={`p-3.5 rounded-2xl border text-left transition ${
                    loanStatusFilter === 'PAID'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-purple-400">Saldados</div>
                  <div className="text-xl font-black text-purple-400 mt-1">{paidLoans.length}</div>
                  <div className="text-[10px] text-slate-500 truncate">100% liquidados</div>
                </button>
              </div>

              {/* Advanced Advisor & Portfolio Filters Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-2 text-amber-400">
                    <Filter className="w-4 h-4" />
                    Filtros Avanzados para Asesores & Reportes de Cartera
                  </span>
                  <button
                    onClick={() => {
                      setLoanStatusFilter('ALL');
                      setSelectedAdvisorFilter('ALL');
                      setFrequencyFilter('ALL');
                      setDateStartFilter('');
                      setDateEndFilter('');
                      setLoanSearch('');
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Restablecer Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                      Filtrar por Asesor:
                    </label>
                    <select
                      value={selectedAdvisorFilter}
                      onChange={(e) => setSelectedAdvisorFilter(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-medium"
                    >
                      <option value="ALL">Todos los Asesores ({users.length})</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                      Estado del Préstamo:
                    </label>
                    <select
                      value={loanStatusFilter}
                      onChange={(e) => setLoanStatusFilter(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-medium"
                    >
                      <option value="ALL">Todos los Estados</option>
                      <option value="EN_TRAMITE">En Trámite / Pendientes</option>
                      <option value="ACTIVE">Al Día (Activos)</option>
                      <option value="OVERDUE">En Mora (Atrasados)</option>
                      <option value="RECHAZADO">Rechazados</option>
                      <option value="PAID">Saldados (Cancelados)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                      Frecuencia de Pago:
                    </label>
                    <select
                      value={frequencyFilter}
                      onChange={(e) => setFrequencyFilter(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs font-medium"
                    >
                      <option value="ALL">Todas las Frecuencias</option>
                      <option value="DIARIO">Diario</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="QUINCENAL">Quincenal</option>
                      <option value="MENSUAL">Mensual</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                      Desde Fecha:
                    </label>
                    <input
                      type="date"
                      value={dateStartFilter}
                      onChange={(e) => setDateStartFilter(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1 text-[11px] font-semibold">
                      Hasta Fecha:
                    </label>
                    <input
                      type="date"
                      value={dateEndFilter}
                      onChange={(e) => setDateEndFilter(e.target.value)}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={loanSearch}
                    onChange={(e) => setLoanSearch(e.target.value)}
                    placeholder="Buscar por Código de Crédito, Nombre del Cliente o Cédula..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Advisor Performance Summary Cards */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-2 text-sky-400">
                    <UserCheck className="w-4 h-4" />
                    Rendimiento de Cartera por Asesor / Cobrador
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Haga clic en un asesor para filtrar su cartera
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {users.map((advisor) => {
                    const advisorLoans = loans.filter(
                      (l) => l.advisorName === advisor.name || l.advisorId === advisor.id
                    );
                    const advisorPortfolio = advisorLoans
                      .filter((l) => l.status === 'ACTIVE' || l.status === 'OVERDUE')
                      .reduce((acc, l) => acc + l.balance, 0);
                    const advisorCollected = payments
                      .filter((p) => p.collectorName.includes(advisor.name))
                      .reduce((acc, p) => acc + p.amount, 0);

                    return (
                      <button
                        key={advisor.id}
                        onClick={() => setSelectedAdvisorFilter(advisor.name)}
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                          selectedAdvisorFilter === advisor.name
                            ? 'bg-sky-500/15 border-sky-400 text-sky-300'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold text-white text-sm">{advisor.name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {advisor.role} • {advisor.phone}
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-amber-400">
                            {advisorLoans.length} créditos
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-800/80">
                          <div>
                            <span className="text-[10px] text-slate-500 block">Cartera Activa:</span>
                            <span className="font-bold text-amber-400">
                              {formatDOP(advisorPortfolio)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 block">Cobranza Total:</span>
                            <span className="font-bold text-emerald-400">
                              {formatDOP(advisorCollected)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filtered Loans Table */}
              <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      <HandCoins className="w-4 h-4 text-amber-400" />
                      Listado de Créditos Filtrados ({filteredLoans.length})
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Saldo filtrado: {formatDOP(filteredLoans.reduce((acc, l) => acc + l.balance, 0))} •
                      Monto financiado: {formatDOP(filteredLoans.reduce((acc, l) => acc + l.amount, 0))}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportLoansExcel}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV Excel
                    </button>
                    <button
                      onClick={handleExportLoansPDF}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" /> PDF
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Código / Cliente</th>
                        <th className="p-3.5">Asesor Asignado</th>
                        <th className="p-3.5">Modalidad & Método</th>
                        <th className="p-3.5">Monto Principal</th>
                        <th className="p-3.5">Cuota Periódica</th>
                        <th className="p-3.5">Balance Restante</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5 text-center">Operaciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLoans.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                            No se encontraron préstamos que coincidan con los filtros seleccionados.
                          </td>
                        </tr>
                      ) : (
                        filteredLoans.map((l) => {
                          const client = clients.find((c) => c.id === l.clientId);
                          const isPending = l.status === 'EN_TRAMITE';
                          const isRejected = l.status === 'RECHAZADO';
                          const isPaid = l.status === 'PAID';
                          const isOverdue = l.status === 'OVERDUE';

                          return (
                            <tr key={l.id} className="hover:bg-slate-800/40 transition">
                              <td className="p-3.5">
                                <div className="font-bold text-white text-sm">{client?.name}</div>
                                <div className="text-[11px] text-amber-400 font-mono">
                                  {l.code} • Cédula: {client?.cedula}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span className="font-semibold text-slate-200">{l.advisorName}</span>
                                <div className="text-[10px] text-slate-400">{l.createdDate}</div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-semibold text-slate-200">
                                  {l.frequency} ({l.rate}% mensual)
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {l.type === 'FIXED' && 'Francés (Cuota Fija)'}
                                  {l.type === 'INTEREST_ONLY' && 'Solo Interés (San)'}
                                  {l.type === 'GERMAN' && 'Alemán (Decreciente)'} • {l.terms} cuotas
                                </div>
                              </td>

                              <td className="p-3.5 font-bold text-slate-200">
                                {formatDOP(l.amount)}
                              </td>

                              <td className="p-3.5 font-extrabold text-emerald-400">
                                {formatDOP(l.quota)}
                              </td>

                              <td className="p-3.5 font-black text-amber-400 text-sm">
                                {formatDOP(l.balance)}
                              </td>

                              <td className="p-3.5">
                                {isPending ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                                    En Trámite
                                  </span>
                                ) : isRejected ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">
                                    Rechazado
                                  </span>
                                ) : isPaid ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold">
                                    Saldado
                                  </span>
                                ) : isOverdue ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">
                                    En Mora ({l.daysOverdue || 1}d)
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                                    Al Día
                                  </span>
                                )}
                              </td>

                              <td className="p-3.5 text-center">
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* Quick Approval / Rejection for pending loans */}
                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleApproveLoan(l.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                                        title="Aprobar préstamo en tiempo real"
                                      >
                                        Aprobar
                                      </button>
                                      <button
                                        onClick={() => handleRejectLoan(l.id)}
                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow"
                                        title="Rechazar préstamo"
                                      >
                                        Rechazar
                                      </button>
                                    </>
                                  )}

                                  {/* Action: View detailed Amortization schedule */}
                                  <button
                                    onClick={() => handleOpenAmortization(l)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30 flex items-center gap-1"
                                    title="Ver cronograma y tabla de amortización"
                                  >
                                    <FileSpreadsheet className="w-3.5 h-3.5" />
                                    <span>Amortización</span>
                                  </button>

                                  {!isPending && !isRejected && !isPaid && (
                                    <>
                                      <button
                                        onClick={() => handleOpenPayment(l.id)}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                                      >
                                        Cobrar
                                      </button>
                                      <button
                                        onClick={() => {
                                          setSelectedLoanForRefinance(l);
                                          setIsRefinanceModalOpen(true);
                                        }}
                                        className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow"
                                        title="Reenganche de préstamo"
                                      >
                                        Reenganche
                                      </button>
                                    </>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedLoanForContract(l);
                                      setIsContractModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg"
                                    title="Ver o Firmar Pagaré Notarial"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedLoanForWhatsApp(l.id);
                                      setIsWhatsAppModalOpen(true);
                                    }}
                                    className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg"
                                    title="Mensaje de WhatsApp AI"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLIENTES & CARTERA HISTÓRICA POR ANTIGÜEDAD */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              {/* Header Title with Export & Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" />
                    Cartera Histórica de Clientes por Antigüedad & Mora
                  </h2>
                  <p className="text-xs text-slate-400">
                    Clasificación de riesgo de 0 a 30 días (Vigente), 31 a 60 días, 61 a 90 días y más de 90 días. Haga click sobre cualquier cliente para entrar y realizar movimientos inmediatos.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportAgingPortfolioCSV}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Exportar cartera histórica de clientes y antigüedad a Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Cartera Excel</span>
                  </button>

                  <button
                    onClick={() => setIsJournalModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Ver Libro Diario de todas las transacciones"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Libro Diario ({journalEntries.length})</span>
                  </button>

                  <button
                    onClick={() => setIsInitialBalanceModalOpen(true)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                    title="Ingresar cliente con balance inicial (Ficha histórica o Saldo al día de hoy)"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Balance Inicial (2 Modalidades)</span>
                  </button>

                  <button
                    onClick={() => setIsApplicationModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Registrar Nuevo Cliente
                  </button>
                </div>
              </div>

              {/* 4 CARTERA AGING CARDS (0-30, 31-60, 61-90, >90 DÍAS) */}
              {(() => {
                const bucket0_30 = clients.filter((c) => getClientOverdueInfo(c.id).bucket === '0_30');
                const bucket31_60 = clients.filter((c) => getClientOverdueInfo(c.id).bucket === '31_60');
                const bucket61_90 = clients.filter((c) => getClientOverdueInfo(c.id).bucket === '61_90');
                const bucketMAS_90 = clients.filter((c) => getClientOverdueInfo(c.id).bucket === 'MAS_90');

                const bal0_30 = bucket0_30.reduce((s, c) => s + getClientOverdueInfo(c.id).totalBal, 0);
                const bal31_60 = bucket31_60.reduce((s, c) => s + getClientOverdueInfo(c.id).totalBal, 0);
                const bal61_90 = bucket61_90.reduce((s, c) => s + getClientOverdueInfo(c.id).totalBal, 0);
                const balMAS_90 = bucketMAS_90.reduce((s, c) => s + getClientOverdueInfo(c.id).totalBal, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {/* Todos */}
                    <button
                      onClick={() => setClientAgingBucket('ALL')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        clientAgingBucket === 'ALL'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Clientes</div>
                      <div className="text-xl font-black text-white mt-1">{clients.length}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal0_30 + bal31_60 + bal61_90 + balMAS_90)}
                      </div>
                    </button>

                    {/* 0 a 30 días: Vigente */}
                    <button
                      onClick={() => setClientAgingBucket('0_30')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        clientAgingBucket === '0_30'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-400">
                          0 a 30 Días: Vigente
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-xl font-black text-emerald-400 mt-1">
                        {bucket0_30.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal0_30)} • Al día
                      </div>
                    </button>

                    {/* 31 a 60 días: Vencido */}
                    <button
                      onClick={() => setClientAgingBucket('31_60')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        clientAgingBucket === '31_60'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-amber-400">
                          31 a 60 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="text-xl font-black text-amber-400 mt-1">
                        {bucket31_60.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal31_60)} • 1-2 cuotas
                      </div>
                    </button>

                    {/* 61 a 90 días: En Mora Judicial */}
                    <button
                      onClick={() => setClientAgingBucket('61_90')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        clientAgingBucket === '61_90'
                          ? 'bg-orange-500/25 border-orange-400 text-orange-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-orange-400">
                          61 a 90 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                      </div>
                      <div className="text-xl font-black text-orange-400 mt-1">
                        {bucket61_90.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal61_90)} • Cobro Judicial
                      </div>
                    </button>

                    {/* Más de 90 días: Incobrable / Castigada */}
                    <button
                      onClick={() => setClientAgingBucket('MAS_90')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        clientAgingBucket === 'MAS_90'
                          ? 'bg-rose-500/25 border-rose-400 text-rose-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-rose-400">
                          Más de 90 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      </div>
                      <div className="text-xl font-black text-rose-400 mt-1">
                        {bucketMAS_90.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(balMAS_90)} • Castigada
                      </div>
                    </button>
                  </div>
                );
              })()}

              {/* Search filter */}
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 ml-2" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Buscar por Nombre, Cédula Dominicana, Teléfono u Ocupación..."
                    className="bg-transparent text-xs sm:text-sm text-slate-200 placeholder-slate-500 w-full focus:outline-none"
                  />
                </div>

                {clientAgingBucket !== 'ALL' && (
                  <button
                    onClick={() => setClientAgingBucket('ALL')}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl text-xs font-bold"
                  >
                    Mostrar Todos los Rangos
                  </button>
                )}
              </div>

              {/* Clients Table with Click-to-Enter-Movement Drawer */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Cliente / Negocio</th>
                        <th className="p-3.5">Cédula & Contacto</th>
                        <th className="p-3.5">Rango de Antigüedad</th>
                        <th className="p-3.5">Deuda Total Activa</th>
                        <th className="p-3.5">Banco para Desembolso</th>
                        <th className="p-3.5">Garante & Co-Deudor</th>
                        <th className="p-3.5 text-center">Operaciones & Movimientos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {clients
                        .filter((c) => {
                          const matchesSearch =
                            c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                            c.cedula.includes(clientSearch) ||
                            c.phone.includes(clientSearch) ||
                            c.occupation.toLowerCase().includes(clientSearch.toLowerCase());

                          const info = getClientOverdueInfo(c.id);
                          const matchesBucket =
                            clientAgingBucket === 'ALL' || info.bucket === clientAgingBucket;

                          return matchesSearch && matchesBucket;
                        })
                        .map((c) => {
                          const info = getClientOverdueInfo(c.id);

                          return (
                            <tr
                              key={c.id}
                              className="hover:bg-slate-800/60 transition cursor-pointer group"
                              onClick={() => {
                                setSelectedClientForMovement(c);
                                setIsClientMovementModalOpen(true);
                              }}
                            >
                              <td className="p-3.5">
                                <div className="font-bold text-white text-sm group-hover:text-amber-400 transition">
                                  {c.name}
                                </div>
                                <div className="text-[11px] text-slate-400">{c.occupation}</div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-mono text-slate-200 font-semibold">{c.cedula}</div>
                                <div className="text-[11px] text-slate-400">{c.phone}</div>
                              </td>

                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${info.badgeClass}`}>
                                  {info.label}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {info.maxDays === 0 ? 'Al día sin mora' : `${info.maxDays} días de atraso`}
                                </div>
                              </td>

                              <td className="p-3.5 font-black text-amber-400 text-sm">
                                {formatDOP(info.totalBal)}
                                <div className="text-[10px] text-slate-500 font-normal">
                                  {info.activeLoansCount} crédito(s) activo(s)
                                </div>
                              </td>

                              <td className="p-3.5">
                                <div className="font-semibold text-sky-400 truncate max-w-xs">
                                  {c.bankName || 'Sin banco'}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {c.bankAccountNumber ? `${c.bankAccountType || 'Cuenta'}: ${c.bankAccountNumber}` : 'Cuenta pendiente'}
                                </div>
                              </td>

                              <td className="p-3.5">
                                {c.guarantor ? (
                                  <div>
                                    <span className="font-semibold text-slate-200 text-[11px]">{c.guarantor} (Fiador)</span>
                                    {c.coDebtor && (
                                      <div className="text-[10px] text-purple-400">
                                        Co-deudor: {c.coDebtor}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-slate-600">Personal</span>
                                )}
                              </td>

                              <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                  {/* Quick Enter Movement Button */}
                                  <button
                                    onClick={() => {
                                      setSelectedClientForMovement(c);
                                      setIsClientMovementModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs shadow flex items-center gap-1"
                                    title="Entrar a este cliente y hacer movimientos contables"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>Movimientos</span>
                                  </button>

                                  {/* Edit Client with Mandatory Journal Justification */}
                                  <button
                                    onClick={() => {
                                      setSelectedClientForEdit(c);
                                      setIsClientEditModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 transition"
                                    title="Editar datos del cliente (con asiento en Diario)"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Individual History */}
                                  <button
                                    onClick={() => setSelectedClientForHistory(c)}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg border border-slate-700 transition"
                                    title="Ver expediente histórico individual"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete Button (Only for Admin Lic. Pedro Baldera) */}
                                  {currentSession.category === 1 && (
                                    <button
                                      onClick={() => {
                                        setSelectedClientForEdit(c);
                                        setIsClientEditModalOpen(true);
                                      }}
                                      className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-400 rounded-lg border border-rose-800/40 transition"
                                      title="Borrar cliente (Administrador con Justificación en Diario)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CARTERA DE PRÉSTAMOS */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Supervisión Global de Créditos
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control de cuotas, amortización, formalización notarial y saldeos anticipados.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAmortization()}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-emerald-500/30"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Simular Amortización
                  </button>

                  <button
                    onClick={() => setIsApplicationModalOpen(true)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-950"
                  >
                    <PlusCircle className="w-4 h-4" />
                    [ 🟢 Nuevo Préstamo ]
                  </button>
                </div>
              </div>

              {/* Loans Table */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 bg-slate-950 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLoanStatusFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        loanStatusFilter === 'ALL'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Todos ({loans.length})
                    </button>
                    <button
                      onClick={() => setLoanStatusFilter('ACTIVE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        loanStatusFilter === 'ACTIVE'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      Al Día ({activeLoans.length})
                    </button>
                    <button
                      onClick={() => setLoanStatusFilter('EN_TRAMITE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        loanStatusFilter === 'EN_TRAMITE'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      En Trámite ({pendingLoans.length})
                    </button>
                    <button
                      onClick={() => setLoanStatusFilter('OVERDUE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        loanStatusFilter === 'OVERDUE'
                          ? 'bg-rose-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      En Mora ({overdueLoans.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExportLoansExcel}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Excel
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Código / Cliente</th>
                        <th className="p-3.5">Modalidad & Método</th>
                        <th className="p-3.5">Principal</th>
                        <th className="p-3.5">Cuota Periódica</th>
                        <th className="p-3.5">Balance</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredLoans.map((l) => {
                        const client = clients.find((c) => c.id === l.clientId);
                        return (
                          <tr key={l.id} className="hover:bg-slate-800/40 transition">
                            <td className="p-3.5">
                              <div className="font-bold text-white text-sm">{client?.name}</div>
                              <div className="text-[11px] text-amber-400 font-mono">
                                {l.code} • Asesor: {l.advisorName}
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-slate-200">
                                {l.frequency} ({l.rate}% mes)
                              </span>
                              <div className="text-[10px] text-slate-400">
                                {l.type === 'FIXED' && 'Francés'}
                                {l.type === 'GERMAN' && 'Alemán'}
                                {l.type === 'INTEREST_ONLY' && 'San / Solo Interés'} • {l.terms} cuotas
                              </div>
                            </td>
                            <td className="p-3.5 font-bold text-slate-200">
                              {formatDOP(l.amount)}
                            </td>
                            <td className="p-3.5 font-extrabold text-emerald-400">
                              {formatDOP(l.quota)}
                            </td>
                            <td className="p-3.5 font-black text-amber-400 text-sm">
                              {formatDOP(l.balance)}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  l.status === 'ACTIVE'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : l.status === 'OVERDUE'
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : l.status === 'EN_TRAMITE'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-purple-500/20 text-purple-300'
                                }`}
                              >
                                {l.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <button
                                  onClick={() => handleOpenAmortization(l)}
                                  className="px-2 py-1 bg-slate-800 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30 flex items-center gap-1"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5" />
                                  <span>Tabla</span>
                                </button>
                                {l.status !== 'PAID' && l.status !== 'RECHAZADO' && (
                                  <button
                                    onClick={() => handleOpenPayment(l.id)}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    Cobrar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RUTA DE COBRANZA & MAPA */}
          {activeTab === 'routes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Ruta Diaria de Cobranza con Mapa Georreferenciado
                  </h2>
                  <p className="text-xs text-slate-400">
                    Optimizada para teléfonos y tablets de cobradores en calles dominicanas.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setIsNotificationModalOpen(true)}
                    className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
                  >
                    <Bell className="w-4 h-4 text-emerald-300" />
                    <span>Avisar a Toda la Ruta (WhatsApp & SMS)</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Fecha de Ruta:</span>
                    <input
                      type="date"
                      value={routeDate}
                      onChange={(e) => setRouteDate(e.target.value)}
                      className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>

              <DominicanMap
                stops={routeStops}
                currentLocation={userLocation}
                onSelectStop={(stop) => handleOpenPayment(stop.loanId)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {routeStops.map((stop, idx) => {
                  const notifToday = notificationLogs.find(
                    (nl) => nl.clientId === stop.clientId && nl.date === routeDate
                  );
                  const cleanPhone = stop.phone.replace(/\D/g, '');
                  const formattedPhone = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
                  const waMessage = `🛵 Hola ${stop.clientName}, le saludamos de ${settings.companyName}. Le informamos que nuestro cobrador estará hoy visitando su zona en ruta. Su cuota a cobrar es DOP ${formatDOP(stop.quota)}. ¡Muchas gracias por su puntualidad!`;
                  const smsMessage = `${settings.companyName}: Estimado/a ${stop.clientName}, hoy pasamos en su ruta de cobro. Cuota: DOP ${formatDOP(stop.quota)}. Tenga su pago listo.`;

                  return (
                    <div
                      key={stop.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm">{stop.clientName}</h4>
                            <p className="text-[11px] text-slate-400">{stop.address}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 block">
                            {stop.status}
                          </span>
                          {notifToday ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 block">
                              ✓ Notificado ({notifToday.channel})
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 block">
                              Sin avisar hoy
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-950 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">Cuota a Cobrar:</span>
                          <span className="font-black text-emerald-400 text-sm">
                            {formatDOP(stop.quota)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">Balance Pendiente:</span>
                          <span className="font-bold text-amber-400">{formatDOP(stop.balance)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-1.5">
                        <a
                          href={`tel:${stop.phone}`}
                          className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1"
                          title="Llamar al cliente"
                        >
                          <Phone className="w-3.5 h-3.5" /> Tel
                        </a>
                        <a
                          href={`https://wa.me/${formattedPhone}?text=${encodeURIComponent(waMessage)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            const newLog: NotificationLog = {
                              id: `NOTIF-WA-${Date.now()}`,
                              clientId: stop.clientId,
                              clientName: stop.clientName,
                              phone: stop.phone,
                              channel: 'WHATSAPP',
                              type: 'RUTA_COBRO',
                              message: waMessage,
                              date: routeDate,
                              time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
                              status: 'ENVIADO',
                              loanCode: `PR-${stop.loanId}`,
                              amount: stop.quota,
                              sentBy: `${currentSession.name} (Ruta Directa)`,
                            };
                            setNotificationLogs((prev) => [newLog, ...prev]);
                          }}
                          className="py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-400 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-emerald-800/40"
                          title="Enviar aviso preventivo por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> WA
                        </a>
                        <a
                          href={`sms:${formattedPhone}?body=${encodeURIComponent(smsMessage)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => {
                            const newLog: NotificationLog = {
                              id: `NOTIF-SMS-${Date.now()}`,
                              clientId: stop.clientId,
                              clientName: stop.clientName,
                              phone: stop.phone,
                              channel: 'SMS',
                              type: 'RUTA_COBRO',
                              message: smsMessage,
                              date: routeDate,
                              time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
                              status: 'ENVIADO',
                              loanCode: `PR-${stop.loanId}`,
                              amount: stop.quota,
                              sentBy: `${currentSession.name} (SMS Ruta)`,
                            };
                            setNotificationLogs((prev) => [newLog, ...prev]);
                          }}
                          className="py-2 bg-sky-950/70 hover:bg-sky-900 text-sky-400 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 border border-sky-800/40"
                          title="Enviar aviso preventivo por SMS"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> SMS
                        </a>
                        <button
                          onClick={() => handleOpenPayment(stop.loanId)}
                          className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 shadow"
                        >
                          <DollarSign className="w-3.5 h-3.5" /> Cobrar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: COBROS & RECIBOS EMITIDOS */}
          {activeTab === 'payments-history' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Historial de Cobros & Recibos Digitales RD
                  </h2>
                  <p className="text-xs text-slate-400">
                    Registro de todas las transacciones realizadas con desglose e impresión térmica.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Recibo No. / Fecha</th>
                        <th className="p-3.5">Cliente / Préstamo</th>
                        <th className="p-3.5">Tipo Operación</th>
                        <th className="p-3.5">Abono Capital</th>
                        <th className="p-3.5">Interés Cobrado</th>
                        <th className="p-3.5">Monto Total</th>
                        <th className="p-3.5 text-center">Imprimir / WA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-amber-400 font-mono">
                              {p.receiptNumber}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {p.date} • {p.time}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-white">{p.clientName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{p.loanCode}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-300">
                              {p.paymentType === 'REGULAR' && 'Cuota Regular'}
                              {p.paymentType === 'CAPITAL_ONLY' && 'Abono Capital'}
                              {p.paymentType === 'INTEREST_ONLY' && 'Solo Intereses'}
                              {p.paymentType === 'PAYOFF' && 'Saldeo Total'}
                            </span>
                            <div className="text-[10px] text-slate-500 uppercase">{p.method}</div>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-300">
                            {formatDOP(p.capitalPaid)}
                          </td>
                          <td className="p-3.5 font-semibold text-emerald-400">
                            {formatDOP(p.interestPaid)}
                          </td>
                          <td className="p-3.5 font-black text-amber-400 text-sm">
                            {formatDOP(p.amount)}
                          </td>
                          <td className="p-3.5 text-center">
                            <button
                              onClick={() => {
                                setCurrentReceiptPayment(p);
                                setIsReceiptModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 mx-auto"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Recibo
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GASTOS G&A (ADMIN) & GASTOS OPERATIVOS POR INQUILINO */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-rose-400" />
                    Gastos Generales, Administrativos & Presupuesto por Inquilino
                  </h2>
                  <p className="text-xs text-slate-400">
                    Control de nómina, servicios públicos, combustible, alquiler y suministros aislados para <span className="text-amber-400 font-bold">{activeTenant.name}</span> ({activeTenant.dbSchema}).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCreateExpense}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-950"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Registrar Gasto Matriz
                  </button>
                </div>
              </div>

              {/* Tenant Isolated Expenses Panel */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="font-black text-white text-sm">
                        Gastos Operativos: {activeTenant.name} ({activeTenant.currency})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Esquema: <span className="font-mono text-indigo-300">{activeTenant.dbSchema}</span> • Balance Inicial: <span className="font-bold text-emerald-400">{activeTenant.currency} {activeTenant.balance.toLocaleString('es-DO')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Total Gastos Inquilino:</span>
                    <span className="text-base font-black text-rose-400">
                      {activeTenant.currency} {(allTenantExpenses[activeTenant.id] || []).reduce((s, e) => s + e.amount, 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Form to add new tenant expense */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    Agregar Gasto para este Inquilino ({activeTenant.name})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Categoría:</label>
                      <select
                        value={newExpCat}
                        onChange={(e) => setNewExpCat(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      >
                        <option value="Nómina">Nómina</option>
                        <option value="Servicios Publicos">Servicios Públicos</option>
                        <option value="Combustible">Combustible</option>
                        <option value="Alquiler">Alquiler</option>
                        <option value="Suministros">Suministros</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Descripción / Concepto:</label>
                      <input
                        type="text"
                        placeholder="ej. Factura energía eléctrica oficina central"
                        value={newExpDesc}
                        onChange={(e) => setNewExpDesc(e.target.value)}
                        className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-semibold block mb-1">Monto ({activeTenant.currency}):</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={newExpAmt}
                          onChange={(e) => setNewExpAmt(e.target.value)}
                          className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-bold"
                        />
                        <button
                          onClick={() => {
                            const val = parseFloat(newExpAmt);
                            if (!val || val <= 0) return alert('Ingrese un monto válido');
                            if (!newExpDesc.trim()) return alert('Ingrese una descripción');
                            const newItem: TenantExpenseItem = {
                              id: Date.now(),
                              date: new Date().toISOString().split('T')[0],
                              category: newExpCat,
                              description: newExpDesc.trim(),
                              amount: val,
                            };
                            setAllTenantExpenses((prev) => ({
                              ...prev,
                              [activeTenant.id]: [newItem, ...(prev[activeTenant.id] || [])],
                            }));
                            setNewExpDesc('');
                            setNewExpAmt('');
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table of tenant expenses */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Categoría</th>
                        <th className="p-3">Descripción</th>
                        <th className="p-3 text-right">Monto ({activeTenant.currency})</th>
                        <th className="p-3 text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {(allTenantExpenses[activeTenant.id] || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-slate-500 text-xs">
                            Sin gastos registrados para {activeTenant.name}.
                          </td>
                        </tr>
                      ) : (
                        (allTenantExpenses[activeTenant.id] || []).map((exp) => (
                          <tr key={exp.id} className="hover:bg-slate-800/40">
                            <td className="p-3 text-slate-400 font-mono">{exp.date}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                                {exp.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-200">{exp.description}</td>
                            <td className="p-3 text-right font-black text-rose-400">
                              {activeTenant.currency} {exp.amount.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => {
                                  setAllTenantExpenses((prev) => ({
                                    ...prev,
                                    [activeTenant.id]: (prev[activeTenant.id] || []).filter((e) => e.id !== exp.id),
                                  }));
                                }}
                                className="p-1 hover:text-rose-400 text-slate-500 transition"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matriz General Expenses Table */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">
                    Historial Consolidado de Gastos de la Empresa Matriz
                  </h3>
                  <span className="text-[11px] font-bold text-amber-400">
                    Total: {formatDOP(expenses.reduce((s, e) => s + e.amount, 0))}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Fecha</th>
                        <th className="p-3.5">Categoría</th>
                        <th className="p-3.5">Descripción / Concepto</th>
                        <th className="p-3.5">Registrado Por</th>
                        <th className="p-3.5 text-right">Monto (DOP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {expenses.map((e) => (
                        <tr key={e.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 text-slate-400 font-mono">{e.date}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                              {e.category}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-200 font-medium">{e.description}</td>
                          <td className="p-3.5 text-slate-400">{e.registeredBy}</td>
                          <td className="p-3.5 text-right font-black text-rose-400 text-sm">
                            {formatDOP(e.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CUENTAS POR PAGAR (PASIVOS) & CARTERA DE ANTIGÜEDAD */}
          {activeTab === 'payables' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-purple-400" />
                    Cuentas por Pagar (Pasivos) & Cartera de Antigüedad
                  </h2>
                  <p className="text-xs text-slate-400">
                    Obligaciones con inversionistas de capital, proveedores y talleres clasificadas de 0 a 30 días, 31 a 60 días, 61 a 90 días y más de 90 días. Haga click sobre cualquiera para entrar y realizar abonos o editar.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleExportPayablesAgingCSV}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Exportar reporte de cuentas por pagar a Excel"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Pasivos Excel</span>
                  </button>

                  <button
                    onClick={() => setIsJournalModalOpen(true)}
                    className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                    title="Ver Libro Diario de todas las transacciones"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Libro Diario ({journalEntries.length})</span>
                  </button>
                </div>
              </div>

              {/* 4 BUCKETS AGING CARDS FOR PAYABLES */}
              {(() => {
                const pay0_30 = payables.filter((p) => getPayableOverdueInfo(p).bucket === '0_30');
                const pay31_60 = payables.filter((p) => getPayableOverdueInfo(p).bucket === '31_60');
                const pay61_90 = payables.filter((p) => getPayableOverdueInfo(p).bucket === '61_90');
                const payMAS_90 = payables.filter((p) => getPayableOverdueInfo(p).bucket === 'MAS_90');

                const bal0_30 = pay0_30.reduce((s, p) => s + p.balance, 0);
                const bal31_60 = pay31_60.reduce((s, p) => s + p.balance, 0);
                const bal61_90 = pay61_90.reduce((s, p) => s + p.balance, 0);
                const balMAS_90 = payMAS_90.reduce((s, p) => s + p.balance, 0);

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <button
                      onClick={() => setPayableAgingBucket('ALL')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        payableAgingBucket === 'ALL'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total Pasivos</div>
                      <div className="text-xl font-black text-white mt-1">{payables.length}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal0_30 + bal31_60 + bal61_90 + balMAS_90)}
                      </div>
                    </button>

                    <button
                      onClick={() => setPayableAgingBucket('0_30')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        payableAgingBucket === '0_30'
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-emerald-400">
                          0 a 30 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-xl font-black text-emerald-400 mt-1">
                        {pay0_30.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal0_30)} • Vigente
                      </div>
                    </button>

                    <button
                      onClick={() => setPayableAgingBucket('31_60')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        payableAgingBucket === '31_60'
                          ? 'bg-amber-500/25 border-amber-400 text-amber-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-amber-400">
                          31 a 60 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      </div>
                      <div className="text-xl font-black text-amber-400 mt-1">
                        {pay31_60.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal31_60)} • Vencido
                      </div>
                    </button>

                    <button
                      onClick={() => setPayableAgingBucket('61_90')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        payableAgingBucket === '61_90'
                          ? 'bg-orange-500/25 border-orange-400 text-orange-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-orange-400">
                          61 a 90 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                      </div>
                      <div className="text-xl font-black text-orange-400 mt-1">
                        {pay61_90.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(bal61_90)} • En Mora
                      </div>
                    </button>

                    <button
                      onClick={() => setPayableAgingBucket('MAS_90')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        payableAgingBucket === 'MAS_90'
                          ? 'bg-rose-500/25 border-rose-400 text-rose-300'
                          : 'bg-slate-900/80 border-slate-800 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-extrabold text-rose-400">
                          Más de 90 Días
                        </span>
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      </div>
                      <div className="text-xl font-black text-rose-400 mt-1">
                        {payMAS_90.length}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {formatDOP(balMAS_90)} • Crítico
                      </div>
                    </button>
                  </div>
                );
              })()}

              {/* Payables Table with Click-to-Enter Drawer */}
              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Acreedor / Inversionista</th>
                        <th className="p-3.5">Categoría</th>
                        <th className="p-3.5">Monto Original</th>
                        <th className="p-3.5">Balance Pendiente</th>
                        <th className="p-3.5">Vencimiento & Mora</th>
                        <th className="p-3.5">Rango Antigüedad</th>
                        <th className="p-3.5 text-center">Acciones & Movimientos</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {payables
                        .filter((p) => {
                          const info = getPayableOverdueInfo(p);
                          return payableAgingBucket === 'ALL' || info.bucket === payableAgingBucket;
                        })
                        .map((p) => {
                          const info = getPayableOverdueInfo(p);

                          return (
                            <tr
                              key={p.id}
                              className="hover:bg-slate-800/60 transition cursor-pointer group"
                              onClick={() => {
                                setSelectedPayableForMovement(p);
                                setIsPayableMovementModalOpen(true);
                              }}
                            >
                              <td className="p-3.5">
                                <div className="font-bold text-white text-sm group-hover:text-purple-300 transition">
                                  {p.creditor}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">{p.id}</div>
                              </td>

                              <td className="p-3.5">
                                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-amber-300">
                                  {p.category || 'INVERSIONISTA'}
                                </span>
                              </td>

                              <td className="p-3.5 text-slate-300 font-semibold">
                                {formatDOP(p.amount)}
                              </td>

                              <td className="p-3.5 font-black text-rose-400 text-sm">
                                {formatDOP(p.balance)}
                              </td>

                              <td className="p-3.5">
                                <div className="text-slate-300 font-mono">{p.dueDate}</div>
                                <div className="text-[10px] text-slate-500">
                                  {info.days > 0 ? `${info.days} días vencido` : 'Al día'}
                                </div>
                              </td>

                              <td className="p-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${info.badgeClass}`}>
                                  {info.label}
                                </span>
                              </td>

                              <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedPayableForMovement(p);
                                      setIsPayableMovementModalOpen(true);
                                    }}
                                    className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow"
                                    title="Entrar a esta cuenta por pagar y hacer movimientos"
                                  >
                                    <DollarSign className="w-3.5 h-3.5" />
                                    <span>Entrar & Abonar</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedPayableForMovement(p);
                                      setIsPayableMovementModalOpen(true);
                                    }}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700"
                                    title="Editar datos con asiento en Diario"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: ESTADOS FINANCIEROS RD (ADMIN) */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Estados Financieros de la Entidad RD
                  </h2>
                  <p className="text-xs text-slate-400">
                    Estado de Resultados (P&L), Balance General y Flujo de Caja en tiempo real.
                  </p>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Estados Financieros
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-black text-amber-400 text-base">Estado de Resultados (P&L)</h3>
                    <p className="text-[11px] text-slate-400">Ganancias y Pérdidas del Período</p>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">Ingresos por Intereses Cobrados:</span>
                      <span className="font-bold text-emerald-400">{formatDOP(totalInterestPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Ingresos por Gastos de Cierre:</span>
                      <span className="font-bold text-emerald-400">{formatDOP(totalClosingFees)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Recargos por Mora:</span>
                      <span className="font-bold text-emerald-400">{formatDOP(totalLateFeesPaid)}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex justify-between font-bold">
                      <span className="text-white">Total Ingresos:</span>
                      <span className="text-emerald-400">{formatDOP(totalIncome)}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>(-) Gastos Generales y Admin:</span>
                      <span className="font-bold">({formatDOP(totalExpenses)})</span>
                    </div>
                    <div className="pt-3 border-t-2 border-slate-700 flex justify-between items-center text-sm font-black">
                      <span className="text-white">GANANCIA NETA:</span>
                      <span className="text-amber-400 text-base">{formatDOP(netProfit)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-black text-amber-400 text-base">Balance General</h3>
                    <p className="text-[11px] text-slate-400">Situación Patrimonial Consolidada</p>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Activos</div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Efectivo en Caja/Bancos:</span>
                      <span className="font-bold text-emerald-400">{formatDOP(availableCash)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-300">Cartera Activa por Cobrar:</span>
                      <span className="font-bold text-slate-200">{formatDOP(totalPortfolioBalance)}</span>
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider pt-2">Pasivos & Patrimonio</div>
                    <div className="flex justify-between text-rose-400">
                      <span>Cuentas por Pagar:</span>
                      <span className="font-bold">{formatDOP(totalLiabilities)}</span>
                    </div>
                    <div className="flex justify-between text-amber-400 font-bold">
                      <span>Capital / Patrimonio Neto:</span>
                      <span>{formatDOP(equity)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="border-b border-slate-800 pb-3">
                    <h3 className="font-black text-amber-400 text-base">Flujo de Efectivo</h3>
                    <p className="text-[11px] text-slate-400">Entradas y Salidas de Caja</p>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-300">(+) Cobros Totales Realizados:</span>
                      <span className="font-bold text-emerald-400">{formatDOP(totalCollected)}</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>(-) Préstamos Desembolsados:</span>
                      <span className="font-bold">({formatDOP(totalDisbursed)})</span>
                    </div>
                    <div className="flex justify-between text-rose-400">
                      <span>(-) Gastos de Operación:</span>
                      <span className="font-bold">({formatDOP(totalExpenses)})</span>
                    </div>
                    <div className="pt-3 border-t-2 border-slate-700 flex justify-between items-center text-sm font-black">
                      <span className="text-white">SALDO EN CAJA:</span>
                      <span className="text-emerald-400 text-base">{formatDOP(availableCash)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: NÓMINA (ADMIN) */}
          {activeTab === 'payroll' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Nómina de Cobradores & Asesores de Crédito
                  </h2>
                  <p className="text-xs text-slate-400">
                    Sueldo base, comisiones por cobranza en calle y liquidación periódica.
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">Empleado</th>
                        <th className="p-3.5">Rol / Cargo</th>
                        <th className="p-3.5">Salario Base</th>
                        <th className="p-3.5">Cobranza Realizada</th>
                        <th className="p-3.5">Comisión (%)</th>
                        <th className="p-3.5">Sueldo Neto</th>
                        <th className="p-3.5 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {payroll.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-white text-sm">{emp.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{emp.cedula}</div>
                          </td>
                          <td className="p-3.5 font-semibold text-amber-400">{emp.role}</td>
                          <td className="p-3.5 text-slate-300 font-semibold">{formatDOP(emp.baseSalary)}</td>
                          <td className="p-3.5 text-emerald-400 font-semibold">{formatDOP(emp.collectedThisPeriod)}</td>
                          <td className="p-3.5 text-slate-300">{emp.commissionPercent}%</td>
                          <td className="p-3.5 font-black text-white text-sm">{formatDOP(emp.netSalary)}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: GOOGLE AI STUDIO HUB */}
          {activeTab === 'ai-hub' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-amber-400" />
                  Google AI Studio (Gemini 3.8 Flash) Módulo Inteligente
                </h2>
                <p className="text-xs text-slate-400">
                  Scoring crediticio popular, Vision AI para Cédulas RD, Asistente de Cobro y Auditoría de Riesgo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-3 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-amber-400 font-bold mb-1">
                      <Sparkles className="w-5 h-5" />
                      <h3 className="text-sm">Scoring Crediticio Informal RD</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Algoritmo adaptado al microcrédito dominicano (colmados, motoconchos, talleres, independientes).
                    </p>
                  </div>
                  <button
                    onClick={() => setIsApplicationModalOpen(true)}
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    Evaluar Nueva Solicitud
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                      <MessageCircle className="w-5 h-5" />
                      <h3 className="text-sm">Cobrador Virtual Dominicano</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Redacción de mensajes persuasivos y respetuosos adaptados a los días exactos de mora.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (loans.length > 0) {
                        setSelectedLoanForWhatsApp(loans[0].id);
                        setIsWhatsAppModalOpen(true);
                      }
                    }}
                    className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    Abrir Redactor WhatsApp AI
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-3 flex flex-col justify-between shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 font-bold mb-1">
                      <FileText className="w-5 h-5" />
                      <h3 className="text-sm">Lector Vision AI Cédula RD</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Extracción automática de nombre, Cédula 001-XXXXXXX-X, fecha de nacimiento y dirección sin digitación manual.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsApplicationModalOpen(true)}
                    className="w-full py-2.5 bg-sky-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow"
                  >
                    Escanear Documento Cédula
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: CONFIGURACIÓN MULTI-EMPRESA & SOPORTE */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Configuración del Sistema & Marca Blanca
                </h2>
                <p className="text-xs text-slate-400">
                  Personalice el nombre del prestamista o empresa para vender e implementar la plataforma.
                </p>
              </div>

              <div className="p-6 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">
                    Nombre de la Empresa / Prestamista (Editable para Venta) *
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-amber-400 font-bold text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">RNC Dominicano</label>
                    <input
                      type="text"
                      value={settings.rnc}
                      onChange={(e) => setSettings({ ...settings, rnc: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-medium block mb-1">Teléfono Principal</label>
                    <input
                      type="text"
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-medium block mb-1">
                    Dirección Física del Negocio (RD)
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <h4 className="font-bold text-amber-400 text-xs">
                    Datos del Soporte Técnico (Editable)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">
                        Nombre del Encargado de Soporte
                      </label>
                      <input
                        type="text"
                        value={settings.technicalSupportName}
                        onChange={(e) =>
                          setSettings({ ...settings, technicalSupportName: e.target.value })
                        }
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 font-medium block mb-1">
                        Contacto / WhatsApp Soporte
                      </label>
                      <input
                        type="text"
                        value={settings.technicalSupportPhone}
                        onChange={(e) =>
                          setSettings({ ...settings, technicalSupportPhone: e.target.value })
                        }
                        className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      alert('¡Configuración guardada exitosamente!');
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl text-xs shadow-lg"
                  >
                    Guardar Parámetros
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>

      {/* MODALS */}
      {/* 1. SuperAdmin SaaS Licensing & Approval Modal (Lic Pedro Baldera) */}
      {isLicensingModalOpen && (
        <SuperAdminLicensingModal
          companies={companies}
          clients={clients}
          loans={loans}
          settings={settings}
          onClose={() => setIsLicensingModalOpen(false)}
          onUpdateCompanies={(updated) => setCompanies(updated)}
          onUpdateClients={(updated) => setClients(updated)}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
        />
      )}

      {/* 2. Smart Authentication & Category Login Modal */}
      {isAuthModalOpen && (
        <SmartAuthModal
          companies={companies}
          clients={clients}
          users={users}
          settings={settings}
          currentSession={currentSession}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(session) => {
            setCurrentSession(session);
            confetti({ particleCount: 50, spread: 60 });
          }}
          onRegisterCompany={handleRegisterNewCompany}
          onLockAccount={handleLockAccount}
          onIncrementFailedAttempt={handleIncrementFailedAttempt}
        />
      )}

      {/* 3. Automatic 10-Second Backup & Restore Manager */}
      {isBackupModalOpen && (
        <BackupManagerModal
          companies={companies}
          clients={clients}
          loans={loans}
          payments={payments}
          expenses={expenses}
          payables={payables}
          payroll={payroll}
          users={users}
          settings={settings}
          onClose={() => setIsBackupModalOpen(false)}
          onRestoreBackup={handleRestoreBackup}
        />
      )}

      {/* 4. Client Individual Historical Database Modal */}
      {selectedClientForHistory && (
        <ClientIndividualHistoryModal
          client={selectedClientForHistory}
          loans={loans}
          payments={payments}
          settings={settings}
          onClose={() => setSelectedClientForHistory(null)}
          onOpenAmortization={(loan) => handleOpenAmortization(loan)}
        />
      )}

      {/* 5. Detailed Loan Amortization Schedule & Simulator Modal */}
      {isAmortizationModalOpen && (
        <AmortizationScheduleModal
          loan={selectedLoanForAmortization}
          clientName={
            clients.find((c) => c.id === selectedLoanForAmortization?.clientId)?.name || 'Cliente'
          }
          settings={settings}
          onClose={() => setIsAmortizationModalOpen(false)}
        />
      )}

      {/* 6. User & Advisor Management Modal */}
      {isUserManagementModalOpen && (
        <UserManagementModal
          users={users}
          currentSession={currentSession}
          onClose={() => setIsUserManagementModalOpen(false)}
          onAddUser={(u) => setUsers([u, ...users])}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* 7. Online Loan Application & Digitization Modal */}
      {isApplicationModalOpen && (
        <ClientApplicationModal
          onClose={() => setIsApplicationModalOpen(false)}
          onSubmitApplication={handleCreateOnlineApplication}
        />
      )}

      {/* 8. Payment Transaction Modal */}
      {isPaymentModalOpen && selectedLoanForPayment && (
        <PaymentModal
          loan={selectedLoanForPayment}
          clientName={
            clients.find((c) => c.id === selectedLoanForPayment.clientId)?.name || 'Cliente'
          }
          collectorName={settings.technicalSupportName}
          onClose={() => setIsPaymentModalOpen(false)}
          onSubmitPayment={handleProcessPayment}
        />
      )}

      {/* 9. Official Receipt Modal */}
      {isReceiptModalOpen && currentReceiptPayment && (
        <ReceiptModal
          payment={currentReceiptPayment}
          settings={settings}
          onClose={() => setIsReceiptModalOpen(false)}
          onSendGmail={(payment) => {
            setActiveGmailDraft({
              paymentId: payment.id,
              templateType: 'RECEIPT',
            });
            setIsGmailModalOpen(true);
          }}
        />
      )}

      {/* 10. Dominican Pagaré Notarial & Signature Modal */}
      {isContractModalOpen && selectedLoanForContract && (
        <ContractModal
          loan={selectedLoanForContract}
          client={clients.find((c) => c.id === selectedLoanForContract.clientId) || null}
          settings={settings}
          onClose={() => setIsContractModalOpen(false)}
          onSaveSignature={handleSaveSignature}
        />
      )}

      {/* 11. Refinance / Reenganche Modal */}
      {isRefinanceModalOpen && selectedLoanForRefinance && (
        <RefinanceModal
          loan={selectedLoanForRefinance}
          clientName={
            clients.find((c) => c.id === selectedLoanForRefinance.clientId)?.name || 'Cliente'
          }
          onClose={() => setIsRefinanceModalOpen(false)}
          onConfirmRefinance={handleRefinanceConfirm}
        />
      )}

      {/* 12. WhatsApp Dominican Assistant Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppAssistantModal
          loans={loans}
          clients={clients}
          settings={settings}
          selectedLoanId={selectedLoanForWhatsApp}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}

      {/* 13. Voucher Verification & Bank Deposit Approval Modal */}
      {isVoucherModalOpen && (
        <VoucherVerificationModal
          vouchers={vouchers}
          loans={loans}
          clients={clients}
          extraCharges={extraCharges}
          reviewerName={currentSession.name}
          onClose={() => setIsVoucherModalOpen(false)}
          onSubmitNewVoucher={handleSubmitNewVoucher}
          onApproveVoucher={handleApproveVoucher}
          onRejectVoucher={handleRejectVoucher}
        />
      )}

      {/* 14. Extra Charges (GPS, Notaría, Visitas & Exoneración) Modal */}
      {isExtraChargesModalOpen && (
        <ExtraChargesModal
          extraCharges={extraCharges}
          loans={loans}
          clients={clients}
          authorizedUserName={currentSession.name}
          onClose={() => setIsExtraChargesModalOpen(false)}
          onAddCharge={handleAddExtraCharge}
          onSettleCharge={handleSettleExtraCharge}
          onExonerateCharge={handleExonerateExtraCharge}
        />
      )}

      {/* 15. Edición & Modificación de Clientes con Asiento en Diario (Admin & Gerente) */}
      {isClientEditModalOpen && selectedClientForEdit && (
        <ClientEditModal
          isOpen={isClientEditModalOpen}
          client={selectedClientForEdit}
          currentSession={currentSession}
          onClose={() => {
            setIsClientEditModalOpen(false);
            setSelectedClientForEdit(null);
          }}
          onSaveClient={handleSaveClientEdit}
          onDeleteClient={handleDeleteClient}
        />
      )}

      {/* 16. Entrar a Cliente & Movimientos Inmediatos (Actualizar Todo Ya) */}
      {isClientMovementModalOpen && selectedClientForMovement && (
        <ClientMovementDetailModal
          isOpen={isClientMovementModalOpen}
          client={selectedClientForMovement}
          loans={loans}
          currentSession={currentSession}
          journalEntries={journalEntries}
          onClose={() => {
            setIsClientMovementModalOpen(false);
            setSelectedClientForMovement(null);
          }}
          onOpenPaymentForLoan={(loanId) => {
            const targetLoan = loans.find((l) => l.id === loanId);
            if (targetLoan) {
              setSelectedLoanForPayment(targetLoan);
              setIsPaymentModalOpen(true);
            }
          }}
          onOpenAmortizationForLoan={(loan) => {
            setSelectedLoanForAmortization(loan);
            setIsAmortizationModalOpen(true);
          }}
          onOpenExtraCharges={() => setIsExtraChargesModalOpen(true)}
          onOpenEditClient={(clientToEdit) => {
            setSelectedClientForEdit(clientToEdit);
            setIsClientEditModalOpen(true);
          }}
          onQuickAdjustment={handleQuickClientAdjustment}
        />
      )}

      {/* 17. Entrar a Cuentas por Pagar & Movimientos / Abono Inmediato */}
      {isPayableMovementModalOpen && selectedPayableForMovement && (
        <PayableMovementModal
          isOpen={isPayableMovementModalOpen}
          payable={selectedPayableForMovement}
          currentSession={currentSession}
          onClose={() => {
            setIsPayableMovementModalOpen(false);
            setSelectedPayableForMovement(null);
          }}
          onUpdatePayable={handleUpdatePayable}
          onSettlePayable={handlePayablePayment}
        />
      )}

      {/* 18. Libro Diario General & Auditoría de Transacciones */}
      {isJournalModalOpen && (
        <GeneralJournalModal
          isOpen={isJournalModalOpen}
          journalEntries={journalEntries}
          currentSession={currentSession}
          onClose={() => setIsJournalModalOpen(false)}
          onAddManualJournalEntry={(entry) =>
            setJournalEntries((prev) => [entry, ...prev])
          }
        />
      )}

      {/* 19. Entrada de Clientes con Balance Inicial & Cartera Migrada (2 Modalidades) */}
      {isInitialBalanceModalOpen && (
        <InitialBalanceOnboardingModal
          isOpen={isInitialBalanceModalOpen}
          currentSession={currentSession}
          onClose={() => setIsInitialBalanceModalOpen(false)}
          onCompleteOnboarding={handleCompleteInitialBalanceOnboarding}
        />
      )}

      {/* 20. Archivo Histórico Secreto de Claves (Solo Admin / Desarrollador Pedro Baldera) */}
      {isSecretVaultModalOpen && (
        <SecretPasswordVaultModal
          isOpen={isSecretVaultModalOpen}
          currentSession={currentSession}
          settings={settings}
          users={users}
          companies={companies}
          clients={clients}
          secretRecords={secretVaultRecords}
          onClose={() => setIsSecretVaultModalOpen(false)}
          onUpdateUserPassword={handleUpdateUserPassword}
          onUpdateCompanyPassword={handleUpdateCompanyPassword}
          onUpdateClientPassword={handleUpdateClientPassword}
          onUnlockAccount={handleUnlockAccount}
        />
      )}

      {/* 21. Servicio de Notificaciones Automáticas WhatsApp & SMS */}
      {isNotificationModalOpen && (
        <NotificationCenterModal
          isOpen={isNotificationModalOpen}
          loans={loans}
          clients={clients}
          routeStops={routeStops}
          settings={settings}
          currentSession={currentSession}
          notificationLogs={notificationLogs}
          onClose={() => setIsNotificationModalOpen(false)}
          onSendNotification={(log) => setNotificationLogs((prev) => [log, ...prev])}
          onOpenGmail={(client, loan) => {
            setActiveGmailDraft({
              clientId: client?.id,
              loanId: loan?.id,
              templateType: 'DUE_SOON',
            });
            setIsGmailModalOpen(true);
          }}
        />
      )}

      {/* 22. Centro Oficial de Notificaciones Gmail & Google Workspace */}
      {isGmailModalOpen && (
        <GmailManagerModal
          isOpen={isGmailModalOpen}
          clients={clients}
          loans={loans}
          payments={payments}
          settings={settings}
          currentSession={currentSession}
          initialDraft={activeGmailDraft}
          onClose={() => {
            setIsGmailModalOpen(false);
            setActiveGmailDraft(undefined);
          }}
          onLogNotification={(log) => {
            setNotificationLogs((prev) => [log, ...prev]);
            setJournalEntries((prev) => [
              {
                id: `ASIENTO-GM-${Date.now()}`,
                entryNumber: `ASIENTO-0${prev.length + 1}`,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
                entityType: 'CLIENTE',
                entityId: log.clientId,
                entityName: log.clientName,
                actionType: 'MODIFICACION',
                justification: `Notificación formal enviada vía Gmail: "${log.subject || 'Aviso'}" a ${log.email || log.phone}`,
                userIdentifier: currentSession.identifier,
                userName: currentSession.name,
                userRole: currentSession.categoryLabel,
                changesSummary: log.message,
              },
              ...prev,
            ]);
          }}
        />
      )}
    </div>
  );
}
