// VASA-EOS(SE) — student banking & financial literacy (school savings-bank scheme).
// Track student savings accounts, deposits and withdrawals. Pure logic.

export interface Account {
  id: string
  student: string
  cls: string
  balance: number
  /** Tenant node this account belongs to — drives per-role data scoping. */
  tenantId: string
}

// Withdraw is capped at the available balance (no overdraft for children).
export function applyTxn(balance: number, kind: "deposit" | "withdraw", amount: number): number {
  if (amount <= 0) return balance
  return kind === "deposit" ? balance + amount : Math.max(0, balance - amount)
}

export interface BankingSummary {
  accounts: number
  totalSavings: number
  avgBalance: number
  activeSavers: number
}

export function bankingSummary(accounts: Account[]): BankingSummary {
  const n = accounts.length
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)
  return {
    accounts: n,
    totalSavings: total,
    avgBalance: n === 0 ? 0 : Math.round(total / n),
    activeSavers: accounts.filter((a) => a.balance > 0).length,
  }
}

export function inr(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`
}
