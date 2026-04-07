# Architecture

## Overview

RevShare состоит из трёх независимых компонентов, каждый из которых отвечает за свою зону ответственности.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                │
│         Phantom Wallet ↔ Anchor SDK ↔ Oracle API        │
└───────────────┬──────────────────────┬──────────────────┘
                │                      │
                ▼                      ▼
┌──────────────────────┐   ┌───────────────────────────────┐
│   Solana Localnet    │   │    Oracle (ASP.NET Core 8)    │
│                      │   │                               │
│  Smart Contract      │   │  Controllers                  │
│  (Rust / Anchor)     │◄──│  Services (Business/Revenue)  │
│                      │   │  Repositories                 │
│  BusinessPool        │   │  OracleWorker (Background)    │
│  HolderClaim         │   │                               │
│  RevenueEpoch        │   │  PostgreSQL                   │
│  TokenListing        │   │                               │
└──────────────────────┘   └───────────────────────────────┘
```

---

## Smart Contract (Rust / Anchor)

**Program ID:** `EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J`

Контракт — единственный источник правды для всех финансовых операций. Никакая логика распределения средств не происходит off-chain.

### Аккаунты

| Аккаунт | Seeds | Описание |
|---|---|---|
| `BusinessPool` | `["business", owner, id]` | Данные бизнеса, параметры токена, состояние vault |
| `HolderClaim` | `["claim", business, holder]` | Позиция инвестора, история клеймов |
| `RevenueEpoch` | `["epoch", business, epoch_number]` | Запись выплаты за эпоху |
| `TokenListing` | `["listing", business, seller]` | Лот на маркетплейсе |
| `collateral_vault` | `["collateral_vault", business]` | PDA хранящий залог бизнеса |
| `funds_vault` | `["funds_vault", business]` | PDA хранящий SOL инвесторов от продажи токенов |
| `TokenMint` | `["mint", business]` | SPL mint для токенов бизнеса |

### Инструкции

| Инструкция | Вызывает | Описание |
|---|---|---|
| `initialize_business` | Владелец | Создаёт пул, mint, vaults, берёт залог. `raise_limit` вычисляется автоматически как `total_tokens × token_price` |
| `buy_tokens` | Инвестор | Переводит SOL в funds_vault, минтит токены |
| `distribute_revenue` | C# Оракул | Создаёт RevenueEpoch, обновляет эпоху |
| `claim` | Инвестор | Забирает долю выручки за эпоху |
| `list_tokens` | Инвестор / Владелец | Блокирует токены в escrow листинга |
| `buy_listed_tokens` | Любой | Покупает лот, SOL → продавцу |
| `cancel_listing` | Инвестор | Возвращает токены из escrow |
| `release_funds` | Владелец | Выводит разблокированный транш |
| `unlock_first_tranche` | Владелец | Ручная синхронизация флага 40% если не сработало автоматически |

### Механика залога и разблокировки 40/30/30

Привлечённые средства не выдаются бизнесу сразу — разблокировка поэтапная:

```
[Продажа всех токенов завершена]
        │
        ▼
  40% → владельцу   (funds_released = 40)
        │
[Первая выплата инвесторам]
        │
        ▼
  30% → владельцу   (funds_released = 70, итого 70%)
        │
[KPI: avg_revenue >= target_revenue]
        │
        ▼
  30% → владельцу   (funds_released = 100, итого 100%)
```

Залог (минимум 30% от `raise_limit`) хранится в `collateral_vault` и защищает инвесторов при дефолте.

### Важно про claim

При покупке токенов (первичный рынок или маркетплейс) `last_claimed_epoch` покупателя всегда подтягивается к `current_epoch`. Это гарантирует что новый держатель может клеймить только те эпохи, в которых он фактически участвовал.

### Ранговая система

```
Новичок (0 месяцев) → $500 лимит
      ↓ 4 месяца без пропусков
Проверенный → $2,000 лимит
      ↓ 12 месяцев без дефолтов
Надёжный → $10,000 лимит
      ↓ ручная верификация
Партнёр → без лимита
```

---

## Oracle Backend (ASP.NET Core 8)

Off-chain сервис с двумя задачами:
1. **Оракул выручки** — симулирует данные кассы (мок), подписывает и отправляет `distribute_revenue` транзакции
2. **Профили** — хранит off-chain данные (названия, описания, логотипы) которые не нужно держать on-chain

### Слои

```
Controllers (HTTP API)
      │
Services (бизнес-логика)
      │
Repositories (доступ к данным)
      │
PostgreSQL + Solana RPC
```

### Ключевые сервисы

**SolanaService** — singleton, держит keypair оракула, отправляет транзакции через Solnet.

**OracleWorker** — `BackgroundService`, запускается раз в месяц, итерирует по активным бизнесам и вызывает `distribute_revenue`.

**RankService** — после каждой выплаты оценивает историю платежей и повышает ранг бизнеса если условия выполнены.

**RevenueService** — для демо симулирует выручку в диапазоне 100–150% от `TargetRevenue` бизнеса. Гарантирует что симуляция всегда успешна для демонстрации прогресса транша.

### Паттерны

- **Repository pattern** — изоляция доступа к БД
- **Result<T>** — все сервисы возвращают обёртку с `Success/Data/Error`
- **DDD** — `BaseAggregateRoot` с domain events, фабричные методы вместо публичных конструкторов
- **Options pattern** — конфиг через `SolanaOptions`

---

## Frontend (Next.js 14)

Фронт работает в двух режимах:

**Чтение данных:**
- Off-chain профили → Oracle API (через Next.js proxy `/api/...`)
- On-chain состояние → напрямую через `program.account.*.fetch(pda)`

**Запись (транзакции):**
- Всегда напрямую через Anchor SDK
- Пользователь подписывает через Phantom

### Важно

PDA адреса всегда вычисляются на фронте детерминированно — никаких запросов к серверу для получения адресов.

При покупке токенов с маркетплейса `last_claimed_epoch` обновляется автоматически — покупатель не наследует невыплаченные эпохи продавца.

### Localnet-специфичный функционал

- `/demo` — страница скачивания demo keypair файлов (Owner / Investor)
- **Airdrop 100 SOL** — кнопка в хедере, видна только на localnet
- Автоматическая регистрация пользователя при подключении кошелька

---

## Docker / Localnet Stack

Весь стек поднимается одной командой:

```bash
docker-compose up -d
```

| Сервис | Образ | Порт | Описание |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | БД оракула |
| `solana-validator` | custom (ubuntu:24.04 + Solana 1.18.26) | 8899 | Localnet с задеплоенным контрактом |
| `oracle` | custom (.NET 8) | 5000 | C# бэкенд |
| `seed` | custom (node:20-alpine) | — | Создаёт demo бизнесы и симулирует выручку |

**Валидатор** использует pre-built `docker/revshare.so` (собранный через `anchor build` из WSL). При пересборке контракта:

```bash
# В WSL:
anchor build
cp target/deploy/revshare.so docker/revshare.so
cp target/idl/revshare.json frontend/src/lib/solana/idl/revshare.json

# Перезапустить стек:
docker-compose down -v && docker-compose up --build -d
```

---

## CI/CD

```
push в programs/** → contract.yml
      build → test → deploy (только main, через PROGRAM_KEYPAIR secret)

push в backend/** → backend.yml
      build → test

push в frontend/** → frontend.yml
      build → lint
```

Deploy контракта на devnet происходит автоматически при пуше в `main` если все тесты прошли. Keypair для деплоя хранится в GitHub Secrets как `PROGRAM_KEYPAIR`.
