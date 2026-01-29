import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../../../components/ui/button_old";
import { ScrollArea } from "../../../../components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "../../../../components/ui/sheet";
import { cn } from "../../../lib/utils";
import { MenuIcon, Users, Home, Settings } from "lucide-react";

const sidebarItems = [
  // { icon: Home, label: "Dashboard", href: "admin/dashboard" },
  { icon: Users, label: "Patients", href: "/admin/dashboard/patients" },
  // { icon: Settings, label: "Settings", href: "admin/dashboard/settings" },
];

export default function DashboardLayout({ children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/dashboard/patients");
  }, []);

  return (
    <div className="flex h-screen overflow-hidden w-full">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r transition-all duration-300",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 py-3 border-b">
          {!isCollapsed && <span className="font-bold">Dashboard</span>}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <MenuIcon className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-2 p-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                  location.pathname === item.href ? "bg-accent" : "",
                  isCollapsed ? "justify-center" : ""
                )}
              >
                <item.icon className="h-4 w-4" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <ScrollArea className="h-full">
            <div className="flex h-14 items-center px-4 border-b">
              <span className="font-bold">AvatarX</span>
            </div>
            <nav className="flex flex-col gap-2 p-2">
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
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
    </div>
  );
}
