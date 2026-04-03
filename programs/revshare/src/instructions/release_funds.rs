use anchor_lang::prelude::*;
use anchor_lang::system_program;
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

    /// CHECK: vault releases SOL to owner
    #[account(
        mut,
        seeds = [b"vault", business_pool.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ReleaseFunds>) -> Result<()> {
    let pool = &mut ctx.accounts.business_pool;

    require!(pool.funds_released > 0, RevShareError::InsufficientCollateral);

    let total_raised = pool.tokens_sold.checked_mul(pool.token_price).unwrap();

    let tranche_pct: u64 = if pool.funds_released == 40 {
        40
    } else if pool.funds_released == 70 {
        30
    } else {
        return err!(RevShareError::InsufficientCollateral);
    };

    let release_amount = total_raised
        .checked_mul(tranche_pct).unwrap()
        .checked_div(100).unwrap();

    let pool_key = pool.key();
    let vault_bump = ctx.bumps.vault;
    let seeds = &[b"vault".as_ref(), pool_key.as_ref(), &[vault_bump]];
    let signer = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.owner.to_account_info(),
        },
        signer,
    );
    system_program::transfer(cpi_ctx, release_amount)?;

    msg!("Released {}% = {} lamports to owner", tranche_pct, release_amount);
    Ok(())
}