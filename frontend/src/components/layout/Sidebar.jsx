'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Tag,
  PieChart,
  Target,
  HandCoins,
  CalendarClock,
  FileBarChart,
  Settings,
  BookOpen
} from 'lucide-react';

export const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Transactions', href: '/transactions', icon: ArrowLeftRight },
  { label: 'Wallets', href: '/wallets', icon: Wallet },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Budgets', href: '/budgets', icon: PieChart },
  { label: 'Savings Goals', href: '/savings-goals', icon: Target },
  { label: 'Debts & Loans', href: '/debts', icon: HandCoins },
  { label: 'Recurring', href: '/recurring', icon: CalendarClock },
  { label: 'Reports & Export', href: '/reports', icon: FileBarChart },
  { label: 'Settings', href: '/settings', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5 px-6 h-16 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">Personal Cashbook</h1>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium tracking-wide">PRIVATE FINANCIAL LEDGER</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>Confidential & End-to-End Secure</span>
        </div>
      </div>
    </aside>
  );
}
