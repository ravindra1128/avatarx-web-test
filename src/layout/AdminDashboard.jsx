import { Home, LogOut, MenuIcon, Users, UserCog, User } from "lucide-react";
import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../Component/AuthProvider";
import MobileSideBar from "../Component/MobileSideBar/MobileSideBar";
import { Button } from "../Component/UI/button";
import { useUser } from "../Hooks/useUser";
import { cn } from "../utils/utils";
import { useTranslation } from 'react-i18next';
import { ROLES } from "../constant/Constant";

const AdminDashboard = ({ children }) => {
  const { setAuthData } = useContext(AuthContext);
  const { slug, role } = useUser();
  const { t } = useTranslation();
  const { authData } = useContext(AuthContext);
  const {pathname} = useLocation();
  const facilitySlug = pathname.split("/")[2];
  const is_admin = authData?.user?.is_admin;
  const sidebarItems = [
    {
      icon: Home,
      label: t('dashboard.sidebar.dashboard'),
      href: `/dashboard/${facilitySlug}`,
      adminOnly: true,
    },
    {
      icon: Users,
      label: t('dashboard.sidebar.patients'),
      href: `/dashboard/${facilitySlug}/patients`,
      adminOnly: true,
    },
  ];
  
  if (is_admin) {
    sidebarItems.push({
      icon: UserCog,
      label: t('dashboard.sidebar.providers'),
      href: `/dashboard/${facilitySlug}/providers`,
      adminOnly: true,
    });
  }
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  // const { pathname } = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    const userLanguage = localStorage.getItem("userLanguage");
    const selectedLanguage = localStorage.getItem("selected_language");
    const i18nextLng = localStorage.getItem("i18nextLng");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("userLanguage", userLanguage);
    localStorage.setItem("selected_language", selectedLanguage);
    localStorage.setItem("i18nextLng", i18nextLng);
    setAuthData(null);
    // navigate("/login");
    window.location.href = role === ROLES.PATIENT ? "/login/patient" : "/login/provider";
    // window.location.reload();
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-full overflow-hidden w-full pt-[70px] -mb-[7.5rem] items-start">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "md:flex sidebar-nav flex-col border-r border-t rounded-lg border-[#e5e7eb] transition-all overflow-hidden duration-300 h-[calc(100vh-70px)] fixed top-[68px] left-0",
          isCollapsed ? "w-18" : "w-70"
        )}
      >
        <div className="flex flex-col">
          <div className="flex h-14 items-center justify-between px-4 py-3 border-b border-[#e5e7eb] ">
            {!isCollapsed && <span className="font-bold">{t('dashboard.title')}</span>}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapse}
              className={"z-[9999]"}
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
                  "flex items-center gap-2 rounded-lg px-3 py-3 transition-colors hover:bg-accent",
                  pathname === item.href ? "bg-gray-100" : "",
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
            variant="ghost"
            className={
              isCollapsed
                ? "w-full justify-start md:w-[65px]"
                : "w-full justify-start"
            }
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" color="black" />
            {!isCollapsed && <span>{t('dashboard.logout')}</span>}
          </Button>
        </div>
      </aside>

      <MobileSideBar />

      {/* Mobile Sidebar */}
      {/* <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <MenuIcon className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-white transition duration-300">
          <div className="flex flex-col h-full">
            <div className="flex h-14 items-center px-4 border-b border-white">
              <span className="font-bold">Admin Dashboard</span>
            </div>
            <nav className="flex flex-col gap-2 p-2 flex-grow">
              {sidebarItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                    pathname === item.href ? "bg-accent" : ""
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
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" color="white" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet> */}

      {/* Main Content */}
      {/* <div className="flex-1 flex flex-col min-h-screen overflow-hidden"> */}
      <div
        className={cn(
          "flex-1 flex flex-col custom-scrollbar overflow-y-auto min-h-[calc(100vh-70px)] ml-auto duration-[.5s]",
          isCollapsed
            ? "md:max-w-[calc(100%-72px)]"
            : "md:max-w-[calc(100%-280px)]"
        )}
      >
        <main className="flex-1 p-4 pl-0 md:pl-6 md:p-6">{children}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;