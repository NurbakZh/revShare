'use client'

import { BusinessDashboard } from '@/components/dashboard/BusinessDashboard'
import { InvestorDashboard } from '@/components/dashboard/InvestorDashboard'
import { useAppStore } from '@/lib/store'

export default function DashboardPage() {
    const role = useAppStore((s) => s.role)

    if (role === 'business') {
        return <BusinessDashboard />
    }
    return <InvestorDashboard />
}
