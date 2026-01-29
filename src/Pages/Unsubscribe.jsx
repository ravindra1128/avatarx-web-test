import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import apiClient from "../config/APIConfig";
import Loader from "../Component/Loader";

const Unsubscribe = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unsubscribed, setUnsubscribed] = useState(false);

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setError(t('unsubscribe.emailRequired'));
      return;
    }

    setIsLoading(true);
    apiClient.post("/user/unsubscribe", { token, email })
      .then((response) => {
        setUnsubscribed(true);
        setError(null);
        // toast.success(response.data.message);
      })
      .catch((error) => {
        const errorMessage = error?.response?.data?.error || t('unsubscribe.internalServerError');
        setError(errorMessage);
        // toast.error(errorMessage);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {isLoading ? (
        <Loader />
      ) : (
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {t('unsubscribe.title')}
          </h1>
          {unsubscribed ? (
            <>
              <div className="text-green-600 text-5xl mb-4">{t('unsubscribe.success.icon')}</div>
              <p className="text-gray-600 mb-6">
                {t('unsubscribe.success.message')}
              </p>
            </>
          ) : (
            <>
              <div className="text-red-600 text-5xl mb-4">{t('unsubscribe.error.icon')}</div>
              <p className="text-red-600 mb-6">
                {error || t('unsubscribe.error.message')}
              </p>
            </>
          )}
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('unsubscribe.returnHome')}
          </button>
        </div>
      )}
    </div>
  );
};

export default Unsubscribe;
