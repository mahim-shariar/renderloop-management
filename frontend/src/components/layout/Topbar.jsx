import { Moon, Sun, LogOut, User, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme/ThemeProvider.jsx';
import { selectAuthUser } from '@/features/auth/authSlice.js';
import { useLogoutMutation } from '@/features/auth/authApi.js';
import Avatar from '@/components/ui/Avatar.jsx';
import NotificationBell from '@/features/notifications/NotificationBell.jsx';
import GlobalSearch from './GlobalSearch.jsx';
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/Dropdown.jsx';

export default function Topbar() {
  const { theme, toggle } = useTheme();
  const user = useSelector(selectAuthUser);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout().unwrap();
      toast.success('Logged out');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed');
    }
  }

  return (
    <div className="sticky top-3 z-30 mx-4 mt-3 md:mx-6">
      <header className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-card/70 px-3 shadow-card backdrop-blur-xl">
        {/* Brand mark — mobile only (no sidebar there) */}
        <div className="flex items-center gap-2 pl-1 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-fuchsia-500 text-white">
            <Film className="h-4 w-4" />
          </div>
        </div>

        <GlobalSearch />

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <NotificationBell />

          <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-accent"
              >
                <Avatar name={user?.name || 'User'} src={user?.avatarUrl} size="sm" />
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-medium leading-none text-foreground">
                    {user?.name || '—'}
                  </div>
                  <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {user?.role || ''}
                  </div>
                </div>
              </button>
            </DropdownTrigger>
            <DropdownContent className="min-w-[12rem]">
              <DropdownLabel>{user?.email}</DropdownLabel>
              <DropdownSeparator />
              <DropdownItem onSelect={() => navigate('/settings')}>
                <User className="h-4 w-4" /> Profile
              </DropdownItem>
              <DropdownItem onSelect={handleLogout} disabled={loggingOut}>
                <LogOut className="h-4 w-4" /> Log out
              </DropdownItem>
            </DropdownContent>
          </Dropdown>
        </div>
      </header>
    </div>
  );
}
