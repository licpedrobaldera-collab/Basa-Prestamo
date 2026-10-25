export type LoanFrequency = 'DIARIO' | 'SEMANAL' | 'QUINCENAL' | 'MENSUAL';
export type LoanType = 'FIXED' | 'INTEREST_ONLY' | 'GERMAN';
export type LoanStatus = 'EN_TRAMITE' | 'APROBADO' | 'RECHAZADO' | 'ACTIVE' | 'OVERDUE' | 'PAID';
export type PaymentType = 'REGULAR' | 'CAPITAL_ONLY' | 'INTEREST_ONLY' | 'PAYOFF';
export type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'TARJETA';
export type UserRole = 'ADMIN' | 'OPERATIVO';

export type AppRole = 'CLIENTE' | 'COBRADOR' | 'AUXILIAR' | 'GERENTE' | 'ADMIN' | 'DEV';

export interface RolePermissions {
  role: AppRole;
  label: string;
  shortDescription: string;
  portalPath: string;
  badgeColor: string;
  canViewClients: 'SOLO_EL_SUYO' | 'ASIGNADOS_A_RUTA' | 'TODOS';
  canApproveLoans: 'NO' | 'PRELIMINAR' | 'SI' | 'ACCESO_TOTAL';
  canCollectInRoute: boolean;
  canCollectInOffice: boolean;
  canConfigureSystem: 'NO' | 'LIMITADO' | 'SI' | 'ACCESO_TOTAL';
  canViewAudit: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'ASESOR' | 'COBRADOR' | 'SUPERVISOR' | 'GERENTE' | 'AUXILIAR' | 'DEV';
  phone: string;
  cedula: string;
  password?: string;
  passwordHistory?: PasswordHistoryItem[];
  failedAttempts?: number;
  isLocked?: boolean;
  lockReason?: string;
  status: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  activeLoansCount?: number;
  totalPortfolio?: number;
  totalCollected?: number;
}

export interface Client {
  id: string;
  name: string;
  cedula: string;
  phone: string;
  whatsapp: string;
  occupation: string;
  monthlyIncome: number;
  address: string;
  gpsLat?: number;
  gpsLng?: number;
  companyId?: string;
  creditScore?: number;
  // Categoría 4: Garante o Codeudor
  guarantor?: string;
  guarantorCedula?: string;
  guarantorPhone?: string;
  guarantorRelation?: string;
  // Categoría 5: Co-deudor (segundo garante solidario)
  coDebtor?: string;
  coDebtorCedula?: string;
  coDebtorPhone?: string;
  coDebtorRelation?: string;
  // Credenciales y Seguridad
  email?: string;
  password?: string;
  passwordHistory?: PasswordHistoryItem[];
  failedAttempts?: number;
  isLocked?: boolean;
  lockReason?: string;
  // Datos Bancarios para Desembolso Dominicano
  bankName?: string;
  bankAccountType?: 'AHORROS' | 'CORRIENTE';
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  collateralType?: 'VEHICULO' | 'INMUEBLE' | 'ELECTRODOMESTICO' | 'JOYA' | 'OTRO';
  collateralDesc?: string;
  collateralPhotos?: string[];
  idPhotoFront?: string;
  idPhotoBack?: string;
  incomeProofPhoto?: string;
  reputation?: string;
  notes?: string;
  createdAt: string;
}

export interface AmortizationRow {
  installmentNumber: number;
  dueDate: string;
  quota: number;
  capital: number;
  interest: number;
  balanceRemaining: number;
  status: 'PENDIENTE' | 'PAGADO' | 'ATRASADO';
}

export interface Loan {
  id: string;
  code: string;
  clientId: string;
  amount: number;
  closingFee: number;
  netDisbursed: number;
  rate: number;
  frequency: LoanFrequency;
  type: LoanType;
  terms: number;
  quota: number;
  totalWithInterest: number;
  balance: number;
  capitalBalance: number;
  interestBalance: number;
  totalPaid: number;
  status: LoanStatus;
  advisorId: string;
  advisorName: string;
  createdDate: string;
  dueDate: string;
  contractSigned: boolean;
  contractSignatureData?: string;
  contractSignedDate?: string;
  promissoryNoteText?: string;
  schedule: AmortizationRow[];
  daysOverdue?: number;
  notes?: string;
  // Desembolso Bancario Dominicano
  disbursementBank?: string;
  disbursementAccount?: string;
  disbursementAccountType?: 'AHORROS' | 'CORRIENTE';
  disbursementConfirmed?: boolean;
  disbursementProofPhoto?: string;
  extraChargesTotal?: number;
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  loanId: string;
  loanCode: string;
  clientId: string;
  clientName: string;
  amount: number;
  capitalPaid: number;
  interestPaid: number;
  lateFeePaid: number;
  extraChargesPaid?: number;
  adminFeePaid?: number;
  voucherVerificationId?: string;
  bankReference?: string;
  paymentType: PaymentType;
  method: PaymentMethod;
  date: string;
  time: string;
  proofPhoto?: string;
  collectorName: string;
  notes?: string;
  balanceAfter: number;
}

export interface PaymentVoucherVerification {
  id: string;
  receiptNumber: string;
  loanId: string;
  loanCode: string;
  clientId: string;
  clientName: string;
  clientCedula: string;
  bankName: string; // Ej. Banco de Reservas, Banco Popular Dominicano, Banco BHD
  accountNumber: string;
  referenceNumber: string; // Número de transferencia / depósito
  amountPaid: number;
  submittedDate: string;
  submittedTime: string;
  proofPhotoUrl?: string;
  status: 'PENDIENTE_VERIFICACION' | 'APROBADO' | 'RECHAZADO';
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
  appliedTransactionId?: string;
  notes?: string;
}

export interface ExtraCharge {
  id: string;
  loanId: string;
  loanCode: string;
  clientId: string;
  clientName: string;
  concept: string; // 'Gasto Notarial' | 'Rastreador GPS' | 'Notificación Legal' | 'Visita de Cobranza' | 'Seguro de Deuda' | 'Mora Administrativa' | 'Otro';
  amount: number;
  isCapitalized: boolean; // true = capitalizado (se suma al capital/balance); false = cargo único
  status: 'PENDIENTE' | 'PAGADO' | 'EXONERADO';
  createdDate: string;
  createdBy: string;
  settledDate?: string;
  settledBy?: string;
  exemptedDate?: string;
  exemptedBy?: string;
  exemptReason?: string;
  notes?: string;
}

export interface RouteStop {
  id: string;
  loanId: string;
  clientId: string;
  clientName: string;
  address: string;
  phone: string;
  gpsLat: number;
  gpsLng: number;
  quota: number;
  balance: number;
  frequency: LoanFrequency;
  status: 'PENDIENTE' | 'PAGADO' | 'PROMESA' | 'AUSENTE' | 'INUBICABLE';
  promiseDate?: string;
  notes?: string;
  visitTime?: string;
}

export interface ExpenseRecord {
  id: string;
  category: 'Combustible' | 'Nómina' | 'Alquiler' | 'Servicios' | 'Notaría / Legal' | 'Mantenimiento' | 'Otros';
  amount: number;
  description: string;
  date: string;
  registeredBy: string;
}

export interface AccountPayable {
  id: string;
  creditor: string;
  amount: number;
  balance: number;
  dueDate: string;
  createdDate?: string;
  status: 'PENDIENTE' | 'PAGADO';
  notes?: string;
  category?: 'INVERSIONISTA' | 'PROVEEDOR' | 'TALLER' | 'OFICINA' | 'OTRO';
  daysOverdue?: number;
  lastPaymentDate?: string;
}

export type JournalEntityType =
  | 'CLIENTE'
  | 'PRESTAMO'
  | 'CUENTA_POR_PAGAR'
  | 'PAGO'
  | 'CARGO_EXTRA'
  | 'AJUSTE_GENERAL';

export type JournalActionType =
  | 'CREACION'
  | 'MODIFICACION'
  | 'ELIMINACION'
  | 'ABONO'
  | 'PAGO_TOTAL'
  | 'AJUSTE_SALDO'
  | 'EXONERACION';

export interface JournalEntry {
  id: string;
  entryNumber: string; // ej. ASIENTO-001
  date: string;
  time: string;
  entityType: JournalEntityType;
  entityId: string;
  entityName: string;
  actionType: JournalActionType;
  justification: string; // Detalle o justificación obligatoria
  userIdentifier: string; // Cédula o RNC del usuario
  userName: string;
  userRole: string; // Administrador, Gerente / Propietario, etc.
  changesSummary?: string;
  previousState?: string;
  newState?: string;
  debitAmount?: number;
  creditAmount?: number;
}

export type PortfolioBucket = 'ALL' | '0_30' | '31_60' | '61_90' | 'MAS_90';

export interface EmployeePayroll {
  id: string;
  name: string;
  role: 'Cobrador de Calle' | 'Asesor de Crédito' | 'Supervisor General' | 'Secretaria / Caja';
  cedula: string;
  phone: string;
  baseSalary: number;
  commissionPercent: number;
  collectedThisPeriod: number;
  totalCommission: number;
  netSalary: number;
  status: 'ACTIVO' | 'PAGADO';
}

export type UserCategory = 1 | 2 | 3 | 4 | 5;

export interface PasswordHistoryItem {
  id: string;
  passwordHash: string;
  changedAt: string;
  changedBy: string;
  reason?: string;
}

export interface CompanyTenant {
  id: string;
  name: string;
  rncOrCedula: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  passwordHistory: PasswordHistoryItem[];
  failedAttempts?: number;
  isLocked?: boolean;
  lockReason?: string;
  status: 'PENDIENTE_APROBACION' | 'DEMO_ACTIVO' | 'DEMO_VENCIDO' | 'PAGADO_ACTIVO' | 'SUSPENDIDO';
  trialStartDate: string;
  trialEndDate: string;
  membershipPlan: 'DEMO_7_DIAS' | 'MENSUAL' | 'SEIS_MESES' | 'ANUAL' | 'DOS_ANOS' | 'TRES_ANOS';
  membershipExpirationDate: string;
  membershipPrice: number;
  approvedBy: string;
  approvedAt: string;
  lastBackupDate?: string;
  notes?: string;
}

export interface SecretPasswordVaultRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: 'ADMIN' | 'GERENTE' | 'COBRADOR' | 'ASESOR' | 'CLIENTE';
  identifier: string; // Cedula o RNC
  secretPassword: string; // Clave secreta registrada
  action: 'CREACION_INICIAL' | 'CAMBIO_CLAVE' | 'REASIGNACION_DESBLOQUEO' | 'RECUPERACION';
  changedAt: string;
  changedBy: string; // Quien realizo o autorizo el cambio
  failedAttemptsBeforeReset?: number;
  notes?: string;
}

export type InitialBalanceMigrationMode = 'HISTORICO_FICHA' | 'SALDO_PROGRAMADO';

export interface InitialBalanceOnboardingData {
  mode: InitialBalanceMigrationMode;
  client: Partial<Client>;
  // Modalidad A: Ficha Histórica / Casos Excepcionales
  originalLoanAmount?: number;
  disbursementDate?: string;
  previousPaymentsMade?: number;
  previousPaymentsCount?: number;
  previousPaymentsNotes?: string;
  // Modalidad B: Continuidad Saldo al Día de Hoy
  initialLoanAmount: number;
  totalPaidToDate: number;
  currentBalanceAsOfToday: number;
  pendingInstallmentsCount: number;
  fixedQuotaAmount: number;
  frequency: LoanFrequency;
  firstDueDate: string;
  rate?: number;
  notes?: string;
  justification: string;
}

export interface AuthSession {
  id: string;
  identifier: string; // Cedula or RNC
  name: string;
  email: string;
  category: UserCategory;
  categoryLabel:
    | 'Categoría 1: Administrador'
    | 'Categoría 2: Prestamista'
    | 'Categoría 3: Cliente'
    | 'Categoría 4: Garante'
    | 'Categoría 4: Garante o Codeudor'
    | 'Categoría 5: Co-deudor';
  companyId?: string;
  tenant?: CompanyTenant;
  client?: Client;
  appRole?: AppRole;
}

export interface SystemSettings {
  companyName: string;
  rnc: string;
  address: string;
  phone: string;
  technicalSupportName: string;
  technicalSupportPhone: string;
  defaultRate: number;
  defaultLateFeePerDay: number;
  graceDays: number;
  currency: string;
  initialCash: number;
  adminCedula: string;
  adminPassword: string;
  adminEmail: string;
}

export type NotificationChannel = 'WHATSAPP' | 'SMS' | 'GMAIL';
export type NotificationTriggerType =
  | 'PROXIMA_A_VENCER'
  | 'PAGO_REALIZADO'
  | 'RUTA_COBRO'
  | 'MORA'
  | 'PERSONALIZADO';

export interface NotificationLog {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  email?: string;
  subject?: string;
  channel: NotificationChannel;
  type: NotificationTriggerType;
  message: string;
  date: string;
  time: string;
  status: 'ENVIADO' | 'PENDIENTE' | 'ERROR';
  loanCode?: string;
  receiptNumber?: string;
  amount?: number;
  dueDate?: string;
  sentBy?: string;
}
