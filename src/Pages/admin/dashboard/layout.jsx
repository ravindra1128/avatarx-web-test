import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../../components/ui/button";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "../../../../components/ui/sheet";
import { MenuIcon, Users, Bell, LogOut, Home, User } from "lucide-react";
import { useUser } from "@/src/contexts/UserContext";
import { AuthContext } from "../../../Component/AuthProvider";
import { useTranslation } from 'react-i18next';

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}



export default function DashboardLayout({ children }) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useUser();
  const { authData } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
  };

  const sidebarItems = [
    { icon: Home, label: t('dashboard.sidebar.dashboard'), href: `/dashboard/${authData?.user?.first_name}`, adminOnly: true },
    {
      icon: Users,
      label: t('dashboard.sidebar.patients'),
      href: `/dashboard/${authData?.user?.first_name}/patients`,
      adminOnly: true,
    },
    // {
    //   icon: Bell,
    //   label: t('dashboard.sidebar.reminders'),
    //   href: "/admin/dashboard/reminders",
    //   adminOnly: true,
    // },
  ];

  return (
    <div className="flex h-full overflow-hidden w-full fixed pt-[70px]">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r transition-all overflow-hidden duration-300 h-[calc(100vh-70px)]",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col">
          <div className="flex h-14 items-center justify-between px-4 py-3 border-b">
            {!isCollapsed && <span className="font-bold">{t('dashboard.title')}</span>}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <MenuIcon className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex flex-col gap-2 p-2 flex-grow">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-accent",
                  location.pathname === item.href ? "bg-gray-100" : "",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-2 mt-auto">
          <Button
            variant="default"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" color="white" />
            {!isCollapsed && <span>{t('dashboard.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex h-14 items-center px-4 border-b">
              <span className="font-bold">{t('dashboard.title')}</span>
            </div>
            <nav className="flex flex-col gap-2 p-2 flex-grow">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                    location.pathname === item.href ? "bg-accent" : ""
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
            <div className="p-2 mt-auto">
              <Button
                variant="default"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" color="white" />
                <span>{t('dashboard.logout')}</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
