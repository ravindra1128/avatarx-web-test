import { useGoogleLogin } from "@react-oauth/google";
import { Loader2, User } from "lucide-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import OTPInput from "react-otp-input";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../Component/AuthProvider";
import { Button } from "../../Component/Buttons/Button";
import { Input } from "../../Component/UI/input";
import apiClient from "../../config/APIConfig";
import { encryptData, jwtDecode } from "../../utils/encryption";
import { logCritical, logInfo } from "../../utils/logger";
import TermsModal from "./TermsModal";
import { flushSync } from "react-dom";


const STEPS = {
  LANGUAGE_SELECTION: "language_selection",
  ROLE_SELECTION: "role_selection",
  INVITE_CONSENT: "invite_consent",
  OTP_VERIFICATION: "otp_verification",
};

const CONSENT_PHONE_NUMBER_STORAGE_KEY = "phone_number";
const LANGUAGE_STORAGE_KEY = "selected_language";

export default function SignInPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const routerLocation = useLocation();
  const [isInvitationMode, setIsInvitationMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginMethod, setLoginMethod] = useState("phone");
  const [mobileNumber, setMobileNumber] = useState(
    localStorage.getItem(CONSENT_PHONE_NUMBER_STORAGE_KEY) || ""
  );
  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
  });
  const selectedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

  const [consentChecked, setConsentChecked] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isConsentError, setIsConsentError] = useState(false);
  const [selectedLanguageState, setSelectedLanguageState] = useState(selectedLanguage || "");
  const [languageSaved, setLanguageSaved] = useState(!!selectedLanguage);
  const { setAuthData } = useContext(AuthContext);
  const otpCaptureRef = useRef(null);

  const isIOS = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }, []);

  // Get current step from URL params, but only for OTP step
  const urlStep = searchParams.get("step");
   const inviteToken = useMemo(() => {
    // invite token is the last part of the path
    const pathParts = routerLocation.pathname.split("/");
    // check if it's a valid jwt token
    const token = pathParts[pathParts.length - 1];
    const decodedToken = jwtDecode(token);
    if (decodedToken) {
      return token;
    }
    return null;
  }, [routerLocation]);

  const currentStep = useMemo(() => {
    // If URL has OTP step, use it
    if (urlStep === STEPS.OTP_VERIFICATION) {
      return STEPS.OTP_VERIFICATION;
    }
    
    // Otherwise, determine step based on language and URL path
    if (!selectedLanguage && !languageSaved) {
      return STEPS.LANGUAGE_SELECTION;
    }
    
    const pathname = routerLocation.pathname;
    
    // Handle invite token flow
    if (inviteToken) {
      return STEPS.INVITE_CONSENT;
    }
    
    // Handle /login/patient and /login/provider routes
    if (pathname === "/login/patient" || pathname === "/login/patient/" || pathname === "/login/provider" || pathname === "/login/provider/") {
      return STEPS.INVITE_CONSENT;
    }
    
    // Default to role selection for other login routes
    return STEPS.ROLE_SELECTION;
  }, [urlStep, selectedLanguage, languageSaved, routerLocation.pathname, inviteToken]);

  const handleStepChange = (newStep) => {
    // Only add URL param for OTP step
    if (newStep === STEPS.OTP_VERIFICATION) {
      const params = new URLSearchParams(searchParams);
      params.set("step", newStep);
      setSearchParams(params);
    } else {
      // Remove step param for other steps
      const params = new URLSearchParams(searchParams);
      params?.delete("step");
      setSearchParams(params);
    }
  };

  const languages = [
    { key: "en", label: "English" },
    { key: "es", label: "Español" },
  ];

  const roles = [
    { key: "user", label: t('login.roleSelection.patient') },
    { key: "facility", label: t('login.roleSelection.provider') },
  ];

  // Initialize language from localStorage
  useEffect(() => {
    if (selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  // Handle role setting and invite token flow
  useEffect(() => {
    const pathname = routerLocation.pathname;
    
    // Handle /login/patient and /login/provider routes
    if (pathname === "/login/patient" || pathname === "/login/patient/" || pathname === "/login/provider" || pathname === "/login/provider/") {
      const isProvider = pathname === "/login/provider" || pathname === "/login/provider/";
      setRole(isProvider ? "facility" : "user");
    }
    
    // Handle invite token flow
    if (inviteToken && (selectedLanguage || languageSaved)) {
      setIsInvitationMode(true);
      handleInviteTokenFlow();
    }
  }, [routerLocation.pathname, inviteToken, selectedLanguage, languageSaved]);

  const handleLanguageSelect = (languageKey) => {
    console.log("Language selected:", languageKey);
    setSelectedLanguageState(languageKey);
    // Don't save to localStorage yet - only save when continue is clicked
    i18n.changeLanguage(languageKey);
  };

  const handleLanguageContinue = () => {
    // Only proceed if a language is actually selected
    if (selectedLanguageState) {
      // Save to localStorage only when continue is clicked
      localStorage.setItem(LANGUAGE_STORAGE_KEY, selectedLanguageState);
      localStorage.setItem("userLanguage", selectedLanguageState);
      
      // Set language saved state to trigger step change
      setLanguageSaved(true);
    }
  };

  // const login = useGoogleLogin({
  //   onSuccess: (tokenResponse) => {
  //     logInfo("Google Login Success:", tokenResponse);
  //     setIsLoading(false);
  //   },
  //   onError: (error) => {
  //     setIsLoading(false);
  //     logError("Google Login Failed:", error);
  //     setLoginError(t('login.errors.googleLoginFailed'));
  //   },
  //   onNonOAuthError: (error) => {
  //     setIsLoading(false);
  //     logError("Google Login Failed:", error);
  //   },
  //   flow: "auth-code",
  //   ux_mode: "redirect",
  //   state: crypto.randomUUID(),
  //   select_account: true,
  //   redirect_uri: `${location.origin}/auth/callback`,
  // });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Enhanced Web OTP API auto-retrieval with Android-specific optimizations
  useEffect(() => {
    if (currentStep !== STEPS.OTP_VERIFICATION || loginMethod !== "phone") return;

    let abortController;
    try {
      // Only attempt if browser supports OTPCredential and Credentials API
      if (typeof window !== "undefined" && "OTPCredential" in window && navigator?.credentials?.get) {
        abortController = new AbortController();
        
        // Enhanced options for better compatibility
        const otpOptions = {
          otp: { 
            transport: ["sms"],
            // Add hint for better SMS recognition across all browsers
            hint: "AvatarX verification code"
          }, 
          signal: abortController.signal 
        };

        navigator.credentials
          .get(otpOptions)
          .then((content) => {
            const code = content?.code ? String(content.code).replace(/\D/g, "").slice(0, 4) : "";
            if (code && code.length === 4) {
              setOtp(code);
              // Optional: Auto-submit after successful auto-fill (uncomment if desired)
              // setTimeout(() => handleVerifyOtp(), 500);
            }
          })
          .catch((error) => {
            console.log("OTP auto-fill failed:", error);
            // Silently ignore (user might type manually)
          });

        // Reduced timeout for better UX (30 seconds instead of 60)
        setTimeout(() => abortController?.abort?.(), 30000);
      }
    } catch (error) {
      console.log("OTP API not supported:", error);
    }

    return () => {
      try { abortController?.abort?.(); } catch (_) {}
    };
  }, [currentStep, loginMethod]);

  // Allow quick paste of the code from clipboard
  useEffect(() => {
    if (currentStep !== STEPS.OTP_VERIFICATION) return;

    const onPaste = (e) => {
      try {
        const pasted = (e.clipboardData?.getData("Text") || "").toString();
        const digits = pasted.replace(/\D/g, "").slice(0, 4);
        if (digits.length === 4) {
          e.preventDefault();
          setOtp(digits);
        }
      } catch (_) {
        // ignore
      }
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [currentStep]);

  // On iOS, focus a hidden capture input to trigger the AutoFill bar
  useEffect(() => {
    if (currentStep !== STEPS.OTP_VERIFICATION) return;
    if (!isIOS) return;
    const focusTimer = setTimeout(() => {
      try { otpCaptureRef.current?.focus?.(); } catch (_) {}
    }, 0);
    return () => clearTimeout(focusTimer);
  }, [currentStep, isIOS]);

  const handleInviteTokenFlow = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/invite/get-mobile", {
        token: inviteToken,
      });
      // Remove +1 prefix if present and any non-digit characters
      const phoneNumber =
        response.data?.data?.phone_number
          ?.replace(/^\+1/, "")
          .replace(/\D/g, "") || "";
      setMobileNumber(phoneNumber);
      setUserDetails({
        firstName: response.data?.data?.first_name || "",
        lastName: response.data?.data?.last_name || "",
      });
      handleStepChange(STEPS.INVITE_CONSENT);
    } catch (err) {
      logCritical("Error getting mobile number", err);
      setError({
        title: t('login.errors.noAccess'),
        message: t('login.errors.noAccessMessage'),
        type: "invite_error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentSubmit = async () => {
    if (!consentChecked) {
      setIsConsentError(true);
      return;
    }
    // if (mobileNumber.length !== 10) {
    //   setOtpError("Please enter a valid 10-digit US mobile number");
    //   return;
    // }
    try {
      setIsLoading(true);
      await handleSendOtp(mobileNumber);
      handleStepChange(STEPS.OTP_VERIFICATION);
    } catch (err) {
      logCritical("Error sending OTP", err);
      setOtpError(
        err?.response?.data?.message ||
        t('login.errors.otpSendFailed')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (phone_number) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/user/send_patient_otp", {
        phone_number: `+1${phone_number}`,
        role,
      });
      setOtpSent(true);
      setCountdown(60);
      setOtpError(null);
      setIsInvitationMode(false);
      handleStepChange(STEPS.OTP_VERIFICATION);
    } catch (err) {
      setOtpError(
        err?.response?.data?.error || t('login.errors.otpSendFailedGeneric')
      );
      logCritical("Error sending OTP", err);
      toast.error(
        err?.response?.data?.error ||
        t('login.errors.otpSendFailed')
      );
      handleStepChange(STEPS.INVITE_CONSENT);
      // Only show error screen for invited users
      if (inviteToken) {
        logCritical("Error sending OTP", err);
        setError({
          title: t('login.errors.unableToSendCode'),
          message:
            err?.response?.data?.message ||
            t('login.errors.otpSendFailed'),
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.post("/user/verify_patient_otp", {
        phone_number: loginMethod === "phone" ? `+1${mobileNumber}` : null,
        email: loginMethod === "email" ? email : null,
        otp,
        role,
      });
      const { data } = response;
      
      const isFacility = data.user.role === "facility";
      const slug = isFacility ? data.user.facility_slug : data.user.patient_slug;
  
      // 1) Persist first
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("token", data.token);
      localStorage.setItem("phone_number", data.user.phone_number ?? "");
      localStorage.setItem("patient_slug", data.user.patient_slug ?? "");
      localStorage.setItem("facility_slug", data.user.facility_slug ?? "");
  
      const encryptedData = await encryptData(data.user.sub);
      localStorage.setItem("iv", encryptedData.iv);
      localStorage.setItem("salt", encryptedData.salt);
      localStorage.setItem("ciphertext", encryptedData.ciphertext);
      localStorage.setItem("userData", JSON.stringify(data.user));
  
      // 2) Synchronously commit context so guards see it
      flushSync(() => {
        setAuthData({
          ...data,
          slug,
          userFacilitySlug: data.user.facility_slug,
        });
      });
  
      // 3) Now navigate (no arbitrary timeout)
      const params = new URLSearchParams(searchParams);
      params.delete("step");
      setSearchParams(params);
  
      navigate(
        data.user.role === "user"
          ? "/patient/dashboard"
          : data.user.role === "admin"
            ? "/super-admin/dashboard"
            : `/dashboard/${slug}`,
        { state: { authData: { ...data, slug } }, replace: true }
      );
    } catch (err) {
      if(err?.response?.status !== 401 && err?.response?.status !== 404 && err?.response?.status !== 400) {
        logCritical("Error verifying OTP", err);
      }
      setOtpError(err?.response?.data?.message || "Invalid Verification Code");
    } finally {
      setIsLoading(false);
    }
  };
  const handleMobileSubmit = async (data) => {
    if (loginMethod === "phone") {
      if (!mobileNumber) {
        setOtpError(t('login.mobileInput.mobileRequired'));
        return;
      }

      localStorage.setItem(CONSENT_PHONE_NUMBER_STORAGE_KEY, mobileNumber);

      // Remove any non-digit characters for validation
      const cleanNumber = mobileNumber.replace(/\D/g, "");

      // Validate US phone number (10 digits)
      if (cleanNumber.length !== 10) {
        setOtpError(t('login.mobileInput.validMobileNumber'));
        return;
      }

      try {
        setIsLoading(true);
        const payload = {
          role,
          phone_number: `+1${cleanNumber}`, // Add US country code
        };

        const response = await apiClient.post(
          "/user/send_patient_otp",
          payload
        );
        setOtpSent(true);
        setCountdown(60);
        setOtpError(null);
        handleStepChange(STEPS.OTP_VERIFICATION);
      } catch (err) {
        logCritical("Error sending OTP", err);
        setError({
          title: t('login.errors.noAccess'),
          message: t('login.errors.noAccessMessage'),
          type: "otp_error",
        });
        setOtpError(
          err?.response?.data?.error || t('login.errors.otpSendFailedGeneric')
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!email) {
        setOtpError(t('login.mobileInput.emailRequired'));
        return;
      }

      if (!consentChecked) {
        setIsConsentError(true);
        return;
      }

      try {
        setIsLoading(true);
        const payload = {
          role,
          email,
        };

        const response = await apiClient.post(
          "/user/send_patient_otp",
          payload
        );
        setOtpSent(true);
        setCountdown(60);
        setOtpError(null);
        handleStepChange(STEPS.OTP_VERIFICATION);
      } catch (err) {
        logCritical("Error sending OTP", err);
        setError({
          title: t('login.errors.noAccess'),
          message: t('login.errors.noAccessMessage'),
          type: "otp_error",
        });
        setOtpError(
          err?.response?.data?.error || t('login.errors.otpSendFailedGeneric')
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setMobileNumber(value);
      setOtpError(null); // Clear error when user types
    }
  };

  const formatPhoneNumber = (number) => {
    const cleaned = number.replace(/\D/g, "");
    // Take only last 10 digits if longer
    const last10Digits = cleaned.slice(-10);
    const match = last10Digits.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return number;
  };

  const renderLanguageSelection = () => (
    <div className="flex items-center justify-center flex-col min-h-screen bg-background w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg mb-16">
        <div className="max-w-md mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold">{t('login.languageSelection.welcome')}</h2>
          <p className="font-normal text-sm">{t('login.languageSelection.title')}</p>
          <div className="grid grid-cols-2 gap-6 mt-8 px-3">
            {languages.map(({ key, label }) => (
              <div
                key={key}
                className={`rounded-xl py-4 px-4 border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:shadow-md ${selectedLanguageState === key ? "border-black bg-gray-50" : "border-gray-200"
                  }`}
                onClick={() => handleLanguageSelect(key)}
              >
                <span
                  className={`text-base font-medium ${selectedLanguageState === key ? "text-black" : "text-gray-500"
                    }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full cursor-pointer"
          onClick={handleLanguageContinue}
          disabled={!selectedLanguageState}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            outline: "none",
          }}
        >
          {t('login.languageSelection.continue')}
        </Button>
      </div>
    </div>
  );

  const renderMobileInput = () => (
    <div className="flex items-center justify-center min-h-screen bg-background w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-md mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold mb-1">{t('login.mobileInput.title')}</h2>
          <div className="space-y-4 text-left">
            <div>
              <div className="text-center mb-10">
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('login.mobileInput.signingAs')}{" "}
                  <span className="font-semibold text-primary">{role === "user" ? t('login.roleSelection.patient') : t('login.roleSelection.provider')}</span>
                </p>
              </div>
              {role !== "user" && (
                <div className="flex justify-center gap-4 mb-4 w-full">
                  <button
                    className={`flex-1 px-4 py-2 text-center cursor-pointer rounded-md whitespace-nowrap ${loginMethod === "phone"
                        ? "bg-black text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    onClick={() => setLoginMethod("phone")}
                  >
                    {t('login.mobileInput.phone')}
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 text-center cursor-pointer rounded-md whitespace-nowrap ${loginMethod === "email"
                        ? "bg-black text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    onClick={() => setLoginMethod("email")}
                  >
                    {t('login.mobileInput.email')}
                  </button>
                </div>
              )}

              {loginMethod === "phone" ? (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.mobileInput.mobileNumberLabel')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <span className="text-gray-500">+1</span>
                    </div>
                    <Input
                      type="tel"
                      id="phone"
                      className="w-full bg-white h-[42px] !rounded-sm !border !border-black-800 pl-10"
                      placeholder={t('login.mobileInput.mobileNumberPlaceholder')}
                      value={formatPhoneNumber(mobileNumber)}
                      onChange={handlePhoneChange}
                      maxLength={14}
                      autoComplete="off"
                    />
                  </div>
                </>
              ) : (
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('login.mobileInput.emailLabel')}
                  </label>
                  <Input
                    type="email"
                    id="email"
                    className="w-full bg-white h-[42px] !rounded-sm !border !border-black-800"
                    placeholder={t('login.mobileInput.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="off"
                  />
                </>
              )}
            </div>
            <div className="mt-6">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-black focus:ring-1 focus:ring-black"
                  checked={consentChecked}
                  onChange={(e) => {
                    setConsentChecked(e.target.checked);
                    setOtpError(null); // Clear error when checkbox is toggled
                    if (!e.target.checked) {
                      setIsConsentError(true);
                    } else {
                      setIsConsentError(false);
                    }
                  }}
                />
                <span className="ml-2 text-sm text-muted-foreground text-left">
                  {loginMethod === "email" ? (
                    <>
                      {t('login.mobileInput.emailConsent')}
                    </>
                  ) : (
                    <>
                      {t('login.mobileInput.phoneConsent')}{" "}
                      <span
                        onClick={() => setShowTermsModal(true)}
                        className="text-sm w-full text-muted-foreground text-center text-blue-600 cursor-pointer"
                      >
                        {t('login.mobileInput.termsAndConditions')}
                      </span>{" "}
                      {t('login.mobileInput.phoneConsentEnd')}
                    </>
                  )}
                </span>
              </label>
            </div>
          </div>

          <Button
            className="w-full mt-6 cursor-pointer"
            onClick={handleMobileSubmit}
            disabled={
              isLoading ||
              isConsentError ||
              (loginMethod === "phone" &&
                mobileNumber.replace(/\D/g, "").length !== 10) ||
              (loginMethod === "email" && (!email || !email.includes("@")))
            }
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              outline: "none",
            }}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              t('login.mobileInput.continue')
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderRoleSelection = () => (
    <div className="flex items-center justify-center flex-col min-h-screen bg-background w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg mb-16">
        <div className="max-w-md mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold">{t('login.roleSelection.title')}</h2>
          <p className="font-normal text-sm">{t('login.roleSelection.subtitle')}</p>
          <div className="grid grid-cols-2 gap-6 mt-8 px-3">
            {roles.map(({ key, label }) => (
              <div
                key={key}
                className={`rounded-xl py-4 px-4 border transition-all cursor-pointer flex flex-col items-center justify-center gap-2 hover:shadow-md ${role === key ? "border-black bg-gray-50" : "border-gray-200"
                  }`}
                onClick={() => setRole(key)}
              >
                <User
                  stroke={role === key ? "black" : "gray"}
                  className="w-10 h-10"
                />
                <span
                  className={`text-base font-medium ${role === key ? "text-black" : "text-gray-500"}
                    mb-2`} // Add margin-bottom for spacing
                  style={{ marginBottom: '8px', display: 'block' }} // Ensure spacing is applied
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="mt-2 text-sm text-muted-foreground">
            {t('login.roleSelection.signingAs')} <strong>{role === "user" ? t('login.roleSelection.patient') : t('login.roleSelection.provider')}</strong> to access your account
          </p>
        </div>

        <Button
          className="w-full cursor-pointer"
          onClick={() => {
            setIsInvitationMode(false);
            navigate( role === "user" ? "/login/patient" : "/login/provider");
          }}
          disabled={isLoading}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            outline: "none",
          }}
        >
          {t('login.roleSelection.continue')}
        </Button>

        <div className="mt-2 text-sm text-muted-foreground">
          {t('login.roleSelection.termsAgreement')} <br />
          {/* <Link to="/terms"> */}
          <span className="text-blue-600 cursor-pointer" onClick={() => setShowTermsModal(true)}>{t('login.roleSelection.termsLink')}</span>
          {/* </Link> */}
        </div>
      </div>
    </div>
  );

  const renderOtpVerification = () => (
    <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg mb-16">
      <div className="max-w-md mx-auto px-8 text-center">
        <h2 className="text-3xl font-bold">{t('login.otpVerification.title')}</h2>
        <p className="font-normal text-sm mt-2">
          {loginMethod === "email" ? t('login.otpVerification.subtitleEmail') : t('login.otpVerification.subtitle')}
        </p>
          <p className="font-medium text-base mt-1 text-gray-700">
            { loginMethod === "phone" ? mobileNumber : email}
          </p>
        <div className="mt-6">
          {/* iOS-friendly capture input (focusable, visually hidden off-screen) */}
          <input
            ref={otpCaptureRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="One-time code"
            value={otp}
            onChange={(e) => {
              const digits = (e.target.value || "").replace(/\D/g, "").slice(0, 4);
              setOtp(digits);
            }}
            style={{
              position: 'absolute',
              left: '-10000px',
              top: 'auto',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
            tabIndex={-1}
          />
          <div className="flex justify-center mb-4">
            <OTPInput
              value={otp}
              onChange={setOtp}
              numInputs={4}
              renderSeparator={<span className="mx-2" />}
              renderInput={(props) => (
                <input
                  {...props}
                  className="!w-16 h-16 text-center text-2xl border-2 border-gray-300 rounded-md focus:border-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="\d{4}"
                  data-testid="otp-input"
                  aria-label="Enter verification code"
                  maxLength="4"
                  onFocus={(e) => e.target.select()}
                  name="otp"
                />
              )}
              inputType="number"
              shouldAutoFocus
            />
          </div>
          {otpError && <p className="text-red-500 text-sm mt-2">{otpError}</p>}
          <Button
            className="w-full mt-4 cursor-pointer"
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length !== 4}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              outline: "none",
            }}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              t('login.otpVerification.verifyCode')
            )}
          </Button>
          <div className="mt-4">
            <p className="text-sm text-gray-600">
              {t('login.otpVerification.didntReceive')}{" "}
              <button
                onClick={() => handleSendOtp(mobileNumber)}
                disabled={countdown > 0}
                className={`text-sm text-blue-600 cursor-pointer ${countdown > 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {countdown > 0 ? `${t('login.otpVerification.resendIn')} ${countdown}s` : t('login.otpVerification.resend')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInviteConsent = () => {
    // if (isLoading) {
    //   return <Loader />;
    // }

    return (
      <div className="flex items-center justify-center min-h-screen bg-background w-full">
        <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg">
          <div className="max-w-md mx-auto px-8 text-center">
            <h2 className="text-3xl font-bold mb-6">{t('login.inviteConsent.title')}</h2>
            <div className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.inviteConsent.name')}
                </label>
                <Input
                  type="text"
                  value={`${userDetails.firstName} ${userDetails.lastName}`}
                  disabled
                  className="w-full bg-gray-50 h-[42px] !rounded-sm !border ! border-black-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.inviteConsent.mobileNumber')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <span className="text-gray-500">+1</span>
                  </div>
                  <Input
                    type="tel"
                    id="phone"
                    className="w-full bg-gray-50 h-[42px] !rounded-sm !border !border-black-800 pl-10"
                    placeholder={t('login.inviteConsent.phonePlaceholder')}
                    value={formatPhoneNumber(mobileNumber)}
                    disabled={true}
                  />
                </div>
                {otpError && !otpError.includes("terms and conditions") && (
                  <p className="text-red-500 text-sm mt-2">{otpError}</p>
                )}
                {/* <p className="text-sm text-gray-500 mt-1">
                  Enter a valid 10-digit US mobile number
                </p> */}
              </div>
              <div className="mt-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className={`rounded border-gray-300 text-black focus:ring-1 focus:ring-black ${otpError && !consentChecked ? "border-red-500" : ""
                      }`}
                    checked={consentChecked}
                    onChange={(e) => {
                      setConsentChecked(e.target.checked);
                      setOtpError(null);
                      if (!e.target.checked) {
                        setIsConsentError(true);
                      } else {
                        setIsConsentError(false);
                      }
                    }}
                  />
                  <span className="ml-2 text-sm text-muted-foreground text-left">
                    {t('login.inviteConsent.consentText')}
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-6">
              <Button
                className="w-full cursor-pointer"
                onClick={handleConsentSubmit}
                disabled={isLoading}
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  outline: "none",
                }}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  t('login.inviteConsent.submit')
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderOtpError = () => (
    <div className="flex items-center justify-center min-h-screen bg-background w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg">
        <div className="max-w-md mx-auto px-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {error.title}
            </h2>
            <p className="text-gray-600 mb-6">{error.message}</p>
          </div>
          <div className="space-y-4">
            <Button
              className="w-full cursor-pointer mb-4"
              onClick={() => {
                setError(null);
                if (inviteToken) {
                  handleInviteTokenFlow();
                } else {
                  handleStepChange(STEPS.INVITE_CONSENT);
                }
              }}
              style={{
                backgroundColor: "#000000",
                color: "#ffffff",
                outline: "none",
              }}
            >
              {t('login.mobileInput.goBackToLogin')}
            </Button>
            {/* <button
              onClick={() => navigate("/contact-us")}
              className="w-full text-gray-600 hover:text-gray-900"
            >
              Contact Support
            </button> */}
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentStep) {
      case STEPS.LANGUAGE_SELECTION:
        return renderLanguageSelection();
      case STEPS.ROLE_SELECTION:
        return renderRoleSelection();
      case STEPS.INVITE_CONSENT:
        return isInvitationMode ? renderInviteConsent() : renderMobileInput();
      case STEPS.OTP_VERIFICATION:
        return renderOtpVerification();
      default:
        return renderRoleSelection();
    }
  };

  if (error) {
    return renderOtpError();
  }

  return (
    <div className="flex items-center justify-center flex-col min-h-screen bg-background w-full">
      {renderContent()}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </div>
  );
}
