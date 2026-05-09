package webhook_test

import (
	"encoding/json"
	"testing"

	"github.com/dev3pack/ruby/backend/internal/webhook"
)

func TestParseExplicitContribute(t *testing.T) {
	raw := []byte(`{"instruction":"contribute","group_id":"g1","member_id":"m1","wallet_address":"W1","amount":5000000,"cycle_number":2,"signature":"sig1"}`)
	ops, err := webhook.ParseHeliusJSON(raw, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(ops) != 1 || ops[0].Kind != "contribute" || ops[0].Amount != 5000000 || ops[0].CycleNumber != 2 {
		t.Fatalf("unexpected ops: %+v", ops)
	}
}

func TestParseExplicitYieldEvent(t *testing.T) {
	raw := []byte(`{"instruction":"yield_event","group_id":"g1","amount_deposited":9000000,"protocol":"kamino","apy":7.5,"signature":"ysig"}`)
	ops, err := webhook.ParseHeliusJSON(raw, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(ops) != 1 || ops[0].Kind != "yield_event" || ops[0].AmountDeposited != 9000000 {
		t.Fatalf("unexpected ops: %+v", ops)
	}
}

func TestParseBatchArray(t *testing.T) {
	raw := []byte(`[
		{"instruction":"contribute","group_id":"g1","member_id":"m1","wallet_address":"W1","amount":100,"cycle_number":1,"signature":"a"},
		{"instruction":"yield_event","group_id":"g1","amount_deposited":200,"protocol":"jito","apy":6.2,"signature":"b"}
	]`)
	ops, err := webhook.ParseHeliusJSON(raw, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(ops) != 2 {
		t.Fatalf("expected 2 ops, got %d %+v", len(ops), ops)
	}
}

func TestParseUnknownInstructionIgnored(t *testing.T) {
	raw := []byte(`{"instruction":"withdraw","group_id":"g1"}`)
	ops, err := webhook.ParseHeliusJSON(raw, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(ops) != 0 {
		t.Fatalf("expected no ops, got %+v", ops)
	}
}

func TestParseHeliusTransactionLogsRubyMemo(t *testing.T) {
	raw := []byte(`{
		"signature":"sigx",
		"transaction":{
			"meta":{
				"logMessages":[
					"Program log: ruby:contribute:grpMemo:WalletMemo:5000000:1"
				]
			}
		}
	}`)
	var m map[string]any
	if err := json.Unmarshal(raw, &m); err != nil {
		t.Fatal(err)
	}
	ops := webhook.ParseHeliusMap(m, "")
	if len(ops) != 1 || ops[0].GroupID != "grpMemo" || ops[0].Amount != 5000000 {
		t.Fatalf("unexpected %+v", ops)
	}
}
