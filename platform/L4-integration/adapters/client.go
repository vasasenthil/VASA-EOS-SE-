package adapters

import (
	"context"
	"encoding/json"
	"io"
	"math/rand"
	"net/http"
	"time"

	"github.com/vasa-eos-se-tn/platform/resilience"
)

// core is the shared resilient HTTP client every sovereign-DPI adapter is built on: a circuit breaker +
// bounded retry around a GET that decodes JSON, with 5xx/transport errors retried and 4xx not (see retryable
// in apaar.go). Each concrete adapter embeds *core and adds its own DTO + anti-corruption transform.
type core struct {
	baseURL string
	http    *http.Client
	breaker *resilience.Breaker
	retry   resilience.RetryPolicy
	sleep   func(time.Duration)
	rnd     *rand.Rand
}

// newCore builds a resilient client over an upstream base URL with sane defaults.
func newCore(baseURL string, hc *http.Client) *core {
	if hc == nil {
		hc = &http.Client{Timeout: 5 * time.Second}
	}
	return &core{
		baseURL: baseURL,
		http:    hc,
		breaker: resilience.NewBreaker(resilience.BreakerConfig{FailThreshold: 3, OpenTimeout: 20 * time.Second, SuccessThreshold: 1}),
		retry:   resilience.RetryPolicy{MaxAttempts: 3, BaseDelay: 5 * time.Millisecond, MaxDelay: 50 * time.Millisecond, Retryable: retryable},
		sleep:   time.Sleep,
		rnd:     rand.New(rand.NewSource(time.Now().UnixNano())),
	}
}

// Breaker exposes the circuit breaker (for health/status surfaces).
func (c *core) Breaker() *resilience.Breaker { return c.breaker }

// getJSON performs a GET through breaker+retry and decodes the body into out.
func (c *core) getJSON(ctx context.Context, path string, out any) error {
	return resilience.Retry(ctx, c.retry, c.sleep, c.rnd, func() error {
		return c.breaker.Do(func() error {
			req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.baseURL+path, nil)
			if err != nil {
				return err
			}
			resp, err := c.http.Do(req)
			if err != nil {
				return err
			}
			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)
			if resp.StatusCode >= 400 {
				return &HTTPError{Status: resp.StatusCode, Body: string(body)}
			}
			return json.Unmarshal(body, out)
		})
	})
}
