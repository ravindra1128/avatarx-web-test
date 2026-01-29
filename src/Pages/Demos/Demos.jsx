import { useGoogleLogin } from "@react-oauth/google";
import { Video, Flame, Camera } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../../Component/AuthProvider.jsx";
import caloriesCount from "../../../public/calories.jpg";
import medicalCheckin from "../../../public/mobile-health-care-idea-modern-technology-check-heart_277904-4220.avif";

export default function Demos() {
  const { t } = useTranslation();
  const { authData } = useContext(AuthContext);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (authData) {
      setToken(authData.accessToken);
    }
  }, [authData]);

  // const login = useGoogleLogin({
  //   onSuccess: (tokenResponse) => {},
  //   onError: (error) => {
  //     console.error("Google Login Failed:", error);
  //     setLoginError("Google login failed. Please try again.");
  //   },
  //   onNonOAuthError: (error) => {
  //     console.error("Google Login Failed:", error);
  //   },
  //   flow: "auth-code",
  //   ux_mode: "redirect",
  //   state: crypto.randomUUID(),
  //   select_account: true,
  //   redirect_uri: `${location.origin}/auth/callback`,
  // });

  const handleDemoClick = async () => {
    navigate("/demos/medical-checkin");
  };

  const handleCaloriesDemoClick = async () => {
    navigate("/demos/calories-count");
  };

  return (
    <div className="container mx-auto py-8 pt-[40px] lg:pt-[90px] mt-8 px-4">
      {/* Header Section */}
      <div className="text-center mb-4">
        <h1 className="!text-3xl md:!text-4xl text-[#111827] font-bold mb-4">
          {t('demos.title')}
        </h1>
        {/* <p className="text-[#111827] text-lg max-w-2xl mx-auto">
          {t('demos.description')}
        </p> */}
      </div>

      {/* Demo Cards Section */}
      <section className="grid md:grid-cols-2 gap-8 w-full max-w-screen-xl mx-auto">
        {/* Medical Checkin Demo */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <img
              src={medicalCheckin}
              alt="Medical Checkin"
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-[#111827] mb-3">
              {t('demos.medicalCheckin.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('demos.medicalCheckin.description')}
            </p>
            <button
              className="cursor-pointer flex items-center !bg-[#111827] !border-[#111827] hover:!border-[#111827e6] !transition-all !duration-300 transition-colors hover:!bg-[#111827e6] text-white justify-center px-6 rounded-lg text-base w-full h-12"
              onClick={handleDemoClick}
            >
              <Video className="mr-2 h-5 w-5" />
              {t('demos.medicalCheckin.tryDemo')}
            </button>
          </div>
        </div>

        {/* Calories Count Demo */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
          <div className="aspect-video bg-gray-100 flex items-center justify-center">
            <img
              src={caloriesCount}
              alt="Calories Count Demo"
              className="max-w-full max-h-full object-contain"
              loading="lazy"
            />
          </div>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-[#111827] mb-3">
              {t('demos.caloriesCount.title')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('demos.caloriesCount.description')}
            </p>
            <button
              className="cursor-pointer flex items-center !bg-[#111827] !border-[#111827] hover:!border-[#111827e6] !transition-all !duration-300 transition-colors hover:!bg-[#111827e6] text-white justify-center px-6 rounded-lg text-base w-full h-12"
              onClick={handleCaloriesDemoClick}
            >
              <Flame className="mr-2 h-5 w-5" />
              {t('demos.caloriesCount.tryDemo')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}