'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/daily',       icon: '☀',  label: 'Daily'  },
  { href: '/cast/iching', icon: '☰',  label: 'I-Ching' },
  { href: '/cast/tarot',  icon: '🂡', label: 'Tarot'  },
  { href: '/diary',       icon: '◈',  label: 'Diary'  },
  { href: '/chat',        icon: '✦',  label: 'Chat'   },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg
                    bg-card/95 backdrop-blur border-t border-[rgba(201,168,76,0.15)]
                    flex justify-around items-center h-16 z-50">
      {TABS.map((t) => {
        const active = path === t.href || (t.href !== '/daily' && path.startsWith(t.href));
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg
                        text-xs transition-colors duration-150
                        ${active
                          ? 'text-gold'
                          : 'text-muted hover:text-parchment/70'}`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="font-mono tracking-wide">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
