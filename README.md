# RevShare

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Solana](https://img.shields.io/badge/Solana-Localnet%20%2F%20Devnet-9945FF?logo=solana)
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
| Нет прозрачного механизма распределения дохода без посредников | Смарт-контракт автоматически распределяет SOL держателям |
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

## Демо (локальный запуск)

**Требования:** Docker, Docker Compose, Node.js 20+

```bash
# 1. Клонировать репо
git clone https://github.com/NurbakZh/revShare.git && cd revShare

# 2. Запустить всю инфраструктуру (валидатор + оракул + БД + seed данные)
docker-compose up -d

# 3. Запустить фронтенд
cd frontend && npm install && npm run dev
```

**Что поднимается автоматически:**
- Solana localnet validator (порт 8899) с задеплоенным контрактом
- Oracle API (порт 5000) — C# бэкенд
- PostgreSQL (порт 5432)
- Seed скрипт — создаёт 2 демо-бизнеса и симулирует выручку

**Фронт:** `http://localhost:3000`  
**API + Swagger:** `http://localhost:5000/swagger`

### Demo кошельки

Перейди на `/demo` в приложении — там можно скачать готовые keypair файлы для Phantom:
- **Owner** — владелец двух демо-бизнесов, уже с SOL
- **Investor** — инвестор, уже с SOL

### Airdrop

На localnet в хедере доступна кнопка **Airdrop 100 SOL** — нажми после подключения кошелька.

---

## Ключевой флоу за 2 минуты

1. Бизнес регистрирует пул → вносит залог → токены появляются в каталоге
2. Инвестор покупает токены → SOL уходит в vault смарт-контракта
3. **Simulate Revenue** → C# оракул генерирует выручку → контракт распределяет долю инвесторам
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
│   Solana Localnet    │   │  Oracle (ASP.NET Core 8)  │
│                      │   │                           │
│  Smart Contract      │   │  BusinessService          │
│  (Rust / Anchor)     │◄──│  RevenueService           │
│                      │   │  RankService              │
│  BusinessPool        │   │  OracleWorker             │
│  HolderClaim         │   │                           │
│  RevenueEpoch        │   │  PostgreSQL               │
│  TokenListing        │   └───────────────────────────┘
│  collateral_vault    │
│  funds_vault         │
└──────────────────────┘
```

**Смарт-контракт (Rust/Anchor)** — хранит всё on-chain: пулы бизнесов, позиции инвесторов, историю эпох, листинги маркетплейса. Все транзакции верифицируются контрактом.

**C# Оракул (ASP.NET Core 8)** — симулирует данные кассовой системы, подписывает и отправляет `distribute_revenue` транзакции. Хранит off-chain профили в PostgreSQL.

**Frontend (Next.js 14)** — подключает Phantom кошелёк, вызывает инструкции контракта напрямую через Anchor SDK, читает off-chain данные из Oracle API.

### Защита от скама — механика 40/30/30

```
Продажа всех токенов → разблокировка 40%
         ↓
Первая выплата инвесторам → разблокировка 30% (итого 70%)
         ↓
KPI выручки достигнут → разблокировка последних 30% (итого 100%)
```

### Ранговая система

| Ранг | Условие | Лимит привлечения |
|---|---|---|
| Новичок | Регистрация | $500 |
| Проверенный | 4 месяца выплат | $2,000 |
| Надёжный | 12 месяцев | $10,000 |
| Партнёр | Ручная верификация | Без лимита |

---

## Структура репозитория

```
revShare/
├── programs/revshare/     # Rust/Anchor смарт-контракт
├── tests/                 # TypeScript тесты контракта
├── scripts/               # seed.ts — демо данные
├── docker/                # Dockerfile.validator, entrypoint, revshare.so
├── docker-compose.yml     # Весь стек одной командой
├── backend/
│   └── src/               # ASP.NET Core 8 Oracle
├── frontend/              # Next.js 14
└── docs/                  # Документация
```

---

## Roadmap

- [x] Смарт-контракт (Rust/Anchor) — все инструкции
- [x] C# Оракул — сервисы, репозитории, контроллеры
- [x] Механика залога и разблокировки 40/30/30
- [x] Ранговая система бизнесов
- [x] Маркетплейс токенов
- [x] Localnet Docker setup — один `docker-compose up`
- [x] Demo keypairs страница + Airdrop кнопка
- [x] CI/CD (GitHub Actions)
- [ ] Реальная интеграция с кассовым API (iiko/Square)
- [ ] Мобильный кошелёк (Backpack)
- [ ] Mainnet деплой

---

## Ссылки

- [Контракт на Devnet Explorer](https://explorer.solana.com/address/EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J?cluster=devnet)
- [Anchor документация](https://www.anchor-lang.com)

---

*National Solana Hackathon by Decentrathon — Case 1: Tokenization of Real-World Assets*
