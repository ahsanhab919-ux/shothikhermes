'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import {
  BookOpen,
  Home,
  MessageCircle,
  PenTool,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEM_KEYS = [
  {
    labelKey: 'nav.home',
    icon: Home,
    href: '/writing-studio',
    match: ['/writing-studio'],
  },
  {
    labelKey: 'nav.tools',
    icon: PenTool,
    href: '/paraphrase',
    match: ['/paraphrase', '/ai-detector', '/humanize-gpt', '/plagiarism-checker', '/grammar-checker', '/summarize', '/translator'],
  },
  {
    labelKey: 'nav.chat',
    icon: MessageCircle,
    href: '/agents/chat',
    match: ['/agents'],
  },
  {
    labelKey: 'nav.books',
    icon: BookOpen,
    href: '/marketplace',
    match: ['/marketplace', '/books'],
  },
  {
    labelKey: 'nav.account',
    icon: User,
    href: '/account',
    match: ['/account'],
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (matches: string[]) =>
    matches.some((m) => pathname.startsWith(m));

  if (pathname.startsWith('/writing-studio')) return null;

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {NAV_ITEM_KEYS.map((item) => {
          const active = isActive(item.match);
          const Icon = item.icon;
          const label = t(item.labelKey);
          return (
            <Link
              key={item.labelKey}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 min-h-[48px] justify-center text-[10px] font-medium transition-colors no-underline',
                active
                  ? 'text-brand'
                  : 'text-muted-foreground active:text-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-brand')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
