// VASA-EOS(SE) — polyglot persistence & data architecture (Sec 2A / 4B).
// Five data tiers and a polyglot store stack; a Bronze/Silver/Gold lake feeding
// analytics + VSK. The Repository seam lets modules stay store-agnostic.

export interface DataStore {
  name: string
  tech: string
  purpose: string
}

export const POLYGLOT_STORES: DataStore[] = [
  { name: "Relational", tech: "PostgreSQL", purpose: "Students, teachers, attendance, marks, schemes, audit" },
  { name: "Document", tech: "MongoDB", purpose: "Lesson plans, content, IEP documents, forms" },
  { name: "Key-Value / Cache", tech: "Redis", purpose: "Sessions, rate-limiting, real-time dashboards" },
  { name: "Graph", tech: "Neo4j", purpose: "Curriculum / career graphs, Tamil-literature ontology" },
  { name: "Search", tech: "Elasticsearch", purpose: "Content & document discovery, log/audit search" },
  { name: "Analytics (OLAP)", tech: "ClickHouse", purpose: "KPI dashboards, trends, aggregation" },
  { name: "Time-Series", tech: "TimescaleDB", purpose: "IoT cold chain, attendance & performance trends" },
  { name: "Vector", tech: "Pinecone / Weaviate", purpose: "Semantic search, RAG, recommendations" },
  { name: "Object Storage", tech: "S3 / MinIO", purpose: "Documents, media, ML models, backups" },
  { name: "Ledger", tech: "Hyperledger", purpose: "Exam results, credentials, NFT-SBT, smart contracts" },
]

export interface DataTier {
  tier: string
  purpose: string
  components: string
}

export const DATA_TIERS: DataTier[] = [
  { tier: "T1 Operational (OLTP)", purpose: "Live transactions", components: "PostgreSQL · MongoDB · Redis · Multi-AZ" },
  { tier: "T2 Event Stream", purpose: "Every state change emits an event (audit by construction)", components: "Apache Kafka · ksqlDB" },
  { tier: "T3 Lake + Warehouse", purpose: "Bronze/Silver/Gold + BI", components: "Snowflake / ClickHouse · dbt · federated to VSK" },
  { tier: "T4 Knowledge Graph", purpose: "Semantic reasoning & recommendations", components: "Neo4j · SPARQL" },
  { tier: "T5 Vector + Feature Store", purpose: "Semantic search / ML features", components: "Pinecone/Weaviate · Feast" },
]

export const DATA_ZONES: string[] = ["Bronze — raw (immutable)", "Silver — cleaned & joined", "Gold — business-ready / ML"]

export const DATA_GOVERNANCE: string[] = [
  "Master Data Management (APAAR / UDISE+ / Teacher ID single source of truth)",
  "Data lineage (Apache Atlas) + self-service catalog (OpenMetadata)",
  "Column/row-level security + Vault tokenisation for PII",
  "Purpose-bound retention + DPDP right-to-erasure",
  "Cross-tenant federation only with consent (sovereignty preserved)",
]

/** Store-agnostic repository seam so modules don't bind to a specific database. */
export interface Repository<T> {
  get(id: string): Promise<T | null>
  list(): Promise<T[]>
  upsert(entity: T): Promise<T>
}
