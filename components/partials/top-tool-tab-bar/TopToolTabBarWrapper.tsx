'use client';

import { usePathname } from 'next/navigation';
import TopToolTabBar from './index';

const APP_PATHS = [
  '/writing-studio',
  '/paraphrase',
  '/ai-detector',
  '/humanize-gpt',
  '/plagiarism-checker',
  '/grammar-checker',
  '/summarize',
  '/translator',
  '/agents',
  '/animation',
  '/research',
  '/slide',
  '/slide-generation',
  '/twin',
];

export default function TopToolTabBarWrapper() {
  const pathname = usePathname();
  const shouldShow = APP_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?'));
  if (!shouldShow) return null;
  return <TopToolTabBar />;
}
