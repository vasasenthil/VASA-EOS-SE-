package i18n

import (
	"math"
	"reflect"
	"testing"
)

func seed() *Catalogue {
	c := New(En)
	c.Load(En, map[string]string{
		"admission.admitted": "{name} has been admitted to {school}.",
		"admission.review":   "Application {id} needs your review.",
		"greeting":           "Welcome",
	})
	c.Load(Ta, map[string]string{
		"admission.admitted": "{name} {school} இல் சேர்க்கப்பட்டார்.",
		"greeting":           "வரவேற்பு",
		// admission.review deliberately untranslated → TMS gap
	})
	return c
}

func TestInterpolation(t *testing.T) {
	c := seed()
	got := c.T(En, "admission.admitted", map[string]string{"name": "Anbu", "school": "Chennai HSS"})
	if got != "Anbu has been admitted to Chennai HSS." {
		t.Fatalf("interpolation wrong: %q", got)
	}
}

func TestTamilTranslation(t *testing.T) {
	c := seed()
	got := c.T(Ta, "admission.admitted", map[string]string{"name": "அன்பு", "school": "சென்னை"})
	if got != "அன்பு சென்னை இல் சேர்க்கப்பட்டார்." {
		t.Fatalf("tamil interpolation wrong: %q", got)
	}
}

func TestFallbackToDefaultLocale(t *testing.T) {
	c := seed()
	// admission.review is missing in ta → falls back to en
	got := c.T(Ta, "admission.review", map[string]string{"id": "STU-9"})
	if got != "Application STU-9 needs your review." {
		t.Fatalf("should fall back to en: %q", got)
	}
}

func TestUnknownKeyReturnsKey(t *testing.T) {
	if got := seed().T(En, "no.such.key", nil); got != "no.such.key" {
		t.Fatalf("unknown key should return itself, got %q", got)
	}
}

func TestMissingAndCoverageTMS(t *testing.T) {
	c := seed()
	miss := c.Missing(Ta)
	if !reflect.DeepEqual(miss, []string{"admission.review"}) {
		t.Fatalf("ta should be missing admission.review, got %v", miss)
	}
	// en has 3 keys, ta translates 2 → 2/3 coverage
	if cov := c.Coverage(Ta); math.Abs(cov-2.0/3.0) > 1e-9 {
		t.Fatalf("ta coverage should be 2/3, got %v", cov)
	}
	if cov := c.Coverage(En); cov != 1 {
		t.Fatalf("the fallback locale is fully covered, got %v", cov)
	}
}

func TestHasAndLocales(t *testing.T) {
	c := seed()
	if !c.Has(Ta, "greeting") || c.Has(Ta, "admission.review") {
		t.Fatal("Has wrong")
	}
	if ls := c.Locales(); !reflect.DeepEqual(ls, []Locale{En, Ta}) {
		t.Fatalf("locales should be [en ta], got %v", ls)
	}
}
