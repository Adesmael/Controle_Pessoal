
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/income', label: 'Receitas', icon: TrendingUp },
  { href: '/expenses', label: 'Despesas', icon: TrendingDown },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm md:hidden">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-1 sm:px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center space-y-1 rounded-md p-1 text-[10px] font-medium transition-colors sm:text-xs hover:bg-accent/50',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5 sm:h-5 sm:w-5', isActive ? 'text-primary' : '')} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
