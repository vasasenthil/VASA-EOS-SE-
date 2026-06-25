-- VASA-EOS(SE) — sample policies seed (demo / non-production).
-- The policies table (001) ships without sample rows; this seeds a few TN/NEP
-- policies so the Policies module shows content once a database is attached.
-- Idempotent-ish: uses fixed ids and ON CONFLICT DO NOTHING.

insert into public.policies (id, title, policy_domain, version, abstract_en, status, keywords, nep_thrust_areas, lead_drafter)
values
  ('POL-2026-NEP1', 'NEP 2020 Implementation Roadmap (Tamil Nadu)', 'Foundational Literacy & Numeracy', '1.0',
   'State roadmap operationalising NEP 2020 for Tamil Nadu schools — FLN by Grade 3, 5+3+3+4 structure, mother-tongue-first pedagogy and holistic progress cards.',
   'Implemented', '{NEP,FLN,NIPUN}', '{"Foundational Learning","Curriculum Reform"}', 'SCERT TN'),
  ('POL-2026-PP01', 'Pudhumai Penn Scheme Guidelines', 'Equity & Inclusion', '2.1',
   'Monthly financial assistance to girl students from government schools pursuing higher education, disbursed via DBT to encourage retention and progression.',
   'Implemented', '{girls,DBT,retention}', '{"Equity","Access"}', 'School Education Dept'),
  ('POL-2026-CMBS', 'Chief Minister''s Breakfast Scheme (CMBS) SOP', 'Nutrition & Welfare', '1.3',
   'Standard operating procedure for the breakfast scheme — menu, hygiene, cook-cum-helper roles, daily register and leakage controls under PM POSHAN convergence.',
   'Implemented', '{nutrition,"PM POSHAN",breakfast}', '{"Health & Nutrition"}', 'School Education Dept'),
  ('POL-2026-NM01', 'Naan Mudhalvan Skilling Framework', 'Vocational & Skills', '1.0',
   'Career guidance, skilling and NSQF-aligned vocational pathways for higher-secondary students, with industry and Skill India linkages.',
   'Pending Internal Review', '{vocational,NSQF,skilling}', '{"Vocational Education","21st-century skills"}', 'DoSE'),
  ('POL-2026-RTE1', 'RTE 25% Admission Procedure', 'Access & Compliance', '1.2',
   'Procedure for the 25% reserved seats for economically-weaker and disadvantaged groups under RTE Act Sec 12(1)(c), including verification, lottery allotment and reimbursement.',
   'Draft', '{RTE,admissions,EWS}', '{"Equity","Access"}', 'DPSE')
on conflict (id) do nothing;
