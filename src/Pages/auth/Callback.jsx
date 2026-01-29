import { Loader2 } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../Component/AuthProvider.jsx";
import { Button } from "../../Component/UI/button.jsx";
import { googleLogin, savePublicKey } from "../../api/user.service.js";
import {
  encryptData,
  setUserPublicKey,
  setupEncryption,
} from "../../utils/encryption.js";
import { logError, logInfo } from "../../utils/logger.js";

export default function Callback() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setAuthData } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleLogin = async () => {
      try {
        const code = searchParams.get("code");
        const inviteToken = localStorage.getItem("inviteToken");
        const type = localStorage.getItem("select-role") || "";

        if (!code) {
          logError("login failed", "No code parameter found in URL");
          setError(t('callback.noCodeError'));
          setIsLoading(false);
          return;
        }

        const userData = await googleLogin({ code, inviteToken, type });

        if (userData.error) {
          logError("login failed", userData.error);
          setError(true);
          setIsLoading(false);
          return;
        }
        logInfo("login success", userData);
        localStorage.removeItem("select-role");
        localStorage.setItem("token", userData.token);
        localStorage.setItem("email", userData.user.email);
        localStorage.setItem("phone_number", userData.user.phone_number);
        const encryptedData = await encryptData(userData.sub);
        localStorage.setItem("iv", encryptedData.iv);
        localStorage.setItem("salt", encryptedData.salt);
        localStorage.setItem("ciphertext", encryptedData.ciphertext);

        // localStorage.setItem("sub", userData.sub);
        const publicKey = await setupEncryption(userData.sub);
        setUserPublicKey(publicKey);
        await savePublicKey({ id: userData.user.id, publicKey });

        setAuthData(userData);

        // here also we need to check is first time or not
        // if first time then we need to redirect to consent page
        // if not then we need to redirect to dashboard
        // userdata willl have one more field called is_consent_given
        // if is_consent_given is false then we need to redirect to /consent page
        // if is_consent_given is true then we need to redirect to /patient/check-vitals

        if (userData.user.role === "user" && !userData.user.is_consent_given) {
          logInfo("redirecting to consent page");
          navigate("/consent");
          return;
        }

        const redirectPath =
          userData.user.role === "user"
            ? "/patient/check-vitals"
            : `/dashboard/${userData.user.first_name}`;

        if (userData.user.role === "user") {
          logInfo("redirecting to check vitals");
        } else {
          logInfo("redirecting to admin dashboard");
        }
        navigate(redirectPath);
      } catch (err) {
        logError("login failed", err.message);
        setError(true);
        setIsLoading(false);
      }
    };

    handleLogin();
  }, [searchParams, navigate, setAuthData]);

  return (
    <>
      {isLoading && (
        <div className="flex items-center justify-center min-h-80 bg-background space-x-1 h-[100vh]">
          <div>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          </div>
          <div>{t('callback.loggingIn')}</div>
        </div>
      )}
      {!isLoading && error && (
         <div className="flex items-center justify-center min-h-screen bg-background w-full">
         <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg">
           <div className="max-w-md mx-auto px-8 text-center">
             <div className="mb-6">
               <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                 </svg>
               </div>
               <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('callback.error.title')}</h2>
               <p className="text-gray-600 mb-6">{t('callback.error.message')}</p>
             </div>
             <div className="space-y-4">
               <Button
                 className="w-full cursor-pointer"
                 onClick={() => {
                   navigate("/login");

                 }}
                 style={{
                   backgroundColor: "#000000",
                   color: "#ffffff",
                   outline: "none",
                 }}
               >
                {t('callback.goBackToLogin')}
               </Button>
               <button
                 onClick={() => navigate("/contact-us")}
                 className="w-full text-gray-600 hover:text-gray-900"
               >
                 {t('callback.contactSupport')}
               </button>
             </div>
           </div>
         </div>
       </div>
      )}
    </>
  );
}