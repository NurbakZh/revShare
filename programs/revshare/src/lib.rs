use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::initialize_business::*;
use instructions::buy_tokens::*;
use instructions::distribute_revenue::*;
use instructions::claim::*;
use instructions::list_tokens::*;
use instructions::buy_listed_tokens::*;
use instructions::cancel_listing::*;
use instructions::release_funds::*;

declare_id!("2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN");

#[program]
pub mod revshare {
    use super::*;

    pub fn initialize_business(
        ctx: Context<InitializeBusiness>,
        params: InitBusinessParams,
    ) -> Result<()> {
        instructions::initialize_business::handler(ctx, params)
    }

    pub fn buy_tokens(ctx: Context<BuyTokens>, amount: u64) -> Result<()> {
        instructions::buy_tokens::handler(ctx, amount)
    }

    pub fn distribute_revenue(
        ctx: Context<DistributeRevenue>,
        revenue_amount: u64,
    ) -> Result<()> {
        instructions::distribute_revenue::handler(ctx, revenue_amount)
    }

    pub fn claim(ctx: Context<Claim>) -> Result<()> {
        instructions::claim::handler(ctx)
    }

    pub fn list_tokens(
        ctx: Context<ListTokens>,
        amount: u64,
        price_per_token: u64,
    ) -> Result<()> {
        instructions::list_tokens::handler(ctx, amount, price_per_token)
    }

    pub fn buy_listed_tokens(ctx: Context<BuyListedTokens>) -> Result<()> {
        instructions::buy_listed_tokens::handler(ctx)
    }

    pub fn cancel_listing(ctx: Context<CancelListing>) -> Result<()> {
        instructions::cancel_listing::handler(ctx)
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        instructions::release_funds::handler(ctx)
    }
}