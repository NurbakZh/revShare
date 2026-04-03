use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::state::{BusinessPool, HolderClaim, RevenueEpoch};
use crate::errors::RevShareError;

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        seeds = [b"business", business_pool.owner.as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    #[account(
        mut,
        seeds = [b"claim", business_pool.key().as_ref(), investor.key().as_ref()],
        bump = holder_claim.bump,
    )]
    pub holder_claim: Account<'info, HolderClaim>,

    #[account(
        seeds = [
            b"epoch",
            business_pool.key().as_ref(),
            &holder_claim.last_claimed_epoch.to_le_bytes()
        ],
        bump = revenue_epoch.bump,
    )]
    pub revenue_epoch: Account<'info, RevenueEpoch>,

    /// CHECK: vault sends SOL to investor
    #[account(
        mut,
        seeds = [b"vault", business_pool.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Claim>) -> Result<()> {
    let pool = &ctx.accounts.business_pool;
    let claim = &mut ctx.accounts.holder_claim;
    let epoch = &ctx.accounts.revenue_epoch;

    require!(
        claim.last_claimed_epoch < pool.current_epoch,
        RevShareError::AlreadyClaimed
    );

    let investor_share = epoch.distributed_amount
        .checked_mul(claim.token_held).unwrap()
        .checked_div(pool.total_tokens).unwrap();

    let pool_key = pool.key();
    let vault_bump = ctx.bumps.vault;
    let seeds = &[b"vault".as_ref(), pool_key.as_ref(), &[vault_bump]];
    let signer = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.investor.to_account_info(),
        },
        signer,
    );
    system_program::transfer(cpi_ctx, investor_share)?;

    claim.last_claimed_epoch += 1;
    claim.total_claimed += investor_share;

    msg!("Claimed {} lamports for epoch {}", investor_share, epoch.epoch_number);
    Ok(())
}