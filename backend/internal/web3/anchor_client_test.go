package web3

import "testing"

func TestBuildTxPlanRequiresProgramConfig(t *testing.T) {
	client := NewAnchorClient(ProgramConfig{})
	_, err := client.BuildTxPlan("create_group", map[string]any{}, map[string]any{})
	if err == nil {
		t.Fatal("expected error when program IDs are missing")
	}
}

func TestBuildTxPlanSuccess(t *testing.T) {
	client := NewAnchorClient(ProgramConfig{
		RubyProgramID:      "ruby111",
		SwigProgramID:      "swig111",
		Token2022ProgramID: "token111",
		AnchorIDLPath:      "missing.json",
	})
	plan, err := client.BuildTxPlan("create_group", map[string]any{"group_id": "g1"}, map[string]any{"amount": 100})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if plan.ProgramID != "ruby111" || plan.InstructionName != "create_group" {
		t.Fatalf("unexpected plan: %+v", plan)
	}
}
