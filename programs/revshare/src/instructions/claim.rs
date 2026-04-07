use anchor_lang::prelude::*;
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

    /// CHECK: funds vault sends SOL to investor
    #[account(
        mut,
        seeds = [b"funds_vault", business_pool.key().as_ref()],
        bump,
    )]
    pub funds_vault: UncheckedAccount<'info>,

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

    let vault_lamports = **ctx.accounts.funds_vault.try_borrow_lamports()?;
    require!(vault_lamports >= investor_share, RevShareError::InsufficientFunds);
    **ctx.accounts.funds_vault.try_borrow_mut_lamports()? -= investor_share;
    **ctx.accounts.investor.try_borrow_mut_lamports()? += investor_share;

    claim.last_claimed_epoch += 1;
    claim.total_claimed += investor_share;

    msg!("Claimed {} lamports for epoch {}", investor_share, epoch.epoch_number);
    Ok(())
}