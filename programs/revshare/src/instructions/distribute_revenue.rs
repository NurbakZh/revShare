use anchor_lang::prelude::*;
use anchor_lang::system_program;
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

    /// CHECK: funds vault receives the investor revenue share from oracle
    #[account(
        mut,
        seeds = [b"funds_vault", business_pool.key().as_ref()],
        bump,
    )]
    pub funds_vault: UncheckedAccount<'info>,

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

    // Oracle deposits the investor share into the funds vault so investors can claim
    if distributed > 0 {
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.oracle.to_account_info(),
                to: ctx.accounts.funds_vault.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, distributed)?;
    }

    pool.current_epoch += 1;
    pool.total_distributed += distributed;
    pool.total_revenue += revenue_amount;

    // Unlock second tranche after first revenue distribution
    if pool.current_epoch == 1 && pool.funds_released == 50 {
        pool.funds_released = 70;
        msg!("Second tranche unlocked");
    }

    // Unlock third tranche after 4 distributions if avg monthly revenue >= target
    if pool.current_epoch >= 4 && pool.funds_released == 80 {
        let avg_revenue = pool.total_revenue / pool.current_epoch;
        if avg_revenue >= pool.target_revenue {
            pool.funds_released = 100;
            msg!(
                "Third tranche unlocked: avg_revenue={} >= target={}",
                avg_revenue,
                pool.target_revenue
            );
        } else {
            msg!(
                "KPI not met: avg_revenue={} < target={}",
                avg_revenue,
                pool.target_revenue
            );
        }
    }

    msg!("Epoch {} distributed: {} lamports", epoch.epoch_number, distributed);
    Ok(())
}