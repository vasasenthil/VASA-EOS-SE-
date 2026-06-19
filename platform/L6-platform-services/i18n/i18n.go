// Package i18n is the L6 code-first localisation catalogue + TMS coverage (CC-SPEC-001 §16, brochure: WCAG
// AAA + multilingual). Messages are keyed strings with {placeholder} interpolation; a lookup falls back to
// the fallback locale (then the key itself) so a missing translation never breaks a surface. The TMS helpers
// (Missing / Coverage) report each locale's translation gap against the fallback, the signal a translation-
// management workflow acts on. Tamil (ta) is first-class alongside English (en). Stdlib-only, safe for
// concurrent reads after load.
package i18n

import (
	"sort"
	"strings"
)

// Locale is a BCP-47-ish language tag.
type Locale string

const (
	En Locale = "en"
	Ta Locale = "ta" // Tamil — the State language
)

// Catalogue holds messages per locale with a fallback.
type Catalogue struct {
	msgs     map[Locale]map[string]string
	fallback Locale
}

// New builds a catalogue with the given fallback locale.
func New(fallback Locale) *Catalogue {
	return &Catalogue{msgs: map[Locale]map[string]string{}, fallback: fallback}
}

// Set adds or replaces one message.
func (c *Catalogue) Set(locale Locale, key, msg string) {
	if c.msgs[locale] == nil {
		c.msgs[locale] = map[string]string{}
	}
	c.msgs[locale][key] = msg
}

// Load bulk-loads a locale's messages.
func (c *Catalogue) Load(locale Locale, messages map[string]string) {
	for k, v := range messages {
		c.Set(locale, k, v)
	}
}

// Has reports whether a locale defines a key.
func (c *Catalogue) Has(locale Locale, key string) bool {
	_, ok := c.msgs[locale][key]
	return ok
}

// raw returns the template for a key, falling back to the fallback locale, then to the key itself.
func (c *Catalogue) raw(locale Locale, key string) string {
	if m, ok := c.msgs[locale][key]; ok {
		return m
	}
	if locale != c.fallback {
		if m, ok := c.msgs[c.fallback][key]; ok {
			return m
		}
	}
	return key
}

// T translates a key for a locale, interpolating {name} placeholders from vars.
func (c *Catalogue) T(locale Locale, key string, vars map[string]string) string {
	out := c.raw(locale, key)
	if len(vars) == 0 || !strings.Contains(out, "{") {
		return out
	}
	for k, v := range vars {
		out = strings.ReplaceAll(out, "{"+k+"}", v)
	}
	return out
}

// Locales returns the locales that have any messages (sorted).
func (c *Catalogue) Locales() []Locale {
	var ls []Locale
	for l := range c.msgs {
		ls = append(ls, l)
	}
	sort.Slice(ls, func(i, j int) bool { return ls[i] < ls[j] })
	return ls
}

// Missing returns the keys present in the fallback locale but absent in `locale` (the TMS translation gap),
// sorted.
func (c *Catalogue) Missing(locale Locale) []string {
	var miss []string
	for key := range c.msgs[c.fallback] {
		if _, ok := c.msgs[locale][key]; !ok {
			miss = append(miss, key)
		}
	}
	sort.Strings(miss)
	return miss
}

// Coverage returns the fraction of fallback keys translated in `locale`, in [0,1] (1.0 for the fallback).
func (c *Catalogue) Coverage(locale Locale) float64 {
	base := len(c.msgs[c.fallback])
	if base == 0 {
		return 1
	}
	have := 0
	for key := range c.msgs[c.fallback] {
		if _, ok := c.msgs[locale][key]; ok {
			have++
		}
	}
	return float64(have) / float64(base)
}
