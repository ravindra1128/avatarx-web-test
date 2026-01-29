import React, { lazy, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../Component/AuthProvider.jsx";
import Loader from "../../../Component/Loader";
const ShenAi = lazy(() => import("../shenai/page.jsx"));
const ShenAiV2 = lazy(() => import("../face-scan/page.jsx"));

export default function ShenAiWithToken() {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const { authData, authLoading, setAuthData } = useContext(AuthContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/continue-login");
      return;
    }

    // Handle auth data from navigation state
    if (state?.authData) {
      setAuthData(state.authData);
      setIsAuthenticated(true);
      return;
    }

    if (
      !authLoading &&
      !authData?.user &&
      pathname === "/patient/check-vitals"
    ) {
      localStorage.setItem("navigateTo", "/check-vitals");
      navigate("/continue-login");
    } else if (
      !authLoading &&
      authData?.user &&
      (pathname === "/patient/check-vitals" ||
        pathname === "/patient/check-vitals_v2")
    ) {
      setIsAuthenticated(true);
    }
  }, [authLoading, state]);

  return (
    <div>
      {isAuthenticated ? (
        pathname.includes("_v2") ? (
          <ShenAiV2 />
        ) : (
          <ShenAi />
        )
      ) : (
        <Loader />
      )}
    </div>
  );
}
