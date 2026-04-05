use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};
use crate::state::{BusinessPool, HolderClaim};
use crate::errors::RevShareError;

#[derive(Accounts)]
pub struct BuyTokens<'info> {
    #[account(mut)]
    pub investor: Signer<'info>,

    #[account(
        mut,
        seeds = [b"business", business_pool.owner.as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    #[account(
        mut,
        seeds = [b"mint", business_pool.key().as_ref()],
        bump,
    )]
    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = investor,
        space = HolderClaim::LEN,
        seeds = [b"claim", business_pool.key().as_ref(), investor.key().as_ref()],
        bump,
    )]
    pub holder_claim: Account<'info, HolderClaim>,

    #[account(
        init_if_needed,
        payer = investor,
        associated_token::mint = token_mint,
        associated_token::authority = investor,
    )]
    pub investor_token_account: Account<'info, TokenAccount>,

    /// CHECK: vault receives SOL
    #[account(
        mut,
        seeds = [b"vault", business_pool.key().as_ref()],
        bump,
    )]
    pub vault: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
    let pool = &mut ctx.accounts.business_pool;

    require!(!pool.is_defaulted, RevShareError::BusinessDefaulted);
    require!(
        pool.tokens_sold + amount <= pool.total_tokens,
        RevShareError::NoTokensAvailable
    );

    let new_raised = (pool.tokens_sold + amount) * pool.token_price;
    require!(new_raised <= pool.raise_limit, RevShareError::RaiseLimitExceeded);

    // Transfer SOL to vault
    let total_cost = amount.checked_mul(pool.token_price).unwrap();
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.investor.to_account_info(),
            to: ctx.accounts.vault.to_account_info(),
        },
    );
    system_program::transfer(cpi_ctx, total_cost)?;

    // Mint tokens to investor
    let owner_key = pool.owner.clone();
    let id_bytes = pool.id.to_le_bytes();
    let bump = pool.bump;
    let seeds = &[b"business".as_ref(), owner_key.as_ref(), id_bytes.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.token_mint.to_account_info(),
        to: ctx.accounts.investor_token_account.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::mint_to(cpi_ctx, amount)?;

    pool.tokens_sold += amount;

    pool.try_unlock_first_tranche();

    // Update holder claim
    let claim = &mut ctx.accounts.holder_claim;
    if claim.holder == Pubkey::default() {
        claim.holder = ctx.accounts.investor.key();
        claim.business = pool.key();
        claim.last_claimed_epoch = pool.current_epoch;
        claim.total_claimed = 0;
        claim.bump = ctx.bumps.holder_claim;
    }
    claim.token_held += amount;

    msg!("Bought {} tokens for {} lamports", amount, total_cost);
    Ok(())
}