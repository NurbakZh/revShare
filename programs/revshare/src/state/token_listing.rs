use anchor_lang::prelude::*;

#[account]
pub struct TokenListing {
    pub seller: Pubkey,
    pub business: Pubkey,
    pub amount: u64,
    pub price_per_token: u64,
    pub is_active: bool,
    pub bump: u8,
}

impl TokenListing {
    pub const LEN: usize = 8  // discriminator
        + 32  // seller
        + 32  // business
        + 8   // amount
        + 8   // price_per_token
        + 1   // is_active
        + 1;  // bump
}