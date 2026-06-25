package integration

import "testing"

func TestSLABoardMeasuredLive(t *testing.T) {
	p := newPlatform(t)
	board := p.SLABoard()
	if len(board) < 2 {
		t.Fatalf("expected at least the model-card + audit SLAs measured live, got %d", len(board))
	}
	byDomain := map[string]SLAStatus{}
	for _, s := range board {
		byDomain[s.Domain] = s
	}
	mc, ok := byDomain["model_card"]
	if !ok {
		t.Fatal("the model-card coverage SLA must be on the board")
	}
	// the only production model is the signed, deployed safety classifier → coverage 1.0, SLA met, sourced
	// from the §G registry (not hard-coded).
	if mc.Measured != 1 || !mc.Met || mc.Source == "" {
		t.Fatalf("model-card SLA should be measured 1.0/met from the registry: %+v", mc)
	}
	au, ok := byDomain["audit"]
	if !ok {
		t.Fatal("the audit-integrity SLA must be on the board")
	}
	if au.Measured != 1 || !au.Met {
		t.Fatalf("audit-integrity SLA should be met on a verified chain: %+v", au)
	}
}
