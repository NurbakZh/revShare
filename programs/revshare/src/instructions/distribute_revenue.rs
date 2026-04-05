use anchor_lang::prelude::*;
use crate::state::{BusinessPool, RevenueEpoch};
use crate::errors::RevShareError;

#[derive(Accounts)]
pub struct DistributeRevenue<'info> {
    #[account(mut)]
    pub oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", business_pool.owner.as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    #[account(
        init,
        payer = oracle,
        space = RevenueEpoch::LEN,
        seeds = [
            b"epoch",
            business_pool.key().as_ref(),
            &business_pool.current_epoch.to_le_bytes()
        ],
        bump,
    )]
    pub revenue_epoch: Account<'info, RevenueEpoch>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<DistributeRevenue>, revenue_amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.business_pool;

    require!(!pool.is_defaulted, RevShareError::BusinessDefaulted);
    require!(
        ctx.accounts.oracle.key() == pool.oracle_authority,
        RevShareError::UnauthorizedOracle
    );

    let distributed = revenue_amount
        .checked_mul(pool.revenue_share_bps as u64).unwrap()
        .checked_div(10_000).unwrap();

    let epoch = &mut ctx.accounts.revenue_epoch;
    epoch.business = pool.key();
    epoch.epoch_number = pool.current_epoch;
    epoch.revenue_amount = revenue_amount;
    epoch.distributed_amount = distributed;
    epoch.timestamp = Clock::get()?.unix_timestamp;
    epoch.bump = ctx.bumps.revenue_epoch;

    pool.current_epoch += 1;
    pool.total_distributed += distributed;

    // Unlock second tranche after first distribution (50 = 40% already released)
    if pool.current_epoch == 1 && pool.funds_released == 50 {
        pool.funds_released = 70;
        msg!("Second tranche unlocked: 70%");
    }
    // Unlock third tranche after second distribution (80 = 70% already released)
    if pool.current_epoch == 2 && pool.funds_released == 80 {
        pool.funds_released = 100;
        msg!("Third tranche unlocked: 100%");
    }

    msg!("Epoch {} distributed: {} lamports", epoch.epoch_number, distributed);
    Ok(())
}