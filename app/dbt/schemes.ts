// DBT scheme catalogue (illustrative eligibility rules). Plain module so both the
// server action and the client form can import it.

export interface DbtScheme {
  label: string
  amountInPaise: number
  girlOnly?: boolean
  govtSchoolOnly?: boolean
}

export const DBT_SCHEMES: Record<string, DbtScheme> = {
  PUDHUMAI_PENN: { label: "Pudhumai Penn (₹1,000/mo)", amountInPaise: 100000, girlOnly: true, govtSchoolOnly: true },
  NMMS: { label: "National Means-cum-Merit Scholarship", amountInPaise: 100000 },
  MOOVALUR: { label: "Moovalur Ramamirthammal HE Assurance", amountInPaise: 100000, girlOnly: true },
}

export const SCHEME_OPTIONS = Object.entries(DBT_SCHEMES).map(([code, s]) => ({ code, label: s.label }))
