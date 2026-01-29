import React, { useState, useEffect, useContext } from 'react';
import './PatientDashboard.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../Component/UI/select';
import moment from 'moment';
import { Activity, Loader2, Utensils, Gift, Flame, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../config/APIConfig';
import { toast } from 'react-toastify';
import Loader from '../../Component/Loader';
import MobileNavigation from '../../Component/MobileNavigation';
import CalendarPicker from '../../Component/CalendarPicker';
import CircularProgress from './CircularProgress';
import PatientCard from '../../Component/Cards/PatientCard';
import CalorieTrendsChart from '../../Component/Chartjs/CalorieTrendsChart';
import BpTrendsChart from '../../Component/Chartjs/BpTrendsChart';
import PatientCardHeading from './PatientCardHeadin';
import userImage from '../../assets/images/user.png';
import PatientDashboardButton from './PatientDashboardButton';
import TodayCaloriesSummary from '../../Component/TodayCaloriesSummary';
import GiftCard from '../../Component/Cards/GiftCard';
import { logCritical } from '../../utils/logger';
import { AuthContext } from '../../Component/AuthProvider';
import { usePending } from '../../Component/PendingContext.jsx';
import NutritionResults from '../../Component/NutritionResults.jsx';
import MealCategoriesList from '../../Component/MealCategoriesList';

const PatientDashboard = () => {

  const [selectedMonth, setSelectedMonth] = useState(moment().format('MMMM YYYY'));
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('this-week');
  // Day selector (Sun–Sat) at top
  const [selectedDay, setSelectedDay] = useState(moment().startOf('day'));
  // Calendar visibility state
  const [showCalendar, setShowCalendar] = useState(false);
  // Per-date calories (API-driven)
  const [dateCalories, setDateCalories] = useState(null);
  const [calorieTrends, setCalorieTrends] = useState(null);
  const [bpTrends, setBpTrends] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [giftCardData, setGiftCardData] = useState(null);
  const [showGiftCard, setShowGiftCard] = useState(false);
  // Calendar state moved to component; keep selectedDay only
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const {authData} = useContext(AuthContext);
  const { isFoodScanPending, foodScanProgress, foodScanPreviewUrl, foodScanPhase, lastFoodScan, setLastFoodScan, pendingMealFor, startFoodScan, selectedMealFor } = usePending();
  const [showNutritionModal, setShowNutritionModal] = useState(false);
  const [nutritionModalData, setNutritionModalData] = useState(null);
  const [nutritionModalImage, setNutritionModalImage] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [associatedPatients, setAssociatedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessageData, setSuccessMessageData] = useState(null);
  const [showVitalsSubscriptionModal, setShowVitalsSubscriptionModal] = useState(false);
  const [loader, setLoader] = useState({
    associatedAccountsLoading: false,
    dashboardDataLoading: false,
    caloriesByDateLoading: false,
    caloriesTrendsLoading: false,
    bpTrendsLoading: false,
  });
  // Set this condition - true means user needs to subscribe, false means they can use the feature freely
  const needsVitalsSubscription = userData?.payment_required; // Change to false to disable the subscription check

  useEffect(() => {
    getAssociatedAccounts();
  }, []);

  // Save patient preference when selectedPatient changes (for initial load)
  useEffect(() => {
    if (selectedPatient?.id) {
      localStorage.setItem("selectedPatientId", selectedPatient.id.toString());
    }
  }, [selectedPatient]);

  // Function to fetch dashboard data
  const fetchDashboardData = async (monthFilter = moment().format('MMMM YYYY')) => {
    setLoader((prev) => ({ ...prev, dashboardDataLoading: true }));
    try {
      const response = await apiClient.post('/patient-dashboard/get_patient_dashboard_data', {
        monthFilter: monthFilter
      });

      if (response.status === 200) {
        setDashboardData(response.data.data || response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch dashboard data');
      logCritical("Error fetching dashboard data:", error);
    } finally {
      setLoader((prev) => ({ ...prev, dashboardDataLoading: false }));
    }
  };


  const getAssociatedAccounts = async () => {
    setLoader((prev) => ({ ...prev, associatedAccountsLoading: true }));
    try {
      const response = await apiClient.post('/user/associated_accounts', {
        phone_number: authData?.user?.phone_number
      });

      if (response.status === 200) {
        const patients = response.data.data;
        setAssociatedPatients(patients);
        
        // Try to restore saved patient preference
        const savedPatientId = localStorage.getItem('selectedPatientId');
        const savedPatient = patients.find(patient => patient.id.toString() === savedPatientId);
        
        if (savedPatient) {
          setSelectedPatient(savedPatient);
        } else {
          // Fallback to first patient if no saved preference
          setSelectedPatient(patients[0]);
        }
      }
    } catch (error) {
      logCritical("Error fetching associated accounts:", error);
      toast.error(error.message || 'Failed to fetch associated accounts');
    } finally {
      setLoader((prev) => ({ ...prev, associatedAccountsLoading: false }));
    }
  };


  const switchAccount = async (patientId) => {
    setLoader((prev) => ({ ...prev, associatedAccountsLoading: true }));
    try {
      const response = await apiClient.post('/user/switch_account', {
        user_id: patientId,
      });

      localStorage.clear();

      const { data } = response;

      setSelectedPatient(data.user);
      // 1) Persist first
      localStorage.setItem("userId", data.user.id);
      localStorage.setItem("token", data.token);
      localStorage.setItem("phone_number", data.user.phone_number ?? "");
      localStorage.setItem("patient_slug", data.user.patient_slug ?? "");
      localStorage.setItem("facility_slug", data.user.facility_slug ?? "");
      localStorage.setItem("userData", JSON.stringify(data.user));
      // Save selected patient preference
      localStorage.setItem("selectedPatientId", patientId.toString());
  
      window.location.reload();

    } catch (error) {
      logCritical("Error fetching associated accounts:", error);
      toast.error(error.message || 'Failed to fetch associated accounts');
    } finally {
      setLoader((prev) => ({ ...prev, associatedAccountsLoading: false }));
    }
  };


  // Fetch data on component mount and when month changes
  useEffect(() => {
    fetchDashboardData(selectedMonth);
  }, [selectedMonth]);


  // Fetch calorie trends for selected period
  const fetchCalorieTrends = async (periodFilter) => {
    setLoader((prev) => ({ ...prev, caloriesTrendsLoading: true }));
    try {
      const response = await apiClient.post('/patient-dashboard/get_patient_colories_trend', {
        periodFilter: periodFilter,
      });
      if (response.status === 200) {
        setCalorieTrends(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch calorie trends');
      logCritical("Error fetching calorie trends:", error);
    } finally {
      setLoader((prev) => ({ ...prev, caloriesTrendsLoading: false }));
    }
  };

  // Fetch BP trends for selected period
  const fetchBpTrends = async (periodFilter) => {
    setLoader((prev) => ({ ...prev, bpTrendsLoading: true }));
    try {
      const response = await apiClient.post('/patient-dashboard/get_patient_bp_trend', {
        periodFilter: periodFilter,
      });
      if (response.status === 200) {
        setBpTrends(response.data);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to fetch BP trends');
      logCritical("Error fetching BP trends:", error);
    } finally {
      setLoader((prev) => ({ ...prev, bpTrendsLoading: false }));
    }
  };

  // Fetch per-date calories whenever selectedDay changes
  useEffect(() => {
    const fetchByDate = async () => {
      try {
        setLoader((prev) => ({ ...prev, caloriesByDateLoading: true }));
        const payload = { date: moment(selectedDay).format('YYYY-MM-DD') };
        const response = await apiClient.post('/patient-dashboard/get_patient_calories_by_date', payload);
        setDateCalories(response?.data || null);
      } catch (e) {
        setDateCalories(null);
        logCritical("Error fetching calories by date:", e);
      } finally {
        setLoader((prev) => ({ ...prev, caloriesByDateLoading: false }));
      }
    };
    if (selectedDay) fetchByDate();
  }, [selectedDay]);

  // Check if there are any incomplete analyses
  const hasIncompleteAnalyses = (analyses) => {
    if (!Array.isArray(analyses)) return false;
    return analyses.some(analysis => analysis.analysis_complete === 0 && analysis.retry_count < 3);
  };

  // Polling function to check for completed analyses
  const pollForCompletedAnalyses = async () => {
    try {
      // Always use today's date for polling
      const todayDate = moment().format('YYYY-MM-DD');
      const payload = { date: todayDate };
      const response = await apiClient.post('/patient-dashboard/get_patient_calories_by_date', payload);
      
      if (response?.data) {
        const previousAnalyses = dateCalories?.analyses || [];
        const newAnalyses = response.data?.analyses || [];
        
        // Check if any analysis just completed
        const newlyCompleted = newAnalyses.find((newAnalysis) => {
          const wasIncomplete = previousAnalyses.find(
            (prev) => prev.id === newAnalysis.id && prev.analysis_complete === 0
          );
          return wasIncomplete && newAnalysis.analysis_complete === 1;
        });
        
        // Show success message if an analysis just completed
        if (newlyCompleted) {
          setSuccessMessageData({
            mealType: newlyCompleted.meal_for || 'Meal',
            foodName: newlyCompleted.detected_food || 'Food Item',
            image: newlyCompleted.image_url
          });
          setShowSuccessMessage(true);
          
          // Auto-hide after 3 seconds
          setTimeout(() => {
            setShowSuccessMessage(false);
          }, 5000);
        }
        
        setDateCalories(response.data);
        
        // Check if all analyses are complete
        const analyses = response.data?.analyses || [];
        if (!hasIncompleteAnalyses(analyses)) {
          // Stop polling if all analyses are complete
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      }
    } catch (error) {
      logCritical("Error polling for completed analyses:", error);
    }
  };

  // Start/stop polling based on incomplete analyses
  useEffect(() => {
    const analyses = dateCalories?.analyses || [];
    const hasIncomplete = hasIncompleteAnalyses(analyses);
    
    if (hasIncomplete && !pollingInterval) {
      // Start polling every 5 seconds
      const interval = setInterval(pollForCompletedAnalyses, 5000);
      setPollingInterval(interval);
    } else if (!hasIncomplete && pollingInterval) {
      // Stop polling if no incomplete analyses
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    // Cleanup on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [dateCalories, pollingInterval]);

  // If selectedDay's month differs from selectedMonth, sync and trigger month-based dashboard fetch
  useEffect(() => {
    if (!selectedDay) return;
    const dayMonth = moment(selectedDay).format('MMMM YYYY');
    if (dayMonth !== selectedMonth) {
      setSelectedMonth(dayMonth);
    }
  }, [selectedDay, selectedMonth]);

  // Initial fetch for default time period
  useEffect(() => {
    fetchCalorieTrends(selectedTimePeriod);
    fetchBpTrends(selectedTimePeriod);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When background analysis completes, prepend lastFoodScan to current list for the selected day
  useEffect(() => {
    if (!isFoodScanPending && lastFoodScan && moment(lastFoodScan.created_at).isSame(selectedDay, 'day')) {
      setDateCalories((prev) => {
        const current = prev && Array.isArray(prev.analyses) ? prev.analyses : [];
        const exists = current.some((x) => (x.id && lastFoodScan.id && x.id === lastFoodScan.id) || (x.created_at === lastFoodScan.created_at && x.detected_food === lastFoodScan.detected_food));
        if (exists) {
          return prev || { analyses: current, meta: prev?.meta };
        }

        // Safely parse nutrition data and normalize numbers (strip 'g', handle undefined)
        const parseNumber = (val) => {
          if (val === null || val === undefined) return 0;
          if (typeof val === 'string') {
            const cleaned = val.replace(/[^0-9.\-]/g, '');
            const num = Number(cleaned);
            return isNaN(num) ? 0 : num;
          }
          const num = Number(val);
          return isNaN(num) ? 0 : num;
        };

        let nd = {};
        try {
          nd = JSON.parse(lastFoodScan.nutrition_data || lastFoodScan.nutrition_data_json || '{}');
        } catch (_) { nd = {}; }

        const addedCalories = parseNumber(lastFoodScan.calories ?? nd.calories);
        const addedProtein = parseNumber(nd.protein);
        const addedCarbs = parseNumber(nd.carbs);
        const addedFat = parseNumber(nd.fat ?? nd.fats);
        const addedFiber = parseNumber(nd.fiber);
        const addedSugar = parseNumber(nd.sugar);
        const addedSodium = parseNumber(nd.sodium);
        const addedHealthScore = parseNumber(nd.healthScore ?? lastFoodScan.health_score);

        const prevMeta = prev?.meta || { 
          totalCalories: 0, 
          totalProtein: 0, 
          totalCarbs: 0, 
          totalFat: 0, 
          totalFiber: 0, 
          totalSugar: 0, 
          totalSodium: 0, 
          totalHealthScore: 0
        };
        
        // Calculate average health score from all entries
        const allEntries = [lastFoodScan, ...current];
        const totalHealthScore = allEntries.reduce((sum, entry) => {
          let nd = {};
          try {
            nd = JSON.parse(entry.nutrition_data || entry.nutrition_data_json || '{}');
          } catch (_) { nd = {}; }
          const healthScore = parseNumber(nd.healthScore ?? entry.health_score);
          return sum + healthScore;
        }, 0);
        
        const entriesCount = allEntries.length;
        const avgHealthScore = entriesCount > 0 ? totalHealthScore / entriesCount : 0;
        const avgHealthScoreRounded = Math.round(avgHealthScore * 100) / 100;
        
        const meta = {
          ...prevMeta,
          totalCalories: parseNumber(prevMeta.totalCalories) + addedCalories,
          totalProtein: parseNumber(prevMeta.totalProtein) + addedProtein,
          totalCarbs: parseNumber(prevMeta.totalCarbs) + addedCarbs,
          totalFat: parseNumber(prevMeta.totalFat) + addedFat,
          totalFiber: parseNumber(prevMeta.totalFiber) + addedFiber,
          totalSugar: parseNumber(prevMeta.totalSugar) + addedSugar,
          totalSodium: parseNumber(prevMeta.totalSodium) + addedSodium,
          totalHealthScore: avgHealthScoreRounded,
        };

        const analyses = [lastFoodScan, ...current];
        return { ...(prev || {}), analyses, meta };
      });
      // Clear the lastFoodScan so it isn't re-added if user changes date
      setLastFoodScan(null);
    }
  }, [isFoodScanPending, lastFoodScan, selectedDay]);

  // After redirect from scan, auto-scroll to the relevant meal section (when result arrives)
  useEffect(() => {
    if (!isFoodScanPending && selectedMealFor) {
      const sectionId = `meal-${String(selectedMealFor).toLowerCase()}`;
      const el = document.getElementById(sectionId);
      if (el) {
        const headerOffset = 90; // account for fixed header/nav
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const top = rect.top + scrollTop - headerOffset;
        try { window.scrollTo({ top, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, top); }
      }
    }
  }, [isFoodScanPending, selectedMealFor]);

  // Also scroll immediately when user starts a pending scan (based on selected meal in modal)
  useEffect(() => {
    if (isFoodScanPending && pendingMealFor) {
      const sectionId = `meal-${String(pendingMealFor).toLowerCase()}`;
      const tryScroll = () => {
        const el = document.getElementById(sectionId);
        if (el) {
          const headerOffset = 90;
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const top = rect.top + scrollTop - headerOffset;
          try { window.scrollTo({ top, behavior: 'smooth' }); } catch (_) { window.scrollTo(0, top); }
        }
      };
      // Retry a few times in case the section renders slightly later
      const timeouts = [50, 150, 300];
      const timers = timeouts.map((ms) => setTimeout(tryScroll, ms));
      return () => timers.forEach(clearTimeout);
    }
  }, [isFoodScanPending, pendingMealFor, loader.caloriesByDateLoading, dateCalories?.analyses?.length]);

  const openNutritionFromScan = (scan) => {
    // Parse nutrition JSON safely
    let nd = {};
    try {
      nd = JSON.parse(scan.nutrition_data || scan.nutrition_data_json || '{}');
    } catch (_) { nd = {}; }

    // Helper function to extract base values (per unit) from quantity-adjusted values
    const extractBaseValue = (value, consumedCount = 1) => {
      if (value === null || value === undefined) return 0;
      if (consumedCount <= 0) return 0; // Protection against division by zero
      if (typeof value === "number") return value / consumedCount;
      if (typeof value === "string") {
        const cleaned = value.replace(/kcal|calories|grams?|g|mg|μg|ug|mcg|%/gi, " ");
        const match = cleaned.match(/-?\d+(?:\.\d+)?/);
        const num = match ? parseFloat(match[0]) : 0;
        return num / consumedCount;
      }
      return 0;
    };

    const consumedCount = Number(scan.consumed_count) || 1;

    const transformed = {
      mealName: scan.detected_food || nd.name || 'Unknown Food',
      mealType: 'Meal',
      calories: extractBaseValue(scan.calories ?? nd.calories, consumedCount),
      carbs: extractBaseValue(nd.carbs, consumedCount),
      protein: extractBaseValue(nd.protein, consumedCount),
      fats: extractBaseValue(nd.fat ?? nd.fats, consumedCount),
      healthScore: (nd.healthScore ?? scan.health_score),
      healthScoreReason: (nd.healthScoreReason ?? scan.health_score_reason),
      confidence: nd.confidence,
      consumed_count: scan.consumed_count,
      // ensure meal_for is available for save API
      meal_for: (scan.meal_for || nd.meal_for) ? String((scan.meal_for || nd.meal_for)).toLowerCase() : undefined,
      nutritionData: {
        fiber: extractBaseValue(nd.fiber, consumedCount),
        sugar: extractBaseValue(nd.sugar, consumedCount),
        sodium: extractBaseValue(nd.sodium, consumedCount),
        saturatedFat: extractBaseValue(nd.saturatedFat, consumedCount),
        unsaturatedFat: extractBaseValue(nd.unsaturatedFat, consumedCount),
        vitamins: nd.vitamins, // Keep vitamins as-is (usually percentages)
        minerals: nd.minerals, // Keep minerals as-is (usually percentages)
      },
      identifiedItems: [
        {
          name: scan.detected_food || nd.name || 'Unknown Food',
          amount: extractBaseValue(scan.calories ?? nd.calories, consumedCount),
          unit: 'cal',
          confidence: nd.confidence,
          consumed_count: scan.consumed_count,
        },
      ],
    };

    setNutritionModalData(transformed);
    setNutritionModalImage(scan.image_url || foodScanPreviewUrl || null);
    setShowNutritionModal(true);
  };

  const updateFoodAnalysis = async (scanId, payload) => {
    // Remove empty keys recursively
    const prune = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      const out = Array.isArray(obj) ? [] : {};
      Object.entries(obj).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return;
        if (typeof v === 'object' && !Array.isArray(v)) {
          const child = prune(v);
          if (child && Object.keys(child).length > 0) out[k] = child;
        } else {
          out[k] = v;
        }
      });
      return out;
    };

    const cleanPayload = prune(payload) || {};
    const url = `/food-analysis/${encodeURIComponent(scanId)}`;
    // Skip backend update for demo routes
    const isDemo = window?.location?.pathname?.includes('/demos/');
    if (isDemo) return { skipped: true };
    const res = await apiClient.put(url, cleanPayload);
    return res?.data || {};
  };

  const deleteFoodAnalysis = async (scanId) => {
    const url = `/food-analysis/${encodeURIComponent(scanId)}`;
    // Skip backend update for demo routes
    const isDemo = window?.location?.pathname?.includes('/demos/');
    if (isDemo) return { skipped: true };
    const res = await apiClient.delete(url);
    return res?.data || {};
  };

  const handleDoneUpdate = async (updatedPayload) => {
    try {
      // Check if this is a no-change scenario
      if (updatedPayload?.noChange) {
        setShowNutritionModal(false);
        return;
      }

      // Identify the scan being edited: take top of current list (from modal trigger)
      const raw = Array.isArray(dateCalories?.analyses) && dateCalories?.analyses?.length > 0 ? dateCalories.analyses : [];
      const edited = nutritionModalData && raw.find((x) => (x.image_url && x.image_url === nutritionModalImage) || (x.created_at === (lastFoodScan?.created_at)) || (x.id && x.id === (lastFoodScan?.id)) ) || raw[0];
      if (!edited) {
        setShowNutritionModal(false);
        return;
      }

      // Call backend update if id exists
      if (edited.id) {
        try { await updateFoodAnalysis(edited.id, updatedPayload); } catch (_) {}
      }

      // Compute delta and update local state (analyses + meta)
      const parseNum = (val) => {
        if (val === undefined || val === null) return 0;
        if (typeof val === 'string') {
          const cleaned = val.replace(/[^0-9.\-]/g, '');
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : 0;
        }
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
      };

      const beforeNd = (() => { try { return JSON.parse(edited.nutrition_data || edited.nutrition_data_json || '{}'); } catch { return {}; } })();
      const afterNd = updatedPayload?.nutrition || {};
      const consumedCount = Number(updatedPayload?.consumed_count) || edited?.consumed_count || 1;
      const originalConsumedCount = Number(edited?.consumed_count) || 1;

      // Extract base values (per unit) from the original data
      const extractBaseValue = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const cleaned = value.replace(/kcal|calories|grams?|g|mg|μg|ug|mcg|%/gi, " ");
          const match = cleaned.match(/-?\d+(?:\.\d+)?/);
          return match ? parseFloat(match[0]) : 0;
        }
        return 0;
      };

      // Get base values (per unit) - divide by original consumed_count to get true base values
      const baseCalories = originalConsumedCount > 0 ? extractBaseValue(edited.calories ?? beforeNd.calories) / originalConsumedCount : 0;
      const baseProtein = originalConsumedCount > 0 ? extractBaseValue(beforeNd.protein) / originalConsumedCount : 0;
      const baseCarbs = originalConsumedCount > 0 ? extractBaseValue(beforeNd.carbs) / originalConsumedCount : 0;
      const baseFat = originalConsumedCount > 0 ? extractBaseValue(beforeNd.fat ?? beforeNd.fats) / originalConsumedCount : 0;

      // Calculate "before" values (original quantity-adjusted values)
      const beforeCalories = baseCalories * originalConsumedCount;
      const beforeProtein = baseProtein * originalConsumedCount;
      const beforeCarbs = baseCarbs * originalConsumedCount;
      const beforeFat = baseFat * originalConsumedCount;

      // Get "after" values (new quantity-adjusted values)
      const afterCalories = baseCalories * consumedCount;
      const afterProtein = baseProtein * consumedCount;
      const afterCarbs = baseCarbs * consumedCount;
      const afterFat = baseFat * consumedCount;

      // Calculate deltas
      const dCalories = afterCalories - beforeCalories;
      const dProtein = afterProtein - beforeProtein;
      const dCarbs = afterCarbs - beforeCarbs;
      const dFat = afterFat - beforeFat;

      setDateCalories((prev) => {
        const current = prev && Array.isArray(prev.analyses) ? prev.analyses : [];
        const nextAnalyses = current.map((x) => {
          if ((edited.id && x.id === edited.id) || (x.created_at === edited.created_at)) {
            const mergedNutrition = {
              ...beforeNd,
              ...afterNd,
            };
            const updated = {
              ...x,
              detected_food: updatedPayload?.detectedFood ?? x.detected_food,
              calories: Number.isFinite(afterCalories) && afterCalories > 0 ? afterCalories : x.calories,
              nutrition_data: JSON.stringify(mergedNutrition),
              consumed_count: consumedCount,
            };
            return updated;
          }
          return x;
        });

        const prevMeta = prev?.meta || { 
          totalCalories: 0, 
          totalProtein: 0, 
          totalCarbs: 0, 
          totalFat: 0, 
          totalFiber: 0, 
          totalSugar: 0, 
          totalSodium: 0, 
          totalHealthScore: 0
        };
        
        // Calculate average health score from all entries after edit
        const totalHealthScore = nextAnalyses.reduce((sum, entry) => {
          let nd = {};
          try {
            nd = JSON.parse(entry.nutrition_data || entry.nutrition_data_json || '{}');
          } catch (_) { nd = {}; }
          const healthScore = parseNum(nd.healthScore ?? entry.health_score);
          return sum + healthScore;
        }, 0);
        
        const entriesCount = nextAnalyses.length;
        const avgHealthScore = entriesCount > 0 ? totalHealthScore / entriesCount : 0;
        const avgHealthScoreRounded = Math.round(avgHealthScore * 100) / 100;
        
        const meta = {
          ...prevMeta,
          totalCalories: parseNum(prevMeta.totalCalories) + dCalories,
          totalProtein: parseNum(prevMeta.totalProtein) + dProtein,
          totalCarbs: parseNum(prevMeta.totalCarbs) + dCarbs,
          totalFat: parseNum(prevMeta.totalFat) + dFat,
          totalFiber: parseNum(prevMeta.totalFiber) + (parseNum(afterNd.fiber) - parseNum(beforeNd.fiber)),
          totalSugar: parseNum(prevMeta.totalSugar) + (parseNum(afterNd.sugar) - parseNum(beforeNd.sugar)),
          totalSodium: parseNum(prevMeta.totalSodium) + (parseNum(afterNd.sodium) - parseNum(beforeNd.sodium)),
          totalHealthScore: avgHealthScoreRounded,
        };

        return { ...(prev || {}), analyses: nextAnalyses, meta };
      });

    } finally {
      setShowNutritionModal(false);
    }
  };

  const handleDeleteFood = async () => {
    try {
      // Identify the scan being deleted
      const raw = Array.isArray(dateCalories?.analyses) && dateCalories?.analyses?.length > 0 ? dateCalories.analyses : [];
      const edited = nutritionModalData && raw.find((x) => (x.image_url && x.image_url === nutritionModalImage) || (x.created_at === (lastFoodScan?.created_at)) || (x.id && x.id === (lastFoodScan?.id)) ) || raw[0];
      
      if (!edited) {
        setShowNutritionModal(false);
        return;
      }

      // Call backend delete if id exists
      if (edited.id) {
        try { 
          await deleteFoodAnalysis(edited.id); 
        } catch (error) {
          toast.error('Failed to delete food item');
          return;
        }
      }

      // Calculate nutrition values to subtract from totals
      const parseNum = (val) => {
        if (val === undefined || val === null) return 0;
        if (typeof val === "string") {
          const cleaned = val.replace(/[^0-9.\-]/g, '');
          const n = Number(cleaned);
          return Number.isFinite(n) ? n : 0;
        }
        const n = Number(val);
        return Number.isFinite(n) ? n : 0;
      };

      const beforeNd = (() => { try { return JSON.parse(edited.nutrition_data || edited.nutrition_data_json || '{}'); } catch { return {}; } })();
      const consumedCount = Number(edited?.consumed_count) || 1;

      // Extract base values (per unit) from the original data
      const extractBaseValue = (value) => {
        if (value === null || value === undefined) return 0;
        if (typeof value === "number") return value;
        if (typeof value === "string") {
          const cleaned = value.replace(/kcal|calories|grams?|g|mg|μg|ug|mcg|%/gi, " ");
          const match = cleaned.match(/-?\d+(?:\.\d+)?/);
          return match ? parseFloat(match[0]) : 0;
        }
        return 0;
      };

      // Get base values (per unit)
      const baseCalories = extractBaseValue(edited.calories ?? beforeNd.calories);
      const baseProtein = extractBaseValue(beforeNd.protein);
      const baseCarbs = extractBaseValue(beforeNd.carbs);
      const baseFat = extractBaseValue(beforeNd.fat ?? beforeNd.fats);
      const baseFiber = extractBaseValue(beforeNd.fiber);
      const baseSugar = extractBaseValue(beforeNd.sugar);
      const baseSodium = extractBaseValue(beforeNd.sodium);
      const baseHealthScore = extractBaseValue(beforeNd.healthScore ?? edited.health_score);

      // Calculate total values that were added (base * quantity)
      const totalCalories = baseCalories * consumedCount;
      const totalProtein = baseProtein * consumedCount;
      const totalCarbs = baseCarbs * consumedCount;
      const totalFat = baseFat * consumedCount;
      const totalFiber = baseFiber * consumedCount;
      const totalSugar = baseSugar * consumedCount;
      const totalSodium = baseSodium * consumedCount;
      const totalHealthScore = baseHealthScore * consumedCount;

      // Remove from local state
      setDateCalories((prev) => {
        const current = prev && Array.isArray(prev.analyses) ? prev.analyses : [];
        const nextAnalyses = current.filter((x) => {
          return !((edited.id && x.id === edited.id) || (x.created_at === edited.created_at));
        });

        const prevMeta = prev?.meta || { 
          totalCalories: 0, 
          totalProtein: 0, 
          totalCarbs: 0, 
          totalFat: 0, 
          totalFiber: 0, 
          totalSugar: 0, 
          totalSodium: 0, 
          totalHealthScore: 0
        };
        
        // Calculate average health score from remaining entries after deletion
        const totalHealthScore = nextAnalyses.reduce((sum, entry) => {
          let nd = {};
          try {
            nd = JSON.parse(entry.nutrition_data || entry.nutrition_data_json || '{}');
          } catch (_) { nd = {}; }
          const healthScore = parseNum(nd.healthScore ?? entry.health_score);
          return sum + healthScore;
        }, 0);
        
        const entriesCount = nextAnalyses.length;
        const avgHealthScore = entriesCount > 0 ? totalHealthScore / entriesCount : 0;
        const avgHealthScoreRounded = Math.round(avgHealthScore * 100) / 100;
        
        const meta = {
          ...prevMeta,
          totalCalories: Math.max(0, parseNum(prevMeta.totalCalories) - totalCalories),
          totalProtein: Math.max(0, parseNum(prevMeta.totalProtein) - totalProtein),
          totalCarbs: Math.max(0, parseNum(prevMeta.totalCarbs) - totalCarbs),
          totalFat: Math.max(0, parseNum(prevMeta.totalFat) - totalFat),
          totalFiber: Math.max(0, parseNum(prevMeta.totalFiber) - totalFiber),
          totalSugar: Math.max(0, parseNum(prevMeta.totalSugar) - totalSugar),
          totalSodium: Math.max(0, parseNum(prevMeta.totalSodium) - totalSodium),
          totalHealthScore: avgHealthScoreRounded,
        };

        return { ...(prev || {}), analyses: nextAnalyses, meta };
      });

      toast.success('Food item deleted successfully');
    } finally {
      setShowNutritionModal(false);
    }
  };

  const getTimePeriod = () => {
    if (selectedTimePeriod === "this-week") {
      return t("patientDashboard.week");
    } else if (selectedTimePeriod === "last-week") {
      return t("patientDashboard.week");
    } else if (selectedTimePeriod === "this-month") {
      return t("patientDashboard.month");
    } else if (selectedTimePeriod === "last-month") {
      return t("patientDashboard.month");
    }
  }

  // Mock gift card data - In real app, this would come from API
  const mockGiftCardData = {
    title: "Amazon Gift Card",
    description: "Use this gift card to purchase anything on Amazon",
    code: "AVATARX2024" + Math.random().toString(36).substr(2, 6).toUpperCase(),
    value: 25,
    merchant: "Amazon",
    merchantUrl: "https://amazon.com",
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
  };

  // Helper function to determine e-gift eligibility
  const getEGiftEligibility = () => {
    const vitalsCount = dashboardData?.vitals_count || 0;
    const isCurrentMonth = selectedMonth === moment().format('MMMM YYYY');
    
    if (!isCurrentMonth) return null; // Only show e-gift eligibility for current month
    
    if (vitalsCount >= 16) {
      return {
        status: 'earned',
        message: t("patientDashboard.eGiftEarnedMessage"),
        remaining: 0
      };
    } else if (vitalsCount > 0) {
      return {
        status: 'progress',
        message: t("patientDashboard.eGiftProgressMessage", { remaining: 16 - vitalsCount }),
        remaining: 16 - vitalsCount
      };
    } else {
      return {
        status: 'eligible',
        message: t("patientDashboard.eGiftMessage"),
        remaining: 16
      };
    }
  };

  // Function to show gift card when user earns it
  const handleShowGiftCard = () => {
    setGiftCardData(mockGiftCardData);
    setShowGiftCard(true);
  };

  // Function to handle gift card redemption
  const handleGiftCardRedemption = () => {
    setShowGiftCard(false);
    setGiftCardData(null);
    toast.success(t("patientDashboard.giftCardRedeemed"));
  };


  // Handler for subscription modal
  const handleVitalsSubscription = () => {
    // Close the modal
    setShowVitalsSubscriptionModal(false);
    // Navigate to vitals page after subscription
    navigate("/patient/check-vitals");
    // You can add your subscription logic here
    // For example, make an API call to subscribe the user
  };

  return (
    <div className="patient-dashboard mt-12 pt-[65px] lg:pt-[80px]">
      {/* Top Section - Header */}


        <div className="dashboard-header">

      {associatedPatients && associatedPatients.length > 0 ? (
            <div className="profile-section">
              <div className="flex items-center gap-4">
                <div className="profile-picture">
                  <img src={userImage} alt="Profile" className="profile-avatar" />
                </div>
                <div className="profile-info">
                  {associatedPatients.length === 1 ? (
                    <PatientCardHeading 
                      title={`${selectedPatient?.first_name} ${selectedPatient?.last_name}`} 
                      className="!mb-0" 
                    />
                  ) : (
                    <Select 
                      value={selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : ""}
                      onValueChange={(value) => {
                        const patient = associatedPatients.find(p => `${p.first_name} ${p.last_name}` === value);
                        if (patient) {
                          switchAccount(patient.id);
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px] bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
                        <SelectValue placeholder="Select Patient" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-200">
                        {associatedPatients.map((patient) => (
                          <SelectItem 
                            key={patient.id} 
                            value={`${patient.first_name} ${patient.last_name}`}
                          >
                            {`${patient.first_name} ${patient.last_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
        ) : (
          <></>
            // <div className="profile-section">
            //   <div className="profile-picture">
            //     <img src={userImage} alt="Profile" className="profile-avatar" />
            //   </div>
            //   <div className="profile-info">
            //     <PatientCardHeading title={getPatientName()} className="!mb-0" />
            //   </div>
            // </div>
        )}



        {loader.associatedAccountsLoading && <Loader />}
        
        {/* Calendar icon with month name in place of month dropdown */}
        <div className="date-selector">
          <button 
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            data-calendar-button
          >
            <Calendar className="w-5 h-5 text-gray-700" />
            <span className="text-sm font-medium text-gray-700">
              {selectedDay ? moment(selectedDay).format('MMMM YYYY') : moment().format('MMMM YYYY')}
            </span>
          </button>
        </div>
      </div>
      <CalendarPicker 
        selectedDay={selectedDay} 
        onChange={(day) => setSelectedDay(day)} 
        showCalendar={showCalendar}
        onToggleCalendar={() => setShowCalendar(!showCalendar)}
      />

      {/* Logging Progress Section */}
      { selectedMonth !== moment().format('MMMM YYYY') && <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
        <div className="text-center">
          {dashboardData?.vitals_count >= 16 ? (
            <>
              <PatientCardHeading title={t("patientDashboard.loggingProgress")} />
              <PatientCardHeading title={t("patientDashboard.congratulations")} className="!text-center" />
              <div className="flex justify-center mb-6">
                <CircularProgress progress={100} />
              </div>
              <p className="text-md text-black font-medium">
                {t("patientDashboard.congratulationsMessage")}
              </p>
            </>
          ) : dashboardData?.vitals_count === 0 ? (
            // Enhanced UI for when no vitals are available
            <>
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <PatientCardHeading title={t("patientDashboard.startYourJourney", "Start Your Health Journey")} className="!text-center text-xl" />
                <p className="text-md text-gray-600 font-medium mb-4">
                  {t("patientDashboard.noVitalsMessage", "Take your first vital signs reading to begin tracking your health progress")}
                </p>
                <PatientDashboardButton
                  btnClick={() => navigate("/patient/check-vitals")}
                  btnText={t("patientDashboard.startVitalsScan", "Start Vitals Scan")}
                  className="w-full"
                />
              </div>
            </>
          ) : (
            <>
              <PatientCardHeading title={t("patientDashboard.loggingProgress")} />
              <PatientCardHeading title={t("patientDashboard.greatJob")} className="!text-center" />
              <div className="flex justify-center mb-6">
                <CircularProgress progress={((dashboardData?.vitals_count ? dashboardData?.vitals_count > 16 ? 16 : dashboardData?.vitals_count : 0) / 16) * 100} />
              </div>
              <p className="text-md text-black font-medium">
                {t("patientDashboard.readingsRemaining", {
                  count: dashboardData?.vitals_count || 0,
                  remaining: 16 - (dashboardData?.vitals_count || 0)
                })}
              </p>
            </>
          )}
        </div>
      </div>}

      {/* E-Gift Eligibility Section - Only show for current month */}
      {getEGiftEligibility() && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <Gift className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {getEGiftEligibility()?.status === 'earned' ? (
              <>
                <PatientCardHeading title={t("patientDashboard.eGiftEligible")} className="!text-center text-xl text-black" />
                <p className="text-md text-gray-600 font-medium mt-2">
                  {getEGiftEligibility()?.message}
                </p>
                {/* <div className="mt-4 inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mb-4">
                  🎉 {t("patientDashboard.rewardUnlocked")}
                </div>
                <div className="mt-4">
                  <PatientDashboardButton
                    btnClick={handleShowGiftCard}
                    btnText={t("patientDashboard.viewGiftCard")}
                    className="w-full"
                  />
                </div> */}
              </>
            ) : (
              <>
                <PatientCardHeading title={t("patientDashboard.eGiftEligible")} className="!text-center text-xl text-black" />
                <p className="text-md text-black font-medium">
                  {getEGiftEligibility()?.message}
                </p>
                
                {/* Progress bar for e-gift */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{t("patientDashboard.progressToEGift")}</span>
                    <span>{dashboardData?.vitals_count || 0}/16 {t("patientDashboard.readings")}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${((dashboardData?.vitals_count || 0) / 16) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className={`mt-4 flex gap-2 max-[370px]:flex-col ${i18n?.language?.startsWith('es') ? 'flex-col' : ''}`}>
                  <PatientDashboardButton
                    btnClick={() => navigate("/patient/check-vitals")}
                    btnText={t("patientDashboard.startVitalsScan", "Start Vitals Scan")}
                    className={`${i18n?.language?.startsWith('es') ? 'w-full' : 'flex-1'} max-[370px]:w-full`}
                  />
                  <PatientDashboardButton 
                    btnClick={() => navigate("/patient/check-calories")} 
                    btnText={t("patientDashboard.startCalorieTracking")} 
                    icon={<Flame className="w-4 h-4" />} 
                    className={`${i18n?.language?.startsWith('es') ? 'w-full' : 'flex-1'} max-[370px]:w-full`}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Gift Card Display */}
      {showGiftCard && giftCardData && (
        <GiftCard 
          giftData={giftCardData} 
          onRedeem={handleGiftCardRedemption}
        />
      )}
      {/* Quick Actions Card */}
     {!(dashboardData?.today_calories && dashboardData?.today_calories > 0) ? <div className="mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
              <Activity className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <PatientCardHeading title={t("userProfile.checkVitals", "Check Vitals")} />
              <p className="text-md text-black font-medium text-left">
                {t('patientDashboard.heartRateBpBreathingRate', 'Heart rate, BP, breathing rate')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <PatientDashboardButton btnClick={() => navigate("/patient/check-vitals")} btnText={t("userProfile.startVitalsScan", "Start Vitals Scan")} />
          </div>
        </div>
        {/* <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-200">
              <Camera className="w-6 h-6 text-gray-700" />
            </div>
            <div className="flex-1 min-w-0">
              <PatientCardHeading title={t("userProfile.trackCalories", "Track Calories")} />
              <p className="text-md text-black font-medium text-left">
                {t('patientDashboard.foodScanNutritionAnalysis', 'Food scan & nutrition analysis')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <PatientDashboardButton btnClick={() => navigate("/patient/check-calories")} btnText={t("patientDashboard.startCalorieTracking")} icon={<Flame className="w-4 h-4" />} />
          </div>
        </div> */}
      </div> : <></>}

      {/* Alerts Card */}
      {(dashboardData?.alert?.alert_in !== null && dashboardData?.alert?.alert !== 'low' && dashboardData?.vitals_count > 0) &&
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <PatientCardHeading title={t("patientDashboard.alertFields." + dashboardData?.alert?.alert_in)} />
            <div className="text-md text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{moment(dashboardData?.alert?.alert_created_at).format('DD MMM hh:mm A')}</div>
          </div>

          {/* Alerts Content */}
          <div className="space-y-3 mb-4">
            <div className="flex gap-2 items-center">
              {/* <div className={`w-2 h-2 bg-gray-500 rounded-full flex-shrink-0`}></div> */}
              <p className="text-md text-black font-medium">{dashboardData?.alert?.alert_reason}</p>
            </div>
          </div>

          {/* Bottom Row: Alert Count + Button */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-2">
            </div>
            <PatientDashboardButton btnClick={() => navigate("/patient/check-vitals")} btnText={t("patientDashboard.startVitalsScan")} />
          </div>
        </div>}
          {/* Calendar + Week strip */}
      {(() => {
        const meta = dateCalories?.meta;
        const hasApiTotals = !!meta;
        const totalCalories = hasApiTotals ? (meta?.totalCalories || 0) : (dashboardData?.today_calories || 0);
        const totalProtein = hasApiTotals ? (meta?.totalProtein || 0) : (dashboardData?.today_protein_count || 0);
        const totalCarbs = hasApiTotals ? (meta?.totalCarbs || 0) : (dashboardData?.today_carbs_count || 0);
        const totalFat = hasApiTotals ? (meta?.totalFat || 0) : (dashboardData?.today_fat_count || 0);
        const totalFiber = hasApiTotals ? (meta?.totalFiber || 0) : (dashboardData?.today_fiber_count || 0);
        const totalSugar = hasApiTotals ? (meta?.totalSugar || 0) : (dashboardData?.today_sugar_count || 0);
        const totalSodium = hasApiTotals ? (meta?.totalSodium || 0) : (dashboardData?.today_sodium_count || 0);
        const healthScore = hasApiTotals ? (meta?.totalHealthScore || 0) : (dashboardData?.today_health_score || 0);
        const healthScoreReason = hasApiTotals ? (meta?.totalHealthScoreReason || '') : (dashboardData?.today_health_score_reason || '');

        return (
          <div className="relative">
            <TodayCaloriesSummary
              totalCalories={totalCalories}
              totalProtein={totalProtein}
              totalCarbs={totalCarbs}
              totalFat={totalFat}
              totalFiber={totalFiber}
              totalSugar={totalSugar}
              totalSodium={totalSodium}
              targets={calorieTrends?.meta?.targets}
              healthScore={healthScore}
              // healthScoreReason={healthScoreReason}
            />
            {loader.caloriesByDateLoading && (
              <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              </div>
            )}
          </div>
        );
      })()}
      {/* Food Intake Section */}
      <div className="mb-4 relative">
        {/* Removed spinner overlay here to avoid duplicate loaders */}
        <div className="flex items-center justify-between mb-1">
          <PatientCardHeading title={t("patientDashboard.foodIntake", "Food Intake")} />
          {/* <h2 className="text-xl font-semibold text-gray-700">Recently logged</h2> */}
          {/* <PatientDashboardButton 
            btnClick={() => navigate("/food-scanner")} 
            btnText="Scan New Food" 
          /> */}
        </div>
        <div className="space-y-4">
          {/* Clean Meal Categories Component */}
          <MealCategoriesList 
            analyses={dateCalories?.analyses || []}
            isLoading={loader.caloriesByDateLoading}
            onItemClick={openNutritionFromScan}
            pendingPreviewUrl={isFoodScanPending ? foodScanPreviewUrl : null}
            pendingProgress={foodScanProgress}
            pendingPhase={foodScanPhase}
            pendingMealFor={isFoodScanPending ? (String(pendingMealFor || '').toLowerCase() || null) : null}
          />
        </div>
      </div>

      {/* Blood Pressure Card */}
      <PatientCard title={t("patientDashboard.bloodPressure")} data={dashboardData?.last_vital} vitalDate={dashboardData?.last_vital?.created_at ? moment(dashboardData.last_vital.created_at).format('DD MMM hh:mm A') : null} showNoData={!dashboardData?.last_vital?.systolic_blood_pressure_mmhg || !dashboardData?.last_vital?.diastolic_blood_pressure_mmhg} noDataText={t("patientDashboard.noDataText")} loading={loader.dashboardDataLoading} btnClick={() => navigate("/patient/check-vitals")} buttonText={t("userProfile.startVitalsScan", "Start Vitals Scan")} >
        {dashboardData?.last_vital  ?.systolic_blood_pressure_mmhg && dashboardData?.last_vital?.diastolic_blood_pressure_mmhg && <div className="flex items-baseline gap-1">
          <PatientCardHeading title={dashboardData?.last_vital?.systolic_blood_pressure_mmhg} />
          <PatientCardHeading title="/" />
          <PatientCardHeading title={dashboardData?.last_vital?.diastolic_blood_pressure_mmhg} /> <span className="text-sm text-gray-500 font-medium">mmHg</span>
        </div>}
      </PatientCard>

      {/* BP Trends Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <PatientCardHeading title={t("patientDashboard.bloodPressureTrends", "Blood Pressure Trends")} />
          <div className="rounded-md">
            <Select value={selectedTimePeriod} onValueChange={(value)=>{fetchBpTrends(value); setSelectedTimePeriod(value);}} disabled={loader.bpTrendsLoading}>
              <SelectTrigger className="w-32 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-xs">
                <SelectValue placeholder={t("patientDashboard.timePeriod")} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-xs">
                <SelectItem value="this-week">{t("patientDashboard.thisWeek")}</SelectItem>
                <SelectItem value="last-week">{t("patientDashboard.lastWeek")}</SelectItem>
                <SelectItem value="this-month">{t("patientDashboard.thisMonth")}</SelectItem>
                <SelectItem value="last-month">{t("patientDashboard.lastMonth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loader.bpTrendsLoading ? (
          <div className="w-full h-[160px] mb-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>) : (
          <>
            {Array.isArray(bpTrends?.data) && bpTrends?.data?.length > 0 ? (
              <BpTrendsChart data={bpTrends?.data} />) : (
              <div className="text-center">
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <Activity className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                  <PatientCardHeading title={t("patientDashboard.startBpTracking", "Start BP Tracking")} className="!text-center text-lg" />
                  <p className="text-md text-gray-600 font-medium pb-4">
                    {t("patientDashboard.noBpMessage", "Begin tracking your blood pressure to monitor your cardiovascular health")}
                  </p>
                </div>
              </div>
            )}
          </>)}
        {/* Bottom Row: BP Summary + Button */}
        <div className="flex justify-between items-end">
          {!loader.bpTrendsLoading && (bpTrends?.meta?.averageSystolic && bpTrends?.meta?.averageDiastolic) ?
            <div className="flex items-baseline gap-1">
              <PatientCardHeading title={`${Math.round(bpTrends?.meta?.averageSystolic)}/${Math.round(bpTrends?.meta?.averageDiastolic)}`} />
              <span className="text-sm text-gray-500 font-medium">mmHg</span>
              <span className="text-sm text-gray-500 font-medium">/</span>
              <span className="text-sm text-gray-500 font-medium">{getTimePeriod()}</span>
            </div> : <div></div>}
        </div>
        <div className='flex justify-end'>
          <PatientDashboardButton btnClick={() => navigate("/patient/check-vitals")} btnText={t("userProfile.startVitalsScan", "Start Vitals Scan")} icon={<Activity className="w-4 h-4" />} />
        </div>
      </div>

      {/* Calorie Trends Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <PatientCardHeading title={t("patientDashboard.calorieTrends")} />
          <div className="rounded-md">
            <Select value={selectedTimePeriod} onValueChange={(value)=>{fetchCalorieTrends(value); setSelectedTimePeriod(value);}} disabled={loader.caloriesTrendsLoading}>
              <SelectTrigger className="w-32 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 text-xs">
                <SelectValue placeholder={t("patientDashboard.timePeriod")} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 text-xs">
                <SelectItem value="this-week">{t("patientDashboard.thisWeek")}</SelectItem>
                <SelectItem value="last-week">{t("patientDashboard.lastWeek")}</SelectItem>
                <SelectItem value="this-month">{t("patientDashboard.thisMonth")}</SelectItem>
                <SelectItem value="last-month">{t("patientDashboard.lastMonth")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loader.caloriesTrendsLoading ? (
          <div className="w-full h-[160px] mb-4 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>) : (
          <>
            {Array.isArray(calorieTrends?.data) && calorieTrends?.data?.length > 0 ? (
              <CalorieTrendsChart data={calorieTrends?.data} />) : (
              <div className="text-center">
                <div className="space-y-4">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                      <Utensils className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <PatientCardHeading title={t("patientDashboard.startNutritionTracking", "Start Nutrition Tracking")} className="!text-center text-lg" />
                  <p className="text-md text-gray-600 font-medium pb-4">
                    {t("patientDashboard.noCaloriesMessage", "Begin tracking your daily nutrition to understand your eating habits")}
                  </p>
                </div>
              </div>
            )}
          </>)}
        {/* Bottom Row: Calorie Count + Button */}
        <div className="flex justify-between items-end">

          {!loader.caloriesTrendsLoading && (calorieTrends?.meta?.totalCalories && calorieTrends?.meta?.totalCalories > 0) ?
            <div className="flex items-baseline gap-1">
              <PatientCardHeading title={calorieTrends?.meta?.totalCalories || 0} />
              <span className="text-sm text-gray-500 font-medium">{t("patientDashboard.calories")}</span>
              <span className="text-sm text-gray-500 font-medium">/</span>
              <span className="text-sm text-gray-500 font-medium">{getTimePeriod()}</span>
            </div> : <div></div>}
        </div>
        <div className='flex justify-end'>

          <PatientDashboardButton btnClick={() => navigate("/patient/check-calories")} btnText={t("patientDashboard.startCalorieTracking")} icon={<Flame className="w-4 h-4" />} />
        </div>

      </div>

      {/* Nutrition Summary Cards - After Trends Card */}
      {!loader.caloriesTrendsLoading && (calorieTrends?.meta?.totalCalories && calorieTrends?.meta?.totalCalories > 0) ? (
        <div className="grid grid-cols-3 gap-1 mb-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-left">
            <PatientCardHeading title={t("nutritionResults.protein")} />
            <span className="text-sm text-gray-500 font-medium">{calorieTrends?.meta?.totalProtein + 'g'}</span>
            <span className="text-sm text-gray-500 font-medium">/</span>
            <span className="text-sm text-gray-500 font-medium">{getTimePeriod()}</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-left">
            <PatientCardHeading title={t("nutritionResults.carbs")} />
            <span className="text-sm text-gray-500 font-medium">{calorieTrends?.meta?.totalCarbs + 'g'}</span>
            <span className="text-sm text-gray-500 font-medium">/</span>
            <span className="text-sm text-gray-500 font-medium">{getTimePeriod()}</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-left">
            <PatientCardHeading title={t("fat")} />
            <span className="text-sm text-gray-500 font-medium">{calorieTrends?.meta?.totalFat + 'g'}</span>
            <span className="text-sm text-gray-500 font-medium">/</span>
            <span className="text-sm text-gray-500 font-medium">{getTimePeriod()}</span>
          </div>
        </div>
      ) : <div></div>}

      {/* Mobile Navigation Footer */}
      <MobileNavigation />
  {showNutritionModal && nutritionModalData && (
    <NutritionResults
      results={nutritionModalData}
      foodImage={nutritionModalImage}
      onClose={() => setShowNutritionModal(false)}
      onEdit={() => {}}
      onDone={handleDoneUpdate}
      onDelete={handleDeleteFood}
    />
  )}
  
    {/* Success Message Toast - Bottom Center */}
    {showSuccessMessage && successMessageData && (
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up px-4 w-full max-w-md">
        <div className="bg-gray-800 text-white rounded-2xl shadow-2xl p-5 min-w-[340px] max-w-md border border-gray-600">
          {/* Header with Icon and Title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-green-400 font-bold text-lg">Log Successful</span>
          </div>
          
          {/* Main Content - Horizontal Layout */}
          <div className="flex items-center gap-4">
            {/* Food Image - Left Side */}
            {successMessageData.image && (
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-md">
                  <img 
                    src={successMessageData.image} 
                    alt={successMessageData.foodName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              </div>
            )}
            
            {/* Meal Info - Right Side */}
            <div className="">
              <div className="text-white font-semibold capitalize text-base text-left">
                {successMessageData.mealType}
              </div>
              <div className="text-gray-300 text-sm text-left">
                {successMessageData.foodName}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default PatientDashboard;