import { useGoogleLogin } from '@react-oauth/google';
import { Button } from "../../Component/Buttons/Button";
import { logInfo } from "../../utils/logger";
const GoogleLogin = () => {
  const login = useGoogleLogin({
    onSuccess: codeResponse => logInfo("google login success",codeResponse),
    flow: 'auth-code',
  });

  return (
    <Button
      className="w-full"
      onClick={() => login()}
      variant="outline"
    >
      <img
        src="/google.svg"
        alt="Google"
        width={20}
        height={20}
        className="h-5 w-5 mr-2"
      />
      Sign in with Google
    </Button>
  );
};

export default GoogleLogin;
