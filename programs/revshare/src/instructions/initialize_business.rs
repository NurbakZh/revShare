use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token::{Mint, Token};
use crate::state::BusinessPool;
use crate::errors::RevShareError;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitBusinessParams {
    pub id: u64,
    pub total_tokens: u64,
    pub token_price: u64,
    pub revenue_share_bps: u16,
    pub collateral_amount: u64,
    pub raise_limit: u64,
    pub target_revenue: u64,
    pub oracle_authority: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: InitBusinessParams)]
pub struct InitializeBusiness<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = BusinessPool::LEN,
        seeds = [b"business", owner.key().as_ref(), &params.id.to_le_bytes()],
        bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    #[account(
        init,
        payer = owner,
        mint::decimals = 0,
        mint::authority = business_pool,
        seeds = [b"mint", business_pool.key().as_ref()],
        bump,
    )]
    pub token_mint: Account<'info, Mint>,

    /// CHECK: collateral vault holds business collateral for investor protection
    #[account(
        init,
        payer = owner,
        space = 0,
        seeds = [b"collateral_vault", business_pool.key().as_ref()],
        bump,
        owner = crate::id(),
    )]
    pub collateral_vault: UncheckedAccount<'info>,

    /// CHECK: funds vault holds raised SOL from token sales
    #[account(
        init,
        payer = owner,
        space = 0,
        seeds = [b"funds_vault", business_pool.key().as_ref()],
        bump,
        owner = crate::id(),
    )]
    pub funds_vault: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<InitializeBusiness>, params: InitBusinessParams) -> Result<()> {
    require!(
        params.revenue_share_bps <= 5000,
        RevShareError::InvalidRevenueShareBps
    );

    let min_collateral = params.raise_limit
        .checked_mul(30).unwrap()
        .checked_div(100).unwrap();
    require!(
        params.collateral_amount >= min_collateral,
        RevShareError::InsufficientCollateral
    );

    let pool = &mut ctx.accounts.business_pool;
    pool.owner = ctx.accounts.owner.key();
    pool.oracle_authority = params.oracle_authority;
    pool.token_mint = ctx.accounts.token_mint.key();
    pool.id = params.id;
    pool.total_tokens = params.total_tokens;
    pool.tokens_sold = 0;
    pool.revenue_share_bps = params.revenue_share_bps;
    pool.collateral = params.collateral_amount;
    pool.token_price = params.token_price;
    pool.current_epoch = 0;
    pool.total_distributed = 0;
    pool.total_revenue = 0;
    pool.is_defaulted = false;
    pool.raise_limit = params.raise_limit;
    pool.funds_released = 0;
    pool.total_raised = 0;
    pool.target_revenue = params.target_revenue;
    pool.bump = ctx.bumps.business_pool;

    // Transfer collateral to collateral vault
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.owner.to_account_info(),
            to: ctx.accounts.collateral_vault.to_account_info(),
        },
    );
    system_program::transfer(cpi_ctx, params.collateral_amount)?;

    msg!("Business {} initialized. Raise limit: {}", params.id, params.raise_limit);
    Ok(())
}