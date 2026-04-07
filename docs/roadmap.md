# Roadmap

## Хакатон (текущее состояние)

### Смарт-контракт
- [x] `initialize_business` — создание пула с залогом (`raise_limit` авто-вычисляется)
- [x] `buy_tokens` — покупка токенов инвесторами
- [x] `distribute_revenue` — ежемесячное распределение (oracle-signed)
- [x] `claim` — получение доли выручки инвестором
- [x] `list_tokens` — выставление токенов на маркетплейс (владелец тоже может)
- [x] `buy_listed_tokens` — покупка лота (с корректным обновлением `last_claimed_epoch`)
- [x] `cancel_listing` — отмена листинга
- [x] `release_funds` — разблокировка траншей 40/30/30
- [x] `unlock_first_tranche` — ручная синхронизация первого транша
- [x] Ранговая система (Новичок → Проверенный → Надёжный → Партнёр)
- [x] Защита от скама (залог + поэтапная разблокировка)
- [x] Деплой на Solana Devnet (через CI/CD)

### Backend (C# Oracle)
- [x] SolanaService — keypair оракула, отправка транзакций
- [x] RevenueService — симуляция выручки 100–150% от target_revenue
- [x] OracleWorker — фоновый сервис ежемесячных выплат
- [x] RankService — автоматическое повышение ранга
- [x] BusinessService, UserService, MarketplaceService
- [x] PostgreSQL + EF Core + миграции
- [x] Repository pattern + DDD
- [x] REST API с Swagger
- [x] Docker + docker-compose

### Frontend (Next.js 14)
- [x] Каталог бизнесов
- [x] Страница бизнеса с историей выручки и трансакциями
- [x] Dashboard инвестора с Claim
- [x] Dashboard бизнеса с выбором бизнеса и симуляцией выручки
- [x] Профиль пользователя
- [x] Маркетплейс — листинг и покупка токенов
- [x] Создание бизнеса (2-шаговая форма)
- [x] `/demo` — страница demo keypairs
- [x] Airdrop 100 SOL кнопка (localnet)
- [x] Onboarding banner — как всё работает
- [x] Автоматическая регистрация пользователя при подключении кошелька
- [x] Сохранение выбранного бизнеса в URL search params

### Инфраструктура
- [x] GitHub Actions CI/CD (contract / backend / frontend)
- [x] Автодеплой контракта на devnet при пуше в main
- [x] Localnet Docker stack — один `docker-compose up`
- [x] Seed скрипт — 2 demo бизнеса + симуляция выручки
- [x] Документация (README, architecture, product, api)

---

## После хакатона

### v1.1 — Реальная интеграция
- [ ] Реальный кассовый API (iiko / Square / Poster)
- [ ] Ценовой оракул (Pyth Network) для токенов
- [ ] KYC/AML верификация через Civic
- [ ] Multi-epoch claim (клейм за несколько эпох сразу)

### v1.2 — UX
- [ ] Мобильный кошелёк (Backpack, Solflare)
- [ ] Email уведомления о выплатах
- [ ] Push-уведомления через Dialect
- [ ] Аналитика APY с историческими данными

### v2.0 — Масштабирование
- [ ] Mainnet деплой
- [ ] Поддержка USDC выплат (не только SOL)
- [ ] SDK для интеграторов
- [ ] Мультиязычность (EN/RU/KZ)
- [ ] Партнёрская программа для агрегаторов кассовых систем

### Долгосрочно
- [ ] DAO управление параметрами платформы
- [ ] Страхование дефолтов через DeFi протоколы
- [ ] Вторичный рынок с автоматическим ценообразованием
- [ ] Интеграция с реестрами бизнеса (юридическое подтверждение)
