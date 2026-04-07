use anchor_lang::prelude::*;

#[error_code]
pub enum RevShareError {
    #[msg("Unauthorized oracle")]
    UnauthorizedOracle,
    #[msg("Insufficient collateral")]
    InsufficientCollateral,
    #[msg("Business is defaulted")]
    BusinessDefaulted,
    #[msg("No tokens available")]
    NoTokensAvailable,
    #[msg("Already claimed this epoch")]
    AlreadyClaimed,
    #[msg("Raise limit exceeded")]
    RaiseLimitExceeded,
    #[msg("Invalid revenue share basis points")]
    InvalidRevenueShareBps,
#[msg("Listing is not active")]
    ListingNotActive,
    #[msg("Insufficient tokens to list")]
    InsufficientTokensToList,
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
}