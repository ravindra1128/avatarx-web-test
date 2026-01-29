import { Button } from "../Component/Buttons/Button.jsx";
import { useGoogleLogin } from "@react-oauth/google";
import {useState} from "react";
import {Loader2} from "lucide-react";
import {Link} from "react-router-dom";
import { useTranslation } from "react-i18next";

export function LoginToContinue() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const login = useGoogleLogin({
    onSuccess: () => {},
    onError: () => {},
    onNonOAuthError: () => {},
    flow: "auth-code",
    ux_mode: "redirect",
    state: crypto.randomUUID(),
    select_account: true,
    redirect_uri: `${window.location.origin}/auth/callback`,
  });

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-card rounded-xl shadow-lg mb-16">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold">{t('loginToContinue.title')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('loginToContinue.subtitle')}
          </p>
        </div>
        <Button className="w-full cursor-pointer" onClick={() => {
          setIsLoading(true);
          login();
        }} disabled={isLoading} style={{ backgroundColor: '#000000', color: '#ffffff', outline: 'none' }}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <img
              src="/google-logo.webp"
              alt="Google"
              width={20}
              height={20}
              className="h-5 w-5 mr-2"

            />
          )}
          {t('loginToContinue.loginButton')}
        </Button>
        <div className="mt-2 text-sm text-muted-foreground">
          {t('loginToContinue.termsAgreement')} <br/>
          <Link to="/terms"><span className="text-blue-600">{t('loginToContinue.termsLink')}</span></Link>
        </div>
      </div>
    </div>
    </>
  );
}
