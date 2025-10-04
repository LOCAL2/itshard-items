import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Settings, Menu } from "lucide-react";
import { isNotificationsEnabled, setNotificationsEnabled } from "@/utils/notifications";
import { Switch } from "@/components/ui/switch";
import { getPreferredTheme, setTheme, ThemeMode } from "@/utils/theme";

const NavBar = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const [notificationsEnabled, setNotificationsEnabledState] = useState<boolean>(isNotificationsEnabled());
  const [theme, setThemeState] = useState<ThemeMode>(getPreferredTheme());
  const [showCalendar, setShowCalendar] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem('show_calendar_view');
      return raw === null ? true : raw === '1';
    } catch {
      return true;
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setNotificationsEnabledState(isNotificationsEnabled());
    window.addEventListener('notifications-changed', handler);
    return () => window.removeEventListener('notifications-changed', handler);
  }, []);

  useEffect(() => {
    const handler = () => setThemeState(getPreferredTheme());
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      try {
        const raw = localStorage.getItem('show_calendar_view');
        setShowCalendar(raw === null ? true : raw === '1');
      } catch { }
    };
    window.addEventListener('show-calendar-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('show-calendar-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link
            to="/"
            className="text-sm sm:text-base font-semibold hover:opacity-90 truncate"
          >
            <span className="hidden sm:inline">ระบบจัดการครอบครัว</span>
            <span className="sm:hidden">ครอบครัว</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                <span className="hidden lg:inline">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                className="flex items-center justify-between gap-3"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-sm">การแจ้งเตือน</span>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={(checked) => {
                    setNotificationsEnabled(checked);
                    setNotificationsEnabledState(checked);
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuItem
                className="flex items-center justify-between gap-3"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-sm">แสดงมุมมองปฏิทิน</span>
                <Switch
                  checked={showCalendar}
                  onCheckedChange={(checked) => {
                    try {
                      localStorage.setItem('show_calendar_view', checked ? '1' : '0');
                    } catch { }
                    setShowCalendar(checked);
                    window.dispatchEvent(new Event('show-calendar-changed'));
                  }}
                />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="flex items-center justify-between gap-3"
                onSelect={(e) => e.preventDefault()}
              >
                <span className="text-sm">ธีม</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTheme('light'); setThemeState('light'); }}
                  >
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setTheme('dark'); setThemeState('dark'); }}
                  >
                    Dark
                  </Button>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="outline" size="sm">
            <Link to="/manager">
              <span className="hidden lg:inline">จัดการ</span>
              <span className="lg:hidden">จัดการ</span>
            </Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">เมนู</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                {/* Navigation Links */}
                <div className="space-y-2">
                  <Button asChild className="w-full justify-start" variant="outline" onClick={handleMobileMenuClose}>
                    <Link to="/manager" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      จัดการระบบ
                    </Link>
                  </Button>
                </div>

                {/* Settings Section */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">การตั้งค่า</h3>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">การแจ้งเตือน</span>
                      <Switch
                        checked={notificationsEnabled}
                        onCheckedChange={(checked) => {
                          setNotificationsEnabled(checked);
                          setNotificationsEnabledState(checked);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm">แสดงมุมมองปฏิทิน</span>
                      <Switch
                        checked={showCalendar}
                        onCheckedChange={(checked) => {
                          try {
                            localStorage.setItem('show_calendar_view', checked ? '1' : '0');
                          } catch { }
                          setShowCalendar(checked);
                          window.dispatchEvent(new Event('show-calendar-changed'));
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm">ธีม</span>
                      <div className="flex gap-2">
                        <Button
                          variant={theme === 'light' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => { setTheme('light'); setThemeState('light'); }}
                        >
                          Light
                        </Button>
                        <Button
                          variant={theme === 'dark' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => { setTheme('dark'); setThemeState('dark'); }}
                        >
                          Dark
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

