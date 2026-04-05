use anchor_lang::prelude::*;
use crate::errors::RevShareError;
use crate::state::BusinessPool;

/// Sync `funds_released` to 40 when the fundraise is complete but the flag was
/// never set (e.g. raise cap hit before `tokens_sold == total_tokens`).
#[derive(Accounts)]
pub struct UnlockFirstTranche<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", owner.key().as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
        has_one = owner,
    )]
    pub business_pool: Account<'info, BusinessPool>,
}

pub fn handler(ctx: Context<UnlockFirstTranche>) -> Result<()> {
    let pool = &mut ctx.accounts.business_pool;
    if pool.funds_released != 0 {
        return Ok(());
    }
    pool.try_unlock_first_tranche();
    require!(pool.funds_released == 40, RevShareError::InsufficientCollateral);
    Ok(())
}
