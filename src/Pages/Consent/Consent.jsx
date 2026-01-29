import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../../Component/Buttons/Button";
import Loader from "../../Component/Loader";
import { Input } from "../../Component/UI/input";
import apiClient from "../../config/APIConfig";

export default function ConsentPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userEmail = localStorage.getItem("email");
    const userPhone = localStorage.getItem("phone_number");
    if (userEmail) {
      setEmail(userEmail);
    }
    if (userPhone) {
      // Remove +91 if present

      const cleanedPhone = userPhone
        .replace(/^(\+91|91)/, "")
        .replace(/\D/g, "");

      // Now format if it's a 10-digit number
      // const formattedPhone = cleanedPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');

      setPhoneNumber(cleanedPhone);
    }
  }, []);

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const handleSubmit = () => {
    if (phoneNumber.length === 10 && acceptedTerms) {
      setIsLoading(true);
      apiClient
        .put("/user/consent", {
          phone_number: phoneNumber,
        })
        .then((res) => {
          if (res.status === 200) {
            navigate("/patient/check-vitals");
          }
        })
        .catch((err) => {})
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const formattedPhoneNumber = phoneNumber
    ? phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3")
    : "";

  return (
    <div className="flex items-center justify-center flex-col min-h-screen bg-white w-full">
      <div className="w-full max-w-md space-y-6 p-8 bg-white rounded-xl shadow-lg mb-16">
        <div className="max-w-md mx-auto px-8">
          <h2 className="text-3xl font-bold text-center">{t('consent.title')}</h2>
          {isLoading && <Loader />}
          <div className="mt-8">
            <label
              htmlFor="email"
              className="text-left block text-sm font-medium text-black"
            >
              {t('consent.emailAddress')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <img
                  src="/images/google.png"
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                <span className="text-gray-500">-</span>
              </div>
              <Input
                type="email"
                id="email"
                placeholder={t('consent.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={true}
                className="pl-20 focus:ring-1 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="phone"
              className="text-left block text-sm font-medium text-black"
            >
              {t('consent.phoneNumber')}
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center">
                <img src="/images/us.webp" alt="US" className="w-5 h-4 mr-2" />
                <span className="text-gray-500">+1</span>
              </div>
              <Input
                type="tel"
                id="phone"
                className="pl-20 focus:ring-1 focus:ring-black focus:border-transparent"
                placeholder={t('consent.phonePlaceholder')}
                value={phoneNumber}
                onChange={handlePhoneChange}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-black focus:ring-1 focus:ring-black"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
              />
              <span className="ml-2 text-sm text-muted-foreground text-left">
                {t('consent.consentText')}
              </span>
            </label>
          </div>

          <Button
            className="w-full mt-6 cursor-pointer"
            disabled={phoneNumber.length !== 10 || !acceptedTerms}
            onClick={handleSubmit}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              outline: "none",
            }}
          >
            {t('consent.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}
