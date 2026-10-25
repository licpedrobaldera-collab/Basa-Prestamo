import { AmortizationRow, LoanFrequency, LoanType } from '../types';

export function formatDOP(amount: number): string {
  return (
    'DOP $' +
    Number(amount || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatCedula(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 10)}-${digits.slice(10, 11)}`;
}

/**
 * Calculates a detailed loan amortization schedule.
 * Supports:
 * - FIXED: French System (Cuotas Iguales - Francés)
 * - INTEREST_ONLY: San / Redondeo (Solo intereses periódicos, capital en la última cuota)
 * - GERMAN: German System (Amortización constante de capital, interés sobre saldo decreciente)
 */
export function generateAmortizationSchedule(
  amount: number,
  ratePercent: number,
  terms: number,
  frequency: LoanFrequency,
  type: LoanType,
  startDateStr?: string
): { schedule: AmortizationRow[]; quota: number; totalWithInterest: number; totalInterest: number } {
  const schedule: AmortizationRow[] = [];
  const startDate = startDateStr ? new Date(startDateStr) : new Date();

  // Rate per period calculation based on frequency
  // ratePercent is given as monthly rate (e.g., 10% monthly)
  let periodRate = ratePercent / 100;
  if (frequency === 'DIARIO') {
    periodRate = (ratePercent / 100) / 24; // approx 24 business days per month
  } else if (frequency === 'SEMANAL') {
    periodRate = (ratePercent / 100) / 4; // 4 weeks per month
  } else if (frequency === 'QUINCENAL') {
    periodRate = (ratePercent / 100) / 2; // 2 fortnights per month
  } else {
    periodRate = ratePercent / 100; // 1 month
  }

  let totalInterest = 0;
  let quota = 0;
  let totalWithInterest = 0;

  if (type === 'FIXED') {
    // Standard French Method / Equal Installments (Método Francés)
    // Formula: Cuota = P * [r / (1 - (1+r)^-n)]
    if (periodRate > 0 && terms > 0) {
      quota = Math.round((amount * (periodRate / (1 - Math.pow(1 + periodRate, -terms)))) * 100) / 100;
    } else {
      quota = terms > 0 ? Math.round((amount / terms) * 100) / 100 : 0;
    }

    let remainingBalance = amount;
    totalInterest = 0;

    for (let i = 1; i <= terms; i++) {
      const nextDate = addFrequencyPeriod(new Date(startDate), frequency, i);
      const interestPart = Math.round(remainingBalance * periodRate * 100) / 100;
      let capitalPart = Math.round((quota - interestPart) * 100) / 100;

      // Adjustment on final installment to avoid rounding dust
      if (i === terms || capitalPart > remainingBalance) {
        capitalPart = remainingBalance;
        quota = Math.round((capitalPart + interestPart) * 100) / 100;
      }

      remainingBalance = Math.max(0, Math.round((remainingBalance - capitalPart) * 100) / 100);
      totalInterest += interestPart;

      schedule.push({
        installmentNumber: i,
        dueDate: nextDate.toISOString().split('T')[0],
        quota: Math.round((capitalPart + interestPart) * 100) / 100,
        capital: capitalPart,
        interest: interestPart,
        balanceRemaining: remainingBalance,
        status: 'PENDIENTE',
      });
    }

    totalWithInterest = Math.round((amount + totalInterest) * 100) / 100;

  } else if (type === 'GERMAN') {
    // German Method: Constant Capital amortization, decreasing interest
    const constantCapital = terms > 0 ? Math.round((amount / terms) * 100) / 100 : 0;
    let remainingBalance = amount;
    totalInterest = 0;

    for (let i = 1; i <= terms; i++) {
      const nextDate = addFrequencyPeriod(new Date(startDate), frequency, i);
      const interestPart = Math.round(remainingBalance * periodRate * 100) / 100;
      const capitalPart = i === terms ? remainingBalance : constantCapital;
      const installmentQuota = Math.round((capitalPart + interestPart) * 100) / 100;

      remainingBalance = Math.max(0, Math.round((remainingBalance - capitalPart) * 100) / 100);
      totalInterest += interestPart;

      if (i === 1) quota = installmentQuota; // Initial installment quota

      schedule.push({
        installmentNumber: i,
        dueDate: nextDate.toISOString().split('T')[0],
        quota: installmentQuota,
        capital: capitalPart,
        interest: interestPart,
        balanceRemaining: remainingBalance,
        status: 'PENDIENTE',
      });
    }

    totalWithInterest = Math.round((amount + totalInterest) * 100) / 100;

  } else {
    // INTEREST_ONLY (San / Redondeo / Solo Interés)
    // Regular installments pay pure interest, final installment returns principal
    const periodicInterest = Math.round(amount * periodRate * 100) / 100;
    quota = periodicInterest;
    totalInterest = Math.round(periodicInterest * terms * 100) / 100;
    totalWithInterest = Math.round((amount + totalInterest) * 100) / 100;

    for (let i = 1; i <= terms; i++) {
      const nextDate = addFrequencyPeriod(new Date(startDate), frequency, i);
      const isLast = i === terms;
      const currentQuota = isLast ? Math.round((periodicInterest + amount) * 100) / 100 : periodicInterest;

      schedule.push({
        installmentNumber: i,
        dueDate: nextDate.toISOString().split('T')[0],
        quota: currentQuota,
        capital: isLast ? amount : 0,
        interest: periodicInterest,
        balanceRemaining: isLast ? 0 : amount,
        status: 'PENDIENTE',
      });
    }
  }

  return { schedule, quota, totalWithInterest, totalInterest };
}

function addFrequencyPeriod(date: Date, frequency: LoanFrequency, step: number): Date {
  const result = new Date(date);
  if (frequency === 'DIARIO') {
    // Skip Sundays for realistic Dominican daily route
    let daysAdded = 0;
    while (daysAdded < step) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0) {
        daysAdded++;
      }
    }
  } else if (frequency === 'SEMANAL') {
    result.setDate(result.getDate() + step * 7);
  } else if (frequency === 'QUINCENAL') {
    result.setDate(result.getDate() + step * 15);
  } else {
    result.setMonth(result.getMonth() + step);
  }
  return result;
}

export function generatePagareNotarialText(
  clientName: string,
  clientCedula: string,
  clientAddress: string,
  creditorName: string,
  creditorRnc: string,
  amount: number,
  rate: number,
  frequency: string,
  terms: number,
  quota: number,
  collateralDesc?: string,
  guarantorName?: string,
  guarantorCedula?: string
): string {
  const today = new Date();
  const fechaTexto = today.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `PAGARÉ NOTARIAL Y ACTO DE CONVENIO DE PRÉSTAMO
CON GARANTÍA PRENDARIA Y FIANZA SOLIDARIA
REPÚBLICA DOMINICANA

En la ciudad de Santo Domingo, República Dominicana, a los ${fechaTexto}.

POR EL PRESENTE ACTO, YO, ${clientName.toUpperCase()}, mayor de edad, portador(a) de la Cédula de Identidad y Electoral No. ${clientCedula}, domiciliado(a) y residente en ${clientAddress}, quien en lo sucesivo se denominará LA PARTE DEUDORA;

${
  guarantorName
    ? `Y DE LA OTRA PARTE, ${guarantorName.toUpperCase()}, portador(a) de la Cédula No. ${guarantorCedula || 'No especificada'}, quien comparece voluntariamente en calidad de GARANTE / FIADOR SOLIDARIO MANCOMUNADO;`
    : ''
}

DECLARO Y RECONOZCO:

PRIMERO: Que debo y pagaré sin aviso ni protesto a la orden de ${creditorName.toUpperCase()} (RNC / Identificación: ${creditorRnc}), en lo sucesivo EL ACREEDOR, o a su orden legítima, la suma de ${formatDOP(
    amount
  )} por concepto de préstamo de dinero en efectivo recibido a mi entera y cabal satisfacción.

SEGUNDO: Dicho crédito devengará un interés pactado del ${rate}% mensual, comprometiéndome a liquidarlo en ${terms} cuotas de amortización periódica con frecuencia ${frequency.toUpperCase()}, a razón de ${formatDOP(
    quota
  )} por cada cuota, con vencimiento en las fechas fijadas en el cronograma anexo.

TERCERO (PRENDA Y GARANTÍA): En garantía del fiel cumplimiento de las obligaciones que por este acto contraigo, EL DEUDOR formaliza y entrega en fianza el siguiente bien: "${
    collateralDesc || 'Garantía personal y bienes muebles presentes y futuros'
  }", comprometiéndose a mantenerlo en óptimo estado de conservación y libre de gravamen hasta el saldo total.

CUARTO (FUERZA EJECUTIVA Y MORA): La falta de pago de dos cuotas consecutivas hará exigible el pago de la totalidad de la suma adeudada sin necesidad de notificación judicial. Para el cobro compulsivo, este Pagaré adquiere de pleno derecho el valor y la fuerza de título ejecutorio conforme a las leyes dominicanas, renunciando LA PARTE DEUDORA a cualquier fuero que pudiere corresponderle y sometiéndose expresamente a la jurisdicción de los tribunales de la República Dominicana.

EN FE DE LO CUAL, las partes suscriben el presente acto formal y libremente en la fecha arriba señalada.`;
}

/**
 * Exports data to an Excel-compatible CSV file with UTF-8 BOM.
 * Supports both:
 * - exportToCSV(filename, headers, rows)
 * - exportToCSV(dataArray, filename)
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void;
export function exportToCSV(data: Record<string, any>[], filename: string): void;
export function exportToCSV(
  arg1: string | Record<string, any>[],
  arg2?: string[] | string,
  arg3?: (string | number)[][]
) {
  let filename = '';
  let headers: string[] = [];
  let rows: (string | number)[][] = [];

  if (Array.isArray(arg1) && typeof arg2 === 'string') {
    filename = arg2;
    if (arg1.length === 0) {
      headers = ['Registro'];
      rows = [['Sin registros']];
    } else {
      headers = Object.keys(arg1[0]);
      rows = arg1.map((item) =>
        headers.map((h) => (item[h] !== undefined && item[h] !== null ? item[h] : ''))
      );
    }
  } else if (typeof arg1 === 'string' && Array.isArray(arg2) && Array.isArray(arg3)) {
    filename = arg1;
    headers = arg2;
    rows = arg3;
  } else {
    filename = 'export';
    headers = ['Columna'];
    rows = [['Datos']];
  }

  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    [
      headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
