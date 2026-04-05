# RevShare — Frontend Integration Guide

## Содержание

1. [Архитектура](#архитектура)
2. [Oracle API](#oracle-api)
3. [Прямая работа с контрактом](#прямая-работа-с-контрактом)
4. [PDA адреса](#pda-адреса)
5. [Типы и модели](#типы-и-модели)
6. [Флоу по страницам](#флоу-по-страницам)

---

## Архитектура

```
Frontend (Next.js 14)
    │
    ├── Oracle API (ASP.NET Core 8)     ← off-chain данные, симуляция выручки
    │       http://localhost:5000
    │
    └── Solana RPC / Anchor             ← on-chain транзакции, чтение аккаунтов
            https://api.devnet.solana.com
```

**Правило:** читать данные можно как из API так и напрямую из контракта. Писать (транзакции) — только через контракт напрямую.

---

## Oracle API

**Base URL:** `http://localhost:5000`

Все ответы обёрнуты в `Result<T>`:
```typescript
type Result<T> = {
  success: boolean
  data: T | null
  error: string | null
}

type PaginatedResult<T> = {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
```

---

### Health

#### `GET /api/health`
Проверка состояния сервиса и подключения к Solana.

**Response:**
```json
{
  "status": "healthy",
  "solana": true,
  "oraclePublicKey": "...",
  "timestamp": "2026-04-03T10:00:00Z"
}
```

---

### Business

#### `GET /api/business`
Список всех активных бизнесов.

**Response:** `Result<BusinessProfile[]>`
```typescript
type BusinessProfile = {
  id: string           // guid
  pubkey: string       // Solana pubkey бизнеса
  ownerPubkey: string
  name: string
  description: string
  city: string
  logoUrl: string | null
  rank: 0 | 1 | 2 | 3  // 0=Newcomer, 1=Verified, 2=Reliable, 3=Partner
  raiseLimit: number   // в лампортах
  targetRevenue: number
  consecutivePayments: number
  hasDefaulted: boolean
  createdAt: string
  updatedAt: string | null
}
```

**Пример:**
```typescript
const res = await fetch('http://localhost:5000/api/business')
const { data: businesses } = await res.json()
```

---

#### `GET /api/business/:pubkey`
Профиль конкретного бизнеса.

**Response:** `Result<BusinessProfile>`

```typescript
const res = await fetch(`http://localhost:5000/api/business/${pubkey}`)
const { success, data, error } = await res.json()
if (!success) console.error(error)
```

---

#### `POST /api/business/register`
Регистрация нового бизнеса (вызывается после `initialize_business` на контракте).

**Request body:**
```typescript
type RegisterBusinessDto = {
  pubkey: string       // адрес BusinessPool PDA
  ownerPubkey: string  // кошелёк владельца
  name: string
  description: string
  city: string
  raiseLimit: number
  targetRevenue: number
  logoUrl?: string
}
```

**Response:** `Result<BusinessProfile>`

```typescript
const res = await fetch('http://localhost:5000/api/business/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pubkey: businessPoolPda.toBase58(),
    ownerPubkey: wallet.publicKey.toBase58(),
    name: 'My Coffee',
    description: 'Best coffee in town',
    city: 'Astana',
    raiseLimit: 500_000_000,
    targetRevenue: 100_000_000,
  })
})
```

---

#### `GET /api/business/:pubkey/revenue/history`
История выплат по эпохам.

**Response:** `Result<RevenueRecord[]>`
```typescript
type RevenueRecord = {
  id: string
  businessPubkey: string
  epoch: number
  amount: number       // в лампортах
  source: string       // "mock_pos" для демо
  txSignature: string | null
  createdAt: string
}
```

---

#### `POST /api/business/:pubkey/revenue/simulate`
**Только для демо.** Симулирует месячную выручку и вызывает `distribute_revenue` на контракте.

**Response:** `Result<RevenueRecord>`

```typescript
// Кнопка "Simulate Month" на /admin
const res = await fetch(`http://localhost:5000/api/business/${pubkey}/revenue/simulate`, {
  method: 'POST'
})
const { data: record } = await res.json()
console.log(`Distributed: ${record.amount} lamports, tx: ${record.txSignature}`)
```

---

### User

#### `GET /api/user/:pubkey`
Профиль пользователя.

**Response:** `Result<UserProfile>`
```typescript
type UserProfile = {
  id: string
  pubkey: string
  name: string
  avatarUrl: string | null
  bio: string | null
  hasBusiness: boolean
  createdAt: string
}
```

---

#### `POST /api/user/register`
Регистрация нового пользователя при первом подключении кошелька.

**Request body:**
```typescript
type RegisterUserDto = {
  pubkey: string
  name: string
  avatarUrl?: string
  bio?: string
}
```

**Response:** `Result<UserProfile>`

```typescript
// Вызывать при первом подключении Phantom
const res = await fetch('http://localhost:5000/api/user/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pubkey: wallet.publicKey.toBase58(),
    name: 'Aibar',
  })
})
```

---

### Marketplace

#### `GET /api/marketplace/listings`
Все активные лоты на маркетплейсе.

**Response:** `Result<TokenListing[]>`
```typescript
type TokenListing = {
  id: string
  listingPubkey: string
  businessPubkey: string
  sellerPubkey: string
  amount: number
  pricePerToken: number  // в лампортах
  status: 0 | 1 | 2     // 0=Active, 1=Sold, 2=Cancelled
  createdAt: string
}
```

---

#### `GET /api/marketplace/listings/:businessPubkey`
Лоты по конкретному бизнесу.

**Response:** `Result<TokenListing[]>`

---

## Прямая работа с контрактом

**Program ID:** `2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN`

### Установка

```bash
yarn add @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react
```

### Инициализация

```typescript
import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import idl from './idl/revshare.json'  // target/idl/revshare.json

const PROGRAM_ID = new PublicKey('2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN')

export function useProgram() {
  const { connection } = useConnection()
  const wallet = useAnchorWallet()

  if (!wallet) return null

  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed'
  })
  return new Program(idl as any, provider)
}
```

---

### Чтение аккаунтов

```typescript
// BusinessPool
const pool = await program.account.businessPool.fetch(businessPoolPda)
// {
//   owner: PublicKey
//   oracleAuthority: PublicKey
//   tokenMint: PublicKey
//   id: BN
//   totalTokens: BN
//   tokensSold: BN
//   revenueShareBps: number
//   collateral: BN
//   tokenPrice: BN
//   currentEpoch: BN
//   totalDistributed: BN
//   isDefaulted: boolean
//   raiseLimit: BN
//   fundsReleased: BN
//   targetRevenue: BN
//   bump: number
// }

// HolderClaim
const claim = await program.account.holderClaim.fetch(holderClaimPda)
// {
//   holder: PublicKey
//   business: PublicKey
//   tokenHeld: BN
//   lastClaimedEpoch: BN
//   totalClaimed: BN
//   bump: number
// }

// RevenueEpoch
const epoch = await program.account.revenueEpoch.fetch(revenueEpochPda)
// {
//   business: PublicKey
//   epochNumber: BN
//   revenueAmount: BN
//   distributedAmount: BN
//   timestamp: BN
//   bump: number
// }

// TokenListing
const listing = await program.account.tokenListing.fetch(tokenListingPda)
// {
//   seller: PublicKey
//   business: PublicKey
//   amount: BN
//   pricePerToken: BN
//   isActive: boolean
//   bump: number
// }

// Все листинги по бизнесу
const listings = await program.account.tokenListing.all([
  {
    memcmp: {
      offset: 8 + 32,  // discriminator + seller
      bytes: businessPoolPda.toBase58()
    }
  }
])
```

**Подписка на изменения:**
```typescript
const subscriptionId = program.account.businessPool.subscribe(
  businessPoolPda,
  'confirmed'
)
subscriptionId.on('change', (account) => {
  console.log('Pool updated:', account.tokensSold.toString())
})
// Отписка
await subscriptionId.removeListener(subscriptionId)
```

---

## PDA адреса

Все PDA вычисляются детерминированно на фронте:

```typescript
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

const PROGRAM_ID = new PublicKey('2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN')

// BusinessPool
function getBusinessPoolPda(ownerPubkey: PublicKey, id: number) {
  const idBytes = new BN(id).toArrayLike(Buffer, 'le', 8)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('business'), ownerPubkey.toBuffer(), idBytes],
    PROGRAM_ID
  )
}

// Token Mint
function getTokenMintPda(businessPoolPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('mint'), businessPoolPda.toBuffer()],
    PROGRAM_ID
  )
}

// SOL Vault
function getVaultPda(businessPoolPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('vault'), businessPoolPda.toBuffer()],
    PROGRAM_ID
  )
}

// HolderClaim
function getHolderClaimPda(businessPoolPda: PublicKey, holderPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('claim'), businessPoolPda.toBuffer(), holderPubkey.toBuffer()],
    PROGRAM_ID
  )
}

// RevenueEpoch
function getRevenueEpochPda(businessPoolPda: PublicKey, epoch: number) {
  const epochBytes = new BN(epoch).toArrayLike(Buffer, 'le', 8)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('epoch'), businessPoolPda.toBuffer(), epochBytes],
    PROGRAM_ID
  )
}

// TokenListing
function getTokenListingPda(businessPoolPda: PublicKey, sellerPubkey: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('listing'), businessPoolPda.toBuffer(), sellerPubkey.toBuffer()],
    PROGRAM_ID
  )
}
```

---

## Инструкции контракта

### `initialize_business`
Создаёт бизнес-пул и вносит залог.

```typescript
const [businessPoolPda] = getBusinessPoolPda(wallet.publicKey, 0)
const [tokenMintPda] = getTokenMintPda(businessPoolPda)
const [vaultPda] = getVaultPda(businessPoolPda)

await program.methods
  .initializeBusiness({
    id: new BN(0),
    totalTokens: new BN(1000),
    tokenPrice: new BN(1_000_000),       // 0.001 SOL
    revenueShareBps: 1000,               // 10%
    collateralAmount: new BN(150_000_000),
    raiseLimit: new BN(500_000_000),
    targetRevenue: new BN(100_000_000),
    oracleAuthority: new PublicKey('ORACLE_PUBKEY'), // из GET /api/health
  })
  .accounts({
    owner: wallet.publicKey,
    businessPool: businessPoolPda,
    tokenMint: tokenMintPda,
    vault: vaultPda,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc()

// После успеха — регистрируем в Oracle API
await fetch('/api/business/register', { method: 'POST', body: JSON.stringify({...}) })
```

---

### `buy_tokens`
Инвестор покупает токены бизнеса.

```typescript
import { Keypair, TOKEN_PROGRAM_ID, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'

const [businessPoolPda] = getBusinessPoolPda(ownerPubkey, businessId)
const [tokenMintPda] = getTokenMintPda(businessPoolPda)
const [vaultPda] = getVaultPda(businessPoolPda)
const [holderClaimPda] = getHolderClaimPda(businessPoolPda, wallet.publicKey)

// Токен аккаунт — новый keypair (init_if_needed)
const tokenAccountKp = Keypair.generate()

await program.methods
  .buyTokens(new BN(amount))
  .accounts({
    investor: wallet.publicKey,
    businessPool: businessPoolPda,
    tokenMint: tokenMintPda,
    holderClaim: holderClaimPda,
    investorTokenAccount: tokenAccountKp.publicKey,
    vault: vaultPda,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([tokenAccountKp])
  .rpc()
```

> ⚠️ Сохраняй `tokenAccountKp.publicKey` в localStorage — он нужен для `list_tokens` и `claim`.

---

### `claim`
Инвестор забирает долю за эпоху.

```typescript
const [holderClaimPda] = getHolderClaimPda(businessPoolPda, wallet.publicKey)

// Узнаём текущую эпоху для клейма
const claim = await program.account.holderClaim.fetch(holderClaimPda)
const epochToClaim = claim.lastClaimedEpoch.toNumber()

const [revenueEpochPda] = getRevenueEpochPda(businessPoolPda, epochToClaim)
const [vaultPda] = getVaultPda(businessPoolPda)

await program.methods
  .claim()
  .accounts({
    investor: wallet.publicKey,
    businessPool: businessPoolPda,
    holderClaim: holderClaimPda,
    revenueEpoch: revenueEpochPda,
    vault: vaultPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

---

### `list_tokens`
Инвестор выставляет токены на маркетплейс.

```typescript
const [tokenListingPda] = getTokenListingPda(businessPoolPda, wallet.publicKey)
const escrowAccountKp = Keypair.generate()

await program.methods
  .listTokens(new BN(amount), new BN(pricePerToken))
  .accounts({
    seller: wallet.publicKey,
    businessPool: businessPoolPda,
    tokenMint: tokenMintPda,
    tokenListing: tokenListingPda,
    sellerTokenAccount: investorTokenAccountPubkey, // сохранённый при buy_tokens
    escrowTokenAccount: escrowAccountKp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([escrowAccountKp])
  .rpc()

// Сохраняй escrowAccountKp.publicKey — нужен для cancel_listing
```

---

### `buy_listed_tokens`
Покупатель покупает лот с маркетплейса.

```typescript
// Получаем листинг
const listing = await program.account.tokenListing.fetch(tokenListingPda)

const [buyer2ClaimPda] = getHolderClaimPda(businessPoolPda, wallet.publicKey)
const buyerTokenAccountKp = Keypair.generate()

await program.methods
  .buyListedTokens()
  .accounts({
    buyer: wallet.publicKey,
    businessPool: businessPoolPda,
    tokenMint: tokenMintPda,
    tokenListing: tokenListingPda,
    seller: listing.seller,
    escrowTokenAccount: escrowAccountPubkey, // из листинга off-chain
    buyerClaim: buyer2ClaimPda,
    buyerTokenAccount: buyerTokenAccountKp.publicKey,
    tokenProgram: TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .signers([buyerTokenAccountKp])
  .rpc()
```

---

### `cancel_listing`
Инвестор отменяет свой лот.

```typescript
const [tokenListingPda] = getTokenListingPda(businessPoolPda, wallet.publicKey)

await program.methods
  .cancelListing()
  .accounts({
    seller: wallet.publicKey,
    businessPool: businessPoolPda,
    tokenListing: tokenListingPda,
    escrowTokenAccount: escrowAccountPubkey,
    sellerTokenAccount: investorTokenAccountPubkey,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc()
```

---

### `release_funds`
Владелец бизнеса выводит разблокированный транш.

```typescript
await program.methods
  .releaseFunds()
  .accounts({
    owner: wallet.publicKey,
    businessPool: businessPoolPda,
    vault: vaultPda,
    systemProgram: SystemProgram.programId,
  })
  .rpc()
```

---

## Типы и модели

```typescript
// Ранги бизнеса
enum BusinessRank {
  Newcomer = 0,   // лимит ~$500
  Verified = 1,   // лимит ~$2,000
  Reliable = 2,   // лимит ~$10,000
  Partner = 3     // без лимита
}

// Статус листинга
enum ListingStatus {
  Active = 0,
  Sold = 1,
  Cancelled = 2
}

// Лампорты → SOL
const toSol = (lamports: number) => lamports / 1_000_000_000

// Basis points → процент
const bpsToPercent = (bps: number) => bps / 100

// APY для карточки бизнеса (примерный)
const calcApy = (revenueShareBps: number, totalRaised: number, avgMonthlyRevenue: number) => {
  const monthlyPayout = (avgMonthlyRevenue * revenueShareBps) / 10_000
  const annualPayout = monthlyPayout * 12
  return (annualPayout / totalRaised) * 100
}
```

---

## Флоу по страницам

### `/` — Каталог бизнесов
1. `GET /api/business` → список бизнесов
2. Для каждого — читаем `BusinessPool` напрямую из контракта для актуальных данных
3. Считаем `tokensLeft = totalTokens - tokensSold`, прогресс продаж

### `/business/[pubkey]` — Страница бизнеса
1. `GET /api/business/:pubkey` → off-chain профиль
2. `program.account.businessPool.fetch(pda)` → on-chain данные
3. `GET /api/business/:pubkey/revenue/history` → история эпох для графика
4. Если инвестор — `program.account.holderClaim.fetch(claimPda)` → доступный клейм
5. Вкладка маркетплейс: `GET /api/marketplace/listings/:pubkey`

### `/dashboard` — Dashboard инвестора
1. Получаем все бизнесы где есть `HolderClaim` инвестора
2. Для каждого считаем доступный клейм:
   ```typescript
   const claim = await program.account.holderClaim.fetch(claimPda)
   const epoch = await program.account.revenueEpoch.fetch(
     getRevenueEpochPda(businessPda, claim.lastClaimedEpoch.toNumber())
   )
   const available = epoch.distributedAmount
     .mul(claim.tokenHeld)
     .div(pool.totalTokens)
   ```

### `/profile` — Профиль
1. `GET /api/user/:pubkey` → профиль
2. Если 404 → `POST /api/user/register` → создаём

### `/register` — Создать бизнес
1. Вызываем `initialize_business` на контракте
2. После успеха — `POST /api/business/register` в Oracle API
3. Редиректим на `/business/[newPda]`

### `/marketplace` — Маркетплейс
1. `GET /api/marketplace/listings` → все активные лоты
2. Для каждого лота — `program.account.tokenListing.fetch(pda)` если нужны актуальные данные
3. Покупка → `buy_listed_tokens`

### `/admin` — Демо панель
1. `GET /api/health` → статус оракула
2. Выбираем бизнес → `POST /api/business/:pubkey/revenue/simulate`
3. Показываем новую эпоху в реальном времени

---

## Важные замечания

- **Все суммы в лампортах** (1 SOL = 1_000_000_000)
- **Никогда не используй float для денег** — только `BN` из `@coral-xyz/anchor`
- **`oracleAuthority`** при создании бизнеса берётся из `GET /api/health` → поле `oraclePublicKey`
- **Токен аккаунты** создаются как новые keypair (не ATA) из-за `init_if_needed` в контракте — сохраняй их pubkey в localStorage
- **Транзакция на devnet** подтверждается ~400мс — показывай spinner
- **PDA всегда вычисляй на фронте** — не запрашивай их у сервера
