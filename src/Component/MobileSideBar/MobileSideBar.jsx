import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { Home, LogOut, MenuIcon, Users, X } from "lucide-react";
import React, { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/images/logo.webp";
import { useUser } from "../../Hooks/useUser";
import { cn } from "../../utils/utils";
import { AuthContext } from "../AuthProvider";
import { Button } from "../UI/button";
const MobileSideBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { authData, setAuthData } = useContext(AuthContext);
  const { slug, facilitySlug, role } = useUser();

  const sidebarItems = [
    {
      icon: Home,
      label: "Dashboard",
      href: `/dashboard/${slug}`,
      adminOnly: true,
    },
    {
      icon: Users,
      label: "Patients",
      href: `/dashboard/${facilitySlug}/patients`,
      adminOnly: true,
    },
    // {
    //   icon: Bell,
    //   label: "Reminders",
    //   href: "/admin/dashboard/reminders",
    //   adminOnly: true,
    // },
  ];
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const logout = () => {
    const userLanguage = localStorage.getItem("userLanguage");
    const selectedLanguage = localStorage.getItem("selected_language");
    const i18nextLng = localStorage.getItem("i18nextLng");
    localStorage.clear();
    localStorage.setItem("userLanguage", userLanguage);
    localStorage.setItem("selected_language", selectedLanguage);
    localStorage.setItem("i18nextLng", i18nextLng);
    setAuthData(null);
    window.location.href =  role === ROLES.PATIENT ?  "/login/patient" : "/login/provider";
  };
  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mobile-collapsable"
        >
          <MenuIcon className="h-4 w-4" id="toggleBtnClick" />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        {/* Overlay with fade animation */}
        <AnimatePresence>
          {isOpen && (
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[3]"
              />
            </Dialog.Overlay>
          )}
        </AnimatePresence>

        {/* Sidebar with smooth open & close animation */}
        <AnimatePresence>
          {isOpen && (
            <Dialog.Content asChild forceMount>
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg p-4 !z-[99999]"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="logo" onClick={() => navigate("/")}>
                    <img src={logo} alt="AvatarX Health" />
                  </div>
                  <Dialog.Close asChild>
                    <button
                      className="p-1 rounded-md hover:bg-gray-200"
                      onClick={() => setIsOpen(false)}
                    >
                      <X size={20} />
                    </button>
                  </Dialog.Close>
                </div>

                <nav>
                  {sidebarItems.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-3 py-3 mb-2 text-sm transition-colors hover:bg-gray-100",
                        pathname === item.href ? "bg-gray-100" : ""
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
                <div className="mt-auto">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logouts
                  </Button>
                </div>
              </motion.div>
            </Dialog.Content>
          )}
        </AnimatePresence>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MobileSideBar;
