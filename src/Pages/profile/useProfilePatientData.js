import moment from "moment";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import apiClient from "../../config/APIConfig";
import { logCritical, logError, logInfo, logWarn } from "../../utils/logger";
import { roundVital } from "../../utils/utils";
import { getMonthList } from "../../api/dashboard.service";

export const useProfilePatientData = () => {
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0); // index into dynamic months list
  const [patientData, setPatientData] = useState(null);
  const [userFilteredData, setUserFilteredData] = useState([]);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [patientStatus, setPatientStatus] = useState({
    status: null,
    show: false,
  });
  const [chartData, setChartData] = useState({ series: [], options: {} });
  const [selectedChartVital, setSelectedChartVital] = useState("All"); // Default to "All"
  const [trendsType, setTrendsType] = useState("vitals"); // "vitals" or "calories"
  const { patientSlug } = useParams();
  const { t, i18n } = useTranslation();

  // localStorage key for user preferences
  const STORAGE_KEY = `userProfile_preferences_${patientSlug || 'default'}`;

  // Helper functions for localStorage
  const savePreferences = (prefs) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error("Error saving preferences to localStorage:", error);
    }
  };

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const prefs = saved ? JSON.parse(saved) : null;
      return prefs;
    } catch (error) {
      console.error("Error loading preferences from localStorage:", error);
      return null;
    }
  };

  // Dynamic month filter options built from available data (latest first)
  const [monthFilterOptions, setMonthFilterOptions] = useState([]);

  // Fetch month list from API and initialize month options
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const res = await getMonthList();
        const apiMonths = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (apiMonths.length > 0) {
          const labels = apiMonths.map((m) => m?.displayName || (m?.monthName && m?.year ? `${m.monthName} ${m.year}` : null)).filter(Boolean);
          const finalMonths = labels.length > 0 ? labels : [moment().format("MMMM YYYY")];
          setMonthFilterOptions(finalMonths);
          // Ensure selected index is in bounds
          if (selectedRangeIndex >= finalMonths.length) {
            setSelectedRangeIndex(0);
          }
        } else {
          setMonthFilterOptions([moment().format("MMMM YYYY")]);
          if (selectedRangeIndex !== 0) setSelectedRangeIndex(0);
        }
      } catch (error) {
        logWarn("Falling back to current month list due to month API error");
        setMonthFilterOptions([moment().format("MMMM YYYY")]);
        if (selectedRangeIndex !== 0) setSelectedRangeIndex(0);
      }
    };
    fetchMonths();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientSlug]);

  // Load user preferences on component mount (only for non-patient views)
  useEffect(() => {
    // Skip loading preferences if viewing a patient
    if (patientSlug) {
      return;
    }
    
    const savedPrefs = loadPreferences();
    if (savedPrefs) {
      // Validate and restore selectedRangeIndex
      if (savedPrefs.selectedRangeIndex !== undefined && 
          typeof savedPrefs.selectedRangeIndex === 'number' &&
          savedPrefs.selectedRangeIndex >= 0) {
        setSelectedRangeIndex(savedPrefs.selectedRangeIndex);
      }
      
      // Validate and restore selectedChartVital
      if (savedPrefs.selectedChartVital && 
          typeof savedPrefs.selectedChartVital === 'string') {
        setSelectedChartVital(savedPrefs.selectedChartVital);
      }
      
      // Validate and restore trendsType
      if (savedPrefs.trendsType && 
          (savedPrefs.trendsType === "vitals" || savedPrefs.trendsType === "calories")) {
        setTrendsType(savedPrefs.trendsType);
      }
    }
  }, [patientSlug]);

  // Wrapper functions that save preferences when state changes (only for non-patient views)
  const updateSelectedRangeIndex = (newIndex) => {
    setSelectedRangeIndex(newIndex);
    // Only save preferences if not viewing a patient
    if (!patientSlug) {
      savePreferences({
        selectedRangeIndex: newIndex,
        selectedChartVital,
        trendsType
      });
    }
  };

  const updateSelectedChartVital = (newVital) => {
    setSelectedChartVital(newVital);
    // Only save preferences if not viewing a patient
    if (!patientSlug) {
      savePreferences({
        selectedRangeIndex,
        selectedChartVital: newVital,
        trendsType
      });
    }
  };

  const updateTrendsType = (newType) => {
    setTrendsType(newType);
    setSelectedChartVital("All"); // Reset to "All" when changing trends type
    // Only save preferences if not viewing a patient
    if (!patientSlug) {
      const prefsToSave = {
        selectedRangeIndex,
        selectedChartVital: "All",
        trendsType: newType
      };
      savePreferences(prefsToSave);
    }
  };

  useEffect(() => {
    if (!patientData?.health_vitals?.length) return;

    // If API already provided month list, don't override it
    if (monthFilterOptions.length === 0) {
      // Determine the earliest month we have any data for
      const allDates = patientData.health_vitals
        .filter(v => v?.vitals_created_at)
        .map(v => moment(v.vitals_created_at));
      if (allDates.length === 0) {
        const currentMonthLabel = moment().format("MMMM YYYY");
        setMonthFilterOptions([currentMonthLabel]);
        setUserFilteredData([]);
        if (selectedRangeIndex !== 0) {
          setSelectedRangeIndex(0);
        }
      } else {
        const earliest = moment.min(allDates);
        // Build a continuous list of months from current month down to earliest (inclusive)
        const months = [];
        const cursor = moment().startOf('month');
        const stop = earliest.clone().startOf('month');
        while (cursor.isSameOrAfter(stop)) {
          months.push(cursor.format("MMMM YYYY"));
          cursor.subtract(1, 'month');
        }
        const effectiveMonths = months.length > 0 ? months : [moment().format("MMMM YYYY")];
        setMonthFilterOptions(effectiveMonths);
        if (selectedRangeIndex >= effectiveMonths.length) {
          setSelectedRangeIndex(0);
        }
      }
    }

    // Filter by selected month label (even if that month has no data, result can be empty)
    const selectedMonthLabel = monthFilterOptions[selectedRangeIndex] || moment().format("MMMM YYYY");
    const selectedMonth = moment(selectedMonthLabel, "MMMM YYYY");
    const filterData = patientData.health_vitals.filter((data) =>
      moment(data.vitals_created_at).isSame(selectedMonth, "month")
    );

    // Sort data chronologically (oldest to newest) for chart display
    filterData.sort(
      (a, b) =>
        moment(a.vitals_created_at).valueOf() -
        moment(b.vitals_created_at).valueOf()
    );

    setUserFilteredData(filterData);
  }, [patientData, selectedRangeIndex, monthFilterOptions]);


  useEffect(() => {
    if (patientData?.health_vitals?.length && userFilteredData.length > 0) {

      const categories = [];
      const annotations = { xaxis: [] };
      let currentDate = null;
      let datePositions = new Map(); // Track position of each date

      // userFilteredData is already sorted chronologically, no need to sort again
      userFilteredData.forEach((vital, index) => {
        const dateTime = moment(vital.vitals_created_at);
        const date = dateTime.format("MMM D");
        const time = dateTime.format("h:mm A");
        const uniqueTime = `${time} (${index + 1})`;
        categories.push(uniqueTime);

        // Track the first occurrence of each date
        if (!datePositions.has(date)) {
          datePositions.set(date, index);
        }
      });

      // Add annotations for each unique date at their first occurrence
      datePositions.forEach((position, date) => {
        annotations.xaxis.push({
          x: categories[position],
          borderColor: "#CBD5E1",
          strokeDashArray: 0,
          offsetX: 0,
          offsetY: 48,
          label: {
            text: date,
            orientation: "horizontal",
            position: "bottom",
            offsetY: 55,
            style: {
              fontSize: "12px",
              fontWeight: "600",
              color: "#1e293b",
              background: "#fff",
              cssClass: "apexcharts-xaxis-annotation-label",
              padding: { left: 8, right: 8, top: 2, bottom: 2 },
            },
          },
        });
      });


      const baseOptions = {
        chart: {
          type: "line",
          height: 350,
          toolbar: { show: false },
          zoom: { enabled: false },
          parentHeightOffset: 0,
        },
        stroke: { curve: "smooth", width: 2 },
        markers: { size: 4, hover: { size: 6 } },
        annotations: annotations,
        xaxis: {
          categories: categories,
          labels: {
            show: true,
            rotate: -45,
            style: { fontSize: "11px", colors: "#64748b" },
            offsetY: -5,
            showDuplicates: false,
          },
          axisBorder: { show: true },
          axisTicks: { show: true },
          position: "bottom",
          tooltip: { enabled: false },
          showForNullSeries: true,
          type: 'category',
        },
        grid: {
          borderColor: "#f1f5f9",
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          padding: { bottom: 60 },
        },
        connectNulls: true,
      };

      let series = [];
      let specificOptions = {};

      switch (selectedChartVital) {
        case "All": {
          const systolicData = userFilteredData.map((v) =>
            v.vital_data?.systolic_blood_pressure_mmhg
              ? roundVital(v.vital_data.systolic_blood_pressure_mmhg)
              : null
          );
          const diastolicData = userFilteredData.map((v) =>
            v.vital_data?.diastolic_blood_pressure_mmhg
              ? roundVital(v.vital_data.diastolic_blood_pressure_mmhg)
              : null
          );
          const heartRateData = userFilteredData.map((v) =>
            v.vital_data?.heart_rate_bpm
              ? roundVital(v.vital_data.heart_rate_bpm)
              : null
          );
          const breathingRateData = userFilteredData.map((v) =>
            v.vital_data?.breathing_rate_bpm
              ? roundVital(v.vital_data.breathing_rate_bpm)
              : null
          );
          const hrvData = userFilteredData.map((v) =>
            v.vital_data?.hrv_sdnn_ms
              ? roundVital(v.vital_data.hrv_sdnn_ms)
              : null
          );
          series = [
            { name: t("userProfile.chartSystolicLabel"), data: systolicData },
            { name: t("userProfile.chartDiastolicLabel"), data: diastolicData },
            { name: t("userProfile.heartRate", "Heart Rate"), data: heartRateData },
            { name: t("userProfile.breathingRate", "Breathing Rate"), data: breathingRateData },
            { name: t("userProfile.hrv", "HRV"), data: hrvData },
          ];

          specificOptions = {
            colors: ["#2563eb", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b"],
            legend: {
              show: true,
              position: "top",
              horizontalAlign: "left",
              fontSize: "12px",
              markers: {
                width: 10,
                height: 10,
              },
            },
            yaxis: [
              {
                seriesName: t("userProfile.chartSystolicLabel"),
                title: {
                  text: t("userProfile.chartBloodPressureLabel"),
                  style: { fontSize: "12px", color: "#2563eb" },
                },
              },
              {
                seriesName: t("userProfile.chartDiastolicLabel"),
                show: false, // Hide duplicate axis
              },
              {
                seriesName: t("userProfile.heartRate", "Heart Rate"),
                opposite: true,
                title: {
                  text: `${t("userProfile.heartRate", "Heart Rate")} (${t("userProfile.bpm", "bpm")})`,
                  style: { fontSize: "12px", color: "#ef4444" },
                },
              },
              {
                seriesName: t("userProfile.breathingRate", "Breathing Rate"),
                show: false, // Hide duplicate axis, grouped with Heart Rate
              },
              {
                seriesName: t("userProfile.hrv", "HRV"),
                opposite: true,
                title: {
                  text: `${t("userProfile.hrv", "HRV")} (${t("userProfile.ms", "ms")})`,
                  style: { fontSize: "12px", color: "#f59e0b" },
                },
              },
            ],
            tooltip: {
              shared: true,
              intersect: false,
              y: {
                formatter: (value, { seriesIndex, w }) => {
                  if (value === null) return "N/A";
                  const seriesName = w.globals.seriesNames[seriesIndex];
                  if (
                    seriesName === t("userProfile.chartSystolicLabel") ||
                    seriesName === t("userProfile.chartDiastolicLabel")
                  ) {
                    return `${value} ${t("userProfile.mmHg", "mmHg")}`;
                  }
                  if (
                    seriesName === t("userProfile.heartRate", "Heart Rate") ||
                    seriesName === t("userProfile.breathingRate", "Breathing Rate")
                  ) {
                    return `${value} ${t("userProfile.bpm", "bpm")}`;
                  }
                  if (seriesName === t("userProfile.hrv", "HRV")) {
                    return `${value} ${t("userProfile.ms", "ms")}`;
                  }
                  return value;
                },
              },
            },
          };
          break;
        }
        case "HRV": {
          const data = userFilteredData.map((v) =>
            v.vital_data?.hrv_sdnn_ms
              ? roundVital(v.vital_data.hrv_sdnn_ms)
              : null
          );
          const validData = data.filter((v) => v !== null);
          series = [{ name: t("userProfile.hrv", "HRV"), data }];
          specificOptions = {
            legend: { show: false },
            colors: ["#f59e0b"],
            yaxis: {
              title: {
                text: `${t("userProfile.hrv", "HRV")} (${t("userProfile.ms", "ms")})`,
                style: { fontSize: "12px" },
              },
              min: validData.length > 0 ? Math.floor(Math.min(...validData) / 10) * 10 : 0,
              max: validData.length > 0 ? Math.ceil(Math.max(...validData) / 10) * 10 : 100,
              tickAmount: 5,
            },
            tooltip: {
              y: { formatter: (value) => (value ? `${value} ${t("userProfile.ms", "ms")}` : "") },
            },
          };
          break;
        }
        case "Heart Rate": {
          const data = userFilteredData.map((v) =>
            v.vital_data?.heart_rate_bpm
              ? roundVital(v.vital_data.heart_rate_bpm)
              : null
          );
          const validData = data.filter((v) => v !== null);
          series = [{ name: t("userProfile.heartRate", "Heart Rate"), data }];
          specificOptions = {
            legend: { show: false },
            colors: ["#ef4444"],
            yaxis: {
              title: {
                text: `${t("userProfile.heartRate", "Heart Rate")} (${t("userProfile.bpm", "bpm")})`,
                style: { fontSize: "12px" },
              },
              min: validData.length > 0 ? Math.floor(Math.min(...validData) / 10) * 10 : 40,
              max: validData.length > 0 ? Math.ceil(Math.max(...validData) / 10) * 10 : 120,
              tickAmount: 6,
            },
            tooltip: {
              y: { formatter: (value) => (value ? `${value} ${t("userProfile.bpm", "bpm")}` : "") },
            },
          };
          break;
        }
        case "Breathing Rate": {
          const data = userFilteredData.map((v) =>
            v.vital_data?.breathing_rate_bpm
              ? roundVital(v.vital_data.breathing_rate_bpm)
              : null
          );
          const validData = data.filter((v) => v !== null);
          series = [{ name: t("userProfile.breathingRate", "Breathing Rate"), data }];
          specificOptions = {
            legend: { show: false },
            colors: ["#8b5cf6"],
            yaxis: {
              title: {
                text: `${t("userProfile.breathingRate", "Breathing Rate")} (${t("userProfile.bpm", "bpm")})`,
                style: { fontSize: "12px" },
              },
              min: validData.length > 0 ? Math.floor(Math.min(...validData) / 5) * 5 : 10,
              max: validData.length > 0 ? Math.ceil(Math.max(...validData) / 5) * 5 : 30,
              tickAmount: 4,
            },
            tooltip: {
              y: { formatter: (value) => (value ? `${value} ${t("userProfile.bpm", "bpm")}` : "") },
            },
          };
          break;
        }
        default: { // Blood Pressure
          const systolicData = userFilteredData.map((v) =>
            v.vital_data?.systolic_blood_pressure_mmhg
              ? roundVital(v.vital_data.systolic_blood_pressure_mmhg)
              : null
          );
          const diastolicData = userFilteredData.map((v) =>
            v.vital_data?.diastolic_blood_pressure_mmhg
              ? roundVital(v.vital_data.diastolic_blood_pressure_mmhg)
              : null
          );
          const validSystolic = systolicData.filter((v) => v !== null);
          const validDiastolic = diastolicData.filter((v) => v !== null);

          series = [
            { name: t("userProfile.chartSystolicLabel"), data: systolicData },
            { name: t("userProfile.chartDiastolicLabel"), data: diastolicData },
          ];
          specificOptions = {
            legend: { show: false },
            colors: ["#2563eb", "#10b981"],
            yaxis: {
              title: {
                text: t("userProfile.chartBloodPressureLabel"),
                style: { fontSize: "12px" },
              },
              min: validDiastolic.length > 0 ? Math.floor(Math.min(...validDiastolic) / 10) * 10 : 60,
              max: validSystolic.length > 0 ? Math.ceil(Math.max(...validSystolic) / 10) * 10 : 180,
              tickAmount: 6,
            },
            tooltip: {
              shared: true,
              intersect: false,
              y: { formatter: (value) => (value ? `${value} mmHg` : "") },
            },
          };
          break;
        }
      }

      const mergedOptions = {
        ...baseOptions,
        ...specificOptions,
        yaxis: specificOptions.yaxis || { ...baseOptions.yaxis, ...specificOptions.yaxis },
        tooltip: { ...baseOptions.tooltip, ...specificOptions.tooltip },
        legend: { ...baseOptions.legend, ...specificOptions.legend },
      };

      if (selectedChartVital !== "Blood Pressure" && selectedChartVital !== "All") {
        mergedOptions.tooltip.shared = false;
        mergedOptions.tooltip.intersect = true;
      }

      setChartData({
        series,
        options: mergedOptions,
      });
    }
  }, [userFilteredData, selectedRangeIndex, t, patientData, selectedChartVital]);


  useEffect(() => {
    const fetchUserHealthVitals = async () => {
      setVitalsLoading(true);
      try {
        let healthVitalsData = null;

        try {
          let apiUrl = `/user/get_user_with_health_vitals`;
          // let pass = await getUserPassword();
          if (patientSlug) {
            apiUrl = `/user/get_user_by_slug_with_health_vitals/${patientSlug}`;
          }
          const selectedMonth = monthFilterOptions[selectedRangeIndex];
          const healthVitalsRes = await apiClient.post(apiUrl, { monthFilter: selectedMonth });
          setVitalsLoading(false);
          // if (patientSlug) {
          //   pass = healthVitalsRes.data.data.sub;
          // }
          healthVitalsData = healthVitalsRes?.data?.data;
          logInfo("Health vitals data fetched successfully");
          if (
            healthVitalsRes?.data?.data?.status !== "ACTIVE" &&
            patientSlug
          ) {
            setPatientStatus({
              status: healthVitalsRes?.data?.data?.status,
              show: true,
            });
          }

          logInfo("Health vitals data decrypted successfully");
          setPatientData(healthVitalsData);
        } catch (err) {
          if (err?.response?.status === 404 && patientSlug) {
            setPatientStatus({
              status: "not_found",
              show: true,
            });
            logCritical("Wrong user slug", err);
          } else {
            logCritical("Error fetching user health vitals", err);
          }
        }
      } catch (err) {
        logCritical("Error fetching user health vitals", err);
      }
    };

    // Only fetch after month options are available
    if (monthFilterOptions.length > 0) {
      fetchUserHealthVitals();
    }
  }, [patientSlug, selectedRangeIndex, monthFilterOptions]);

  return {
    selectedRangeIndex,
    patientData,
    userFilteredData,
    setPatientData,
    setUserFilteredData,
    setSelectedRangeIndex: updateSelectedRangeIndex,
    monthFilterOptions,
    vitalsLoading,
    setPatientStatus,
    patientStatus,
    chartData,
    setChartData,
    patientSlug,
    selectedChartVital,
    setSelectedChartVital: updateSelectedChartVital,
    trendsType,
    setTrendsType: updateTrendsType,
  };
};