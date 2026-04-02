use anchor_lang::prelude::*;

declare_id!("2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN");

#[program]
pub mod revshare {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
