// VASA-EOS(SE) — Library Management (Sec 37 / DPSE).
// School + digital library with Anna Centenary Library federation, reading tracking,
// and NIPUN-aligned reading challenges. Tamil-first collection.

export interface Book {
  id: string
  title: string
  author: string
  language: "Tamil" | "English"
  total: number
  available: number
}

export const CATALOGUE: Book[] = [
  { id: "B1", title: "Thirukkural", author: "Thiruvalluvar", language: "Tamil", total: 40, available: 31 },
  { id: "B2", title: "Ponniyin Selvan", author: "Kalki", language: "Tamil", total: 25, available: 12 },
  { id: "B3", title: "Wings of Fire", author: "A.P.J. Abdul Kalam", language: "English", total: 30, available: 22 },
  { id: "B4", title: "Sangam Poetry (Selections)", author: "Various", language: "Tamil", total: 18, available: 15 },
  { id: "B5", title: "A Brief History of Time", author: "Stephen Hawking", language: "English", total: 15, available: 9 },
]

export interface LibrarySummary {
  titles: number
  copies: number
  issued: number
  tamilShare: number
}

export function librarySummary(books: Book[] = CATALOGUE): LibrarySummary {
  const copies = books.reduce((s, b) => s + b.total, 0)
  const issued = books.reduce((s, b) => s + (b.total - b.available), 0)
  const tamil = books.filter((b) => b.language === "Tamil").reduce((s, b) => s + b.total, 0)
  return { titles: books.length, copies, issued, tamilShare: copies ? Math.round((tamil / copies) * 100) : 0 }
}

export const LIBRARY_FEATURES: string[] = [
  "Anna Centenary Library federation + inter-library loan",
  "Digital library: e-books, audio books (visually impaired)",
  "Tamil literature digital corpus (Sangam to contemporary)",
  "Reading tracking + NIPUN reading challenges",
  "Accessibility: screen reader, Braille refresh, dyslexia fonts",
]
