package integration

import "database/sql"

// pgTJStore is the durable PostgreSQL adapter for the Native AI Language Lab (translation jobs).
type pgTJStore struct{ db *sql.DB }

func newPgTJStore(dsn string) (*pgTJStore, error) {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		return nil, err
	}
	s := &pgTJStore{db: db}
	if err := s.ensureSchema(); err != nil {
		return nil, err
	}
	return s, nil
}

func (s *pgTJStore) ensureSchema() error {
	_, err := s.db.Exec(`
CREATE TABLE IF NOT EXISTS translation_jobs (
    id               TEXT PRIMARY KEY,
    org_unit         TEXT NOT NULL,
    title            TEXT NOT NULL,
    domain           TEXT NOT NULL,
    source_lang      TEXT NOT NULL,
    target_lang      TEXT NOT NULL,
    status           TEXT NOT NULL,
    machine_assisted BOOLEAN NOT NULL DEFAULT false,
    translator       TEXT NOT NULL DEFAULT '',
    reviewer         TEXT NOT NULL DEFAULT '',
    note             TEXT NOT NULL DEFAULT '',
    created_on       TEXT NOT NULL DEFAULT '',
    updated_at       TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS tj_org_idx    ON translation_jobs (org_unit);
CREATE INDEX IF NOT EXISTS tj_target_idx ON translation_jobs (target_lang);
CREATE INDEX IF NOT EXISTS tj_status_idx ON translation_jobs (status);`)
	return err
}

const tjCols = "id,org_unit,title,domain,source_lang,target_lang,status,machine_assisted,translator,reviewer,note,created_on,updated_at"

func scanTJ(row interface{ Scan(...any) error }) (TranslationJob, error) {
	var j TranslationJob
	err := row.Scan(&j.ID, &j.OrgUnit, &j.Title, &j.Domain, &j.SourceLang, &j.TargetLang, &j.Status,
		&j.MachineAssisted, &j.Translator, &j.Reviewer, &j.Note, &j.CreatedOn, &j.UpdatedAt)
	if err != nil {
		return TranslationJob{}, err
	}
	return j, nil
}

func (s *pgTJStore) Upsert(j TranslationJob) (TranslationJob, error) {
	if _, err := s.db.Exec(`INSERT INTO translation_jobs (`+tjCols+`)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (id) DO UPDATE SET org_unit=$2,title=$3,domain=$4,source_lang=$5,target_lang=$6,status=$7,
            machine_assisted=$8,translator=$9,reviewer=$10,note=$11,created_on=$12,updated_at=$13`,
		j.ID, j.OrgUnit, j.Title, j.Domain, j.SourceLang, j.TargetLang, j.Status, j.MachineAssisted, j.Translator, j.Reviewer, j.Note, j.CreatedOn, j.UpdatedAt); err != nil {
		return TranslationJob{}, err
	}
	return j, nil
}

func (s *pgTJStore) Get(id string) (TranslationJob, bool) {
	j, err := scanTJ(s.db.QueryRow(`SELECT `+tjCols+` FROM translation_jobs WHERE id=$1`, id))
	if err != nil {
		return TranslationJob{}, false
	}
	return j, true
}

func (s *pgTJStore) List(f tjFilter) []TranslationJob {
	rows, err := s.db.Query(`SELECT ` + tjCols + ` FROM translation_jobs`)
	if err != nil {
		return nil
	}
	defer rows.Close()
	var out []TranslationJob
	for rows.Next() {
		j, err := scanTJ(rows)
		if err != nil {
			continue
		}
		if matchTJ(f, j) {
			out = append(out, j)
		}
	}
	return out
}
