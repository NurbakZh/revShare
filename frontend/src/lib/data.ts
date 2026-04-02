export interface Business {
    id: string;
    name: string;
    description: string;
    category: string;
    apy: number;
    riskLevel: 'Low' | 'Medium' | 'High';
    tokenPrice: number;
    totalTokens: number;
    tokensLeft: number;
    fundingProgress: number;
    monthlyRevenue: number[];
    logo: string;
    owner: string;
    revenueSharePercent: number;
    targetRevenue: number;
}

export const mockBusinesses: Business[] = [
    {
        id: '1',
        name: 'Brew & Bytes Café',
        description:
            'Modern coffee shop with tech coworking space in downtown SF',
        category: 'Food & Beverage',
        apy: 18.5,
        riskLevel: 'Low',
        tokenPrice: 50,
        totalTokens: 10000,
        tokensLeft: 3420,
        fundingProgress: 65.8,
        monthlyRevenue: [
            45000, 48000, 52000, 55000, 58000, 62000, 65000, 68000, 71000,
            74000, 78000, 82000,
        ],
        logo: '☕',
        owner: '5hG8...kL9p',
        revenueSharePercent: 20,
        targetRevenue: 100000,
    },
    {
        id: '2',
        name: 'GreenLeaf Organics',
        description: 'Organic produce delivery service serving 5 cities',
        category: 'Food & Delivery',
        apy: 22.3,
        riskLevel: 'Medium',
        tokenPrice: 75,
        totalTokens: 8000,
        tokensLeft: 1200,
        fundingProgress: 85,
        monthlyRevenue: [
            30000, 35000, 38000, 42000, 45000, 48000, 52000, 55000, 58000,
            62000, 65000, 68000,
        ],
        logo: '🌱',
        owner: '7jK2...mN4q',
        revenueSharePercent: 25,
        targetRevenue: 80000,
    },
    {
        id: '3',
        name: 'FitFlow Studios',
        description: 'Boutique fitness studio chain with virtual classes',
        category: 'Health & Wellness',
        apy: 15.8,
        riskLevel: 'Low',
        tokenPrice: 40,
        totalTokens: 15000,
        tokensLeft: 7500,
        fundingProgress: 50,
        monthlyRevenue: [
            25000, 27000, 29000, 31000, 33000, 35000, 37000, 39000, 41000,
            43000, 45000, 48000,
        ],
        logo: '💪',
        owner: '9mP5...rT8s',
        revenueSharePercent: 18,
        targetRevenue: 60000,
    },
    {
        id: '4',
        name: 'TechRepair Pro',
        description: 'Electronics repair service with same-day turnaround',
        category: 'Technology',
        apy: 28.7,
        riskLevel: 'High',
        tokenPrice: 100,
        totalTokens: 5000,
        tokensLeft: 800,
        fundingProgress: 84,
        monthlyRevenue: [
            20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000,
            65000, 70000, 75000,
        ],
        logo: '🔧',
        owner: '3aB7...vW1x',
        revenueSharePercent: 30,
        targetRevenue: 90000,
    },
    {
        id: '5',
        name: 'Artisan Bakery Co.',
        description: 'Handcrafted bread and pastries with local ingredients',
        category: 'Food & Beverage',
        apy: 16.2,
        riskLevel: 'Low',
        tokenPrice: 35,
        totalTokens: 12000,
        tokensLeft: 5400,
        fundingProgress: 55,
        monthlyRevenue: [
            18000, 19000, 21000, 22000, 24000, 26000, 28000, 30000, 32000,
            34000, 36000, 38000,
        ],
        logo: '🥖',
        owner: '6dF9...yZ2a',
        revenueSharePercent: 15,
        targetRevenue: 50000,
    },
    {
        id: '6',
        name: 'Pet Paradise Grooming',
        description: 'Premium pet grooming and spa services',
        category: 'Pet Services',
        apy: 19.5,
        riskLevel: 'Medium',
        tokenPrice: 60,
        totalTokens: 7000,
        tokensLeft: 2100,
        fundingProgress: 70,
        monthlyRevenue: [
            15000, 17000, 19000, 21000, 23000, 25000, 27000, 29000, 31000,
            33000, 35000, 38000,
        ],
        logo: '🐾',
        owner: '8hJ4...cE5b',
        revenueSharePercent: 22,
        targetRevenue: 45000,
    },
];
