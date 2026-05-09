use anchor_lang::prelude::*;

declare_id!("RuBy111111111111111111111111111111111111111");

#[program]
pub mod ruby_protocol {
    use super::*;

    pub fn create_group(
        ctx: Context<CreateGroup>,
        group_id: String,
        contribution_lamports: u64,
        max_members: u8,
    ) -> Result<()> {
        require!(max_members > 0 && max_members <= 10, RubyError::InvalidMaxMembers);
        let group = &mut ctx.accounts.group;
        group.group_id = group_id;
        group.creator = ctx.accounts.creator.key();
        group.contribution_lamports = contribution_lamports;
        group.max_members = max_members;
        group.member_count = 1;
        group.vault_balance = 0;
        group.cycles = 0;
        Ok(())
    }

    pub fn join_group(ctx: Context<JoinGroup>) -> Result<()> {
        let group = &mut ctx.accounts.group;
        require!(group.member_count < group.max_members, RubyError::GroupFull);

        let member = &mut ctx.accounts.member;
        member.group = group.key();
        member.wallet = ctx.accounts.member_wallet.key();
        member.total_contributed = 0;
        member.credit_score = 0;
        member.bump = ctx.bumps.member;

        group.member_count = group.member_count.saturating_add(1);
        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>, amount: u64, on_time: bool) -> Result<()> {
        let group = &mut ctx.accounts.group;
        let member = &mut ctx.accounts.member;
        member.total_contributed = member.total_contributed.saturating_add(amount);
        if on_time {
            member.credit_score = member.credit_score.saturating_add(1);
        }
        group.vault_balance = group.vault_balance.saturating_add(amount);
        group.cycles = group.cycles.saturating_add(1);
        Ok(())
    }

    pub fn create_swig_proposal(
        ctx: Context<CreateSwigProposal>,
        kind: u8,
        amount_lamports: u64,
        approvals_required: u8,
    ) -> Result<()> {
        require!(approvals_required > 0, RubyError::InvalidApprovalsRequired);
        let proposal = &mut ctx.accounts.proposal;
        proposal.group = ctx.accounts.group.key();
        proposal.kind = kind;
        proposal.amount_lamports = amount_lamports;
        proposal.approvals_required = approvals_required;
        proposal.approvals_count = 0;
        proposal.status = ProposalStatus::Pending;
        proposal.created_by = ctx.accounts.member_wallet.key();
        Ok(())
    }

    pub fn approve_swig_proposal(ctx: Context<ApproveSwigProposal>) -> Result<()> {
        let approval = &mut ctx.accounts.approval;
        approval.proposal = ctx.accounts.proposal.key();
        approval.member = ctx.accounts.member.key();
        approval.bump = ctx.bumps.approval;

        let proposal = &mut ctx.accounts.proposal;
        proposal.approvals_count = proposal.approvals_count.saturating_add(1);
        if proposal.approvals_count >= proposal.approvals_required {
            proposal.status = ProposalStatus::Approved;
        }
        Ok(())
    }

    pub fn create_loan_request(ctx: Context<CreateLoanRequest>, amount_lamports: u64) -> Result<()> {
        let loan = &mut ctx.accounts.loan;
        loan.group = ctx.accounts.group.key();
        loan.borrower = ctx.accounts.borrower_wallet.key();
        loan.amount_lamports = amount_lamports;
        loan.approvals = 0;
        loan.rejections = 0;
        loan.status = LoanStatus::Pending;
        Ok(())
    }

    pub fn vote_loan_request(ctx: Context<VoteLoanRequest>, approve: bool) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        vote.loan = ctx.accounts.loan.key();
        vote.member = ctx.accounts.member.key();
        vote.approve = approve;
        vote.bump = ctx.bumps.vote;

        let loan = &mut ctx.accounts.loan;
        if approve {
            loan.approvals = loan.approvals.saturating_add(1);
        } else {
            loan.rejections = loan.rejections.saturating_add(1);
        }
        if loan.approvals >= 3 {
            loan.status = LoanStatus::Approved;
        } else if loan.rejections >= 3 {
            loan.status = LoanStatus::Rejected;
        }
        Ok(())
    }

    pub fn create_blink_action(ctx: Context<CreateBlinkAction>, blink_type: u8) -> Result<()> {
        let blink = &mut ctx.accounts.blink_action;
        blink.group = ctx.accounts.group.key();
        blink.member = ctx.accounts.member.key();
        blink.blink_type = blink_type;
        blink.status = BlinkStatus::Created;
        Ok(())
    }

    pub fn execute_blink_action(ctx: Context<ExecuteBlinkAction>) -> Result<()> {
        let blink = &mut ctx.accounts.blink_action;
        blink.status = BlinkStatus::Executed;
        Ok(())
    }

    pub fn record_yield_event(ctx: Context<RecordYieldEvent>, amount_lamports: u64, protocol: u8, apy_bps: u16) -> Result<()> {
        let evt = &mut ctx.accounts.yield_event;
        evt.group = ctx.accounts.group.key();
        evt.amount_lamports = amount_lamports;
        evt.protocol = protocol;
        evt.apy_bps = apy_bps;
        evt.recorded_at = Clock::get()?.unix_timestamp;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(group_id: String)]
pub struct CreateGroup<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + GroupAccount::MAX_SIZE,
        seeds = [b"group", group_id.as_bytes()],
        bump
    )]
    pub group: Account<'info, GroupAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinGroup<'info> {
    #[account(mut)]
    pub member_wallet: Signer<'info>,
    #[account(mut)]
    pub group: Account<'info, GroupAccount>,
    #[account(
        init,
        payer = member_wallet,
        space = 8 + MemberAccount::MAX_SIZE,
        seeds = [b"member", group.key().as_ref(), member_wallet.key().as_ref()],
        bump
    )]
    pub member: Account<'info, MemberAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    pub member_wallet: Signer<'info>,
    #[account(mut)]
    pub group: Account<'info, GroupAccount>,
    #[account(mut, has_one = group, has_one = wallet @ RubyError::MemberWalletMismatch)]
    pub member: Account<'info, MemberAccount>,
}

#[derive(Accounts)]
pub struct CreateSwigProposal<'info> {
    pub member_wallet: Signer<'info>,
    pub group: Account<'info, GroupAccount>,
    pub member: Account<'info, MemberAccount>,
    #[account(
        init,
        payer = member_wallet,
        space = 8 + SwigProposalAccount::MAX_SIZE,
        seeds = [b"proposal", group.key().as_ref(), member_wallet.key().as_ref()],
        bump
    )]
    pub proposal: Account<'info, SwigProposalAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ApproveSwigProposal<'info> {
    pub member_wallet: Signer<'info>,
    pub group: Account<'info, GroupAccount>,
    pub member: Account<'info, MemberAccount>,
    #[account(mut)]
    pub proposal: Account<'info, SwigProposalAccount>,
    #[account(
        init,
        payer = member_wallet,
        space = 8 + ApprovalAccount::MAX_SIZE,
        seeds = [b"approval", proposal.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub approval: Account<'info, ApprovalAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateLoanRequest<'info> {
    pub borrower_wallet: Signer<'info>,
    pub group: Account<'info, GroupAccount>,
    pub member: Account<'info, MemberAccount>,
    #[account(
        init,
        payer = borrower_wallet,
        space = 8 + LoanRequestAccount::MAX_SIZE,
        seeds = [b"loan", group.key().as_ref(), borrower_wallet.key().as_ref()],
        bump
    )]
    pub loan: Account<'info, LoanRequestAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteLoanRequest<'info> {
    pub member_wallet: Signer<'info>,
    pub group: Account<'info, GroupAccount>,
    pub member: Account<'info, MemberAccount>,
    #[account(mut)]
    pub loan: Account<'info, LoanRequestAccount>,
    #[account(
        init,
        payer = member_wallet,
        space = 8 + LoanVoteAccount::MAX_SIZE,
        seeds = [b"loan_vote", loan.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub vote: Account<'info, LoanVoteAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateBlinkAction<'info> {
    pub member_wallet: Signer<'info>,
    pub group: Account<'info, GroupAccount>,
    pub member: Account<'info, MemberAccount>,
    #[account(
        init,
        payer = member_wallet,
        space = 8 + BlinkActionAccount::MAX_SIZE,
        seeds = [b"blink", group.key().as_ref(), member.key().as_ref()],
        bump
    )]
    pub blink_action: Account<'info, BlinkActionAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteBlinkAction<'info> {
    pub member_wallet: Signer<'info>,
    #[account(mut)]
    pub blink_action: Account<'info, BlinkActionAccount>,
}

#[derive(Accounts)]
pub struct RecordYieldEvent<'info> {
    pub agent_wallet: Signer<'info>,
    pub group: Account<'info, GroupAccount>,
    #[account(
        init,
        payer = agent_wallet,
        space = 8 + YieldEventAccount::MAX_SIZE,
        seeds = [b"yield", group.key().as_ref(), agent_wallet.key().as_ref()],
        bump
    )]
    pub yield_event: Account<'info, YieldEventAccount>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct GroupAccount {
    pub group_id: String,
    pub creator: Pubkey,
    pub contribution_lamports: u64,
    pub max_members: u8,
    pub member_count: u8,
    pub vault_balance: u64,
    pub cycles: u32,
}
impl GroupAccount {
    pub const MAX_SIZE: usize = 4 + 64 + 32 + 8 + 1 + 1 + 8 + 4;
}

#[account]
pub struct MemberAccount {
    pub group: Pubkey,
    pub wallet: Pubkey,
    pub total_contributed: u64,
    pub credit_score: u32,
    pub bump: u8,
}
impl MemberAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 4 + 1;
}

#[account]
pub struct SwigProposalAccount {
    pub group: Pubkey,
    pub kind: u8,
    pub amount_lamports: u64,
    pub approvals_required: u8,
    pub approvals_count: u8,
    pub status: ProposalStatus,
    pub created_by: Pubkey,
}
impl SwigProposalAccount {
    pub const MAX_SIZE: usize = 32 + 1 + 8 + 1 + 1 + 1 + 32;
}

#[account]
pub struct ApprovalAccount {
    pub proposal: Pubkey,
    pub member: Pubkey,
    pub bump: u8,
}
impl ApprovalAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 1;
}

#[account]
pub struct LoanRequestAccount {
    pub group: Pubkey,
    pub borrower: Pubkey,
    pub amount_lamports: u64,
    pub approvals: u8,
    pub rejections: u8,
    pub status: LoanStatus,
}
impl LoanRequestAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 8 + 1 + 1 + 1;
}

#[account]
pub struct LoanVoteAccount {
    pub loan: Pubkey,
    pub member: Pubkey,
    pub approve: bool,
    pub bump: u8,
}
impl LoanVoteAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 1 + 1;
}

#[account]
pub struct BlinkActionAccount {
    pub group: Pubkey,
    pub member: Pubkey,
    pub blink_type: u8,
    pub status: BlinkStatus,
}
impl BlinkActionAccount {
    pub const MAX_SIZE: usize = 32 + 32 + 1 + 1;
}

#[account]
pub struct YieldEventAccount {
    pub group: Pubkey,
    pub amount_lamports: u64,
    pub protocol: u8,
    pub apy_bps: u16,
    pub recorded_at: i64,
}
impl YieldEventAccount {
    pub const MAX_SIZE: usize = 32 + 8 + 1 + 2 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProposalStatus {
    Pending,
    Approved,
    Executed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum LoanStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum BlinkStatus {
    Created,
    Executed,
    Failed,
}

#[error_code]
pub enum RubyError {
    #[msg("Invalid max members. Must be between 1 and 10.")]
    InvalidMaxMembers,
    #[msg("Group has reached max members.")]
    GroupFull,
    #[msg("Invalid approvals_required.")]
    InvalidApprovalsRequired,
    #[msg("Member wallet mismatch.")]
    MemberWalletMismatch,
}
