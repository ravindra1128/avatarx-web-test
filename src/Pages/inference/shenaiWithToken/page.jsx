import React, { lazy, useContext, useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getUserInfoFromToken } from "../../../api/user.service";
import { AuthContext } from "../../../Component/AuthProvider";
import Loader from "../../../Component/Loader";
import Login from "../../Login/Login";
const ShenAi = lazy(() => import("../shenai/page.jsx"));

export default function ShenAiWithToken() {
  const { token } = useParams();
  const location = useLocation();
  const { authData, setAuthData } = useContext(AuthContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // const login = useGoogleLogin({
  //   onSuccess: () => {},
  //   onError: () => {},
  //   onNonOAuthError: () => {},
  //   flow: "auth-code",
  //   ux_mode: "redirect",
  //   state: crypto.randomUUID(),
  //   select_account: true,
  //   redirect_uri: `${window.location.origin}/auth/callback`,
  // });

  const authenticateUser = async (token) => {
    try {
      // setIsLoggingIn(true);
      const userData = authData;
      const user = await getUserInfoFromToken(token, userData?.user);
      // if (user?.id) {
      if (userData?.user?.email) {
        const newData = {
          user: { phone_number: user?.phone_number, ...userData?.user },
          token: userData?.token,
        };
        localStorage.setItem("token", newData?.token);
        setAuthData(newData);
        setIsAuthenticated(true);
      } else {
        localStorage.setItem("navigateTo", location.pathname + location.search);
      }
      // }
    } catch (error) {
      console.log(error);
    } finally {
      // setIsLoggingIn(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("inviteToken", token);
      authenticateUser(token);
    }
  }, []);

  return (
    <div>
      {isLoading && <Loader />}
      {isAuthenticated ? (
        <ShenAi />
      ) : (
        <Login />
        // <>{isLoggingIn ? <div className="text-center flex justify-center items-center h-screen">Logging in...</div> : <Login />}</>
      )}
    </div>
  );
}
