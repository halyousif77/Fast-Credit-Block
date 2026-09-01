// The /api/credit-data endpoint returns rows keyed by the original Excel
// column headers (e.g. "Van Code.", "Credit Invoice Amount"). The desktop
// pages read those raw keys directly. The mobile pages, however, expect
// clean snake/camel case fields - this file bridges the two so mobile pages
// stop silently reading `undefined` (which is what caused every mobile stat
// to show 0).

export type CreditRow = {
  vanCode: string;
  employeeName: string;
  employeeAtsCode: string;
  customerCode: string;
  customerName: string;
  centralInvoice: string;
  paymentTerm: string;
  invoice: string;
  trxDate: string;
  amount: number;
  pendingCim: string;
  creditDays: number;
  totalRejectedCount: number;
  statusUserBlock: string;
  invoiceStatus: string;
  region: string;
  city: string;
};

export function normalizeCreditRow(row: any): CreditRow {
  return {
    vanCode: row["Van Code."] || "",
    employeeName: row["Employee Name."] || "",
    employeeAtsCode: row["Employee ATS Code."] || "",
    customerCode: row["Customer Code"] || "",
    customerName: row["Customer Name"] || "",
    centralInvoice: row["Central Invoice"] || "",
    paymentTerm: row["Payment Term"] || "",
    invoice: row["Invoice #"] || "",
    trxDate: row["Trx Date"] || "",
    amount: parseFloat(row["Credit Invoice Amount"]) || 0,
    pendingCim: row["Pending CIM"] || "",
    creditDays: Number(row["Credit_Days"]) || 0,
    totalRejectedCount: Number(row["Total Rejected Count"]) || 0,
    statusUserBlock: row["Status User Block"] || "",
    invoiceStatus: row["Invoice status (Due/ Overdue)"] || "",
    region: row["Region"] || "",
    city: row["City"] || "",
  };
}

export async function fetchCreditRows(): Promise<CreditRow[]> {
  const res = await fetch("/api/credit-data");
  const json = await res.json();
  const raw = Array.isArray(json.data) ? json.data : [];
  return raw.map(normalizeCreditRow);
}

// Same "is this invoice actually outstanding" rule the desktop dashboard
// uses: skip centrally-invoiced rows and anything already flagged legal.
export function isOutstandingRow(row: CreditRow) {
  const isNotCentral =
    String(row.centralInvoice || "").trim().toUpperCase() === "NOT CENTRAL";
  const isLegal = row.invoiceStatus.toLowerCase().includes("legal");
  return isNotCentral && !isLegal;
}
