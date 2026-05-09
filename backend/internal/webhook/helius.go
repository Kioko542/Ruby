// Package webhook parses Helius (and demo-shaped) Solana webhook payloads.
package webhook

import (
	"encoding/json"
	"strconv"
	"strings"
)

// ParsedOp is a normalized instruction detected from a webhook payload.
type ParsedOp struct {
	Kind            string // contribute | yield_event
	GroupID         string
	MemberID        string
	WalletAddress   string
	Amount          int64
	CycleNumber     int
	Signature       string
	Protocol        string
	APY             float64
	AmountDeposited int64 // yield_event
}

// ParseHeliusJSON parses a Helius webhook body (single object or JSON array of transactions).
func ParseHeliusJSON(raw []byte, rubyProgramID string) ([]ParsedOp, error) {
	raw = trimSpaceBytes(raw)
	if len(raw) == 0 {
		return nil, nil
	}
	if raw[0] == '[' {
		var batch []json.RawMessage
		if err := json.Unmarshal(raw, &batch); err != nil {
			return nil, err
		}
		var out []ParsedOp
		for _, chunk := range batch {
			ops, err := parseOneJSON(chunk, rubyProgramID)
			if err != nil {
				return nil, err
			}
			out = append(out, ops...)
		}
		return out, nil
	}
	return parseOneJSON(raw, rubyProgramID)
}

func trimSpaceBytes(b []byte) []byte {
	return []byte(strings.TrimSpace(string(b)))
}

func parseOneJSON(raw []byte, rubyProgramID string) ([]ParsedOp, error) {
	var payload map[string]any
	if err := json.Unmarshal(raw, &payload); err != nil {
		return nil, err
	}
	return ParseHeliusMap(payload, rubyProgramID), nil
}

// ParseHeliusMap extracts operations from one decoded JSON object.
func ParseHeliusMap(payload map[string]any, rubyProgramID string) []ParsedOp {
	var out []ParsedOp
	if op := parseExplicitInstruction(payload); op != nil {
		return append(out, *op)
	}

	sig := stringField(payload, "signature")

	if op := parseExplicitInstruction(nestedMap(payload, "params")); op != nil {
		op.Signature = pickSig(op.Signature, sig)
		return append(out, *op)
	}

	if tx := nestedMap(payload, "transaction"); len(tx) > 0 {
		if meta := nestedMap(tx, "meta"); len(meta) > 0 {
			if logs := stringSlice(meta, "logMessages"); len(logs) > 0 {
				if kind := detectInstructionFromLogs(logs); kind != "" {
					op := ParsedOp{
						Kind:      kind,
						Signature: sig,
					}
					fillDemoFieldsFromLogs(logs, &op)
					if op.GroupID != "" {
						out = append(out, op)
					}
				}
			}
		}
		if msg := nestedMap(tx, "message"); len(msg) > 0 {
			for _, ins := range nestedSlice(msg, "instructions") {
				m, ok := ins.(map[string]any)
				if !ok {
					continue
				}
				pid := stringField(m, "programId")
				if rubyProgramID != "" && !strings.EqualFold(pid, rubyProgramID) {
					continue
				}
				_ = m // reserved for future Anchor decode
			}
		}
	}

	return dedupeOps(out)
}

func parseExplicitInstruction(m map[string]any) *ParsedOp {
	if len(m) == 0 {
		return nil
	}
	inst := strings.ToLower(strings.TrimSpace(stringField(m, "instruction")))
	if inst == "" {
		inst = strings.ToLower(strings.TrimSpace(stringField(m, "kind")))
	}
	switch inst {
	case "contribute":
		op := &ParsedOp{
			Kind:          "contribute",
			GroupID:       stringField(m, "group_id"),
			MemberID:      stringField(m, "member_id"),
			WalletAddress: stringField(m, "wallet_address"),
			Signature:     stringField(m, "signature"),
			CycleNumber:   intFromAny(m["cycle_number"], 1),
			Amount:        int64FromAny(m["amount"]),
		}
		if op.WalletAddress == "" {
			op.WalletAddress = stringField(m, "wallet")
		}
		if op.MemberID == "" && op.WalletAddress != "" {
			op.MemberID = op.WalletAddress
		}
		if op.GroupID == "" || op.Amount <= 0 || op.WalletAddress == "" {
			return nil
		}
		if op.CycleNumber <= 0 {
			op.CycleNumber = 1
		}
		return op
	case "yield_event":
		op := &ParsedOp{
			Kind:            "yield_event",
			GroupID:         stringField(m, "group_id"),
			Signature:       stringField(m, "signature"),
			Protocol:        strings.ToLower(stringField(m, "protocol")),
			AmountDeposited: int64FromAny(m["amount_deposited"]),
			APY:             floatFromAny(m["apy"]),
		}
		if op.Protocol == "" {
			op.Protocol = "kamino"
		}
		if op.AmountDeposited <= 0 {
			op.AmountDeposited = int64FromAny(m["amount"])
		}
		if op.GroupID == "" || op.AmountDeposited <= 0 {
			return nil
		}
		return op
	default:
		return nil
	}
}

func detectInstructionFromLogs(logs []string) string {
	var blob string
	for _, line := range logs {
		blob += " " + strings.ToLower(line)
	}
	if strings.Contains(blob, "yield_event") || strings.Contains(blob, "yield event") {
		return "yield_event"
	}
	if strings.Contains(blob, "contribute") {
		return "contribute"
	}
	return ""
}

// Demo format in logs: Program log: ruby:contribute:<group_id>:<wallet>:<amt>:<cycle>
func fillDemoFieldsFromLogs(logs []string, op *ParsedOp) {
	for _, line := range logs {
		if !strings.Contains(strings.ToLower(line), "ruby:") {
			continue
		}
		parts := strings.Split(line, ":")
		for i := range parts {
			parts[i] = strings.TrimSpace(parts[i])
		}
		for i := 0; i < len(parts)-3; i++ {
			if strings.EqualFold(parts[i], "ruby") && strings.EqualFold(parts[i+1], "contribute") {
				op.GroupID = parts[i+2]
				op.WalletAddress = parts[i+3]
				if len(parts) > i+4 {
					op.Amount = int64FromAny(parts[i+4])
				}
				if len(parts) > i+5 {
					op.CycleNumber = intFromAny(parts[i+5], 1)
				}
				op.MemberID = op.WalletAddress
				return
			}
		}
	}
}

func dedupeOps(ops []ParsedOp) []ParsedOp {
	seen := map[string]struct{}{}
	var out []ParsedOp
	for _, op := range ops {
		key := op.Kind + "|" + op.Signature + "|" + op.GroupID + "|" + op.MemberID + "|" + strconv.FormatInt(op.Amount, 10)
		if _, ok := seen[key]; ok {
			continue
		}
		seen[key] = struct{}{}
		out = append(out, op)
	}
	return out
}

func pickSig(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}

func nestedMap(m map[string]any, key string) map[string]any {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	switch t := v.(type) {
	case map[string]any:
		return t
	case map[any]any:
		out := make(map[string]any, len(t))
		for k, val := range t {
			if ks, ok := k.(string); ok {
				out[ks] = val
			}
		}
		return out
	default:
		return nil
	}
}

func nestedSlice(m map[string]any, key string) []any {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	arr, ok := v.([]any)
	if !ok {
		return nil
	}
	return arr
}

func stringField(m map[string]any, key string) string {
	v, ok := m[key]
	if !ok || v == nil {
		return ""
	}
	switch t := v.(type) {
	case string:
		return strings.TrimSpace(t)
	case float64:
		return strconv.FormatInt(int64(t), 10)
	default:
		return strings.TrimSpace(fmtAny(v))
	}
}

func fmtAny(v any) string {
	b, err := json.Marshal(v)
	if err != nil {
		return ""
	}
	s := string(b)
	return strings.Trim(s, `"`)
}

func stringSlice(m map[string]any, key string) []string {
	v, ok := m[key]
	if !ok || v == nil {
		return nil
	}
	arr, ok := v.([]any)
	if !ok {
		return nil
	}
	out := make([]string, 0, len(arr))
	for _, x := range arr {
		if s, ok := x.(string); ok {
			out = append(out, s)
		}
	}
	return out
}

func int64FromAny(v any) int64 {
	switch t := v.(type) {
	case float64:
		return int64(t)
	case int64:
		return t
	case int:
		return int64(t)
	case json.Number:
		n, _ := t.Int64()
		return n
	case string:
		n, _ := strconv.ParseInt(strings.TrimSpace(t), 10, 64)
		return n
	default:
		return 0
	}
}

func intFromAny(v any, def int) int {
	n := int64FromAny(v)
	if n <= 0 {
		return def
	}
	return int(n)
}

func floatFromAny(v any) float64 {
	switch t := v.(type) {
	case float64:
		return t
	case float32:
		return float64(t)
	case json.Number:
		f, _ := t.Float64()
		return f
	case string:
		f, _ := strconv.ParseFloat(strings.TrimSpace(t), 64)
		return f
	default:
		return 0
	}
}
