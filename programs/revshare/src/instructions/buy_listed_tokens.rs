use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use crate::state::{BusinessPool, HolderClaim, TokenListing};
use crate::errors::RevShareError;

#[derive(Accounts)]
pub struct BuyListedTokens<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(
        seeds = [b"business", business_pool.owner.as_ref(), &business_pool.id.to_le_bytes()],
        bump = business_pool.bump,
    )]
    pub business_pool: Account<'info, BusinessPool>,

    pub token_mint: Account<'info, Mint>,

    #[account(
        mut,
        seeds = [b"listing", business_pool.key().as_ref(), token_listing.seller.as_ref()],
        bump = token_listing.bump,
    )]
    pub token_listing: Account<'info, TokenListing>,

    /// CHECK: seller receives SOL
    #[account(mut)]
    pub seller: UncheckedAccount<'info>,

    #[account(mut, token::mint = token_mint)]
    pub escrow_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = buyer,
        space = HolderClaim::LEN,
        seeds = [b"claim", business_pool.key().as_ref(), buyer.key().as_ref()],
        bump,
    )]
    pub buyer_claim: Account<'info, HolderClaim>,

    #[account(
        init_if_needed,
        payer = buyer,
        associated_token::mint = token_mint,
        associated_token::authority = buyer,
    )]
    pub buyer_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(ctx: Context<BuyListedTokens>) -> Result<()> {
    let listing = &mut ctx.accounts.token_listing;
    let pool = &ctx.accounts.business_pool;

    require!(listing.is_active, RevShareError::ListingNotActive);

    let total_cost = listing.amount.checked_mul(listing.price_per_token).unwrap();

    // Transfer SOL to seller
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        system_program::Transfer {
            from: ctx.accounts.buyer.to_account_info(),
            to: ctx.accounts.seller.to_account_info(),
        },
    );
    system_program::transfer(cpi_ctx, total_cost)?;

    // Transfer tokens from escrow to buyer
    let pool_key = pool.key();
    let seller_key = listing.seller.clone();
    let bump = listing.bump;
    let seeds = &[b"listing".as_ref(), pool_key.as_ref(), seller_key.as_ref(), &[bump]];
    let signer = &[&seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_token_account.to_account_info(),
        to: ctx.accounts.buyer_token_account.to_account_info(),
        authority: listing.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer,
    );
    token::transfer(cpi_ctx, listing.amount)?;

    // Update buyer claim
    let claim = &mut ctx.accounts.buyer_claim;
    if claim.holder == Pubkey::default() {
        claim.holder = ctx.accounts.buyer.key();
        claim.business = pool.key();
        claim.last_claimed_epoch = pool.current_epoch;
        claim.bump = ctx.bumps.buyer_claim;
    }
    claim.token_held += listing.amount;

    listing.is_active = false;

    msg!("Sold {} tokens for {} lamports", listing.amount, total_cost);
    Ok(())
}