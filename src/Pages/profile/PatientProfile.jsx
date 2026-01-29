import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Plus,
  Camera,
} from "lucide-react";
import moment from "moment";
import React, { useEffect, useRef, useState } from "react";
import Chart from "react-apexcharts";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ErrorMsg from "../../Component/ErrorMsg";
import { Button } from "../../Component/UI/button";
import LanguageSelectModal from "../../Component/UI/LanguageSelectModal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../Component/UI/tooltip";
import FoodScanner from "../../Component/FoodScanner";
import NutritionResults from "../../Component/NutritionResults";
import apiClient from "../../config/APIConfig";
import { useUser } from "../../Hooks/useUser";
import { getUserPassword } from "../../utils/encryption";
import { logCritical, logInfo } from "../../utils/logger";
import { formatTime, roundVital } from "../../utils/utils";
import { useNewUsers } from "../admin/dashboard/UserSession/useNewUsers";
import { useProfilePatientData } from "./useProfilePatientData";
import { useRPMTimer } from "./useRPMTimer";
import "./UserProfile.css";
import NutritionChart from "../../Component/Chartjs/NutritionChart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Component/UI/select";
import MobileNavigation from "../../Component/MobileNavigation";
import DualAxisChartForPatient from "../../Component/Chartjs/DualAxisChartForPatient";

const PatientProfile = () => {
  const { t } = useTranslation();
const {
  selectedRangeIndex,
  patientData,
  userFilteredData,
  setSelectedRangeIndex,
  setPatientData,
  patientSlug,
  monthFilterOptions,
  vitalsLoading,
  patientStatus,
  setPatientStatus,
  chartData,
  selectedChartVital,
  setSelectedChartVital,
  trendsType,
  setTrendsType,
} = useProfilePatientData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { slug } = useUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();
  const {
    isConnected,
    elapsedSeconds,
    isTimerLoading,
    setIsTimerLoading,
    isPaused,
    setIsPaused,
  } = useRPMTimer({ patientSlug, patientData });
  const elapsedRef = useRef(0);
  const { inviteLoading, handleInviteUser } = useNewUsers();
  const [showLangModal, setShowLangModal] = useState(false);
  const [showFoodScanner, setShowFoodScanner] = useState(false);
  const [showNutritionResults, setShowNutritionResults] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [nutritionResults, setNutritionResults] = useState(null);
  const navigate = useNavigate();
  
  // New state for calories data
  const [caloriesData, setCaloriesData] = useState(null);
  const [caloriesLoading, setCaloriesLoading] = useState(false);
  const [caloriesError, setCaloriesError] = useState(null);
  
  const {pathname} = useLocation();
  const facilitySlug = pathname.split("/")[2];
  console.log(monthFilterOptions, "monthFilterOptions");

  // Build month options from calories data when in calories trends
  const calorieMonthOptions = (() => {
    if (Array.isArray(caloriesData) && caloriesData.length > 0) {
      const allDates = caloriesData
        .filter((v) => v?.createdAt)
        .map((v) => moment(v.createdAt));
      if (allDates.length === 0) return [];
      const earliest = moment.min(allDates);
      const months = [];
      const cursor = moment().startOf("month");
      const stop = earliest.clone().startOf("month");
      while (cursor.isSameOrAfter(stop)) {
        months.push(cursor.format("MMMM YYYY"));
        cursor.subtract(1, "month");
      }
      return months;
    }
    return [];
  })();

  // Choose which month list to display based on current trend
  const displayMonthOptions = trendsType === "calories"
    ? (calorieMonthOptions.length > 0 ? calorieMonthOptions : [])
    : monthFilterOptions;

// Ensure we always have a sensible month list and selected index
const effectiveMonthOptions = (Array.isArray(displayMonthOptions) && displayMonthOptions.length > 0)
  ? displayMonthOptions
  : [moment().format("MMMM YYYY")];
const safeSelectedIndex = (typeof selectedRangeIndex === 'number' && selectedRangeIndex < effectiveMonthOptions.length)
  ? selectedRangeIndex
  : 0;

// If options are empty or out of bounds, force select current month (index 0)
useEffect(() => {
  const currentOptions = (Array.isArray(displayMonthOptions) && displayMonthOptions.length > 0)
    ? displayMonthOptions
    : [moment().format("MMMM YYYY")];
  if (!Array.isArray(currentOptions) || currentOptions.length === 0) {
    if (selectedRangeIndex !== 0) setSelectedRangeIndex(0);
  } else if (selectedRangeIndex >= currentOptions.length) {
    setSelectedRangeIndex(0);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [trendsType, monthFilterOptions, caloriesData]);

  // Filter calories data based on selected month range
const getFilteredCaloriesData = () => {
  if (!caloriesData || caloriesData.length === 0) return [];

  // Use effective month options and safe index so we always have a month
  const selectedMonthLabel = effectiveMonthOptions[safeSelectedIndex];
  if (!selectedMonthLabel) return [];

    const selectedMonth = moment(selectedMonthLabel, "MMMM YYYY");
    const filterData = caloriesData.filter((data) =>
      moment(data.createdAt).isSame(selectedMonth, "month")
    );
    // Sort data chronologically (oldest to newest) for chart display
    filterData.sort(
      (a, b) =>
        moment(a.createdAt).valueOf() -
        moment(b.createdAt).valueOf()
    );

    console.log(`Filtered ${filterData.length} calories records for month filter ${selectedRangeIndex} (${selectedMonthLabel})`);
    return filterData;
  };

  // Function to fetch calories data
  const fetchCaloriesData = async () => {
    setCaloriesLoading(true);
    setCaloriesError(null);
    try {
      let apiUrl = '/food-analysis';
      if(patientSlug) {
        apiUrl = `/food-analysis/get_user_food_analyses_by_slug/${patientSlug}`;
      }
      const response = await apiClient.get(apiUrl);
      if (response.status === 200) {
        const data = response.data.data || response.data;
        data.analyses = data.analyses?.filter(analysis => analysis.nutritionData?.carbs !== 'Unknown' && analysis.nutritionData?.protein !== 'Unknown' && analysis.nutritionData?.fat !== 'Unknown');
        setCaloriesData(data.analyses);
        logInfo("Calories data fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching calories data:", error);
      setCaloriesError(error.message || "Failed to fetch calories data");
    } finally {
      setCaloriesLoading(false);
    }
  };

  useEffect(() => {
    elapsedRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  // Fetch calories data on component mount
  useEffect(() => {
    fetchCaloriesData();
  }, []);

  // Re-filter calories data when month selection changes
  useEffect(() => {
    if (trendsType === "calories" && caloriesData && caloriesData.length > 0) {
      const filteredData = getFilteredCaloriesData();
    console.log(`📊 Calories data re-filtered for month ${safeSelectedIndex}:`, {
      selectedMonth: effectiveMonthOptions[safeSelectedIndex],
        totalCaloriesData: caloriesData.length,
        filteredRecords: filteredData.length,
      availableMonths: effectiveMonthOptions
      });
    }
}, [selectedRangeIndex, monthFilterOptions, trendsType, caloriesData]);

  useEffect(() => {
    if (patientData) {
      reset({
        first_name: patientData.first_name || "",
        last_name: patientData.last_name || "",
        email: patientData.email || "",
        phone: patientData.phone || "",
      });
    }
  }, [patientData, reset]);

  // Add helper to check invite cooldown
  const getInviteCooldown = (user) => {
    if (!user || !user.message_sent_at) return 0;
    const lastInvite = moment(user.message_sent_at);
    const now = moment();
    const diffMs = now.diff(lastInvite);
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours in ms
    const remainingMs = cooldownMs - diffMs;
    if (remainingMs > 0) {
      // Return hours left, rounded up
      return Math.ceil(remainingMs / (60 * 60 * 1000));
    }
    return 0;
  };

  // Food Scanner Handlers
  const handleImageProcessed = (results) => {
    setNutritionResults(results);
    const currentImage = results?.imageUrl || null;
    setScannedImage(currentImage);
    setShowFoodScanner(false);
    setShowNutritionResults(true);
  };

  const handleFoodScannerClose = () => {
    setShowFoodScanner(false);
  };

  const handleNutritionResultsClose = () => {
    setShowNutritionResults(false);
    setScannedImage(null);
    setNutritionResults(null);
  };

  const handleEditResults = () => {
    // Reset and show scanner again
    setShowNutritionResults(false);
    setScannedImage(null);
    setNutritionResults(null);
    setShowFoodScanner(true);
  };

  const handleDone = () => {
    // TODO: Implement save functionality
    setShowNutritionResults(false);
    setScannedImage(null);
    setNutritionResults(null);
  };

  const inviteButtonTooltip = (user) => {
    if (user.phone_type === "landline") {
      return (
        <TooltipContent>{t("users.inviteDisabledTooltip")}</TooltipContent>
      );
    }
    if (getInviteCooldown(user) > 0) {
      return (
        <TooltipContent>
          {t("userProfile.invitationSent")}{" "}
          {moment(user.message_sent_at).fromNow()}.
          <br />
          {t("userProfile.anotherInviteCanBeSentIn")}{" "}
          {Math.ceil(getInviteCooldown(user))} {t("userProfile.hour")}(s).
        </TooltipContent>
      );
    }
    return null;
  };
  
  const isShowAlerts = (reading, alertType) => {
    if (patientSlug) {
      return reading?.alert_in === alertType && reading?.alert != "low"
    }
    return false;
  }

  // Form submit handler for updating user profile
  const onSubmit = async (data) => {
    setIsTimerLoading(true);
    try {
      let apiUrl = `/user/update_user/${patientData.id}`;
      const updatedUserData = {
        ...patientData,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
      };
      updatedUserData.sub = await getUserPassword();
      const updateRes = await apiClient.post(apiUrl, updatedUserData);
      logInfo("User updated successfully");
      setPatientData(updateRes.data.data);
      setIsEditModalOpen(false);
    } catch (err) {
      logCritical("Error updating user", err);
      if (err.response && err.response.status === 400) {
        alert(t("userProfile.invalidInput"));
      } else {
        alert(t("userProfile.errorUpdatingProfile"));
      }
    } finally {
      setIsTimerLoading(false);
    }
  };

  return (
    <div
      className={`py-8  px-4 ${
        patientSlug ? "mt-0 pt-0" : "mt-8 pt-[40px] lg:pt-[60px]"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top bar: Go Back on left, Finish Monitoring + Timer on right (if patientSlug) */}
        {patientSlug && (
          <>
            {/* <div className="mb-8 flex flex-wrap items-center gap-4 bg-white"> */}
            <div className="mb-8 flex flex-wrap items-center gap-4 bg-white border border-gray-200 rounded-xl shadow p-4">
              <Link to={`/dashboard/${facilitySlug}/patients/`}>
                <Button className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t("userProfile.goBackToPatientsList")}
                </Button>
              </Link>
              <div className="flex-1" />
              <div className="flex items-center gap-4">
                {/* <Button
                onClick={handleFinishMonitoring}
                disabled={isFinishing || elapsedSeconds === 0}
                className="h-10 px-6 bg-[#5B4DF7] hover:bg-[#473dc2] text-white font-semibold rounded-lg shadow flex items-center gap-2 transition-all duration-200"
              >
                Finish Monitoring
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button> */}
                {/* <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused((prev) => !prev)}
                    className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors"
                    aria-label={!isPaused ? "End session" : "Start session"}
                    disabled={isTimerLoading || !isConnected}
                    style={{
                      opacity: isTimerLoading || !isConnected ? 0.5 : 1,
                      pointerEvents:
                        isTimerLoading || !isConnected ? "none" : "auto",
                    }}
                  >
                    {!isPaused ? (
                      <Pause className="w-6 h-6 text-gray-700" />
                    ) : (
                      <Play className="w-6 h-6 text-gray-700" />
                    )}
                  </button>
                  <div className="flex items-center gap-3">
                    {isTimerLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-black" />
                        <span className="text-lg font-semibold text-gray-600 font-mono w-32 text-center whitespace-nowrap">
                          {t("userProfile.syncing")}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 relative">
                        <span
                          className={`text-xl font-semibold text-gray-800 font-mono text-center whitespace-nowrap ${
                            Math.floor(elapsedSeconds / 3600) > 0
                              ? "w-32"
                              : "w-12"
                          }`}
                        >
                          {formatTime(elapsedSeconds)}
                        </span>
                        <span className="text-xl font-semibold text-gray-800 font-mono">
                          {t("userProfile.forRPM")}
                        </span>
                      </div>
                    )}
                  </div>
                </div> */}
                
                {/* Food Scanner Button */}
                {/* <Button
                  onClick={() => setShowFoodScanner(true)}
                  className="h-10 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  {t("userProfile.scanFood", "Scan Food")}
                </Button> */}
              </div>
            </div>
          </>
        )}

        {/* Edit Profile Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl transform transition-all">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {t("userProfile.editProfile")}
                  </h2>
                  <button
                    onClick={() => {
                      reset();
                      setIsEditModalOpen(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* First Name Field */}
                  <div>
                    <div className="relative">
                      <input
                        {...register("first_name", {
                          required: "First name is required",
                          minLength: {
                            value: 2,
                            message: "First name must be at least 2 characters",
                          },
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white transition-colors
                          ${
                            errors.first_name
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                          } focus:outline-none focus:ring-4`}
                        placeholder={t("userProfile.enterFirstName")}
                      />
                      {errors.first_name && (
                        <div className="absolute right-0 top-0 flex items-center h-full pr-3">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {errors.first_name && (
                      <ErrorMsg error={errors.first_name.message} />
                    )}
                  </div>

                  {/* Last Name Field */}
                  <div>
                    <div className="relative">
                      <input
                        {...register("last_name", {
                          required: "Last name is required",
                          minLength: {
                            value: 2,
                            message: "Last name must be at least 2 characters",
                          },
                        })}
                        className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white transition-colors
                          ${
                            errors.last_name
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                          } focus:outline-none focus:ring-4`}
                        placeholder={t("userProfile.enterLastName")}
                      />
                      {errors.last_name && (
                        <div className="absolute right-0 top-0 flex items-center h-full pr-3">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {errors.last_name && (
                      <ErrorMsg error={errors.last_name.message} />
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <div className="relative">
                      <input
                        {...register("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address",
                          },
                        })}
                        type="email"
                        className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white transition-colors
                          ${
                            errors.email
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                          } focus:outline-none focus:ring-4`}
                        placeholder={t("userProfile.enterEmail")}
                      />
                      {errors.email && (
                        <div className="absolute right-0 top-0 flex items-center h-full pr-3">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {errors.email && <ErrorMsg error={errors.email.message} />}
                  </div>

                  {/* Phone Field */}
                  <div>
                    <div className="relative">
                      <input
                        {...register("phone", {
                          required: "Phone number is required",
                          pattern: {
                            value: /^[0-9]{10}$/,
                            message:
                              "Please enter a valid 10-digit phone number",
                          },
                        })}
                        type="tel"
                        className={`w-full px-4 py-2.5 rounded-lg border bg-gray-50 focus:bg-white transition-colors
                          ${
                            errors.phone
                              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                              : "border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                          } focus:outline-none focus:ring-4`}
                        placeholder={t("userProfile.enterPhoneNumber")}
                      />
                      {errors.phone && (
                        <div className="absolute right-0 top-0 flex items-center h-full pr-3">
                          <svg
                            className="w-5 h-5 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    {errors.phone && <ErrorMsg error={errors.phone.message} />}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      reset();
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-colors"
                  >
                    {t("userProfile.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 transition-colors"
                  >
                    {t("userProfile.saveChanges")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Main Content Grid */}
        {/* revert this change if medication section is needed */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">  */}
        {patientData && (patientData.sms_status === "FAILED" && userFilteredData?.length === 0) && patientSlug ? (
          <div className="text-center py-12 border rounded-xl flex flex-col items-center justify-center gap-6 bg-white">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="h-14 w-14 text-yellow-500 mb-2 animate-pulse" />
              <h2 className="text-2xl font-bold text-black mb-1">
                {t("userProfile.messageCouldNotBeDelivered")}
              </h2>
              <p className="text-base text-black font-medium mb-2">
                {t("userProfile.messageCouldNotBeDeliveredReason")}
              </p>
              <ul className="text-left text-black text-base mb-2 space-y-1">
                <li>• {t("userProfile.patientPhoneSwitchedOff")}</li>
                <li>• {t("userProfile.outOfCoverageArea")}</li>
                <li>• {t("userProfile.incorrectPhoneNumber")}</li>
              </ul>
              <p className="text-sm text-black mb-2">
                {t("userProfile.pleaseVerifyPatientPhoneNumber")}
              </p>
              {/* <Button
                onClick={async () => {
                  await handleInviteUser(userData, true);
                  setPatientStatus({
                    status: "MESSAGE_SENT",
                    show: true,
                  });
                }}
                disabled={inviteLoading.show}
                className="h-10 bg-black hover:bg-gray-700 text-white text-base font-semibold rounded-lg shadow transition-all duration-200 flex items-center gap-2 w-44 mt-2"
              >
                {inviteLoading.show ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>{t('userProfile.retrySending')}</span>
                  </>
                )}
              </Button> */}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => setShowLangModal(true)}
                      disabled={
                        inviteLoading.show || getInviteCooldown(patientData) > 0
                      }
                      className={`h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 w-44 mt-2${
                        inviteLoading.show || getInviteCooldown(patientData) > 0
                          ? " bg-gray-600 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {inviteLoading.show ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          <span>{t("userProfile.retrySending")}</span>
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  {getInviteCooldown(patientData) > 0 && (
                    <TooltipContent>
                      {t("userProfile.invitationSent")}{" "}
                      {moment(patientData.message_sent_at).fromNow()}.<br />
                      {t("userProfile.anotherInviteCanBeSentIn")}{" "}
                      {Math.ceil(getInviteCooldown(patientData))}{" "}
                      {t("userProfile.hour")}(s).
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : patientData &&
          patientStatus.show &&
          patientStatus.status === null &&
          !patientData.sms_status &&
          patientSlug ? (
          <div className="text-center py-12 border rounded-xl flex flex-col items-center justify-center gap-6 bg-white">
            <img
              src="/invite.gif"
              alt="Send invite"
              className="h-20 w-20 mb-2"
            />
            <p className="text-2xl font-bold text-black mb-1">
              {t("userProfile.noInviteSentYet")}
            </p>
            <p className="text-base text-gray-700 mb-4 max-w-md">
              {t("userProfile.noInviteSentYetDescription")}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setShowLangModal(true)}
                    disabled={
                      inviteLoading.show || getInviteCooldown(patientData) > 0
                    }
                    className={`h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 w-32${
                      inviteLoading.show || getInviteCooldown(patientData) > 0
                        ? " bg-gray-600 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    {inviteLoading.show ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>{t("userProfile.invite")}</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                {getInviteCooldown(patientData) > 0 && (
                  <TooltipContent>
                    {t("userProfile.invitationSent")}{" "}
                    {moment(patientData.message_sent_at).fromNow()}.<br />
                    {t("userProfile.anotherInviteCanBeSentIn")}{" "}
                    {Math.ceil(getInviteCooldown(patientData))}{" "}
                    {t("userProfile.hour")}(s).
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : patientStatus.status === "MESSAGE_SENT" && patientSlug ? (
          <div className="text-center py-12 border rounded-xl flex flex-col items-center justify-center gap-6 bg-white">
            <div className="flex flex-col items-center gap-2">
              <img
                src="/call.gif"
                alt="Call the patient"
                className="h-20 w-20 mb-2"
              />
              <p className="text-2xl font-bold text-black mb-1">
                {t("userProfile.patientHasNotJoinedYet")}
              </p>
            </div>
            <div className="max-w-lg mx-auto">
              <ol className="text-base text-gray-700 mb-4 list-decimal list-inside text-left">
                <li className="mb-2">
                  {t("userProfile.patientNotJoinedDescription")}
                </li>
                <li className="mb-2 font-semibold text-black">
                  {t("userProfile.pleaseCallPatient")}
                </li>
                <li className="mb-2">{t("userProfile.oncePatientLogsIn")}</li>
              </ol>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex flex-col items-center gap-2">
                      <Button
                        onClick={() => setShowLangModal(true)}
                        disabled={
                          inviteLoading.show ||
                          getInviteCooldown(patientData) > 0
                        }
                        className={`h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2${
                          inviteLoading.show ||
                          getInviteCooldown(patientData) > 0
                            ? " bg-gray-600 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        {inviteLoading.show ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            <span>{t("userProfile.resendInvite")}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {inviteButtonTooltip(patientData)}
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        ) : patientStatus.status === "not_found" && patientSlug ? (
          <div className="text-center py-12 border rounded-xl flex flex-col items-center justify-center gap-4">
            <p className="text-2xl font-bold text-gray-700 mb-2">
              {t("userProfile.patientNotFound")}
            </p>
            <p className="text-base text-gray-500 mb-4 max-w-md">
              {t("userProfile.patientNotFoundDescription")}
            </p>
            <Link to={`/dashboard/${facilitySlug}/patients/`}>
              <Button className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                {t("userProfile.goBackToPatientsList")}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="">
            {/* Charts Section */}
            <div className="lg:col-span-8 space-y-8">
              {/* Blood Pressure Trends Card */}
              <div className="rounded-2xl shadow-lg py-3">
                <div className="flex sm:flex-row items-center justify-between gap-4 mb-4 p-2">
                  <div className="flex items-center gap-4">
                    {/* <h2 className="text-2xl font-bold text-gray-900">
                      {trendsType === "vitals" ? (
                        {
                          All: t("userProfile.allVitalsTrends", "All Vitals Trends"),
                          "Blood Pressure": t("userProfile.bloodPressureTrends", "Blood Pressure Trends"),
                          HRV: t("userProfile.hrvTrends", "HRV Trends"),
                          "Heart Rate": t("userProfile.heartRateTrends", "Heart Rate Trends"),
                          "Breathing Rate": t("userProfile.breathingRateTrends", "Breathing Rate Trends"),
                        }[selectedChartVital]
                      ) : (
                        {
                          All: t("userProfile.allNutritionTrends", "All Nutrition Trends"),
                          "Calories": t("userProfile.caloriesTrends", "Calories Trends"),
                          "Carbs": t("userProfile.carbsTrends", "Carbs Trends"),
                          "Protein": t("userProfile.proteinTrends", "Protein Trends"),
                          "Fat": t("userProfile.fatTrends", "Fat Trends"),
                        }[selectedChartVital] || t("userProfile.caloriesTrends", "Calories Trends")
                      )}
                    </h2> */}
                    
                    {/* Trends Type Selector */}
                    <div className="flex items-center gap-2">
                    <Select 
                      value={trendsType} 
                      onValueChange={(value) => {
                        setTrendsType(value);
                        // Reset selectedChartVital to "All" when switching trends type
                        setSelectedChartVital("All");
                        // Reset month selection when trend changes so index is valid for new list
                        setSelectedRangeIndex(0);
                      }}
                    >
                      <SelectTrigger className="w-24 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
                        <SelectValue placeholder="Select trends type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-sm">
                        <SelectItem value="vitals">{t("userProfile.vitalsTrends", "Vitals Trends")}</SelectItem>
                        <SelectItem value="calories">{t("userProfile.caloriesTrends", "Calories Trends")}</SelectItem>
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Vitals Selector - Only show when trendsType is "vitals" */}
                    {trendsType === "vitals" && (
                      <div className="w-36">
                      <Select 
                        value={selectedChartVital}
                        onValueChange={(value) => setSelectedChartVital(value)}
                      >
                        <SelectTrigger className="w-24 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
                          <SelectValue placeholder="Select vital" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-sm">
                          <SelectItem value="All">{t("userProfile.all", "All")}</SelectItem>
                          <SelectItem value="Blood Pressure">{t("userProfile.bloodPressure", "Blood Pressure")}</SelectItem>
                          <SelectItem value="HRV">{t("userProfile.hrv", "HRV")}</SelectItem>
                          <SelectItem value="Heart Rate">{t("userProfile.heartRate", "Heart Rate")}</SelectItem>
                          <SelectItem value="Breathing Rate">{t("userProfile.breathingRate", "Breathing Rate")}</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                    )}
                    
                    {/* Calories Selector - Only show when trendsType is "calories" */}
                    {trendsType === "calories" && (
                      <div className="w-36">
                      <Select 
                        value={selectedChartVital}
                        onValueChange={(value) => setSelectedChartVital(value)}
                      >
                        <SelectTrigger className="w-24 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
                          <SelectValue placeholder="Select nutrition metric" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200 text-sm">
                          <SelectItem value="All">{t("userProfile.all", "All")}</SelectItem>
                          <SelectItem value="Calories">{t("userProfile.calories", "Calories")}</SelectItem>
                          <SelectItem value="Carbs">{t("userProfile.carbs", "Carbs")}</SelectItem>
                          <SelectItem value="Protein">{t("userProfile.protein", "Protein")}</SelectItem>
                          <SelectItem value="Fat">{t("userProfile.fat", "Fat")}</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                    )}
                    
                    {/* Month Selector */}
                    <div className="w-48">
                    <Select value={String(safeSelectedIndex)} onValueChange={(value) => {
                      const nextIndex = parseInt(value, 10);
                      if (!Number.isNaN(nextIndex)) {
                        setSelectedRangeIndex(nextIndex);
                      }
                    }}>
                      <SelectTrigger className="w-48 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
                        <SelectValue placeholder={t("patientDashboard.selectMonth")} />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200 text-sm">
                        <SelectContent className="bg-white border-gray-200 text-sm max-h-64 overflow-auto">
                          {effectiveMonthOptions.map((label, idx) => (
                              <SelectItem key={idx} value={String(idx)}>
                                {label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </SelectContent>
                    </Select>
                    </div>
                  </div>
                </div>

                {vitalsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                    <p className="text-gray-500">
                      {t("userProfile.loadingHealthVitalsData")}
                    </p>
                  </div>
                ) : trendsType === "vitals" && userFilteredData.length > 0 ? (
                  <div className="mt-4 rounded-xl overflow-hidden">
                       <DualAxisChartForPatient 
                        selectedVital={selectedChartVital}

                       data={userFilteredData.filter(item => 
                         item?.systolic_blood_pressure_mmhg != null
                       )} 
                      />
                  </div>
                ) : trendsType === "calories" && caloriesData && caloriesData.length > 0 ? (
                  <div className="mt-4 rounded-xl overflow-hidden">
                    {(() => {
                      const filteredCaloriesData = getFilteredCaloriesData();
                      
                      if (filteredCaloriesData.length === 0) {
                        return (
                          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <p className="text-xl font-medium mb-2">{t("userProfile.noCaloriesDataForSelectedMonth")}</p>
                            <p className="text-sm text-gray-500">{t("userProfile.trySelectingDifferentMonthRange")}</p>
                          </div>
                        );
                      }
                      
                      const transformedData = filteredCaloriesData.map(item => ({
                        ...item,
                        vitals_created_at: item.createdAt,
                        vital_data: {
                          calories: item.nutritionData.calories,
                          carbs: item.nutritionData.carbs ? parseInt(item.nutritionData.carbs.replace('g', '')) : 0,
                          protein: item.nutritionData.protein ? parseInt(item.nutritionData.protein.replace('g', '')) : 0,
                          fat: item.nutritionData.fat ? parseInt(item.nutritionData.fat.replace('g', '')) : 0
                        }
                      }));
                      return (
                        <div>
                          <NutritionChart 
                            data={transformedData} 
                            selectedVital={selectedChartVital}
                          />
                        </div>
                      );
                    })()}
                  </div>
                ) : trendsType === "calories" && caloriesLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                    <p className="text-gray-500">{t("userProfile.loadingCaloriesData")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Activity className="w-16 h-16 mb-4 animate-pulse" />
                    <p className="text-xl font-medium mb-2">
                      {trendsType === "vitals" 
                        ? t("userProfile.noReadingsAvailable")
                        : t("userProfile.noCaloriesDataAvailable")
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {trendsType === "vitals"
                        ? t("userProfile.trySelectingDifferentRange")
                        : t("userProfile.tryScanningFood", "Try scanning some food to see your nutrition trends")
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Readings Table Card */}
              <div>
               {! vitalsLoading && <div className="p-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {trendsType === "vitals" 
                   ? t("userProfile.detailedReadings", {
                          range: effectiveMonthOptions[safeSelectedIndex],
                        })
                      : t("detailedNutritionReadings", {
                          range: effectiveMonthOptions[safeSelectedIndex],
                        })
                    }
                  </h2>
                </div>}
                <div className="overflow-hidden p-3 mt-5 border border-gray-200 rounded-2xl">
                  {vitalsLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-black mb-4" />
                      <p className="text-gray-500">
                        {t("userProfile.loadingReadingsData")}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full divide-y divide-gray-200">
                        <thead className="sticky top-0 bg-white">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[75px]">
                              {t("userProfile.time")}
                            </th>
                            {trendsType === "vitals" ? (
                              <>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[130px]">
                                  {t("userProfile.vitals")}
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[100px]">
                                  {t("userProfile.bloodPressure")}
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[200px]">
                                  {t("userProfile.otherMetrics")}
                                </th>
                              </>
                            ) : (
                              <>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[130px]">
                                  {t("userProfile.calories", "Calories")}
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[100px]">
                                  {t("userProfile.carbs", "Carbs")}
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[100px]">
                                  {t("userProfile.protein", "Protein")}
                                </th>
                                <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[100px]">
                                  {t("userProfile.fat", "Fat")}
                                </th>
                              </>
                            )}
                            {/* {patientSlug && <th className="px-6 py-4 text-left text-sm font-semibold border-x-none text-gray-900 min-w-[150px]">
                              {t("userProfile.notes", "Notes")}
                            </th>} */}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {trendsType === "vitals" ? (
                            // Vitals Data Table
                            userFilteredData.length > 0 ? (
                              userFilteredData.map((reading) => (
                                <tr key={reading.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 border-x-none whitespace-nowrap">
                                    <div className="text-sm text-gray-900 font-medium">
                                      {reading.vitals_created_at ? moment(reading.vitals_created_at).format("hh:mm A") : "N/A"}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {reading.vitals_created_at ? moment(reading.vitals_created_at).format("MMM D, YYYY") : "N/A"}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 border-x-none">
                                    <div className="space-y-1">
                                      {reading?.breathing_rate_bpm
                                         && (
                                        <div className="text-sm text-gray-900">
                                          <span className={`${ isShowAlerts(reading, 'breathing_rate_bpm') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' }` : 'text-gray-500' }`}>
                                            {t("userProfile.breathing")}:
                                          </span>
                                          <span className={`ml-2 ${ isShowAlerts(reading, 'breathing_rate_bpm') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' } px-2 py-1 rounded font-semibold` : 'px-2 py-1 rounded font-semibold' }`}>
                                            {roundVital(
                                              reading?.breathing_rate_bpm
                                            )}{" "}
                                            {t("userProfile.bpm")}
                                          </span>
                                        </div>
                                      )}
                                      {reading?.heart_rate_bpm && (
                                        <div className="text-sm text-gray-900">
                                          <span className={`${ isShowAlerts(reading, 'heart_rate_bpm') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' }` : 'text-gray-500' }`}>
                                            {t("userProfile.pulse")}:
                                          </span>
                                          <span className={`ml-2 ${ isShowAlerts(reading, 'heart_rate_bpm') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' } px-2 py-1 rounded font-semibold` : 'px-2 py-1 rounded font-semibold' }`}>
                                            {roundVital(
                                              reading?.heart_rate_bpm
                                            )}{" "}
                                            {t("userProfile.bpm")}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 border-x-none">
                                    <div className="text-sm text-gray-900">
                                      <span className={`${ isShowAlerts(reading, 'systolic_blood_pressure_mmhg') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' } px-2 py-1 rounded font-semibold` : 'px-2 py-1 rounded font-semibold' }`}>
                                        {roundVital(
                                          reading?.systolic_blood_pressure_mmhg
                                        )}
                                      </span>
                                      /
                                      <span className={`${ isShowAlerts(reading, 'diastolic_blood_pressure_mmhg') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' } px-2 py-1 rounded font-semibold` : 'px-2 py-1 rounded font-semibold' }`}>
                                        {roundVital(
                                          reading?.diastolic_blood_pressure_mmhg
                                        )}
                                      </span>
                                      <span className={`${ isShowAlerts(reading, 'diastolic_blood_pressure_mmhg') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' }` : 'text-gray-500' }`}>
                                        {" "}
                                        {t("userProfile.mmHg")}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 border-x-none">
                                    <div className="space-y-1">
                                      {reading?.hrv_sdnn_ms && (
                                        <div className="text-sm text-gray-900">
                                          <span className={`${ isShowAlerts(reading, 'hrv_sdnn_ms') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' }` : 'text-gray-500' }`}>
                                            {t(
                                              "userProfile.heartRateVariability"
                                            )}
                                            :
                                          </span>
                                          <span className={`ml-2 ${ isShowAlerts(reading, 'hrv_sdnn_ms') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' } px-2 py-1 rounded font-semibold` : 'px-2 py-1 rounded font-semibold' }`}>
                                            {roundVital(
                                              reading?.hrv_sdnn_ms
                                            )}{" "}
                                            {t("userProfile.ms")}
                                          </span>
                                        </div>
                                      )}
                                        {reading?.parasympathetic_activity && (
                                        <div className="text-sm text-gray-900">
                                          <span className={`${ isShowAlerts(reading, 'parasympathetic_activity') ? `${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' }` : 'text-gray-500' }`}>
                                            {t("userProfile.paraActivity")}:
                                          </span>
                                          <span className="ml-2">
                                            {roundVital(
                                              reading?.parasympathetic_activity
                                            )}
                                            {t("userProfile.percent")}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  {patientSlug && <td className="px-6 py-4 border-x-none">
                                    <div className="text-sm text-gray-900">
                                      {reading?.alert_reason && reading?.alert != "low" && (
                                        <span className={`px-2 py-1 ${ reading?.alert === 'high' ? 'text-red-500' : 'text-orange-400' }  font-semibold rounded-full`}>
                                          {reading?.alert_reason}
                                        </span>
                                      )}
                                    </div>
                                  </td>}
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="!text-center text-gray-500 py-8"
                                >
                                  {t("userProfile.noReadingsAvailable")}
                                </td>
                              </tr>
                            )
                          ) : (
                            // Calories Data Table
                            (() => {
                              const filteredCaloriesData = getFilteredCaloriesData();
                              return filteredCaloriesData.length > 0 ? (
                                filteredCaloriesData.map((item) => (
                                  <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 border-x-none whitespace-nowrap">
                                      <div className="text-sm text-gray-900 font-medium">
                                        {item.createdAt ? moment(item.createdAt).format("hh:mm A") : "N/A"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {item.createdAt ? moment(item.createdAt).format("MMM D, YYYY") : "N/A"}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 border-x-none">
                                      <div className="text-sm text-gray-900">
                                        <span className="text-gray-500">{t("userProfile.caloriesLabel")}</span>
                                        <span className="ml-2 px-2 py-1 rounded font-semibold text-gray-700">
                                          {item.calories}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 border-x-none">
                                      <div className="text-sm text-gray-900">
                                        <span className="text-gray-500">{t("userProfile.carbsLabel")}</span>
                                        <span className="ml-2 px-2 py-1 rounded font-semibold text-gray-700">
                                          {item.nutritionData.carbs}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 border-x-none">
                                        <div className="text-sm text-gray-900">
                                          <span className="text-gray-500">{t("userProfile.proteinLabel")}</span>
                                          <span className="ml-2 px-2 py-1 rounded font-semibold text-gray-700">
                                            {item.nutritionData.protein}
                                          </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 border-x-none">
                                        <div className="text-sm text-gray-900">
                                          <span className="text-gray-500">{t("userProfile.fatLabel")}</span>
                                          <span className="ml-2 px-2 py-1 rounded font-semibold text-gray-700">
                                            {item.nutritionData.fat}
                                          </span>
                                        </div>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan="5"
                                    className="!text-center text-gray-500 py-8"
                                  >
                                    {t("noCaloriesDataAvailableForSelectedMonth")}
                                  </td>
                                </tr>
                              );
                            })()
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Medications Section */}
            {/* comment this out if medication section is needed */}
            {/* <div className="lg:col-span-4">
              <div className="rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Medications
                  </h2>
                  <span className="border border-blue-200 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                    {medicationData.length} Active
                  </span>
                </div>

                <div className="space-y-4">
                  {medicationData.length > 0 ? (
                    medicationData.map((medication) => (
                      <div
                        key={medication.id}
                        className="flex items-center p-4 border rounded-xl hover:border-blue-200 transition-colors duration-200"
                      >
                        <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center rounded-xl border border-blue-100">
                          <Pill className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="ml-4 flex-grow">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {medication.medication_name}
                          </h3>
                          <div className="flex items-center mt-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <span className="ml-2 text-sm text-gray-600">
                              {moment(
                                medication.reminder_time,
                                "HH:mm:ss"
                              ).format("h:mm A")}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 border rounded-xl">
                      <Pill className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-600">
                        No medications scheduled
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Medications will appear here when prescribed
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div> */}
          </div>
        )}
      </div>
      
      {/* Food Scanner Modal */}
      {showFoodScanner && (
        <FoodScanner
          onClose={handleFoodScannerClose}
          onImageProcessed={handleImageProcessed}
        />
      )}

      {/* Nutrition Results Modal */}
      {showNutritionResults && (
        <NutritionResults
          results={nutritionResults}
          foodImage={scannedImage}
          onClose={handleNutritionResultsClose}
          onEdit={handleEditResults}
          onDone={handleDone}
        />
      )}
      
      <LanguageSelectModal
        open={showLangModal}
        onClose={() => setShowLangModal(false)}
        onSelect={async (lang) => {
          setShowLangModal(false);
          await handleInviteUser({...patientData, facility_slug: facilitySlug}, true, lang);
          setPatientStatus({ status: "MESSAGE_SENT", show: true });
        }}
        loading={inviteLoading.show}
      />
      
      {/* Mobile Navigation Footer */}
      <MobileNavigation />
    </div>
  );
};

export default PatientProfile;