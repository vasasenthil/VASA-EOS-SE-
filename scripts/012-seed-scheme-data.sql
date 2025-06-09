-- Seed Scheme Categories
INSERT INTO scheme_categories (name, description) VALUES
('Infrastructure Development', 'Schemes focused on improving physical and digital infrastructure in educational institutions.'),
('Teacher Professional Development', 'Schemes for training, upskilling, and capacity building of teachers and educators.'),
('Student Welfare & Scholarships', 'Schemes providing financial aid, scholarships, and support services to students.'),
('Digital Education & EdTech', 'Schemes promoting the use of technology in education and providing digital learning resources.'),
('Inclusive Education', 'Schemes aimed at ensuring equitable access and quality education for all children, including CWSN and disadvantaged groups.'),
('Quality Enhancement', 'Schemes focused on improving learning outcomes, curriculum, and assessment methods.'),
('Early Childhood Care & Education (ECCE)', 'Schemes related to foundational learning and pre-primary education.')
ON CONFLICT (name) DO NOTHING;

-- Seed Organizational Unit Subtypes (examples)
INSERT INTO organizational_unit_subtypes (name, description, governance_tier_id)
SELECT 
    s.name, 
    s.description,
    gt.id
FROM (VALUES
    ('Central Government School (KVS)', 'Kendriya Vidyalaya Sangathan Schools', 'Institutional Level (Schools)'),
    ('Central Government School (NVS)', 'Navodaya Vidyalaya Samiti Schools', 'Institutional Level (Schools)'),
    ('State Government School', 'Schools run by State/UT Governments', 'Institutional Level (Schools)'),
    ('Private Unaided School', 'Privately managed schools without government aid', 'Institutional Level (Schools)'),
    ('Private Aided School', 'Privately managed schools receiving government aid', 'Institutional Level (Schools)'),
    ('Local Body School', 'Schools managed by local government bodies (municipalities, panchayats)', 'Institutional Level (Schools)')
) AS s(name, description, tier_name)
LEFT JOIN governance_tiers gt ON gt.name = s.tier_name
ON CONFLICT (name) DO NOTHING;


-- Seed Example Schemes (requires existing OUs and Users for created_by, issuing_authority_ou_id)
-- For simplicity, we'll fetch one OU ID for MoE and one for a State.
-- In a real scenario, these IDs would be known or dynamically fetched.

DO $$
DECLARE
    moe_ou_id UUID;
    karnataka_dse_ou_id UUID;
    admin_user_id UUID;
    infra_category_id UUID;
    teacher_dev_category_id UUID;
    student_welfare_category_id UUID;
    digital_edu_category_id UUID;

    kvs_subtype_id UUID;
    state_gov_school_subtype_id UUID;
    private_aided_subtype_id UUID;

    central_tier_id UUID;
    state_tier_id UUID;
    district_tier_id UUID;
    institutional_tier_id UUID;

    pm_shri_scheme_id UUID;
    nistha_scheme_id UUID;
    karnataka_vidya_nidhi_scheme_id UUID;
BEGIN
    -- Fetch prerequisite IDs
    SELECT id INTO moe_ou_id FROM organizational_units WHERE region_code = 'IND_MOE' LIMIT 1;
    SELECT id INTO karnataka_dse_ou_id FROM organizational_units WHERE region_code = 'KA_DSE' LIMIT 1;
    
    -- Attempt to get an actual user ID, fallback to NULL if no users exist or for simplicity
    SELECT id INTO admin_user_id FROM auth.users ORDER BY email LIMIT 1; 
    -- If auth.users is empty, admin_user_id will be NULL. 
    -- The created_by/updated_by fields in schemes table should be nullable or have a default system user.
    -- For this script, assuming they are nullable.

    SELECT id INTO infra_category_id FROM scheme_categories WHERE name = 'Infrastructure Development' LIMIT 1;
    SELECT id INTO teacher_dev_category_id FROM scheme_categories WHERE name = 'Teacher Professional Development' LIMIT 1;
    SELECT id INTO student_welfare_category_id FROM scheme_categories WHERE name = 'Student Welfare & Scholarships' LIMIT 1;
    SELECT id INTO digital_edu_category_id FROM scheme_categories WHERE name = 'Digital Education & EdTech' LIMIT 1;

    SELECT id INTO kvs_subtype_id FROM organizational_unit_subtypes WHERE name = 'Central Government School (KVS)' LIMIT 1;
    SELECT id INTO state_gov_school_subtype_id FROM organizational_unit_subtypes WHERE name = 'State Government School' LIMIT 1;
    SELECT id INTO private_aided_subtype_id FROM organizational_unit_subtypes WHERE name = 'Private Aided School' LIMIT 1;

    SELECT id INTO central_tier_id FROM governance_tiers WHERE name = 'Central Level' LIMIT 1;
    SELECT id INTO state_tier_id FROM governance_tiers WHERE name = 'State/UT Level' LIMIT 1;
    SELECT id INTO district_tier_id FROM governance_tiers WHERE name = 'District Level' LIMIT 1;
    SELECT id INTO institutional_tier_id FROM governance_tiers WHERE name = 'Institutional Level (Schools)' LIMIT 1;

    -- Check if essential OUs are found
    IF moe_ou_id IS NULL THEN
        RAISE WARNING 'Ministry of Education OU (IND_MOE) not found. Some schemes may not be seeded correctly.';
    END IF;
    IF karnataka_dse_ou_id IS NULL THEN
        RAISE WARNING 'Karnataka DSE OU (KA_DSE) not found. Some state schemes may not be seeded correctly.';
    END IF;


    -- 1. PM SHRI (Central Scheme)
    IF moe_ou_id IS NOT NULL AND infra_category_id IS NOT NULL THEN
        INSERT INTO schemes (
            name, description, objectives, scheme_code, category_id, issuing_authority_ou_id,
            funding_pattern, start_date, end_date, status, target_beneficiaries, eligibility_criteria, website_url, created_by, updated_by
        ) VALUES (
            'PM Schools for Rising India (PM SHRI)',
            'A centrally sponsored scheme to upgrade existing government schools into exemplary schools showcasing NEP 2020 principles.',
            'To develop green schools, showcase all components of NEP 2020, offer mentorship to other schools, and deliver quality teaching for cognitive development.',
            'PM_SHRI_001', infra_category_id, moe_ou_id,
            '60:40 for most States, 90:10 for NE/Hilly/UTs with legislature, 100% for UTs without legislature.',
            '2022-09-05', '2027-03-31', 'Active',
            'Selected existing Government schools (Central/State/UT/Local Body)',
            'Schools selected through Challenge Mode based on UDISE+ data and self-assessment.',
            'https://pmshrischools.education.gov.in/', admin_user_id, admin_user_id
        ) ON CONFLICT (name, issuing_authority_ou_id) DO NOTHING
        RETURNING id INTO pm_shri_scheme_id;

        IF pm_shri_scheme_id IS NOT NULL THEN
            IF kvs_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (pm_shri_scheme_id, kvs_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            IF state_gov_school_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (pm_shri_scheme_id, state_gov_school_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            -- Target Tiers
            IF state_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (pm_shri_scheme_id, state_tier_id, 'Implementation Partner') ON CONFLICT DO NOTHING; END IF;
            IF district_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (pm_shri_scheme_id, district_tier_id, 'Monitoring & Support') ON CONFLICT DO NOTHING; END IF;
            IF institutional_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (pm_shri_scheme_id, institutional_tier_id, 'Beneficiary & Implementation Site') ON CONFLICT DO NOTHING; END IF;
        END IF;
    END IF;

    -- 2. NISHTHA (National Initiative for School Heads'' and Teachers'' Holistic Advancement) (Central Scheme)
    IF moe_ou_id IS NOT NULL AND teacher_dev_category_id IS NOT NULL THEN
        INSERT INTO schemes (
            name, description, objectives, scheme_code, category_id, issuing_authority_ou_id,
            funding_pattern, status, target_beneficiaries, eligibility_criteria, website_url, created_by, updated_by
        ) VALUES (
            'NISHTHA (National Initiative for School Heads'' and Teachers'' Holistic Advancement)',
            'Capacity building program for improving quality of school education through integrated teacher training.',
            'To equip and motivate teachers and school principals to encourage and foster critical thinking in students. To cover all teachers and Heads of Schools at the elementary level in all Government schools.',
            'NISHTHA_001', teacher_dev_category_id, moe_ou_id, -- Assuming NCERT/MoE as issuer
            '100% Centrally Sponsored (as part of Samagra Shiksha)', 'Active',
            'Teachers and Heads of Schools at Elementary, Secondary, and Pre-primary levels in Government and Aided schools.',
            'All teachers and school heads in specified school types.',
            'https://itpd.ncert.gov.in/', admin_user_id, admin_user_id
        ) ON CONFLICT (name, issuing_authority_ou_id) DO NOTHING
        RETURNING id INTO nistha_scheme_id;

        IF nistha_scheme_id IS NOT NULL THEN
            IF state_gov_school_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (nistha_scheme_id, state_gov_school_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            IF private_aided_subtype_id IS NOT NULL THEN
                 INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (nistha_scheme_id, private_aided_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
             -- Target Tiers
            IF state_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (nistha_scheme_id, state_tier_id, 'Coordination & Training Delivery') ON CONFLICT DO NOTHING; END IF;
            IF district_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (nistha_scheme_id, district_tier_id, 'Local Training Management') ON CONFLICT DO NOTHING; END IF;
            IF institutional_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (nistha_scheme_id, institutional_tier_id, 'Participant Level') ON CONFLICT DO NOTHING; END IF;
        END IF;
    END IF;

    -- 3. Example State Scheme (Karnataka - Fictional for demonstration)
    IF karnataka_dse_ou_id IS NOT NULL AND student_welfare_category_id IS NOT NULL THEN
        INSERT INTO schemes (
            name, description, objectives, scheme_code, category_id, issuing_authority_ou_id,
            funding_pattern, start_date, status, target_beneficiaries, eligibility_criteria, created_by, updated_by
        ) VALUES (
            'Karnataka Vidya Nidhi Scholarship',
            'State scholarship program for meritorious students from economically weaker sections pursuing higher secondary education.',
            'To provide financial assistance to prevent dropouts and encourage higher education enrollment among EWS students.',
            'KA_VIDYANIDHI_001', student_welfare_category_id, karnataka_dse_ou_id,
            '100% State Funded', '2023-06-01', 'Active',
            'Meritorious students from EWS families enrolled in Class 11 & 12 in Karnataka government and aided schools.',
            'Annual family income below X, minimum Y% marks in Class 10.', admin_user_id, admin_user_id
        ) ON CONFLICT (name, issuing_authority_ou_id) DO NOTHING
        RETURNING id INTO karnataka_vidya_nidhi_scheme_id;

        IF karnataka_vidya_nidhi_scheme_id IS NOT NULL THEN
            IF state_gov_school_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (karnataka_vidya_nidhi_scheme_id, state_gov_school_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            IF private_aided_subtype_id IS NOT NULL THEN
                INSERT INTO scheme_applicability_ou_subtypes (scheme_id, ou_subtype_id) VALUES (karnataka_vidya_nidhi_scheme_id, private_aided_subtype_id) ON CONFLICT DO NOTHING;
            END IF;
            -- Target Tiers
            IF institutional_tier_id IS NOT NULL THEN INSERT INTO scheme_target_governance_tiers(scheme_id, tier_id, role_description) VALUES (karnataka_vidya_nidhi_scheme_id, institutional_tier_id, 'Beneficiary Enrollment') ON CONFLICT DO NOTHING; END IF;
        END IF;
    END IF;

END $$;
