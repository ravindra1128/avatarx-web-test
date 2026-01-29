import { useTranslation } from "react-i18next";
import PatientCardHeading from "../../Pages/patientDashboard/PatientCardHeadin";
import { Button } from "../UI/button";
import { Activity } from "lucide-react";
import PatientDashboardButton from "../../Pages/patientDashboard/PatientDashboardButton";

const PatientCard = ({ title, data, loading, btnClick, buttonText, children, noDataText, showNoData, vitalDate }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <PatientCardHeading title={title} />
               {vitalDate && !showNoData && <div className="text-md text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{vitalDate}</div>}
            </div>
            {showNoData && <div className="text-center mb-2">
              <div className="text-gray-400 text-sm mb-2">{t("patientDashboard.noDataAvailable")}</div>
              <div className="text-md text-gray-500">{noDataText}</div>
            </div>}
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-2">
                    {loading ? (
                        <div className="text-sm text-gray-500">Loading...</div>
                    ) : data ? (
                        <>
                            {children}
                        </>
                    ) : <div></div>}
                </div>
            </div>
                <div className="flex justify-end">
                    <PatientDashboardButton btnClick={btnClick} btnText={buttonText} />
                </div>
        </div>
    )
}

export default PatientCard;