import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "../Component/Buttons/Button.jsx";

const AccessDenied = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <div className="flex flex-col justify-center items-center min-h-72 space-y-3 h-[100vh]">
        <div>{t("login.accessDenied.title")}</div>
        <div className={"cursor-pointer bg-black text-white rounded-md"}>
          <Button
            className="cursor-pointer"
            type="primary"
            onClick={() => navigate("/")}
          >
            {t("login.accessDenied.contactUs")}
          </Button>
        </div>
      </div>
    </>
  );
};

export default AccessDenied;
