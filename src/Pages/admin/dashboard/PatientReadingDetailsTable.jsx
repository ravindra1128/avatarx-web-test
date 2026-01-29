import { Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import moment from "moment";
import { useState, useContext, useEffect } from "react";
import { useUser } from "../../../Hooks/useUser";
import { useTranslation } from 'react-i18next';
import { Button } from "../../../Component/UI/button";
import { Input } from "../../../Component/UI/input";
import { Calendar, Loader2, UserIcon, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../Component/UI/select";
import apiClient from "../../../config/APIConfig";
import { logCritical, logError } from "../../../utils/logger";
import LanguageSelectModal from "../../../Component/UI/LanguageSelectModal";
import { useNewUsers } from "./UserSession/useNewUsers.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../Component/Cards/card";
import { CommentSection } from "../../../Component/CommentSection.jsx";

const PatientReadingDetailsTable = ({ monthsData, setIsLoading, selectedMonth, setSelectedMonth }) => {
  const { t } = useTranslation();
  const { slug } = useUser();

  const {pathname} = useLocation();
  const facilitySlug = pathname.split("/")[2];
  const [showLangModal, setShowLangModal] = useState(false);
  const [inviteUser, setInviteUser] = useState(null);
  const { inviteLoading, handleSendReminder } = useNewUsers();
  const [globalEditing, setGlobalEditing] = useState({
    userId: null,
    commentId: null,
  });
  const [patientWithVitalsCount, setPatientWithVitalsCount] = useState([]);
  const [revenue, setRevenue] = useState({
    projectedRevenue: 0,
    reimbursableRevenue: 0,
    totalUsers: 0,
    activePatients: 0,
  });

  // Load saved preferences from localStorage
  const getSavedPreferences = () => {
    try {
      const saved = localStorage.getItem('patientReadingPreferences');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading preferences:', error);
      return null;
    }
  };

  const savePreferences = (preferences) => {
    try {
      localStorage.setItem('patientReadingPreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  // Initialize state with saved preferences or defaults
  const savedPrefs = getSavedPreferences();
  const [page, setPage] = useState(savedPrefs?.page || 0);
  const [rowsPerPage, setRowsPerPage] = useState(savedPrefs?.rowsPerPage || 10);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting states
  const [sortBy, setSortBy] = useState(savedPrefs?.sortBy || "day_count");
  const [sortOrder, setSortOrder] = useState(savedPrefs?.sortOrder || "desc");

  // Reading filter states
  const [filterType, setFilterType] = useState(savedPrefs?.filterType || "reading_gt");
  const [filterValue, setFilterValue] = useState(savedPrefs?.filterValue || "5");

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const isRevenueCardVisible = userData.revenue_card;
  const isAdmin = userData.is_admin;

  // Month filter state
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const columns = [
    {
      id: "patient_name",
      name: t('dashboard.patient'),
    },
    {
      id: "reading_days",
      name: t('dashboard.daysOfReading'),
      sortable: true,
      sortKey: "day_count",
    },
    {
      id: "last_reading",
      name: t('dashboard.lastReading'),
      sortable: true,
      sortKey: "last_reading",
    },
    {
      id: "calories_count",
      name: t('dashboard.caloriesCount'),
      sortable: true,
      sortKey: "day_calories_count",
    },
    {
      id: "last_calories_reading",
      name: t('dashboard.lastCaloriesReading'),
      sortable: true,
      sortKey: "last_calories_scan",
    },
    {
      id: "comment",
      name: t('users.comment'),
    }
  ];

  useEffect(() => {
    fetchPatientWithVitalsCount();
    savePreferences({
      page,
      rowsPerPage,
      filterType,
      filterValue,
      selectedMonth,
      sortBy,
      sortOrder
    });
  }, [page, rowsPerPage, sortBy, sortOrder, selectedMonth]);

  const handleSearch = () => {
    setIsFilterLoading(true);
    savePreferences({
      page,
      rowsPerPage,
      filterType,
      filterValue,
      selectedMonth,
      sortBy,
      sortOrder
    });
    fetchPatientWithVitalsCount();
  };

  const handleKeyPress = (e) => {
    if (!/\d/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'Enter') {
      e.preventDefault();
    }
  };

  const handleSort = (sortKey) => {
    let newSortBy = sortKey;
    let newSortOrder = "asc";
    
    if (sortBy === sortKey) {
      newSortOrder = sortOrder === "asc" ? "desc" : "asc";
    }
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    
    savePreferences({
      page,
      rowsPerPage,
      filterType,
      filterValue,
      selectedMonth,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    });
    
    fetchPatientWithVitalsCount();
  };

  const fetchPatientWithVitalsCount = async (monthFilter = null, isFilter = false) => {
    // setIsPatientLoading(true);
    setIsLoading((prev) => ({...prev, isPatientLoading :true}));
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const monthFilter = monthsData.find(month => month.displayName === selectedMonth);

      const requestData = {
        page: page + 1,
        limit: rowsPerPage,
        monthFilter: monthFilter ? monthFilter.value : selectedMonth ? selectedMonth : moment().format('MMMM YYYY'),
        startDate: monthFilter ? monthFilter.startDate : null,
        endDate: monthFilter ? monthFilter.endDate : null,
        sortBy: sortBy,
        sortOrder: sortOrder,
        timeZone: timeZone,
      };

      if (filterType && filterValue) {
        if (filterType === "reading_gt") {
          requestData.readingFilter = {
            reading_gt: parseFloat(filterValue)
          };
        } else if (filterType === "reading_lt") {
          requestData.readingFilter = {
            reading_lt: parseFloat(filterValue)
          };
        } else if (filterType === "last_active_gt") {
          requestData.readingFilter = {
            last_active_gt: parseFloat(filterValue)
          };
        } else if (filterType === "all_readings") {
          requestData.readingFilter = {
            all_readings: parseFloat(filterValue)
          };
        } else if (filterType === "calories_gt") {
          requestData.readingFilter = {
            calories_gt: parseFloat(filterValue)
          };
        } else if (filterType === "calories_lt") {
          requestData.readingFilter = {
            calories_lt: parseFloat(filterValue)
          };
        }
      }

      requestData.slug = facilitySlug || "";

      const response = await apiClient.post(`/user/get_patient_with_vitals_count`, requestData);
      setPatientWithVitalsCount(response.data.data);
      setTotalCount(response.data.pagination?.totalCount || 0);
      setRevenue({
        projectedRevenue: response.data.revenue.projectedRevenue,
        reimbursableRevenue: response.data.revenue.reimbursableRevenue,
        totalUsers: response.data.revenue.totalUsers,
        activePatients: response.data.revenue.projectedUsers,
      });
    } catch (error) {
      logCritical("Error fetching patients with vitals count", error);
    }
    finally {
      setIsFilterLoading(false);
      // setIsPatientLoading(false);
      setIsLoading((prev) => ({...prev, isPatientLoading :false}));
    }
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    savePreferences({
      page: newPage,
      rowsPerPage,
      filterType,
      filterValue,
      selectedMonth,
      sortBy,
      sortOrder
    });
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    savePreferences({
      page: 0,
      rowsPerPage: newRowsPerPage,
      filterType,
      filterValue,
      selectedMonth,
      sortBy,
      sortOrder
    });
  };

  const handleFilterTypeChange = (newFilterType) => {
    setFilterType(newFilterType);
    if (newFilterType === "all_readings") {
      setFilterValue("0");
    }
    savePreferences({
      page,
      rowsPerPage,
      filterType: newFilterType,
      filterValue,
      selectedMonth,
      sortBy,
      sortOrder
    });
  };

  const handleFilterValueChange = (newFilterValue) => {
    setFilterValue(newFilterValue);
    savePreferences({
      page,
      rowsPerPage,
      filterType,
      filterValue: newFilterValue,
      selectedMonth,
      sortBy,
      sortOrder
    });
  };

  return (
    <div className="space-y-6">

     {/* Revenue Cards */}
      {/* {isAdmin ? */}
      {/* grid lg:gap-4 gap-3 md:grid-cols-2 lg:grid-cols-2 my-6 */}
      <div className={`grid lg:gap-4 gap-3 md:grid-cols-2  my-6 ${isRevenueCardVisible ? 'lg:grid-cols-4' : 'lg:grid-cols-2'}`}>
        {isRevenueCardVisible ? <>
        <Card className="bg-white border-gray-200 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {t('dashboard.reimbursableRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              $ {revenue?.reimbursableRevenue?.toLocaleString?.() || '0'}
              <span className="text-base font-medium text-gray-700 ml-2">
                in {moment(selectedMonth).format('MMMM YYYY')}
                {/* {selectedMonth === 'current' && moment().format('MMMM')}
                {selectedMonth === 'last' && moment().subtract(1, 'month').format('MMMM')} */}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {t('dashboard.projectedRevenue')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              $ {revenue?.projectedRevenue?.toLocaleString?.() || '0'}
              <span className="text-base font-medium text-gray-700 ml-2">
                in {moment(selectedMonth).format('MMMM YYYY')}
                {/* {selectedMonth === 'current' && moment().format('MMMM')}
                {selectedMonth === 'last' && moment().subtract(1, 'month').format('MMMM')} */}
              </span>
            </div>
          </CardContent>
        </Card>
        </> :<></>}
        <Card className="bg-white border-gray-200 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {t('dashboard.activeUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {revenue?.activePatients || '0'}
              <span className="text-base font-medium text-gray-700 ml-2">
                in {moment(selectedMonth).format('MMMM YYYY')}
                {/* {selectedMonth === 'current' && moment().format('MMMM')}
                {selectedMonth === 'last' && moment().subtract(1, 'month').format('MMMM')} */}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 hover:shadow-md transition-all duration-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
              {t('dashboard.inactiveUsers')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              { revenue?.totalUsers - revenue?.activePatients || '0'}
              <span className="text-base font-medium text-gray-700 ml-2">
                in {moment(selectedMonth).format('MMMM YYYY')}
                {/* {selectedMonth === 'current' && moment().format('MMMM')}
                {selectedMonth === 'last' && moment().subtract(1, 'month').format('MMMM')} */}
              </span>
            </div>
          </CardContent>
        </Card>
      </div> 
      {/* : <></>} */}

      {/* Main Table Section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2 text-gray-800">
                <UserIcon className="text-2xl font-semibold text-gray-800" />
                {t('dashboard.vitalsReading')}
              </div>
            {/* <div className="flex items-center gap-3">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Calendar className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {t('dashboard.patientsReading')}
                </h3>
              </div>
            </div> */}

            {/* Compact Filter Section */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <Select value={filterType} onValueChange={handleFilterTypeChange}>
                    <SelectTrigger className="w-44 border-0 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 bg-transparent outline-none px-3 py-2">
                      <SelectValue placeholder="Select filter" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-sm shadow-lg">
                      <SelectItem value="all_readings">All Readings</SelectItem>
                      <SelectItem value="reading_gt">Days Of Readings &gt;</SelectItem>
                      <SelectItem value="reading_lt">Days Of Readings &lt;</SelectItem>
                      <SelectItem value="calories_gt">Calories Count &gt;</SelectItem>
                      <SelectItem value="calories_lt">Calories Count &lt;</SelectItem>
                      <SelectItem value="last_active_gt">Last Active &gt;</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-px h-6 bg-gray-300"></div>
                  <Input
                    placeholder="Enter value"
                    value={filterValue}
                    onChange={(e) => handleFilterValueChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-20 border-0 focus:ring-1 focus:ring-gray-500 focus:border-gray-500 focus:outline-none active:ring-0 active:border-0 active:outline-none hover:ring-0 hover:border-0 bg-transparent px-3 py-2"
                  />
                </div>

              <Button
                onClick={handleSearch}
                disabled={isFilterLoading}  
                  className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-sm hover:shadow-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFilterLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Searching...</span>
                    </div>
                  ) : (
                    "Search"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setFilterType("all_readings");
                    setFilterValue("0");
                    setSelectedMonth("all");
                    setPage(0);
                  setSortBy("day_count");
                  setSortOrder("desc");
                    savePreferences({
                      page: 0,
                      rowsPerPage: 10,
                      filterType: "all_readings",
                      filterValue: "5",
                    selectedMonth: "all",
                    sortBy: "day_count",
                    sortOrder: "desc"
                  });
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-3 py-2 rounded-md transition-all duration-200 bg-white shadow-sm text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Table */}
        <div className="overflow-hidden">
          <TableContainer>
            <Table stickyHeader sx={{ minWidth: 650 }} aria-label="patient reading details table">
              <TableHead>
                <TableRow>
                  {columns?.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      className={headCell.sortable ? 'cursor-pointer hover:bg-gray-50' : ''}
                      onClick={headCell.sortable ? () => handleSort(headCell.sortKey) : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span>{headCell.name}</span>
                        {headCell.sortable && (
                          <span className="ml-1 inline-flex align-middle">
                            {sortBy === headCell.sortKey ? (
                              sortOrder === "asc" ? (
                                <ArrowUp className="w-3 h-3 text-gray-900" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-gray-900" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-gray-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {patientWithVitalsCount.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-2 bg-gray-100 rounded-full mb-3">
                          <Calendar className="w-6 h-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-1">
                          {t('dashboard.noRecordFound')}
                        </h3>
                        <p className="text-gray-500 max-w-sm text-center text-sm">
                          {t('dashboard.noPatientReadings')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  patientWithVitalsCount.map((patient, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        "&:last-child td, &:last-child th": { border: 0 },
                        "&:hover": { backgroundColor: "#f9fafb" },
                        transition: "background-color 0.2s ease"
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ padding: "12px 16px" }}>
                        <Link
                          to={`/dashboard/${facilitySlug}/patients/${patient.slug}`}
                          className="!text-blue-500 hover:!underline !transform hover:!translate-y-[-2px] !transition-transform !duration-200"
                        >
                          {patient.first_name} {patient.last_name}
                        </Link>
                      </TableCell>

                      <TableCell sx={{ padding: "12px 16px" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium text-sm">
                            {patient.day_count}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell sx={{ padding: "12px 16px" }}>
                        <span className="text-gray-700 text-sm">
                          {patient.last_reading
                            ? moment(patient.last_reading).format("MMM D, YYYY h:mm A")
                            : ""}
                        </span>
                      </TableCell>
                      <TableCell sx={{ padding: "12px 16px" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-700 font-medium text-sm">
                            {patient.day_calories_count}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell sx={{ padding: "12px 16px" }}>
                        <span className="text-gray-700 text-sm">
                          {patient.last_calories_scan
                            ? moment(patient.last_calories_scan).format("MMM D, YYYY h:mm A")
                            : ""}
                        </span>
                      </TableCell>

                      <TableCell sx={{ padding: "12px 16px" }}>
                        <CommentSection patientId={patient.id} comments={patient.notes} onCommentAdded={(response, type) => {
                          if (type === "update") {
                            setPatientWithVitalsCount(patientWithVitalsCount.map(usr => usr.id === patient.id ? { ...usr, notes: patient.notes.map(note => note.id === response.id ? { ...note, content: response.content } : note) } : usr));
                          } else {
                            setPatientWithVitalsCount(patientWithVitalsCount.map(usr => usr.id === patient.id ? { ...usr, notes: [...usr.notes, response] } : usr));
                          }
                        }} globalEditing={globalEditing} setGlobalEditing={setGlobalEditing} isNote={true} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <div className="border-t border-gray-200">
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{
                '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                  color: '#6b7280',
                  fontSize: '13px'
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Language Selection Modal */}
      {showLangModal && (
        <LanguageSelectModal
          open={showLangModal}
          onClose={() => {
            setShowLangModal(false);
            setInviteUser(null);
          }}
          onSelect={async (lang) => {
            setShowLangModal(false);
            if (inviteUser) {
              await handleSendReminder({ ...inviteUser, id: inviteUser.user_id }, lang);
              setInviteUser(null);
              fetchPatientWithVitalsCount();
            }
          }}
          loading={inviteLoading.show}
        />
      )}
    </div>
  );
};

export default PatientReadingDetailsTable; 