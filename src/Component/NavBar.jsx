import React, { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/images/logo.webp";
import logoNvision from "../assets/images/logoNvision.png";
import userLogo from "../assets/images/user.png";
import { useUser } from "../Hooks/useUser";
import { AuthContext } from "./AuthProvider.jsx";
import LanguageSwitcher from "./LanguageSwitcher/LanguageSwitcher";
import "./NavBar.css";
import { ROLES } from "../constant/Constant.js";

// Utility function to detect mobile devices
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
};

function Navbar() {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [blurred, setBlurred] = useState(false);
  const { slug, facilitySlug, role } = useUser();
  const [isClicked, setIsClicked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { authData, setAuthData } = useContext(AuthContext);
  const user = localStorage.getItem("user");
  const menuRef = useRef(null);
  const [showLoginDropdown, setShowLoginDropdown] = useState(false);
  const loginDropdownRef = useRef(null);

  const navigate = useNavigate();
  const {pathname} = useLocation()
  console.log(pathname,"/123/")

  // const navigate = (path) => {
  //   window.location.assign(`https://theavatarx.com/${path}`);
  // };

  useEffect(() => {
    const scrollHandler = () => {
      setScrolled(window.pageYOffset <= 20);
    };
    window.addEventListener("scroll", scrollHandler);

    // Explicit call so that the navbar gets blurred when component mounts
    scrollHandler();

    return () => {
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    const handleClickOutside = (event) => {
      // Only handle click outside on desktop devices
      if (isMobileDevice()) return;
      
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
        setIsClicked(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    if (!showLoginDropdown) return;
    const handleClickOutside = (event) => {
      // Only handle click outside on desktop devices
      if (isMobileDevice()) return;
      
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target)) {
        setShowLoginDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLoginDropdown]);

  const signOut = () => {
    const userLanguage = localStorage.getItem("userLanguage");
    const selectedLanguage = localStorage.getItem("selected_language");
    const i18nextLng = localStorage.getItem("i18nextLng");
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("userLanguage", userLanguage);
    localStorage.setItem("selected_language", selectedLanguage);
    localStorage.setItem("i18nextLng", i18nextLng);
    setAuthData(null);
    setShowMenu(false);
    setIsClicked(false);
    window.location.href =  role === ROLES.PATIENT ?  "/login/patient" : "/login/provider";
  };

  const menuItems =
    authData?.user?.role === "facility"
      ? [
          {
            label: t('navbar.dashboard'),
            to: `/dashboard/${slug}`,
          },
        ]
      : [
        {
          label: t('navbar.dashboard'),
          to: `/patient/dashboard`
        },
        {
          label: t('navbar.history'),
          to: `/profile`,
        },
          // {
          //   label: t('navbar.viewProfile'),
          //   to: `/profile/${facilitySlug}/${slug}`,
          // },
          // {
          //   label: t('navbar.checkVitals'),
          //   to: "/patient/check-vitals",
          // },
        ];

  const AuthButton = () => {
    if (user) {
      return (
        <>
          <div
            className="relative inline-block text-left mobile-auth"
            ref={menuRef}
          >
            <div>
              <button
                type="button"
                className="cursor-pointer inline-flex w-full justify-center gap-x-1.5 rounded-full text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50"
                id="menu-button"
                aria-expanded="true"
                aria-haspopup="true"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                <img
                  className="inline-block size-9 rounded-full ring-2 ring-white"
                  loading="lazy"
                  crossOrigin={"anonymous"}
                  // src={authData?.user?.picture}
                  src={userLogo}
                  alt="profile_pic"
                />
              </button>
            </div>
            {showMenu && (
              <div
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-hidden"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                tabIndex="-1"
              >
                <div className="py-1" role="none">
                  {menuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      tabIndex="-1"
                      id="menu-item-0"
                      onClick={() => setShowMenu(false)}
                    >
                      {item.label}
                    </Link>
                  ))}

                  {/* {(authData?.user?.role === "admin" ||
                    authData?.user?.role === "facility") && (
                    <Link
                      to="/admin/invite"
                      className="block px-4 py-2 text-sm text-gray-700"
                      role="menuitem"
                      tabIndex="-1"
                      id="menu-item-1"
                      onClick={() => setShowMenu(false)}
                    >
                      Invite user
                    </Link>
                  )} */}

                  <form method="POST" action="#" role="none">
                    <button
                      type="submit"
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 cursor-pointer"
                      role="menuitem"
                      tabIndex="-1"
                      id="menu-item-3"
                      onClick={signOut}
                    >
                      {t("navbar.signOut")}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4">
          <button
              className="mobile-auth-button contact-button cursor-pointer"
              onClick={() => {
                setIsClicked(false);
                navigate( authData?.user?.role === "facility" ? `/dashboard/${slug}` : "/patient/dashboard");
              }}
            >
              {t("navbar.dashboard")}
            </button>
           { authData?.user?.role !== "facility" ? <> 
           {/* <button
              className="mobile-auth-button contact-button cursor-pointer"
              onClick={() => {
                setIsClicked(false);
                navigate("/patient/check-vitals");
              }}
            >
              {t("navbar.checkVitals")}
            </button> */}
            <button
              className="mobile-auth-button contact-button cursor-pointer"
              onClick={() => {
                setIsClicked(false);
                navigate("/profile");
              }}
            >
              {t("navbar.history")}
            </button></> : <>
            
            </>}
            <button
              className="mobile-auth-button contact-button cursor-pointer"
              onClick={() => signOut()}
            >
              {t("navbar.logOut")}
            </button>
          </div>
        </>
      );
    } else {
      return (
        <div className="relative" ref={loginDropdownRef}>
          <button
            className="cursor-pointer inline-flex w-full justify-center gap-x-1.5 rounded-full text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 px-4 py-1.5"
            onClick={() => setShowLoginDropdown((prev) => !prev)}
          >
            {t('navbar.logIn')}
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </button>
          {showLoginDropdown && (
            <div className="login-dropdown absolute right-0 z-10 mt-2 w-38 origin-top-right rounded-md bg-white ring-1 shadow-lg ring-black/5 focus:outline-none">
              <div className="py-1">
                <Link
                  to="/login/provider"
                  className="block py-2 px-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  onClick={() => {
                    setShowLoginDropdown(false);
                    setIsClicked(false);
                  }}
                >
                  {t('navbar.providerLogin', 'Provider Login')}
                </Link>
                <div className="border-t border-gray-200"></div>
                <Link
                  to="/login/patient"
                  className="block py-2 px-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  onClick={() => {
                    setShowLoginDropdown(false);
                    setIsClicked(false);
                  }}
                >
                  {t('navbar.patientLogin', 'Patient Login')}
                </Link>
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  const toggleButton = () => {
    setShowMenu((prev) => !prev);
    setIsClicked((prev) => !prev);
  };

  return (
    <>
      <nav
        className={`navbar ${!scrolled ? "scrolled" : ""} ${
          blurred ? "blurred" : ""
        } ${isClicked ? "toggle-active" : ""}`}
      >
        <div
          className="logo"
          onClick={() => {
            navigate("/");
            setIsClicked(false);
          }}
        >
          <img src={pathname === '/demos/nvision' ? logoNvision :logo} alt="AvatarX Health" style={{height : pathname === '/demos/nvision' ? '32px' :''}} />
        </div>
        <div>
          <button
            onClick={toggleButton}
            className={isClicked ? "toggle-btn toggle-active" : "toggle-btn"}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
        <ul className={isClicked ? "nav-links toggle-active" : "nav-links"}>
          <li className="not-mobile">
            <LanguageSwitcher />
          </li>
          {(!user || !isMobileDevice()) ? <>
          <li>
            <Link to="/#what-we-do" onClick={() => setIsClicked(false)}>
              {t('navbar.whatWeDo')}
            </Link>
          </li>
          <li>
            <Link to="/#technology" onClick={() => setIsClicked(false)}>
              {t('navbar.ourAiTechnology')}
            </Link>
          </li>
          {/* <li>
            <Link to="#story">OUR STORY</Link>
          </li> */}
          <li>
            <Link to="/contact-us" onClick={() => setIsClicked(false)}>
              {t('navbar.contactUs')}
            </Link>
          </li>
          <li>
            <Link
              to="/demos"
              onClick={() => setIsClicked(false)}
            >
              {t('navbar.tryDemo')}
            </Link>
          </li>
          </> : <>
          
          </>}
          
          {/* {(authData?.user?.role === "admin" ||
            authData?.user?.role === "facility") && (
            <li>
              <button
                className="contact-button"
                onClick={() => {
                  setIsClicked(false);
                  navigate("/admin/invite");
                }}
              >
                Invite user
              </button>
            </li>
          )} */}
          <li>{AuthButton()}</li>
          <li className="mobile-screen">
            <LanguageSwitcher />
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Navbar;