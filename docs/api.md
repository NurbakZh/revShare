# API Reference

**Base URL:** `http://localhost:5000`  
**Swagger UI:** `http://localhost:5000/swagger`

Все ответы обёрнуты в `Result<T>`:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## Health

### `GET /api/health`
Статус сервиса и подключения к Solana.

```json
{
  "status": "healthy",
  "solana": true,
  "oraclePublicKey": "AbCd...XyZ",
  "timestamp": "2026-04-07T10:00:00Z"
}
```

> `oraclePublicKey` используется при создании бизнеса как `oracleAuthority` в смарт-контракте.

---

## Business

### `GET /api/business`
Список всех активных бизнесов.

**Response:** `Result<BusinessProfile[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "pubkey": "BaaJp3...",
      "ownerPubkey": "7xKm...",
      "name": "Coffee House",
      "description": "Best coffee in Astana",
      "city": "Astana",
      "logoUrl": null,
      "rank": 0,
      "raiseLimit": 5000000000,
      "targetRevenue": 500000000,
      "consecutivePayments": 2,
      "hasDefaulted": false,
      "createdAt": "2026-04-07T10:00:00Z"
    }
  ],
  "error": null
}
```

---

### `GET /api/business/{pubkey}`
Профиль конкретного бизнеса.

**Response:** `Result<BusinessProfile>`

**Errors:**
- `404` — бизнес не найден

---

### `GET /api/business/owner/{ownerPubkey}`
Все бизнесы конкретного владельца.

**Response:** `Result<BusinessProfile[]>`

---

### `POST /api/business/register`
Регистрация бизнеса в off-chain БД. Вызывается после `initialize_business` на контракте.

**Request:**
```json
{
  "pubkey": "BaaJp3...",
  "ownerPubkey": "7xKm...",
  "name": "Coffee House",
  "description": "Best coffee in Astana",
  "city": "Astana",
  "raiseLimit": 5000000000,
  "targetRevenue": 500000000,
  "logoUrl": null
}
```

> Примечание: `raiseLimit` в смарт-контракте вычисляется автоматически (`total_tokens × token_price`). В запросе передаётся для off-chain отображения.

**Response:** `Result<BusinessProfile>`

**Errors:**
- `400` — бизнес с таким pubkey уже зарегистрирован

---

### `GET /api/business/{pubkey}/revenue/history`
История выплат по эпохам.

**Response:** `Result<RevenueRecord[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "businessPubkey": "BaaJp3...",
      "epoch": 0,
      "amount": 150000000,
      "source": "mock_pos",
      "txSignature": "5fi2mg...",
      "createdAt": "2026-04-07T10:00:00Z"
    }
  ]
}
```

---

### `POST /api/business/{pubkey}/revenue/simulate`
**Только для демо.** Симулирует выручку за месяц и вызывает `distribute_revenue` на контракте.

Выручка генерируется случайно в диапазоне **100–150% от `targetRevenue`** бизнеса — всегда выше целевого показателя.

**Response:** `Result<RevenueRecord>`

```json
{
  "success": true,
  "data": {
    "businessPubkey": "BaaJp3...",
    "epoch": 1,
    "amount": 627543000,
    "txSignature": "AbCd..."
  }
}
```

---

## User

### `GET /api/user/{pubkey}`
Профиль пользователя по pubkey кошелька.

**Response:** `Result<UserProfile>`

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "pubkey": "7xKm...",
    "name": "Aibar",
    "avatarUrl": null,
    "bio": "Web3 investor",
    "hasBusiness": false,
    "createdAt": "2026-04-07T10:00:00Z"
  }
}
```

**Errors:**
- `404` — пользователь не найден

---

### `POST /api/user/register`
Регистрация нового пользователя. Автоматически вызывается при первом подключении кошелька на фронте.

**Request:**
```json
{
  "pubkey": "7xKm...",
  "name": "Aibar",
  "avatarUrl": null,
  "bio": "Web3 investor"
}
```

**Response:** `Result<UserProfile>`

**Errors:**
- `400` — пользователь уже зарегистрирован

---

## Marketplace

### `GET /api/marketplace/listings`
Все активные лоты на маркетплейсе.

**Response:** `Result<TokenListing[]>`

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "listingPubkey": "Cn9pq8...",
      "businessPubkey": "BaaJp3...",
      "sellerPubkey": "9KVQc...",
      "amount": 10,
      "pricePerToken": 2000000,
      "status": 0,
      "createdAt": "2026-04-07T10:00:00Z"
    }
  ]
}
```

**Status values:** `0` = Active, `1` = Sold, `2` = Cancelled

---

### `GET /api/marketplace/listings/{businessPubkey}`
Лоты по конкретному бизнесу.

**Response:** `Result<TokenListing[]>`

---

## Типы

```typescript
type BusinessProfile = {
  id: string
  pubkey: string
  ownerPubkey: string
  name: string
  description: string
  city: string
  logoUrl: string | null
  rank: 0 | 1 | 2 | 3        // Newcomer/Verified/Reliable/Partner
  raiseLimit: number           // lamports
  targetRevenue: number        // lamports
  consecutivePayments: number
  hasDefaulted: boolean
  createdAt: string
  updatedAt: string | null
}

type RevenueRecord = {
  id: string
  businessPubkey: string
  epoch: number
  amount: number               // lamports
  source: string
  txSignature: string | null
  createdAt: string
}

type UserProfile = {
  id: string
  pubkey: string
  name: string
  avatarUrl: string | null
  bio: string | null
  hasBusiness: boolean
  createdAt: string
}

type TokenListing = {
  id: string
  listingPubkey: string
  businessPubkey: string
  sellerPubkey: string
  amount: number
  pricePerToken: number        // lamports
  status: 0 | 1 | 2
  createdAt: string
}
```
