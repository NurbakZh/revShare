# RevShare Frontend

Next.js 14 фронтенд для RevShare платформы.

## Запуск

```bash
npm install
npm run dev
```

Открыть: `http://localhost:3000`

> Требует запущенной инфраструктуры: `docker-compose up -d` из корня репо.

## Переменные окружения

Файл `.env.dev` (для локальной разработки):

```env
NEXT_PUBLIC_ORACLE_URL=        # пусто = используется Next.js proxy (рекомендуется)
NEXT_PUBLIC_SOLANA_RPC=http://localhost:8899
NEXT_PUBLIC_PROGRAM_ID=EBzgZ4TU3tBtzfqLLmLpZcvoKKyuvyuseCkQ3MizCv8J
```

## Структура

```
src/
├── app/                        # Next.js App Router страницы
│   ├── page.tsx                # Каталог бизнесов
│   ├── business/[id]/          # Страница бизнеса
│   ├── dashboard/              # Инвестор / бизнес дашборды
│   ├── marketplace/            # Маркетплейс токенов
│   ├── profile/                # Профиль пользователя
│   ├── create-business/        # Создание бизнеса
│   └── demo/                   # Demo keypairs для тестирования
├── components/
│   ├── dashboard/              # BusinessDashboard, InvestorDashboard
│   ├── Header.tsx              # Навигация + подключение кошелька + Airdrop
│   └── OnboardingBanner.tsx    # Как всё работает (первый визит)
└── lib/
    ├── api/                    # Клиент Oracle API
    ├── solana/                 # Anchor SDK, PDAs, helpers, IDL
    └── store.ts                # Zustand store
```

## Phantom настройка для localnet

1. Phantom → Settings → Developer Settings → Change Network → Custom RPC
2. URL: `http://localhost:8899`
3. Используй demo keypairs со страницы `/demo` или нажми **Airdrop 100 SOL** в хедере
