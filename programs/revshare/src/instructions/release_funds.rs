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

    let release_amount = total_raised
        .checked_mul(tranche_pct).unwrap()
        .checked_div(100).unwrap();

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