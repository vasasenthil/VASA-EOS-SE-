import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define UserRole here as it's not easily importable in this context
type UserRole = "STUDENT" | "TEACHER" | "SCHOOL_ADMIN" | "STATE_ADMIN"

// This is your new API route handler
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  // --- SECURITY CHECK ---
  // This is a simple secret key check to prevent unauthorized access.
  // Make sure to set SEED_SECRET in your Vercel Environment Variables.
  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json({ error: "Supabase environment variables not set." }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  // --- Seeding Logic (copied from seed-users.ts) ---
  const logs: string[] = []
  const log = (message: string) => {
    console.log(message)
    logs.push(message)
  }

  try {
    log("Starting to seed users via API route...")

    const school1Name = "Vidya Mandir High School"
    const school2Name = "Jnana Prabodhini School"
    let school1Id = await getSchoolIdByName(supabaseAdmin, school1Name, log)
    let school2Id = await getSchoolIdByName(supabaseAdmin, school2Name, log)

    if (!school1Id) {
      school1Id = await createSchool(supabaseAdmin, school1Name, "Maharashtra", "Pune", log)
    }
    if (!school2Id) {
      school2Id = await createSchool(supabaseAdmin, school2Name, "Karnataka", "Bengaluru", log)
    }

    const usersToSeed = [
      { email: "student1@example.com", fullName: "Alice Wonderland", role: "STUDENT", schoolName: school1Name },
      { email: "student2@example.com", fullName: "Bob The Builder", role: "STUDENT", schoolName: school2Name },
      { email: "teacher1@example.com", fullName: "Charles Xavier", role: "TEACHER", schoolName: school1Name },
      { email: "teacher2@example.com", fullName: "Diana Prince", role: "TEACHER", schoolName: school2Name },
      { email: "schooladmin1@example.com", fullName: "Edward Nigma", role: "SCHOOL_ADMIN", schoolName: school1Name },
      { email: "stateadmin1@example.com", fullName: "Fiona Glenanne", role: "STATE_ADMIN" },
      {
        email: "principal.vmhs@example.com",
        fullName: "Principal VMHS",
        role: "SCHOOL_ADMIN",
        schoolName: school1Name,
      },
      {
        email: "subjectincharge.math.vmhs@example.com",
        fullName: "Math Incharge VMHS",
        role: "TEACHER",
        schoolName: school1Name,
      },
      {
        email: "academichead.jps@example.com",
        fullName: "Academic Head JPS",
        role: "SCHOOL_ADMIN",
        schoolName: school2Name,
      },
      {
        email: "institutionhead.jps@example.com",
        fullName: "Institution Head JPS",
        role: "SCHOOL_ADMIN",
        schoolName: school2Name,
      },
    ]

    for (const userData of usersToSeed) {
      await processUser(supabaseAdmin, userData, { school1Id, school2Id, school1Name, school2Name }, log)
    }

    log("\nUser seeding script completed successfully.")
    return NextResponse.json({ message: "Seeding completed!", logs })
  } catch (error: any) {
    log(`\nAn error occurred during seeding: ${error.message}`)
    return NextResponse.json({ error: "Seeding failed.", logs, details: error.message }, { status: 500 })
  }
}

// --- Helper Functions ---

async function getSchoolIdByName(supabase: any, name: string, log: (msg: string) => void): Promise<string | null> {
  const { data, error } = await supabase.from("schools").select("id").eq("name", name).single()
  if (error && error.code !== "PGRST116") {
    log(`Warning fetching school "${name}": ${error.message}.`)
    return null
  }
  return data ? data.id : null
}

async function createSchool(
  supabase: any,
  name: string,
  state: string,
  city: string,
  log: (msg: string) => void,
): Promise<string | null> {
  log(`School "${name}" not found, attempting to create...`)
  const { data, error } = await supabase.from("schools").insert({ name, state, city }).select("id").single()
  if (error) {
    log(`Failed to create school "${name}": ${error.message}`)
    return null
  }
  if (data) {
    log(`Created school "${name}" with ID: ${data.id}`)
    return data.id
  }
  return null
}

async function processUser(supabase: any, userData: any, schools: any, log: (msg: string) => void) {
  const password = "password123"
  log(`\nProcessing user: ${userData.email} (${userData.role})`)

  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: userData.email,
    password: password,
    email_confirm: true,
    user_metadata: { full_name: userData.fullName },
  })

  if (authError) {
    if (authError.message.includes("already registered")) {
      log(`Auth user ${userData.email} already exists. Skipping auth creation.`)
      // If you want to be thorough, you could fetch the existing user and profile here, but for a seed script, skipping is fine.
      return
    }
    log(`Failed to create auth user ${userData.email}: ${authError.message}`)
    return
  }

  if (!authUser || !authUser.user) {
    log(`Auth user ${userData.email} created but no user data returned.`)
    return
  }

  let userSchoolId: string | null = null
  if (userData.schoolName) {
    if (userData.schoolName === schools.school1Name) userSchoolId = schools.school1Id
    else if (userData.schoolName === schools.school2Name) userSchoolId = schools.school2Id
  }

  const { error: profileInsertError } = await supabase.from("users").insert({
    id: authUser.user.id,
    email: userData.email,
    full_name: userData.fullName,
    role: userData.role,
    school_id: userData.role === "STATE_ADMIN" ? null : userSchoolId,
  })

  if (profileInsertError) {
    log(`Failed to insert profile for ${userData.email}: ${profileInsertError.message}`)
  } else {
    log(`Successfully created user profile for ${userData.email}.`)
  }
}
