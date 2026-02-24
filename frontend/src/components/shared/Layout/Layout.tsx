import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Settings,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useEventStream } from '@/hooks/useEventStream';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/events',    icon: AlertTriangle,   labelKey: 'nav.events'    },
  { to: '/reports',   icon: FileText,        labelKey: 'nav.reports'   },
  { to: '/admin',     icon: Settings,        labelKey: 'nav.admin'     },
];

export default function Layout() {
  const { t } = useTranslation();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const { user, logout } = useAuth();

  // SSE subscription — keeps list + dashboard fresh across tabs
  useEventStream();

  const handleLogout = async () => {
    await logout.mutateAsync();
    toast.success(t('auth.logoutSuccess'));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-200',
          sidebarOpen ? 'w-56' : 'w-14',
        )}
      >
        {/* Logo / Toggle */}
        <div className="flex h-14 items-center justify-between border-b px-3">
          {sidebarOpen && (
            <span className="truncate text-sm font-semibold text-primary">
              ISD-OMS
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          <ul className="space-y-1 px-2">
            {navItems.map(({ to, icon: Icon, labelKey }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent',
                      isActive
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'text-muted-foreground',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {sidebarOpen && <span className="truncate">{t(labelKey)}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* User / Logout */}
        <div className="border-t p-2">
          <div
            className={cn(
              'flex items-center gap-2 rounded-md px-2 py-2',
              sidebarOpen && 'mb-1',
            )}
          >
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            {sidebarOpen && (
              <div className="flex-1 truncate">
                <p className="truncate text-xs font-medium">{user?.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size={sidebarOpen ? 'sm' : 'icon'}
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {sidebarOpen && <span>{t('auth.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
