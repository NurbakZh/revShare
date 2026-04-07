use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{BusinessPool, HolderClaim, TokenListing};
use crate::errors::RevShareError;

#[derive(Accounts)]
pub struct ListTokens<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [b"business", business_pool.owner.as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = seller,
        space = TokenListing::LEN,
        seeds = [b"listing", business_pool.key().as_ref(), seller.key().as_ref()],
        bump,
    )]
    pub token_listing: Account<'info, TokenListing>,

    #[account(
        mut,
        seeds = [b"claim", business_pool.key().as_ref(), seller.key().as_ref()],
        bump = seller_claim.bump,
    )]
    pub seller_claim: Account<'info, HolderClaim>,

    #[account(mut, token::mint = token_mint, token::authority = seller)]
    pub seller_token_account: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = seller,
        token::mint = token_mint,
        token::authority = token_listing,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<ListTokens>, amount: u64, price_per_token: u64) -> Result<()> {
    require!(
        ctx.accounts.seller.key() != ctx.accounts.business_pool.owner,
        RevShareError::OwnerCannotList
    );
    require!(
        ctx.accounts.seller_claim.token_held >= amount,
        RevShareError::InsufficientTokensToList
    );

    let cpi_accounts = Transfer {
        from: ctx.accounts.seller_token_account.to_account_info(),
        to: ctx.accounts.escrow_token_account.to_account_info(),
        authority: ctx.accounts.seller.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    token::transfer(cpi_ctx, amount)?;

    let listing = &mut ctx.accounts.token_listing;
    listing.seller = ctx.accounts.seller.key();
    listing.business = ctx.accounts.business_pool.key();
    listing.amount = amount;
    listing.price_per_token = price_per_token;
    listing.is_active = true;
    listing.bump = ctx.bumps.token_listing;

    ctx.accounts.seller_claim.token_held -= amount;

    msg!("Listed {} tokens at {} lamports each", amount, price_per_token);
    Ok(())
}