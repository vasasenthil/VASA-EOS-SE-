import { test } from "node:test"
import assert from "node:assert/strict"
import { navMessageKey } from "@/lib/i18n/nav-labels"
import { MESSAGE_KEYS, resources } from "@/lib/i18n/resources"

test("every mapped nav title resolves to a committed, Tamil-localised key", () => {
  const known = new Set<string>(MESSAGE_KEYS)
  for (const title of ["Dashboard", "Attendance", "Schemes", "Governance", "Accessibility", "Fee Management", "Staff Management", "Students (SIS)"]) {
    const key = navMessageKey(title)
    assert.ok(key, `nav title '${title}' should map to a key`)
    assert.ok(known.has(key), `nav key '${key}' must be a committed MESSAGE_KEY`)
    // the mapped key is actually localised in Tamil (the live sidebar will translate it)
    assert.notEqual(resources.ta.translation[key], undefined, `Tamil missing '${key}'`)
  }
})

test("an unmapped title falls back (undefined) so the sidebar keeps its English label", () => {
  assert.equal(navMessageKey("Cabinet Note"), undefined)
  assert.equal(navMessageKey(""), undefined)
})
