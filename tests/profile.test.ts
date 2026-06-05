import { test } from "node:test"
import assert from "node:assert/strict"
import { profileCompleteness, DEFAULT_PROFILE, type TeacherProfile } from "@/lib/profile"

const full: TeacherProfile = {
  name: "A",
  designation: "GA",
  subjects: "Maths",
  qualification: "M.Sc",
  experienceYears: 5,
  phone: "999",
  email: "a@b.c",
}

test("a fully-filled profile is 100%", () => {
  assert.equal(profileCompleteness(full), 100)
})

test("missing contact lowers completeness; default profile is incomplete", () => {
  assert.ok(profileCompleteness({ ...full, phone: "", email: "" }) < 100)
  assert.ok(profileCompleteness(DEFAULT_PROFILE) < 100) // no phone/email seeded
})

test("zero experience does not count as filled", () => {
  assert.ok(profileCompleteness({ ...full, experienceYears: 0 }) < 100)
})
