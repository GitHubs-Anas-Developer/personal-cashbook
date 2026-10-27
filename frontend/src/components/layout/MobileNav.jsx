'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  FileBarChart,
  Menu,
  X,
  PieChart,
  Target,
  HandCoins,
  CalendarClock,
  Settings
} from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const primaryItems = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Ledger', href: '/transactions', icon: ArrowLeftRight },
    { label: 'Wallets', href: '/wallets', icon: Wallet },
    { label: 'Reports', href: '/reports', icon: FileBarChart }
  ];

  const moreItems = [
    { label: 'Budgets', href: '/budgets', icon: PieChart },
    { label: 'Savings Goals', href: '/savings-goals', icon: Target },
    { label: 'Debts & Loans', href: '/debts', icon: HandCoins },
    { label: 'Recurring Rules', href: '/recurring', icon: CalendarClock },
    { label: 'Settings & Security', href: '/settings', icon: Settings }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1">
        <div className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Icon className="w-5 h-5 mb-0.5" />
                {item.label}
              </Link>
            );
          })}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center py-1.5 px-3 rounded-lg text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            More
          </button>
        </div>
      </div>

      {/* Mobile "More" Drawer */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white dark:bg-slate-900 shadow-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quick Navigation</h2>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-1">
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-4 border-t border-slate-100 dark:border-slate-800">
              Personal Cashbook v1.0
            </div>
          </div>
        </div>
      )}
    </>
  );
}
