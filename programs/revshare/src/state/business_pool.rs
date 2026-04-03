use anchor_lang::prelude::*;

#[account]
pub struct BusinessPool {
    pub owner: Pubkey,
    pub oracle_authority: Pubkey,
    pub token_mint: Pubkey,
    pub id: u64,
    pub total_tokens: u64,
    pub tokens_sold: u64,
    pub revenue_share_bps: u16,
    pub collateral: u64,
    pub token_price: u64,
    pub current_epoch: u64,
    pub total_distributed: u64,
    pub is_defaulted: bool,
    pub raise_limit: u64,
    pub funds_released: u64,
    pub target_revenue: u64,
    pub bump: u8,
}

impl BusinessPool {
    pub const LEN: usize = 8   // discriminator
        + 32  // owner
        + 32  // oracle_authority
        + 32  // token_mint
        + 8   // id
        + 8   // total_tokens
        + 8   // tokens_sold
        + 2   // revenue_share_bps
        + 8   // collateral
        + 8   // token_price
        + 8   // current_epoch
        + 8   // total_distributed
        + 1   // is_defaulted
        + 8   // raise_limit
        + 8   // funds_released
        + 8   // target_revenue
        + 1;  // bump
}