'use client';

import SvgColor from '@/components/common/SvgColor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import {
  BookOpen,
  Brain,
  FolderOpen,
  Home,
  MessageCircle,
  Plus,
  Presentation,
  Search,
  Table,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import NotificationBell from '@/components/forum/NotificationBell';

const svgIcon = (name: string, className = 'h-4 w-4 bg-current') => (
  <SvgColor src={`/navbar/${name}.svg`} className={className} />
);

const WRITING_TOOL_KEYS = [
  { key: 'sidebar.write', icon: svgIcon('diamond'), href: '/writing-studio' },
  { key: 'sidebar.paraphrase', icon: svgIcon('paraphrase'), href: '/paraphrase' },
  { key: 'sidebar.aiDetector', icon: svgIcon('ai_detector'), href: '/ai-detector' },
  { key: 'sidebar.humanize', icon: svgIcon('humanize'), href: '/humanize-gpt' },
  { key: 'sidebar.plagiarism', icon: svgIcon('plagiarism_checker'), href: '/plagiarism-checker' },
  { key: 'sidebar.grammar', icon: svgIcon('grammar_checker'), href: '/grammar-checker' },
  { key: 'sidebar.summarize', icon: svgIcon('summarize'), href: '/summarize' },
  { key: 'sidebar.translate', icon: svgIcon('translator'), href: '/translator' },
];

const AGENT_TOOL_KEYS = [
  { key: 'sidebar.aiChat', icon: <MessageCircle className="h-4 w-4" />, href: '/agents/chat' },
  { key: 'sidebar.aiSlides', icon: <Presentation className="h-4 w-4" />, href: '/agents/presentation' },
  { key: 'sidebar.aiSheets', icon: <Table className="h-4 w-4" />, href: '/agents/sheets' },
  { key: 'sidebar.deepResearch', icon: <Search className="h-4 w-4" />, href: '/agents/research' },
];

function NavIcon({
  icon,
  label,
  href,
  isActive,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
  tooltip?: string;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            aria-label={label}
            className={cn(
              'flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl mx-1 w-[54px] cursor-pointer transition-colors no-underline',
              isActive
                ? 'bg-brand/10 text-brand'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <span className="flex items-center justify-center">{icon}</span>
            <span className="text-[9px] font-medium text-center leading-tight truncate w-full text-current">
              {label}
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {tooltip ?? label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function Divider() {
  return <div className="mx-3 my-1 border-t border-sidebar-border" />;
}

function NewButtonWithPopup() {
  const { t } = useTranslation();
  const WRITING_TOOLS = WRITING_TOOL_KEYS.map((tool) => ({ ...tool, label: t(tool.key) }));
  const AGENT_TOOLS = AGENT_TOOL_KEYS.map((tool) => ({ ...tool, label: t(tool.key) }));

  return (
    <div className="group relative mx-1 w-[54px]">
      <button
        aria-label="New / Tools"
        className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-xl w-full cursor-pointer transition-colors text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <span className="flex items-center justify-center">
          <Plus className="h-5 w-5" />
        </span>
        <span className="text-[9px] font-medium text-center leading-tight text-current">
          {t('nav.new')}
        </span>
      </button>

      <div className="pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-150 absolute left-[calc(100%+8px)] top-0 z-50 w-52 rounded-2xl border border-border bg-popover shadow-xl p-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {t('sidebar.writingTools')}
        </p>
        <div className="flex flex-col gap-0.5 mb-3">
          {WRITING_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors no-underline"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 text-muted-foreground">
                {tool.icon}
              </span>
              <span>{tool.label}</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-border mb-2" />

        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {t('sidebar.aiAgents')}
        </p>
        <div className="flex flex-col gap-0.5 mb-3">
          {AGENT_TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors no-underline"
            >
              <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 text-muted-foreground">
                {tool.icon}
              </span>
              <span>{tool.label}</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-border mb-2" />

        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          {t('sidebar.discover')}
        </p>
        <Link
          href="/marketplace"
          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors no-underline"
        >
          <span className="flex-shrink-0 flex items-center justify-center w-4 h-4 text-muted-foreground">
            <BookOpen className="h-4 w-4" />
          </span>
          <span>{t('sidebar.bookMarketplace')}</span>
        </Link>
      </div>
    </div>
  );
}

export default function IconNavSidebar() {
  const pathname = usePathname();
  const isActive = (match: string) => pathname.startsWith(match);
  const user = useSelector((state: any) => state.auth?.user);
  const masterId: string | null = user?._id ?? user?.email ?? null;
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-16 flex-shrink-0 flex-col bg-sidebar border-r border-sidebar-border z-40 overflow-visible">
      <div className="flex items-center justify-center h-12 lg:h-16 border-b border-sidebar-border flex-shrink-0">
        <Link href="/" aria-label="Shothik AI Home">
          <Image
            src="/moscot.png"
            alt="Shothik AI"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        </Link>
      </div>

      <div className="flex flex-col flex-1 overflow-visible py-2 items-center">
        <NewButtonWithPopup />

        <NavIcon
          icon={<Home className="h-5 w-5" />}
          label={t('nav.home')}
          href="/writing-studio"
          isActive={pathname === '/writing-studio'}
          tooltip={t('sidebar.writingStudio')}
        />

        <NavIcon
          icon={<FolderOpen className="h-5 w-5" />}
          label={t('nav.projects')}
          href="/writing-studio?projects=1"
          isActive={false}
          tooltip={t('sidebar.yourProjects')}
        />

        <NavIcon
          icon={<MessageCircle className="h-5 w-5" />}
          label={t('nav.chat')}
          href="/agents/chat"
          isActive={isActive('/agents/chat')}
          tooltip={t('sidebar.aiChat')}
        />

        <NavIcon
          icon={<Users className="h-5 w-5" />}
          label={t('nav.community')}
          href="/community"
          isActive={isActive('/community')}
          tooltip={t('sidebar.communityForums')}
        />

        <NavIcon
          icon={<BookOpen className="h-5 w-5" />}
          label={t('nav.books')}
          href="/marketplace"
          isActive={isActive('/marketplace') || isActive('/books')}
          tooltip={t('sidebar.bookMarketplaceTooltip')}
        />

        <Divider />

        <NavIcon
          icon={<Brain className="h-5 w-5" />}
          label={t('sidebar.twin')}
          href="/twin"
          isActive={isActive('/twin')}
          tooltip={t('sidebar.twinTooltip')}
        />

        <div className="flex-1" />

        <Divider />

        {masterId && (
          <div className="mx-auto mb-1">
            <NotificationBell masterId={masterId} />
          </div>
        )}

        <NavIcon
          icon={svgIcon('user', 'h-5 w-5 bg-current')}
          label={t('nav.account')}
          href="/account"
          isActive={isActive('/account')}
          tooltip={t('sidebar.yourAccount')}
        />
      </div>
    </aside>
  );
}
