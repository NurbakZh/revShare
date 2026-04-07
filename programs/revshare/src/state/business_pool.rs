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
    pub total_revenue: u64,
    pub is_defaulted: bool,
    pub raise_limit: u64,
    pub funds_released: u64,
    pub total_raised: u64,
    pub target_revenue: u64,
    pub bump: u8,
}

impl BusinessPool {
    /// Sets `funds_released` to 40 when the fundraise is complete: either every
    /// token was minted from the pool, or the raise cap (`raise_limit`) was
    /// reached (so no further primary sales are possible even if `tokens_sold < total_tokens`).
    pub fn try_unlock_first_tranche(&mut self) {
        if self.funds_released != 0 {
            return;
        }
        let sold_out = self.tokens_sold >= self.total_tokens;
        let raise_cap_hit = self.total_raised >= self.raise_limit;
        if sold_out || raise_cap_hit {
            self.funds_released = 40;
            msg!("First tranche unlocked: 40%");
        }
    }

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
        + 8   // total_revenue
        + 1   // is_defaulted
        + 8   // raise_limit
        + 8   // funds_released
        + 8   // total_raised
        + 8   // target_revenue
        + 1;  // bump
}