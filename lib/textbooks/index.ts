// VASA-EOS(SE) — textbook indent & book bank (free-textbook scheme fulfilment).
// Indent textbooks by class/subject and track received vs pending. Pure logic.

export interface Indent {
  id: string
  cls: string
  subject: string
  required: number
  received: number
}

export function pendingOf(i: Indent): number {
  return Math.max(0, i.required - i.received)
}

export interface TextbookSummary {
  titles: number
  required: number
  received: number
  pending: number
  fulfilmentPct: number
}

export function textbookSummary(indents: Indent[]): TextbookSummary {
  const required = indents.reduce((sum, i) => sum + i.required, 0)
  const received = indents.reduce((sum, i) => sum + Math.min(i.received, i.required), 0)
  return {
    titles: indents.length,
    required,
    received,
    pending: indents.reduce((sum, i) => sum + pendingOf(i), 0),
    fulfilmentPct: required === 0 ? 0 : Math.round((received / required) * 100),
  }
}
