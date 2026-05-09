package web3

import (
	"encoding/json"
	"errors"
	"os"
	"strings"
)

type ProgramConfig struct {
	RubyProgramID      string
	SwigProgramID      string
	Token2022ProgramID string
	AnchorIDLPath      string
}

type AnchorClient struct {
	cfg ProgramConfig
	idl *anchorIDL
}

type anchorIDL struct {
	Name         string `json:"name"`
	Instructions []struct {
		Name string `json:"name"`
	} `json:"instructions"`
}

type TxPlan struct {
	Network         string         `json:"network"`
	ProgramID       string         `json:"program_id"`
	InstructionName string         `json:"instruction_name"`
	Accounts        map[string]any `json:"accounts"`
	Args            map[string]any `json:"args"`
	HasIDL          bool           `json:"has_idl"`
}

func NewAnchorClient(cfg ProgramConfig) *AnchorClient {
	c := &AnchorClient{cfg: cfg}
	c.loadIDL()
	return c
}

func (c *AnchorClient) loadIDL() {
	raw, err := os.ReadFile(c.cfg.AnchorIDLPath)
	if err != nil {
		return
	}
	var idl anchorIDL
	if err := json.Unmarshal(raw, &idl); err != nil {
		return
	}
	c.idl = &idl
}

func (c *AnchorClient) IDLAvailable() bool {
	return c.idl != nil
}

func (c *AnchorClient) ValidateConfig() error {
	if strings.TrimSpace(c.cfg.RubyProgramID) == "" {
		return errors.New("RUBY_PROGRAM_ID is required")
	}
	if strings.TrimSpace(c.cfg.Token2022ProgramID) == "" {
		return errors.New("TOKEN_2022_PROGRAM_ID is required")
	}
	if strings.TrimSpace(c.cfg.SwigProgramID) == "" {
		return errors.New("SWIG_PROGRAM_ID is required")
	}
	return nil
}

func (c *AnchorClient) BuildTxPlan(instruction string, accounts map[string]any, args map[string]any) (*TxPlan, error) {
	if err := c.ValidateConfig(); err != nil {
		return nil, err
	}
	return &TxPlan{
		Network:         "devnet",
		ProgramID:       c.cfg.RubyProgramID,
		InstructionName: instruction,
		Accounts:        accounts,
		Args:            args,
		HasIDL:          c.IDLAvailable(),
	}, nil
}
