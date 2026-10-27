import './globals.css';
import { StoreProvider } from '../components/layout/StoreProvider.jsx';

export const metadata = {
  title: 'Personal Cashbook — Private Financial Ledger',
  description: 'Production-ready personal cashbook for individual users to track income, expenses, wallets, budgets, savings goals, and debts with mathematical ledger correctness.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
