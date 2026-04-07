use anchor_lang::prelude::*;
use crate::state::BusinessPool;
use crate::errors::RevShareError;

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", owner.key().as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
        has_one = owner,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    /// CHECK: funds vault releases SOL to owner
    #[account(
        mut,
        seeds = [b"funds_vault", business_pool.key().as_ref()],
        bump,
    )]
    pub funds_vault: UncheckedAccount<'info>,

}

pub fn handler(ctx: Context<ReleaseFunds>) -> Result<()> {
    let pool = &mut ctx.accounts.business_pool;

    require!(pool.funds_released > 0, RevShareError::InsufficientCollateral);

    let total_raised = pool.total_raised;

    let tranche_pct: u64 = if pool.funds_released == 40 {
        40
    } else if pool.funds_released == 70 {
        30
    } else if pool.funds_released == 100 {
        30
    } else {
        return err!(RevShareError::InsufficientCollateral);
    };

    let nominal = total_raised
        .checked_mul(tranche_pct).unwrap()
        .checked_div(100).unwrap();

    // Cap to actual vault balance to guard against small discrepancies
    // (e.g. secondary-market sales do not increment total_raised).
    let vault_balance = ctx.accounts.funds_vault.lamports();
    let release_amount = nominal.min(vault_balance);

    require!(release_amount > 0, RevShareError::InsufficientCollateral);

    **ctx.accounts.funds_vault.try_borrow_mut_lamports()? -= release_amount;
    **ctx.accounts.owner.try_borrow_mut_lamports()? += release_amount;

    // Update funds_released to prevent double release
    if pool.funds_released == 40 {
        pool.funds_released = 50; // 40% released
    } else if pool.funds_released == 70 {
        pool.funds_released = 80; // 70% released  
    } else if pool.funds_released == 100 {
        pool.funds_released = 110; // 100% released
    }

    msg!("Released {}% = {} lamports to owner", tranche_pct, release_amount);
    Ok(())
}