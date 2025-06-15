import { createClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"

// Define UserRole type locally if not exported from another file
type UserRole = "STUDENT" | "TEACHER" | "SCHOOL_ADMIN" | "STATE_ADMIN"

const usersToSeed = [
  {
    email: "student1@example.com",
    password: "password123",
    fullName: "Alice Wonderland",
    role: "STUDENT",
    schoolName: "Vidya Mandir High School",
  },
  {
    email: "student2@example.com",
    password: "password123",
    fullName: "Bob The Builder",
    role: "STUDENT",
    schoolName: "Jnana Prabodhini School",
  },
  {
    email: "teacher1@example.com",
    password: "password123",
    fullName: "Charles Xavier",
    role: "TEACHER",
    schoolName: "Vidya Mandir High School",
  },
  {
    email: "teacher2@example.com",
    password: "password123",
    fullName: "Diana Prince",
    role: "TEACHER",
    schoolName: "Jnana Prabodhini School",
  },
  {
    email: "schooladmin1@example.com",
    password: "password123",
    fullName: "Edward Nigma",
    role: "SCHOOL_ADMIN",
    schoolName: "Vidya Mandir High School",
  },
  {
    email: "stateadmin1@example.com",
    password: "password123",
    fullName: "Fiona Glenanne",
    role: "STATE_ADMIN",
    schoolName: null,
  },
  {
    email: "principal.vmhs@example.com",
    password: "password123",
    fullName: "Principal VMHS",
    role: "SCHOOL_ADMIN",
    schoolName: "Vidya Mandir High School",
  },
  {
    email: "subjectincharge.math.vmhs@example.com",
    password: "password123",
    fullName: "Math Incharge VMHS",
    role: "TEACHER",
    schoolName: "Vidya Mandir High School",
  },
  {
    email: "academichead.jps@example.com",
    password: "password123",
    fullName: "Academic Head JPS",
    role: "SCHOOL_ADMIN",
    schoolName: "Jnana Prabodhini School",
  },
  {
    email: "institutionhead.jps@example.com",
    password: "password123",
    fullName: "Institution Head JPS",
    role: "SCHOOL_ADMIN",
    schoolName: "Jnana Prabodhini School",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get("secret")

  if (secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: "Supabase environment variables not set." }, { status: 500 })
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const logs: string[] = ["Starting to seed users with robust script..."]

  // Ensure schools exist, or create them
  const schoolNames = [...new Set(usersToSeed.map((u) => u.schoolName).filter(Boolean))]
  const schoolMap = new Map<string, string>()

  for (const name of schoolNames) {
    let { data: school, error } = await supabaseAdmin.from("schools").select("id").eq("name", name).single()
    if (error && error.code === "PGRST116") {
      logs.push(`School '${name}' not found, creating it...`)
      const { data: newSchool, error: createError } = await supabaseAdmin
        .from("schools")
        .insert({ name })
        .select("id")
        .single()
      if (createError) {
        logs.push(`Error creating school '${name}': ${createError.message}`)
        continue
      }
      school = newSchool
      logs.push(`Successfully created school '${name}'.`)
    } else if (error) {
      logs.push(`Error fetching school '${name}': ${error.message}`)
      continue
    }
    if (school) {
      schoolMap.set(name, school.id)
    }
  }

  for (const user of usersToSeed) {
    logs.push(`\nProcessing user: ${user.email} (${user.role})`)
    let authUserId: string | undefined

    // 1. Check if user exists in auth.users
    const { data: existingAuthUser, error: getAuthUserError } = await supabaseAdmin.auth.admin.getUserByEmail(
      user.email,
    )

    if (getAuthUserError && getAuthUserError.message.includes("User not found")) {
      // User does not exist, create them in Auth
      const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName },
      })

      if (createAuthError) {
        logs.push(`Failed to create auth user ${user.email}: ${createAuthError.message}`)
        continue
      }
      authUserId = newAuthUser.user.id
      logs.push(`Successfully created auth user for ${user.email}.`)
    } else if (getAuthUserError) {
      logs.push(`Error checking auth user ${user.email}: ${getAuthUserError.message}`)
      continue
    } else {
      // User already exists in Auth
      authUserId = existingAuthUser.user.id
      logs.push(`Auth user for ${user.email} already exists.`)
    }

    if (!authUserId) {
      logs.push(`Could not get an auth user ID for ${user.email}. Skipping profile creation.`)
      continue
    }

    // 2. Check if user profile exists in public.users
    const { data: existingProfile, error: profileCheckError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", authUserId)
      .single()

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      logs.push(`Error checking profile for ${user.email}: ${profileCheckError.message}`)
      continue
    }

    if (existingProfile) {
      logs.push(`User profile for ${user.email} already exists. Skipping.`)
    } else {
      // Profile does not exist, create it
      const school_id = user.schoolName ? schoolMap.get(user.schoolName) : null
      const { error: createProfileError } = await supabaseAdmin.from("users").insert({
        id: authUserId,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        school_id: school_id,
      })

      if (createProfileError) {
        logs.push(`Failed to create user profile for ${user.email}: ${createProfileError.message}`)
      } else {
        logs.push(`Successfully created user profile for ${user.email}.`)
      }
    }
  }

  logs.push("\nUser seeding script completed successfully.")
  return NextResponse.json({ message: "Seeding completed!", logs })
}
