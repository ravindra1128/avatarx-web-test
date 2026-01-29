import { Search, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../Component/Cards/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../Component/UI/select";
import { UserIcon } from "lucide-react";
import moment from "moment";
import { toast } from "react-toastify";
import Loader from "../../../Component/Loader";
import { Input } from "../../../Component/UI/input";
import apiClient from "../../../config/APIConfig";
import { logCritical, logInfo } from "../../../utils/logger";
import TableView from "./TableView";
import { useTranslation } from 'react-i18next';
import PatientReadingDetailsTable from "./PatientReadingDetailsTable";
import { useLocation } from "react-router-dom";
function DashboardPage() {
  const { t } = useTranslation();
  // Load from sessionStorage or use default values
  const getSessionValue = (key, defaultValue) => {
    const stored = sessionStorage.getItem(key);
    return stored !== null ? JSON.parse(stored) : defaultValue;
  };

  const getSavedPreferences = () => {
    try {
      const saved = localStorage.getItem('patientReadingPreferences');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  };

  const [priority, setPriority] = useState(() => getSessionValue('dashboard_priority', 'high'));
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState(() => getSessionValue('dashboard_sortOrder', 'newest'));
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const savedPrefs = getSavedPreferences();
    return savedPrefs?.selectedMonth || null;
  });
  const [monthsData, setMonthsData] = useState([]);
  const [isLoadingMonths, setIsLoadingMonths] = useState(false);
  const {pathname} = useLocation();

  // Function to get filter month names from API
  const get_filter_month_name = async () => {
    setIsLoadingMonths(true);
    try {
      const response = await apiClient.post('/user/get_filter_month_name');
      if (response?.status === 200) {
        const monthsData = response.data.data || response.data;
        
        // Add "All Time" option at the end
        const monthsWithAllTime = [
          ...monthsData
        ];
        
        // If no month is selected and no preference exists, select the first month
        if (!selectedMonth && monthsData.length > 0) {
          setSelectedMonth(monthsData[0].displayName);
        }
        
        setMonthsData(monthsWithAllTime);
        return monthsWithAllTime;
      }
    } catch (error) {
      logCritical("Error fetching months data", error);
      toast.error("Failed to load months data");
      
      // Fallback to default months if API fails
      const fallbackMonths = [
        {
          displayName: "current",
          value: "current",
          label: `Current Month (${moment().format('MMMM YYYY')})`
        },
        {
          displayName: "last",
          value: "last", 
          label: `Last Month (${moment().subtract(1, 'month').format('MMMM YYYY')})`
        }
      ];
      
      // If no month is selected, select the first fallback month
      if (!selectedMonth) {
        setSelectedMonth(fallbackMonths[0].displayName);
      }
      
      setMonthsData(fallbackMonths);
      return fallbackMonths;
    } finally {
      setIsLoadingMonths(false);
    }
  };

  const [stats, setStats] = useState(null);
  const [reminderHistory, setReminderHistory] = useState([
    {
      full_name: "rvds",
      medicine: "Sd",
      reminded_at: "",
    },
  ]);
  const [isLoading, setIsLoading] = useState({ isAlertLoading: false, isPatientLoading: false });
  const [patients, setPatients] = useState([]);
  const [patientsData, setPatientData] = useState({
    patients: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const [filteredPatientsData, setFilteredPatientsData] = useState({
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    // Always apply initial filtering when patients data is available
    if (patients.length > 0) {
      applyAllFilters(
        getSessionValue('dashboard_priority', priority),
        selectedMonth,
        searchQuery,
        getSessionValue('dashboard_sortOrder', sortOrder)
      );
    }
    // eslint-disable-next-line
  }, [patients, selectedMonth]);

  // Ensure first month is selected when monthsData loads and no month is selected
  useEffect(() => {
    if (monthsData.length > 0 && !selectedMonth) {
      console.log('Setting first month:', monthsData[0].displayName);
      setSelectedMonth(monthsData[0].displayName);
    }
  }, [monthsData, selectedMonth]);

  // Ensure selectedMonth is valid when monthsData changes
  useEffect(() => {
    if (monthsData.length > 0 && selectedMonth) {
      const isValidMonth = monthsData.some(month => 
        month.displayName === selectedMonth || month.value === selectedMonth
      );
      if (!isValidMonth) {
        // If current selectedMonth is not in the new monthsData, select the first one
        setSelectedMonth(monthsData[0].displayName);
      }
    }
  }, [monthsData, selectedMonth]);

  // Centralized filter function
  const applyAllFilters = (
    priorityValue = priority,
    monthValue = selectedMonth,
    searchValue = searchQuery,
    sortValue = sortOrder
  ) => {
    // let filtered = [...patients];
    let filtered = structuredClone(patients);

    // Priority filter
    if (priorityValue && priorityValue !== "all-statuses") {
      filtered = filtered.filter((patient) =>
        patient?.priority?.toLowerCase().includes(priorityValue.toLowerCase())
      );
    }

    // Month filter for table
    if (monthValue && monthValue !== "all") {
      const now = moment();
      let startOfMonth, endOfMonth;

      if (monthValue === "current") {
        startOfMonth = now.clone().startOf('month');
        endOfMonth = now.clone().endOf('month');
      } else if (monthValue === "last") {
        startOfMonth = now.clone().subtract(1, 'month').startOf('month');
        endOfMonth = now.clone().subtract(1, 'month').endOf('month');
      } else {
        // Handle API month data - try to find by displayName or value
        const monthData = monthsData.find(m => 
          m.displayName === monthValue
        );
        if (monthData && monthData.startDate && monthData.endDate) {
          startOfMonth = moment(monthData.startDate);
          endOfMonth = moment(monthData.endDate);
        } else {
          // Fallback to moment parsing
          startOfMonth = moment(monthValue).startOf('month');
          endOfMonth = moment(monthValue).endOf('month');
        }
      }

      if (startOfMonth && endOfMonth) {
        filtered = filtered.filter((data) => {
          const createdAt = moment(data.vitals_created_at);
          return createdAt.isBetween(startOfMonth, endOfMonth, undefined, "[]");
        });
      }
    }

    // Search filter
    if (searchValue && searchValue.trim() !== "") {
      filtered = filtered.filter((patient) => {
        const fullName = `${patient?.patient_first_name} ${patient?.patient_last_name}`.toLowerCase();
        return fullName.includes(searchValue.toLowerCase());
      });
    }

    // Sorting
    if (sortValue === "newest") {
      filtered = filtered.sort((a, b) =>
        new Date(b.vitals_created_at).getTime() - new Date(a.vitals_created_at).getTime()
      );
    } else if (sortValue === "oldest") {
      filtered = filtered.sort((a, b) =>
        new Date(a.vitals_created_at).getTime() - new Date(b.vitals_created_at).getTime()
      );
    }

    setFilteredPatients(filtered);

    // Calculate card counts based only on month (not priority/search/sort)
    let monthFiltered = [...patients];
    if (monthValue && monthValue !== "all") {
      const now = moment();
      let startOfMonth, endOfMonth;

      if (monthValue === "current") {
        startOfMonth = now.clone().startOf('month');
        endOfMonth = now.clone().endOf('month');
      } else if (monthValue === "last") {
        startOfMonth = now.clone().subtract(1, 'month').startOf('month');
        endOfMonth = now.clone().subtract(1, 'month').endOf('month');
      } else {
        // Handle API month data - try to find by displayName or value
        const monthData = monthsData.find(m => 
          m.displayName === monthValue 
        );
        if (monthData && monthData.startDate && monthData.endDate) {
          startOfMonth = moment(monthData.startDate);
          endOfMonth = moment(monthData.endDate);
        } else {
          // Fallback to moment parsing
          startOfMonth = moment(monthValue).startOf('month');
          endOfMonth = moment(monthValue).endOf('month');
        }
      }

      if (startOfMonth && endOfMonth) {
        monthFiltered = monthFiltered.filter((data) => {
          const createdAt = moment(data.vitals_created_at);
          return createdAt.isBetween(startOfMonth, endOfMonth, undefined, "[]");
        });
      }
    }

    if (monthValue !== "all") {
      setFilteredPatientsData({
        high: monthFiltered.filter((p) => p.priority === "high").length,
        medium: monthFiltered.filter((p) => p.priority === "medium").length,
        low: monthFiltered.filter((p) => p.priority === "low").length,
      });
    } else {
      setFilteredPatientsData({ high: 0, medium: 0, low: 0 });
    }
  };

  const handlePrioritySelect = (value) => {
    setPriority(value);
    applyAllFilters(value, selectedMonth, searchQuery, sortOrder);
    sessionStorage.setItem('dashboard_priority', JSON.stringify(value));
  };

  const handleMonthChange = (value) => {
    setSelectedMonth(value);
    applyAllFilters(priority, value, searchQuery, sortOrder);
    // Save to localStorage to persist with PatientReadingDetailsTable
    try {
      const saved = localStorage.getItem('patientReadingPreferences') || '{}';
      const preferences = JSON.parse(saved);
      preferences.selectedMonth = value;
      localStorage.setItem('patientReadingPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving month preference:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    applyAllFilters(priority, selectedMonth, value, sortOrder);
    // sessionStorage.setItem('dashboard_searchQuery', JSON.stringify(value));
  };

  const handleSort = (value) => {
    setSortOrder(value);
    applyAllFilters(priority, selectedMonth, searchQuery, value);
    sessionStorage.setItem('dashboard_sortOrder', JSON.stringify(value));
  };

  useEffect(() => {
    fetchPatients();
    get_filter_month_name();
  }, []);

 


  const fetchPatients = async () => {
    // setIsPatientLoading(true);
    setIsLoading({ ...isLoading, isAlertLoading: true });
    console.log(pathname.split("/")[2], "123")
    const slug = pathname.split("/")[2];
    try {
      const response = await apiClient.post(`/user/get_patient_alerts`, {
        slug: slug,
      });
      if (response?.status === 200) {
        const res = response?.data?.data;
        const result = [...res?.high, ...res?.medium, ...res?.low];
        setPatients(result);
        // Remove manual filtering - applyAllFilters will handle it
        setPatientData({
          ...patientsData,
          patients: result?.length,
          high: res?.high?.length,
          medium: res?.medium?.length,
          low: res?.low?.length,
        });
        logInfo("Patients alerts data fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching patients alerts", error);
      toast.error(error?.response?.data?.message || "Something went wrong!");
    } finally {
      // setIsPatientLoading(false);
      setIsLoading({ ...isLoading, isAlertLoading: false });
    }
  };

  // Card click handlers
  // In the Card onClick, use: () => handlePrioritySelect("high") or ("medium")
  // ... existing code ...

  function formatTimeToAMPM(timeSet) {
    const timeParts = timeSet.split(":");
    const date = new Date();
    date.setHours(timeParts[0], timeParts[1], timeParts[2]);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function formatToDateTimeAMPM(timeString) {
    const date = new Date(timeString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Los_Angeles",
    });
  }

  const handleDashboardMonthChange = (newMonth) => {
    console.log('Month changed to:', newMonth);
    handleMonthChange(newMonth);
  };

  return (
    <>
      {/* {isPatientLoading && <Loader />} */}
      {(isLoading.isAlertLoading || isLoading.isPatientLoading) && <Loader />}

      <div className="space-y-6">
        <main className="mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between items-center lg:gap-0 gap-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              {t('dashboard.overview')}
            </h2>
            <div className="flex items-end">
              {console.log('Select values - selectedMonth:', selectedMonth, 'monthsData:', monthsData, 'computed value:', selectedMonth || (monthsData.length > 0 ? monthsData[0].displayName : undefined))}
              <Select 
                value={selectedMonth || (monthsData.length > 0 ? monthsData[0].displayName : undefined)} 
                onValueChange={handleDashboardMonthChange} 
                disabled={isLoadingMonths}
              >
                <SelectTrigger className="w-48 bg-white border-gray-200 focus:ring-1 focus:ring-gray-500 focus:border-gray-500">
                  <SelectValue placeholder={isLoadingMonths ? "Loading months..." : "Select month"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 text-sm">
                  {monthsData.map((month) => (
                    <SelectItem key={month.displayName || month.value} value={month.displayName || month.value}>
                      {month.displayName || month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-4">
            <PatientReadingDetailsTable monthsData={monthsData} setIsLoading={setIsLoading} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
          </div>
          <div className="grid lg:gap-8 gap-5 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card
              onClick={() => handlePrioritySelect("high")}
              className="cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-semibold text-gray-800 mb-0">
                  {/* Total Users */}
                  {t('dashboard.highPriority')}
                </CardTitle>
                {/* <Users className="h-4 w-4 text-blue-500" /> */}
                <TriangleAlert className="h-5 w-5 text-red-500" />
              </CardHeader>
              <CardContent>
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.users?.toLocaleString?.()}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMonth !== "all" ? filteredPatientsData.high : patientsData?.high || 0}
                  </p>
                </>
              </CardContent>
            </Card>
            <Card
              onClick={() => handlePrioritySelect("medium")}
              className="cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-semibold text-gray-800 mb-0">
                  {/* Video Conversations */}
                  {t('dashboard.mediumPriority')}
                </CardTitle>
                {/* <Video className="h-4 w-4 text-green-500" /> */}
                <TriangleAlert className="h-5 w-5 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.videoConversations?.toLocaleString?.()}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedMonth !== "all" ? filteredPatientsData.medium : patientsData?.medium || 0}
                  </p>
                </>
              </CardContent>
            </Card>
            {/* <Card
              onClick={() => handlePrioritySelect("")}
              className="cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg !leading-[20px] !font-medium text-gray-500 mb-0">
                  Total Patients
                </CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.users.toLocaleString()}
                    </div>
                    <p className="text-md text-gray-500">
                      {patientsData?.patients || null}
                    </p>
                  </>
                )}
              </CardContent>
            </Card> */}
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 ">
              <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 text-gray-800">
                <UserIcon className="text-2xl font-semibold text-gray-800" />
                {t('dashboard.patientTable')}
              </div>

              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mt-6">
                <div className="relative w-full md:w-[300px]">
                  <Input
                    type="text"
                    placeholder={t('dashboard.searchPatients')}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Select
                    value={priority}
                    onValueChange={(value) => handlePrioritySelect(value)}
                  >
                    <SelectTrigger className="w-full md:w-[160px] bg-white border-gray-300 hover:border-blue-400 transition-colors">
                      <SelectValue placeholder={t('dashboard.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e4ebf4] text-xs">
                      <SelectItem value="all-statuses">{t('dashboard.all')}</SelectItem>
                      <SelectItem value="medium">{t('dashboard.medium')}</SelectItem>
                      <SelectItem value="high">{t('dashboard.high')}</SelectItem>
                      <SelectItem value="low">{t('dashboard.low')}</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* <Select
                    value={selectedMonth}
                    onValueChange={(value) => handleMonthChange(value)}
                  >
                    <SelectTrigger className="w-full md:w-[160px] bg-white border-gray-300 hover:border-blue-400 transition-colors">
                      <SelectValue placeholder={t('dashboard.selectMonth')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e4ebf4] text-xs">
                      <SelectItem value="all">{t('dashboard.allTime')}</SelectItem>
                      <SelectItem value="current">{t('dashboard.currentMonth')}</SelectItem>
                      <SelectItem value="last">{t('dashboard.lastMonth')}</SelectItem>
                    </SelectContent>
                  </Select> */}

                  <Select
                    value={sortOrder}
                    onValueChange={(value) => handleSort(value)}
                  >
                    <SelectTrigger className="w-full md:w-[160px] bg-white border-gray-300 hover:border-blue-400 transition-colors">
                      <SelectValue placeholder={t('dashboard.sortByDate')} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e4ebf4] text-xs">
                      <SelectItem value="newest">{t('dashboard.newestFirst')}</SelectItem>
                      <SelectItem value="oldest">{t('dashboard.oldestFirst')}</SelectItem>
                    </SelectContent>
                  </Select>

                </div>
              </div>
            </div>
            {/* <div style={{ position: "relative" }}>
            {selectDate && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  zIndex: 10,
                  boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                  backgroundColor: "white",
                  borderRadius: "8px",
                }}
              >
                <DateRange
                  onChange={(item) => {
                    setState([item.selection]);
                    const { startDate, endDate } = item.selection;
                    if (
                      startDate &&
                      endDate &&
                      startDate.getTime() !== endDate.getTime()
                    ) {
                      setSelectDate(false);
                    }
                   
                  }}
                  maxDate={new Date()}
                  // showSelectionPreview={true}
                  moveRangeOnFirstSelection={false}
                  months={2}
                  ranges={state}
                  direction="horizontal"
                  linkedCalendars={false}
                />
              </div>
            )} */}
            {/* <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full md:w-[220px] justify-start text-left font-normal bg-white border-gray-300 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                      {customDateRange.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "LLL dd, y")} -{" "}
                            {format(customDateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(customDateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={customDateRange.from}
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      numberOfMonths={2}
                      className="rounded-md border-md border-gray-200 bg-white"
                    />
                  </PopoverContent>
                </Popover> */}

            <div className="mt-4">
              {filteredPatients?.length > 0 ? (
                <TableView patients={filteredPatients} />
              ) : (
                <div className="flex items-center justify-center p-5">
                  {t('dashboard.noRecordFound')}
                </div>
              )}
            </div>
            {/* </div> */}
          </div>
        </main>
      </div>
    </>
  );
}

export default DashboardPage;
