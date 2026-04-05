use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::{BusinessPool, HolderClaim, TokenListing};

#[derive(Accounts)]
pub struct CancelListing<'info> {
    #[account(mut)]
    pub seller: Signer<'info>,

    #[account(
        seeds = [b"business", business_pool.owner.as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    #[account(
        mut,
        seeds = [b"listing", business_pool.key().as_ref(), seller.key().as_ref()],
        bump = token_listing.bump,
        has_one = seller,
    )]
    pub token_listing: Account<'info, TokenListing>,

    #[account(mut)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [b"claim", business_pool.key().as_ref(), seller.key().as_ref()],
        bump = seller_claim.bump,
    )]
    pub seller_claim: Account<'info, HolderClaim>,

    #[account(mut, token::authority = seller)]
    pub seller_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(ctx: Context<CancelListing>) -> Result<()> {
    let listing = &mut ctx.accounts.token_listing;
    let pool = &ctx.accounts.business_pool;

    let pool_key = pool.key();
    let seller_key = listing.seller.clone();
    let bump = listing.bump;
    let seeds = &[b"listing".as_ref(), pool_key.as_ref(), seller_key.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.seller_token_account.to_account_info(),
        authority: listing.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::transfer(cpi_ctx, listing.amount)?;

    listing.is_active = false;
    ctx.accounts.seller_claim.token_held += listing.amount;

    msg!("Listing cancelled, {} tokens returned", listing.amount);
    Ok(())
}