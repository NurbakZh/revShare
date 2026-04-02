use anchor_lang::prelude::*;

#[account]
pub struct RevenueEpoch {
    pub business: Pubkey,
    pub epoch_number: u64,
    pub revenue_amount: u64,
    pub distributed_amount: u64,
    pub timestamp: i64,
    pub bump: u8,
}

impl RevenueEpoch {
    pub const LEN: usize = 8  // discriminator
        + 32  // business
        + 8   // epoch_number
        + 8   // revenue_amount
        + 8   // distributed_amount
        + 8   // timestamp
        + 1;  // bump
}