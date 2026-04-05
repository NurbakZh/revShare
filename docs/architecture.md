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
│   Solana Devnet      │   │    Oracle (ASP.NET Core 8)    │
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
| `RevenueEpoch` | `["epoch", business, epoch_number]` | Запись месячной выплаты |
| `TokenListing` | `["listing", business, seller]` | Лот на маркетплейсе |
| `Vault` | `["vault", business]` | PDA хранящий SOL инвесторов и залог |
| `TokenMint` | `["mint", business]` | SPL mint для токенов бизнеса |

### Инструкции

| Инструкция | Вызывает | Описание |
|---|---|---|
| `initialize_business` | Владелец | Создаёт пул, mint, vault, берёт залог |
| `buy_tokens` | Инвестор | Переводит SOL в vault, минтит токены |
| `distribute_revenue` | C# Оракул | Создаёт RevenueEpoch, обновляет эпоху |
| `claim` | Инвестор | Забирает долю выручки за эпоху |
| `list_tokens` | Инвестор | Блокирует токены в escrow листинга |
| `buy_listed_tokens` | Любой | Покупает лот, SOL → продавцу |
| `cancel_listing` | Инвестор | Возвращает токены из escrow |
| `release_funds` | Владелец | Выводит разблокированный транш |

### Механика залога и разблокировки 40/30/30

Привлечённые средства не выдаются бизнесу сразу — разблокировка поэтапная:

```
[Продажа токенов завершена]
        │
        ▼
  40% → владельцу
        │
[Первая выплата инвесторам]
        │
        ▼
  30% → владельцу (итого 70%)
        │
[KPI выручки достигнут: avg_revenue >= target_revenue]
        │
        ▼
  30% → владельцу (итого 100%)
```

Залог (минимум 30% от лимита привлечения) остаётся в vault и покрывает выплаты инвесторам если бизнес перестаёт платить.

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
1. **Оракул выручки** — читает кассовую систему, подписывает и отправляет `distribute_revenue` транзакцию
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

**RevenueService** — для хакатона симулирует выручку в диапазоне `[MinMonthlyRevenue, MaxMonthlyRevenue]` из конфига.

### Паттерны

- **Repository pattern** — изоляция доступа к БД
- **Result<T>** — все сервисы возвращают обёртку с `Success/Data/Error`
- **DDD** — `BaseAggregateRoot` с domain events, фабричные методы вместо публичных конструкторов
- **Options pattern** — конфиг через `SolanaOptions`

---

## Frontend (Next.js 14)

Фронт работает в двух режимах:

**Чтение данных:**
- Off-chain профили → Oracle API
- On-chain состояние → напрямую через `program.account.*.fetch(pda)`
- Подписка на изменения → `program.account.*.subscribe(pda)`

**Запись (транзакции):**
- Всегда напрямую через Anchor SDK
- Пользователь подписывает через Phantom

### Важно

PDA адреса всегда вычисляются на фронте детерминированно — никаких запросов к серверу для получения адресов.

Токен аккаунты создаются как новые keypair (не ATA) из-за `init_if_needed` в контракте. Их pubkey нужно сохранять в localStorage.

---

## CI/CD

```
push в programs/** → contract.yml
      build → test → deploy (только main)

push в backend/** → backend.yml
      build → test

push в frontend/** → frontend.yml
      build → lint
```

Deploy контракта на devnet происходит автоматически при пуше в `main` если все тесты прошли. Keypair для деплоя хранится в GitHub Secrets как `DEPLOY_KEYPAIR`.