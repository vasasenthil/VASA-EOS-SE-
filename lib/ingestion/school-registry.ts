// VASA-EOS(SE) — UDISE+ school-registry ingestion schema (the first real-data adapter).
//
// Maps a UDISE+ school export (the canonical national school registry) into the platform's school record,
// keyed idempotently on the 11-digit UDISE code — the natural primary key, so re-loading a refreshed export
// updates schools in place rather than duplicating them. The SAMPLE_CSV mirrors the real UDISE+ column
// headers and deliberately includes one invalid row (bad UDISE code) and one duplicate (same code, updated
// enrolment) so validation and idempotency are demonstrable. Replace SAMPLE_CSV with a real export to load
// real data — the adapter is unchanged. Pure + client-safe.

import { type Schema, digits, oneOf, nonNegativeInt, toInt, toFloat } from "@/lib/ingestion"

export interface SchoolRecord {
  udiseCode: string
  name: string
  district: string
  block: string
  category: string
  management: string
  lowestClass?: number
  highestClass?: number
  enrolment?: number
  latitude?: number
  longitude?: number
}

export const SCHOOL_CATEGORIES = ["Pre-Primary", "Primary", "Upper Primary", "Secondary", "Higher Secondary"] as const
export const MANAGEMENT_TYPES = ["Government", "Aided", "Private Unaided", "Central Govt", "Local Body"] as const

export const SCHOOL_SCHEMA: Schema<SchoolRecord> = {
  name: "UDISE+ school registry",
  idField: "udiseCode",
  fields: [
    { column: "UDISE Code", key: "udiseCode", required: true, validate: digits(11) },
    { column: "School Name", key: "name", required: true },
    { column: "District", key: "district", required: true },
    { column: "Block", key: "block", required: true },
    { column: "School Category", key: "category", required: true, validate: oneOf(SCHOOL_CATEGORIES) },
    { column: "Management", key: "management", required: true, validate: oneOf(MANAGEMENT_TYPES) },
    { column: "Lowest Class", key: "lowestClass", validate: nonNegativeInt, transform: toInt },
    { column: "Highest Class", key: "highestClass", validate: nonNegativeInt, transform: toInt },
    { column: "Total Enrolment", key: "enrolment", validate: nonNegativeInt, transform: toInt },
    { column: "Latitude", key: "latitude", transform: toFloat },
    { column: "Longitude", key: "longitude", transform: toFloat },
  ],
}

// Mirrors real UDISE+ headers. One invalid row (UDISE not 11 digits) and one duplicate (33010100101).
export const SAMPLE_CSV = `UDISE Code,School Name,District,Block,School Category,Management,Lowest Class,Highest Class,Total Enrolment,Latitude,Longitude
33010100101,GHSS Anna Nagar,Chennai,Chennai North,Higher Secondary,Government,6,12,1248,13.0827,80.2707
33010100102,GMS Kilpauk,Chennai,Chennai North,Upper Primary,Government,1,8,640,13.0801,80.2412
33060200305,Panchayat Union Primary School Melur,Madurai,Melur,Primary,Local Body,1,5,210,10.0312,78.3401
33150400512,St. Joseph's Aided School,Coimbatore,Coimbatore South,Secondary,Aided,6,10,980,11.0168,76.9558
ABC10100999,Bad Code School,Salem,Salem,Primary,Government,1,5,120,11.6643,78.1460
33010100101,GHSS Anna Nagar (updated roll),Chennai,Chennai North,Higher Secondary,Government,6,12,1305,13.0827,80.2707
`

/** Districts represented in the current record set. */
export function districtsOf(records: SchoolRecord[]): string[] {
  return [...new Set(records.map((r) => r.district))].sort()
}

/** Total enrolment across the record set. */
export function totalEnrolment(records: SchoolRecord[]): number {
  return records.reduce((s, r) => s + (r.enrolment ?? 0), 0)
}
