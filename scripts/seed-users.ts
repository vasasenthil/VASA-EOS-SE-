import { createClient } from "@supabase/supabase-js"
import type { UserRole } from "@/app/admin/users/actions/register-user-action" // Assuming UserRole is exported or define it here

// Define UserRole if not easily importable
// type UserRole = "STUDENT" | "TEACHER" | "SCHOOL_ADMIN" | "STATE_ADMIN";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Supabase URL or Service Role Key is not defined. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.",
  )
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

interface School {
  id: string
  name: string
}

interface UserSeedData {
  email: string
  password?: string // Optional: if not provided, a default will be used
  fullName: string
  role: UserRole
  schoolName?: string // Name of the school to link to
}

async function getSchoolIdByName(name: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from("schools").select("id").eq("name", name).single()
  if (error && error.code !== "PGRST116") {
    // PGRST116: 0 rows
    console.warn(`Warning fetching school "${name}": ${error.message}. It might not exist.`)
    return null
  }
  if (!data) {
    console.warn(`School "${name}" not found.`)
    return null
  }
  return data.id
}

async function seedUsers() {
  console.log("Starting to seed users...")

  // --- 1. Define or Fetch Schools ---
  // Ensure these schools exist or were created by '013-mvp-initial-schema.sql'
  // For simplicity, we'll try to fetch them. If not found, users needing them won't be fully linked.
  const school1Name = "Vidya Mandir High School" // Example school name from schema
  const school2Name = "Jnana Prabodhini School" // Another example

  let school1Id = await getSchoolIdByName(school1Name)
  let school2Id = await getSchoolIdByName(school2Name)

  // If schools don't exist, let's try to create them for the seed to work better
  if (!school1Id) {
    console.log(`School "${school1Name}" not found, attempting to create...`)
    const { data, error } = await supabaseAdmin
      .from("schools")
      .insert({ name: school1Name, state: "Maharashtra", city: "Pune" })
      .select("id")
      .single()
    if (error) {
      console.error(`Failed to create school "${school1Name}": ${error.message}`)
    } else if (data) {
      school1Id = data.id
      console.log(`Created school "${school1Name}" with ID: ${school1Id}`)
    }
  }

  if (!school2Id) {
    console.log(`School "${school2Name}" not found, attempting to create...`)
    const { data, error } = await supabaseAdmin
      .from("schools")
      .insert({ name: school2Name, state: "Karnataka", city: "Bengaluru" })
      .select("id")
      .single()
    if (error) {
      console.error(`Failed to create school "${school2Name}": ${error.message}`)
    } else if (data) {
      school2Id = data.id
      console.log(`Created school "${school2Name}" with ID: ${school2Id}`)
    }
  }

  const usersToSeed: UserSeedData[] = [
    {
      email: "student1@example.com",
      fullName: "Alice Wonderland",
      role: "STUDENT",
      schoolName: school1Name,
    },
    {
      email: "student2@example.com",
      fullName: "Bob The Builder",
      role: "STUDENT",
      schoolName: school2Name,
    },
    {
      email: "teacher1@example.com",
      fullName: "Charles Xavier",
      role: "TEACHER",
      schoolName: school1Name,
    },
    {
      email: "teacher2@example.com",
      fullName: "Diana Prince",
      role: "TEACHER",
      schoolName: school2Name,
    },
    {
      email: "schooladmin1@example.com",
      fullName: "Edward Nigma",
      role: "SCHOOL_ADMIN",
      schoolName: school1Name,
    },
    {
      email: "stateadmin1@example.com",
      fullName: "Fiona Glenanne",
      role: "STATE_ADMIN", // State admins are not tied to a specific school in this model
    },
    {
      email: "principal.vmhs@example.com",
      fullName: "Principal VMHS",
      role: "SCHOOL_ADMIN", // Using SCHOOL_ADMIN as a proxy for Principal
      schoolName: school1Name,
    },
    {
      email: "subjectincharge.math.vmhs@example.com",
      fullName: "Math Incharge VMHS",
      role: "TEACHER", // Using TEACHER as a proxy
      schoolName: school1Name,
    },
    {
      email: "academichead.jps@example.com",
      fullName: "Academic Head JPS",
      role: "SCHOOL_ADMIN", // Using SCHOOL_ADMIN as a proxy
      schoolName: school2Name,
    },
    {
      email: "institutionhead.jps@example.com",
      fullName: "Institution Head JPS",
      role: "SCHOOL_ADMIN", // Using SCHOOL_ADMIN as a proxy
      schoolName: school2Name,
    },
  ]

  for (const userData of usersToSeed) {
    const password = userData.password || "password123" // Default password

    console.log(`\nProcessing user: ${userData.email} (${userData.role})`)

    // --- 2. Create user in Supabase Auth ---
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: password,
      email_confirm: true, // Auto-confirm for seed data
      user_metadata: {
        full_name: userData.fullName,
        // initial_role: userData.role, // Can store role here if desired
      },
    })

    if (authError) {
      if (
        authError.message.includes("already registered") ||
        authError.message.includes("duplicate key value violates unique constraint")
      ) {
        console.warn(
          `Auth user ${userData.email} already exists or failed due to unique constraint. Attempting to fetch existing auth user ID.`,
        )
        const { data: existingAuthUser, error: fetchAuthError } = await supabaseAdmin.auth.admin.listUsers({
          email: userData.email,
        } as any) // Type workaround
        if (fetchAuthError || !existingAuthUser || existingAuthUser.users.length === 0) {
          console.error(
            `Failed to fetch existing auth user ${userData.email}: ${fetchAuthError?.message || "Not found"}`,
          )
          continue
        }
        const authUserId = existingAuthUser.users[0].id

        // Check if user already in public.users
        const { data: existingPublicUser, error: publicUserFetchError } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("id", authUserId)
          .single()

        if (publicUserFetchError && publicUserFetchError.code !== "PGRST116") {
          // PGRST116 means no rows found
          console.error(`Error checking public.users for ${userData.email}: ${publicUserFetchError.message}`)
          continue
        }

        if (existingPublicUser) {
          console.log(`User ${userData.email} already exists in public.users table. Skipping profile creation.`)
          continue
        } else {
          // Auth user exists, but not in public.users. Proceed to insert into public.users
          console.log(
            `Auth user ${userData.email} exists (ID: ${authUserId}), but not in public.users. Proceeding to create profile.`,
          )
          // Fall through to profile insertion with authUserId
          await insertUserProfile(authUserId, userData, school1Id, school2Id)
        }
        continue // Skip to next user if auth creation failed and couldn't recover
      } else {
        console.error(`Failed to create auth user ${userData.email}: ${authError.message}`)
        continue // Skip to next user
      }
    }

    if (!authUser || !authUser.user) {
      console.error(`Auth user ${userData.email} created but no user data returned.`)
      continue
    }

    await insertUserProfile(authUser.user.id, userData, school1Id, school2Id)
  }

  console.log("\nUser seeding script completed.")
}

async function insertUserProfile(
  authUserId: string,
  userData: UserSeedData,
  school1Id: string | null,
  school2Id: string | null,
) {
  let userSchoolId: string | null = null
  if (userData.schoolName) {
    if (userData.schoolName === "Vidya Mandir High School") userSchoolId = school1Id
    else if (userData.schoolName === "Jnana Prabodhini School") userSchoolId = school2Id
    else {
      console.warn(
        `School name "${userData.schoolName}" for user ${userData.email} not pre-defined. Trying to fetch by name.`,
      )
      userSchoolId = await getSchoolIdByName(userData.schoolName)
    }

    if (!userSchoolId && userData.role !== "STATE_ADMIN") {
      console.warn(
        `School ID for "${userData.schoolName}" not found. User ${userData.email} will not be linked to a school.`,
      )
    }
  }

  // --- 3. Insert into public.users table ---
  const { error: profileInsertError } = await supabaseAdmin.from("users").insert({
    id: authUserId, // Link to the auth user
    email: userData.email,
    full_name: userData.fullName,
    role: userData.role,
    school_id: userData.role === "STATE_ADMIN" ? null : userSchoolId, // STATE_ADMIN not tied to a school
  })

  if (profileInsertError) {
    console.error(
      `Failed to insert profile for ${userData.email} (Auth ID: ${authUserId}): ${profileInsertError.message}`,
    )
    // Potentially delete the auth user if profile insert fails (rollback)
    console.warn(`Consider manually deleting auth user ${authUserId} if this profile error is critical.`)
  } else {
    console.log(`Successfully created user profile for ${userData.email} (Auth ID: ${authUserId}) in public.users.`)
  }
}

seedUsers()
  .then(() => console.log("Finished seeding users successfully."))
  .catch((err) => console.error("Error in user seeding script:", err))
