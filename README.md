# RevShare

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)
![Anchor](https://img.shields.io/badge/Anchor-0.32.1-512DA8)
![.NET](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet)
![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![CI Contract](https://github.com/NurbakZh/revShare/actions/workflows/contract.yml/badge.svg)
![CI Backend](https://github.com/NurbakZh/revShare/actions/workflows/backend.yml/badge.svg)
![CI Frontend](https://github.com/NurbakZh/revShare/actions/workflows/frontend.yml/badge.svg)

**Revenue sharing platform on Solana — малый бизнес привлекает финансирование через токенизацию выручки, инвесторы получают автоматические ежемесячные выплаты.**

---

## Проблема → Решение

| Проблема | Решение |
|---|---|
| Малый бизнес не может получить финансирование без банков и больших залогов | Бизнес выпускает SPL токены и продаёт их комьюнити |
| Обычные инвесторы не имеют доступа к инвестициям в локальный бизнес | Минимальный порог входа — цена одного токена |
| Нет прозрачного механизма распределения дохода без посредников | Смарт-контракт автоматически распределяет USDC/SOL держателям |
| Риск скама — бизнес может взять деньги и исчезнуть | Залог + поэтапная разблокировка средств 40/30/30 |
| Низкая ликвидность инвестиций | Встроенный маркетплейс для перепродажи токенов |

---

## Почему Solana

- **Скорость** — транзакция подтверждается за ~400мс, инвестор видит зачисление мгновенно
- **Стоимость** — комиссия ~$0.00025 против $5-50 на Ethereum, что критично для малого бизнеса
- **SPL токены** — нативный стандарт токенов, не нужны кастомные решения
- **Anchor** — типобезопасный фреймворк для смарт-контрактов с автогенерацией IDL
- **PDA аккаунты** — детерминированные адреса позволяют фронту вычислять все адреса без запросов к серверу

---

## Демо

> Контракт задеплоен на Solana Devnet: [`2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN`](https://explorer.solana.com/address/2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN?cluster=devnet)

**Ключевой флоу за 2 минуты:**
1. Бизнес регистрирует лот → вносит залог → токены появляются в каталоге
2. Инвестор покупает токены → SOL уходит в vault смарт-контракта
3. Нажимаем **Simulate Month** → C# оракул подтягивает выручку → контракт распределяет долю
4. Инвестор нажимает **Claim** → SOL зачисляется на кошелёк
5. Маркетплейс → инвестор выставляет токены → другой покупатель совершает сделку

---

## Архитектура

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 14)                │
│         Phantom Wallet ↔ Anchor SDK ↔ Oracle API        │
└───────────────┬──────────────────────┬──────────────────┘
                │                      │
                ▼                      ▼
┌──────────────────────┐   ┌───────────────────────────┐
│   Solana Devnet      │   │  Oracle (ASP.NET Core 8)  │
│                      │   │                           │
│  Smart Contract      │   │  ┌─────────────────────┐  │
│  (Rust / Anchor)     │   │  │ BusinessService     │  │
│                      │◄──┤  │ RevenueService      │  │
│  • BusinessPool      │   │  │ RankService         │  │
│  • HolderClaim       │   │  │ MarketplaceService  │  │
│  • RevenueEpoch      │   │  └─────────────────────┘  │
│  • TokenListing      │   │                           │
│                      │   │  PostgreSQL               │
└──────────────────────┘   └───────────────────────────┘
```

**Три компонента:**

**Смарт-контракт (Rust/Anchor)** — хранит всё on-chain: пулы бизнесов, позиции инвесторов, историю эпох, листинги маркетплейса. Все транзакции верифицируются контрактом.

**C# Оракул (ASP.NET Core 8)** — читает данные из кассовой системы (мок для хакатона), подписывает и отправляет `distribute_revenue` транзакцию каждый месяц. Хранит off-chain профили в PostgreSQL.

**Frontend (Next.js 14)** — подключает Phantom кошелёк, вызывает инструкции контракта напрямую через Anchor SDK, читает off-chain данные из Oracle API.

**Защита от скама — механика 40/30/30:**
```
Продажа токенов → разблокировка 40%
       ↓
Первая выплата инвесторам → разблокировка 30%
       ↓
KPI выручки достигнут → разблокировка последних 30%
```

**Ранговая система:**
| Ранг | Условие | Лимит привлечения |
|---|---|---|
| Новичок | Регистрация | $500 |
| Проверенный | 4 месяца выплат | $2,000 |
| Надёжный | 12 месяцев | $10,000 |
| Партнёр | Ручная верификация | Без лимита |

---

## Quick Start

**Требования:** Docker, Docker Compose

```bash
# 1. Клонировать репо
git clone https://github.com/NurbakZh/revShare.git && cd revShare

# 2. Запустить БД и бэкенд
docker-compose up -d

# 3. Открыть фронт
cd frontend && npm install && npm run dev
```

**API доступен:** `http://localhost:5000/swagger`  
**Фронт доступен:** `http://localhost:3000`

> Контракт уже задеплоен на devnet — ничего дополнительно деплоить не нужно.

---

## Структура репозитория

```
revShare/
├── programs/revshare/     # Rust/Anchor смарт-контракт
├── tests/                 # TypeScript тесты контракта (13/13 ✅)
├── backend/
│   ├── src/               # ASP.NET Core 8 Oracle
│   └── tests/             # Юнит тесты бэкенда (26/26 ✅)
├── frontend/              # Next.js 14
├── docs/                  # Документация для фронта
└── docker-compose.yml
```

---

## Roadmap

- [x] Смарт-контракт (Rust/Anchor) — все инструкции
- [x] C# Оракул — сервисы, репозитории, контроллеры
- [x] Механика залога и разблокировки 40/30/30
- [x] Ранговая система бизнесов
- [x] Маркетплейс токенов
- [x] CI/CD (GitHub Actions)
- [ ] Реальная интеграция с кассовым API (iiko/Square)
- [ ] Мобильный кошелёк (Backpack)
- [ ] Mainnet деплой

---

## Ссылки

- [Контракт на Devnet Explorer](https://explorer.solana.com/address/2d7xANWdHiz3b8w5btAcWuzReufZXV1r8r4t6puDEygN?cluster=devnet)
- [Документация для фронтенда](./docs/FRONTEND_INTEGRATION.md)
- [Anchor документация](https://www.anchor-lang.com)
- [Сдача на Colosseum](https://colosseum.org)

---

*National Solana Hackathon by Decentrathon — Case 1: Tokenization of Real-World Assets*