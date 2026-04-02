use anchor_lang::prelude::*;

#[account]
pub struct HolderClaim {
    pub holder: Pubkey,
    pub business: Pubkey,
    pub token_held: u64,
    pub last_claimed_epoch: u64,
    pub total_claimed: u64,
    pub bump: u8,
}

impl HolderClaim {
    pub const LEN: usize = 8   // discriminator
        + 32  // holder
        + 32  // business
        + 8   // token_held
        + 8   // last_claimed_epoch
        + 8   // total_claimed
        + 1;  // bump
}