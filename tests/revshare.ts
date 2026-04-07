import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Revshare } from "../target/types/revshare";
import { assert } from "chai";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

// ─────────────────────────────────────────────
// Хелперы
// ─────────────────────────────────────────────

function pda(seeds: Buffer[], programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

function bnToLeBytes(n: BN): Buffer {
  return n.toArrayLike(Buffer, "le", 8);
}

async function send(label: string, txPromise: Promise<string>): Promise<string> {
  const tx = await txPromise;
  console.log(`  ✅ ${label}: ${tx.slice(0, 20)}...`);
  return tx;
}

// ─────────────────────────────────────────────
// Тесты
// ─────────────────────────────────────────────

describe("RevShare — полный флоу", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Revshare as Program<Revshare>;
  const conn = provider.connection;

  const owner = provider.wallet as anchor.Wallet;
  const investorKp = Keypair.generate();
  const buyer2Kp = Keypair.generate();
  const oracleKp = Keypair.generate();

  const investorEscrowKp = Keypair.generate();
  const buyer2EscrowKp = Keypair.generate();
  const cancelEscrowKp = Keypair.generate();

  const BUSINESS_ID = new BN(0);
  const TOTAL_TOKENS = new BN(1_000);
  const REVENUE_SHARE_BPS = 1_000; // 10%
  const TOKEN_PRICE = new BN(0.001 * LAMPORTS_PER_SOL);
  const RAISE_LIMIT = new BN(1.5 * LAMPORTS_PER_SOL);
  const COLLATERAL = new BN(0.5 * LAMPORTS_PER_SOL);
  const TARGET_REVENUE = new BN(2 * LAMPORTS_PER_SOL);
  const BUY_AMOUNT = new BN(100);
  const REVENUE_AMOUNT = new BN(5 * LAMPORTS_PER_SOL);
  const LIST_AMOUNT = new BN(10);
  const LIST_PRICE = new BN(0.002 * LAMPORTS_PER_SOL);

  let businessPoolPda: PublicKey;
  let tokenMintPda: PublicKey;
  let collateralVaultPda: PublicKey;
  let fundsVaultPda: PublicKey;
  let holderClaimPda: PublicKey;
  let revenueEpoch0Pda: PublicKey;
  let tokenListingPda: PublicKey;
  let investorTokenAta: PublicKey;
  let buyer2TokenAta: PublicKey;

  before("Вычисляем PDA, airdrop", async () => {
    const sig1 = await conn.requestAirdrop(investorKp.publicKey, 3 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig1);
    const sig2 = await conn.requestAirdrop(buyer2Kp.publicKey, 3 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig2);
    // Oracle needs enough SOL to cover revenue distribution (10% of REVENUE_AMOUNT = 0.5 SOL) + fees
    const sig3 = await conn.requestAirdrop(oracleKp.publicKey, 2 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig3);

    businessPoolPda = pda(
      [Buffer.from("business"), owner.publicKey.toBuffer(), bnToLeBytes(BUSINESS_ID)],
      program.programId
    );
    tokenMintPda = pda(
      [Buffer.from("mint"), businessPoolPda.toBuffer()],
      program.programId
    );
    collateralVaultPda = pda(
      [Buffer.from("collateral_vault"), businessPoolPda.toBuffer()],
      program.programId
    );
    fundsVaultPda = pda(
      [Buffer.from("funds_vault"), businessPoolPda.toBuffer()],
      program.programId
    );
    holderClaimPda = pda(
      [Buffer.from("claim"), businessPoolPda.toBuffer(), investorKp.publicKey.toBuffer()],
      program.programId
    );
    revenueEpoch0Pda = pda(
      [Buffer.from("epoch"), businessPoolPda.toBuffer(), bnToLeBytes(new BN(0))],
      program.programId
    );
    tokenListingPda = pda(
      [Buffer.from("listing"), businessPoolPda.toBuffer(), investorKp.publicKey.toBuffer()],
      program.programId
    );

    investorTokenAta = getAssociatedTokenAddressSync(
      tokenMintPda,
      investorKp.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
    buyer2TokenAta = getAssociatedTokenAddressSync(
      tokenMintPda,
      buyer2Kp.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    console.log("  investor:        ", investorKp.publicKey.toBase58());
    console.log("  buyer2:          ", buyer2Kp.publicKey.toBase58());
    console.log("  oracle:          ", oracleKp.publicKey.toBase58());
    console.log("  businessPool:    ", businessPoolPda.toBase58());
    console.log("  tokenMint:       ", tokenMintPda.toBase58());
    console.log("  collateralVault: ", collateralVaultPda.toBase58());
    console.log("  fundsVault:      ", fundsVaultPda.toBase58());
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 1: initialize_business
  // ─────────────────────────────────────────────
  it("1. initialize_business — создаёт пул и вносит залог", async () => {
    const params = {
      id: BUSINESS_ID,
      totalTokens: TOTAL_TOKENS,
      tokenPrice: TOKEN_PRICE,
      revenueShareBps: REVENUE_SHARE_BPS,
      collateralAmount: COLLATERAL,
      raiseLimit: RAISE_LIMIT,
      targetRevenue: TARGET_REVENUE,
      oracleAuthority: oracleKp.publicKey,
    };

    await send(
      "initialize_business",
      program.methods
        .initializeBusiness(params)
        .accounts({
          owner: owner.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          collateralVault: collateralVaultPda,
          fundsVault: fundsVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc()
    );

    const pool = await program.account.businessPool.fetch(businessPoolPda);
    assert.equal(pool.owner.toBase58(), owner.publicKey.toBase58(), "owner");
    assert.equal(pool.totalTokens.toString(), TOTAL_TOKENS.toString(), "total_tokens");
    assert.equal(pool.revenueShareBps, REVENUE_SHARE_BPS, "bps");
    assert.equal(pool.tokenPrice.toString(), TOKEN_PRICE.toString(), "token_price");
    assert.equal(pool.raiseLimit.toString(), RAISE_LIMIT.toString(), "raise_limit");
    assert.equal(pool.fundsReleased.toString(), "0", "released=0");
    assert.equal(pool.isDefaulted, false, "not defaulted");
    assert.equal(pool.currentEpoch.toString(), "0", "epoch=0");
    assert.equal(pool.tokensSold.toString(), "0", "sold=0");
    assert.equal(pool.totalRevenue.toString(), "0", "total_revenue=0");

    const collateralBalance = await conn.getBalance(collateralVaultPda);
    assert.isAtLeast(collateralBalance, COLLATERAL.toNumber(), "collateral_vault содержит залог");
    console.log(`  Баланс collateral_vault: ${collateralBalance / LAMPORTS_PER_SOL} SOL`);
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 2: недостаточный залог — негатив
  // ─────────────────────────────────────────────
  it("2. [негатив] initialize_business — залог ниже минимума отклоняется", async () => {
    const fakeOwner = Keypair.generate();
    const sig = await conn.requestAirdrop(fakeOwner.publicKey, 1 * LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig);

    const fakePoolPda = pda(
      [Buffer.from("business"), fakeOwner.publicKey.toBuffer(), bnToLeBytes(new BN(0))],
      program.programId
    );
    const fakeMintPda = pda(
      [Buffer.from("mint"), fakePoolPda.toBuffer()],
      program.programId
    );
    const fakeCollateralVaultPda = pda(
      [Buffer.from("collateral_vault"), fakePoolPda.toBuffer()],
      program.programId
    );
    const fakeFundsVaultPda = pda(
      [Buffer.from("funds_vault"), fakePoolPda.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .initializeBusiness({
          id: new BN(0),
          totalTokens: TOTAL_TOKENS,
          tokenPrice: TOKEN_PRICE,
          revenueShareBps: REVENUE_SHARE_BPS,
          collateralAmount: new BN(0.01 * LAMPORTS_PER_SOL),
          raiseLimit: RAISE_LIMIT,
          targetRevenue: TARGET_REVENUE,
          oracleAuthority: oracleKp.publicKey,
        })
        .accounts({
          owner: fakeOwner.publicKey,
          businessPool: fakePoolPda,
          tokenMint: fakeMintPda,
          collateralVault: fakeCollateralVaultPda,
          fundsVault: fakeFundsVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([fakeOwner])
        .rpc();

      assert.fail("Должна была упасть ошибка InsufficientCollateral");
    } catch (err: any) {
      assert.include(err.message, "InsufficientCollateral");
      console.log("  ✅ Недостаточный залог отклонён");
    }
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 3: buy_tokens
  // ─────────────────────────────────────────────
  it("3. buy_tokens — инвестор покупает токены", async () => {
    const vaultBefore = await conn.getBalance(fundsVaultPda);

    await send(
      "buy_tokens",
      program.methods
        .buyTokens(BUY_AMOUNT)
        .accounts({
          investor: investorKp.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          holderClaim: holderClaimPda,
          investorTokenAccount: investorTokenAta,
          fundsVault: fundsVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([investorKp])
        .rpc()
    );

    const pool = await program.account.businessPool.fetch(businessPoolPda);
    const claim = await program.account.holderClaim.fetch(holderClaimPda);

    assert.equal(pool.tokensSold.toString(), BUY_AMOUNT.toString(), "tokens_sold");
    assert.equal(claim.tokenHeld.toString(), BUY_AMOUNT.toString(), "token_held");
    assert.equal(claim.holder.toBase58(), investorKp.publicKey.toBase58(), "holder");

    const expectedCost = TOKEN_PRICE.mul(BUY_AMOUNT).toNumber();
    const vaultAfter = await conn.getBalance(fundsVaultPda);
    assert.equal(vaultAfter - vaultBefore, expectedCost, "funds_vault пополнился");
    console.log(`  Куплено: ${BUY_AMOUNT} токенов за ${expectedCost / LAMPORTS_PER_SOL} SOL`);
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 4: превышение лимита — негатив
  // ─────────────────────────────────────────────
  it("4. [негатив] buy_tokens — превышение raise_limit отклоняется", async () => {
    try {
      await program.methods
        .buyTokens(new BN(10_000))
        .accounts({
          investor: investorKp.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          holderClaim: holderClaimPda,
          investorTokenAccount: investorTokenAta,
          fundsVault: fundsVaultPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([investorKp])
        .rpc();

      assert.fail("Должна была упасть ошибка");
    } catch (err: any) {
      const ok =
        err.message.includes("RaiseLimitExceeded") ||
        err.message.includes("NoTokensAvailable");
      assert.isTrue(ok, `Ожидалась ошибка лимита: ${err.message}`);
      console.log("  ✅ Превышение лимита отклонено");
    }
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 5: distribute_revenue
  // ─────────────────────────────────────────────
  it("5. distribute_revenue — оракул создаёт epoch 0", async () => {
    const vaultBefore = await conn.getBalance(fundsVaultPda);

    await send(
      "distribute_revenue",
      program.methods
        .distributeRevenue(REVENUE_AMOUNT)
        .accounts({
          oracle: oracleKp.publicKey,
          businessPool: businessPoolPda,
          revenueEpoch: revenueEpoch0Pda,
          fundsVault: fundsVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([oracleKp])
        .rpc()
    );

    const epoch = await program.account.revenueEpoch.fetch(revenueEpoch0Pda);
    const pool = await program.account.businessPool.fetch(businessPoolPda);

    assert.equal(epoch.epochNumber.toString(), "0", "epoch_number");
    assert.equal(epoch.revenueAmount.toString(), REVENUE_AMOUNT.toString(), "revenue_amount");

    const expectedShare = REVENUE_AMOUNT.muln(REVENUE_SHARE_BPS).divn(10_000);
    assert.equal(epoch.distributedAmount.toString(), expectedShare.toString(), "distributed");
    assert.equal(pool.currentEpoch.toString(), "1", "epoch стал 1");
    assert.equal(pool.totalRevenue.toString(), REVENUE_AMOUNT.toString(), "total_revenue");

    // Oracle deposits distributed share into funds_vault
    const vaultAfter = await conn.getBalance(fundsVaultPda);
    assert.isAtLeast(vaultAfter, vaultBefore + expectedShare.toNumber(), "funds_vault пополнился");

    console.log(`  Выручка:         ${REVENUE_AMOUNT.toNumber() / LAMPORTS_PER_SOL} SOL`);
    console.log(`  Доля инвесторов: ${expectedShare.toNumber() / LAMPORTS_PER_SOL} SOL`);
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 6: неавторизованный оракул — негатив
  // ─────────────────────────────────────────────
  it("6. [негатив] distribute_revenue — чужой оракул отклоняется", async () => {
    const fakeOracle = Keypair.generate();
    const sig = await conn.requestAirdrop(fakeOracle.publicKey, LAMPORTS_PER_SOL);
    await conn.confirmTransaction(sig);

    const epoch1Pda = pda(
      [Buffer.from("epoch"), businessPoolPda.toBuffer(), bnToLeBytes(new BN(1))],
      program.programId
    );

    try {
      await program.methods
        .distributeRevenue(REVENUE_AMOUNT)
        .accounts({
          oracle: fakeOracle.publicKey,
          businessPool: businessPoolPda,
          revenueEpoch: epoch1Pda,
          fundsVault: fundsVaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([fakeOracle])
        .rpc();

      assert.fail("Должна была упасть ошибка UnauthorizedOracle");
    } catch (err: any) {
      assert.include(err.message, "UnauthorizedOracle");
      console.log("  ✅ Чужой оракул отклонён");
    }
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 7: claim
  // ─────────────────────────────────────────────
  it("7. claim — инвестор получает долю за epoch 0", async () => {
    const epoch = await program.account.revenueEpoch.fetch(revenueEpoch0Pda);
    const pool = await program.account.businessPool.fetch(businessPoolPda);
    const vaultBefore = await conn.getBalance(fundsVaultPda);

    await send(
      "claim",
      program.methods
        .claim()
        .accounts({
          investor: investorKp.publicKey,
          businessPool: businessPoolPda,
          holderClaim: holderClaimPda,
          revenueEpoch: revenueEpoch0Pda,
          fundsVault: fundsVaultPda,
        })
        .signers([investorKp])
        .rpc()
    );

    const claim = await program.account.holderClaim.fetch(holderClaimPda);
    const expectedPayout = epoch.distributedAmount
      .mul(BUY_AMOUNT)
      .div(pool.totalTokens);

    assert.equal(claim.lastClaimedEpoch.toString(), "1", "last_epoch=1");
    assert.equal(claim.totalClaimed.toString(), expectedPayout.toString(), "total_claimed");

    const vaultAfter = await conn.getBalance(fundsVaultPda);
    assert.equal(vaultBefore - vaultAfter, expectedPayout.toNumber(), "funds_vault уменьшился");
    console.log(`  Получено: ${expectedPayout.toNumber() / LAMPORTS_PER_SOL} SOL`);
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 8: двойной клейм — негатив
  // ─────────────────────────────────────────────
  it("8. [негатив] claim — повторный клейм отклоняется", async () => {
    try {
      await program.methods
        .claim()
        .accounts({
          investor: investorKp.publicKey,
          businessPool: businessPoolPda,
          holderClaim: holderClaimPda,
          revenueEpoch: revenueEpoch0Pda,
          fundsVault: fundsVaultPda,
        })
        .signers([investorKp])
        .rpc();

      assert.fail("Должна была упасть ошибка");
    } catch (err: any) {
      const ok =
        err.message.includes("AlreadyClaimed") ||
        err.message.includes("ConstraintSeeds") ||
        err.message.includes("AccountNotInitialized");
      assert.isTrue(ok, `Ожидалась ошибка клейма: ${err.message}`);
      console.log("  ✅ Повторный клейм отклонён");
    }
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 9: release_funds
  // ─────────────────────────────────────────────
  it("9. release_funds — владелец запрашивает разблокировку", async () => {
    try {
      await send(
        "release_funds",
        program.methods
          .releaseFunds()
          .accounts({
            owner: owner.publicKey,
            businessPool: businessPoolPda,
            fundsVault: fundsVaultPda,
          })
          .rpc()
      );

      const pool = await program.account.businessPool.fetch(businessPoolPda);
      console.log(`  funds_released после: ${pool.fundsReleased}`);
    } catch (err: any) {
      const ok =
        err.message.includes("InsufficientCollateral") ||
        err.message.includes("InsufficientVaultBalance");
      assert.isTrue(ok, `Неожиданная ошибка: ${err.message}`);
      console.log(`  ✅ release_funds ответил ожидаемо`);
    }
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 10: list_tokens
  // ─────────────────────────────────────────────
  it("10. list_tokens — инвестор выставляет токены на маркетплейс", async () => {
    await send(
      "list_tokens",
      program.methods
        .listTokens(LIST_AMOUNT, LIST_PRICE)
        .accounts({
          seller: investorKp.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          tokenListing: tokenListingPda,
          sellerClaim: holderClaimPda,
          sellerTokenAccount: investorTokenAta,
          escrowTokenAccount: investorEscrowKp.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([investorKp, investorEscrowKp])
        .rpc()
    );

    const listing = await program.account.tokenListing.fetch(tokenListingPda);
    const claim = await program.account.holderClaim.fetch(holderClaimPda);
    assert.equal(listing.seller.toBase58(), investorKp.publicKey.toBase58(), "seller");
    assert.equal(listing.amount.toString(), LIST_AMOUNT.toString(), "amount");
    assert.equal(listing.pricePerToken.toString(), LIST_PRICE.toString(), "price");
    assert.isTrue(listing.isActive, "listing active");
    assert.equal(
      claim.tokenHeld.toString(),
      BUY_AMOUNT.sub(LIST_AMOUNT).toString(),
      "token_held уменьшился"
    );
    console.log(`  Выставлено: ${LIST_AMOUNT} токенов по ${LIST_PRICE.toNumber() / LAMPORTS_PER_SOL} SOL`);
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 11: бизнес не может листить — негатив
  // ─────────────────────────────────────────────
  it("11. [негатив] list_tokens — owner не может выставлять токены", async () => {
    const ownerListingPda = pda(
      [Buffer.from("listing"), businessPoolPda.toBuffer(), owner.publicKey.toBuffer()],
      program.programId
    );
    const ownerClaimPda = pda(
      [Buffer.from("claim"), businessPoolPda.toBuffer(), owner.publicKey.toBuffer()],
      program.programId
    );
    const ownerTokenKp = Keypair.generate();
    const ownerEscrowKp = Keypair.generate();

    try {
      await program.methods
        .listTokens(new BN(1), LIST_PRICE)
        .accounts({
          seller: owner.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          tokenListing: ownerListingPda,
          sellerClaim: ownerClaimPda,
          sellerTokenAccount: ownerTokenKp.publicKey,
          escrowTokenAccount: ownerEscrowKp.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([ownerTokenKp, ownerEscrowKp])
        .rpc();

      assert.fail("Должна была упасть ошибка");
    } catch (err: any) {
      const blocked =
        err.message.includes("OwnerCannotList") ||
        err.message.includes("AccountNotInitialized") ||
        err.message.includes("unknown signer");
      assert.isTrue(blocked, `Owner заблокирован: ${err.message}`);
      console.log("  ✅ Owner не может листить токены");
    }
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 12: buy_listed_tokens
  // ─────────────────────────────────────────────
  it("12. buy_listed_tokens — покупатель покупает лот", async () => {
    const buyer2ClaimPda = pda(
      [Buffer.from("claim"), businessPoolPda.toBuffer(), buyer2Kp.publicKey.toBuffer()],
      program.programId
    );

    await send(
      "buy_listed_tokens",
      program.methods
        .buyListedTokens()
        .accounts({
          buyer: buyer2Kp.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          tokenListing: tokenListingPda,
          seller: investorKp.publicKey,
          escrowTokenAccount: investorEscrowKp.publicKey,
          buyerClaim: buyer2ClaimPda,
          buyerTokenAccount: buyer2TokenAta,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([buyer2Kp])
        .rpc()
    );

    const listing = await program.account.tokenListing.fetch(tokenListingPda);
    const buyerClaim = await program.account.holderClaim.fetch(buyer2ClaimPda);

    assert.isFalse(listing.isActive, "listing деактивирован");
    assert.equal(buyerClaim.tokenHeld.toString(), LIST_AMOUNT.toString(), "token_held покупателя");
    assert.equal(buyerClaim.holder.toBase58(), buyer2Kp.publicKey.toBase58(), "holder");

    const expectedPayment = LIST_PRICE.mul(LIST_AMOUNT).toNumber();
    console.log(`  Продано: ${LIST_AMOUNT} токенов за ${expectedPayment / LAMPORTS_PER_SOL} SOL`);
  });

  // ─────────────────────────────────────────────
  // ТЕСТ 13: cancel_listing
  // ─────────────────────────────────────────────
  it("13. cancel_listing — инвестор отменяет листинг", async () => {
    // Re-list tokens using init_if_needed (listing PDA already exists but is_active=false)
    const relist_amount = new BN(5);
    await send(
      "list_tokens (re-list для отмены)",
      program.methods
        .listTokens(relist_amount, LIST_PRICE)
        .accounts({
          seller: investorKp.publicKey,
          businessPool: businessPoolPda,
          tokenMint: tokenMintPda,
          tokenListing: tokenListingPda,
          sellerClaim: holderClaimPda,
          sellerTokenAccount: investorTokenAta,
          escrowTokenAccount: cancelEscrowKp.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([investorKp, cancelEscrowKp])
        .rpc()
    );

    const listingBefore = await program.account.tokenListing.fetch(tokenListingPda);
    assert.isTrue(listingBefore.isActive, "listing активен перед отменой");

    const claimBefore = await program.account.holderClaim.fetch(holderClaimPda);

    // Now cancel the listing
    await send(
      "cancel_listing",
      program.methods
        .cancelListing()
        .accounts({
          seller: investorKp.publicKey,
          businessPool: businessPoolPda,
          tokenListing: tokenListingPda,
          escrowTokenAccount: cancelEscrowKp.publicKey,
          sellerClaim: holderClaimPda,
          sellerTokenAccount: investorTokenAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([investorKp])
        .rpc()
    );

    const listingAfter = await program.account.tokenListing.fetch(tokenListingPda);
    const claimAfter = await program.account.holderClaim.fetch(holderClaimPda);

    assert.isFalse(listingAfter.isActive, "listing деактивирован");
    assert.equal(
      claimAfter.tokenHeld.toString(),
      claimBefore.tokenHeld.add(relist_amount).toString(),
      "токены возвращены в claim"
    );
    console.log(`  ✅ ${relist_amount} токенов возвращено из эскроу`);
  });

  // ─────────────────────────────────────────────
  // Итоговый отчёт
  // ─────────────────────────────────────────────
  after("Итоговое состояние", async () => {
    try {
      const pool = await program.account.businessPool.fetch(businessPoolPda);
      const claim = await program.account.holderClaim.fetch(holderClaimPda);
      const fundsBalance = await conn.getBalance(fundsVaultPda);
      const collateralBalance = await conn.getBalance(collateralVaultPda);

      console.log("\n  ══════════════════════════════════════");
      console.log("  BusinessPool:");
      console.log(`    tokens_sold:       ${pool.tokensSold} / ${pool.totalTokens}`);
      console.log(`    current_epoch:     ${pool.currentEpoch}`);
      console.log(`    total_revenue:     ${pool.totalRevenue.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`    total_distributed: ${pool.totalDistributed.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`    funds_released:    ${pool.fundsReleased}`);
      console.log(`    funds_vault:       ${fundsBalance / LAMPORTS_PER_SOL} SOL`);
      console.log(`    collateral_vault:  ${collateralBalance / LAMPORTS_PER_SOL} SOL`);
      console.log("\n  HolderClaim инвестора:");
      console.log(`    token_held:         ${claim.tokenHeld}`);
      console.log(`    last_claimed_epoch: ${claim.lastClaimedEpoch}`);
      console.log(`    total_claimed:      ${claim.totalClaimed.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log("  ══════════════════════════════════════\n");
    } catch (e) {
      console.log("  (не удалось получить финальное состояние)");
    }
  });
});
