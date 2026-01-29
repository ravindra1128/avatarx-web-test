import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import {
  Building2,
  CalendarRange,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  Users2,
  X,
} from "lucide-react";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../../../../Component/AuthProvider";
import Loader from "../../../../Component/Loader";
import { Button } from "../../../../Component/UI/button";
import { Input } from "../../../../Component/UI/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../Component/UI/select";
import apiClient from "../../../../config/APIConfig";
import { useDebounce } from "../../../../Hooks/useDebounceHook";
import { logCritical, logInfo } from "../../../../utils/logger";
import CreateBranch from "../../root/CreateBranch";
import CreateFacility from "../../root/CreateFacility";
import CreateCustomer from "../../root/CreateCustomer";
import NewUsers from "./NewUsers";
import { useTranslation } from 'react-i18next';

const UserSession = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [selectedFacility, setSelectedFacility] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  // const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [showCreateBranchModal, setShowCreateBranchModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [facilityToDelete, setFacilityToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCustomerModal, setShowCreateCustomerModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const { authData } = useContext(AuthContext);
  const fetchSessions = async (query = searchQuery) => {
    setIsLoading(true);
    try {
      const today = moment();
      let startDate = null;
      let endDate = today.format("YYYY-MM-DD");

      switch (dateRange) {
        case "1d":
          startDate = today.clone().subtract(1, "day").format("YYYY-MM-DD");
          break;
        case "7d":
          startDate = today.clone().subtract(7, "days").format("YYYY-MM-DD");
          break;
        case "30d":
          startDate = today.clone().subtract(30, "days").format("YYYY-MM-DD");
          break;
        default:
          startDate = null;
          endDate = null;
      }

      const queryParams = new URLSearchParams({
        page: page + 1,
        limit: rowsPerPage,
        ...(query && { search: query }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(selectedFacility !== "all" && { facilityId: selectedFacility }),
      });

      const response = await apiClient.get(
        `/user/get_all_session_activity_logs?${queryParams}`
      );

      if (response?.status === 200) {
        const { data, pagination } = response.data;
        setSessions(data);
        setTotalCount(pagination.totalCount);
        logInfo("Sessions fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching sessions", error);
      toast.error(error?.response?.data?.message || "Failed to fetch sessions");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFacilities = async () => {
    try {
      const response = await apiClient.get("/medical/facilities");
      if (response?.status === 200) {
        setFacilities(response.data);
        logInfo("Facilities fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching facilities", error);
      toast.error(
        error?.response?.data?.message || "Failed to fetch facilities!"
      );
    }
  };


  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get("/medical/customers");
      setCustomers(response.data.data);
      logInfo("Providers fetched successfully");
    
    } catch (error) {
      logCritical("Error fetching facilities", error);
      toast.error(
        error?.response?.data?.message || "Failed to fetch providers!"
      );
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get("/medical/branches");
      if (response?.status === 200) {
        setBranches(response.data);
        logInfo("Branches fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching branches", error);
      toast.error(
        error?.response?.data?.message || "Failed to fetch branches!"
      );
    }
  };

  useEffect(() => {
    fetchFacilities();
    fetchBranches();
    fetchCustomers();
  }, []);

  // Effect for non-search related updates
  useEffect(() => {
    fetchSessions();
  }, [page, rowsPerPage, dateRange, selectedFacility]);

  // Debounced search handler
  const handleDebouncedSearch = useDebounce((value) => {
    setSearchQuery(value);
    setPage(0);
    fetchSessions(value);
  }, 500);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    handleDebouncedSearch(value);
  };

  const handleDateRange = (value) => {
    setDateRange(value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFacilityChange = (value) => {
    setSelectedFacility(value);
    setPage(0);
  };

  const handleCreateBranchSuccess = () => {
    setShowCreateBranchModal(false);
    fetchBranches(); // Refresh branches list
  };

  const handleDeleteConfirm = async () => {
    if (!facilityToDelete) return;

    setIsDeleting(true);
    try {
      const response = await apiClient.delete(
        `/medical/facilities/${facilityToDelete.id}`
      );
      toast.success(response.data.message || "Provider deleted successfully");
      setShowDeleteConfirmModal(false);
      setFacilityToDelete(null);
      fetchFacilities(); // Refresh the list
      fetchCustomers(); // Refresh the list
    } catch (error) {
      logCritical("Error deleting provider", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete Provider"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    setSelectedUser(null);
    fetchFacilities(); // Refresh facilities list
    fetchCustomers(); // Refresh customers list
  };

  const handleCreateCustomerSuccess = () => {
    setShowCreateCustomerModal(false);
    setSelectedUser(null);
    fetchFacilities(); // Refresh facilities list
    fetchCustomers(); // Refresh customers list
  };

  return (
    <div className="space-y-6 p-8 pt-[100px]">
      {isLoading && <Loader />}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Users2 className="h-7 w-7 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-800">{t('userSession.userSessions')}</h2>
            </div>
          </div>

          <div className="mt-4 border-t border-gray-100 pt-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="relative w-full md:w-[320px]">
                <Input
                  type="text"
                  value={search}
                  placeholder={t('userSession.searchByNameOrEmail')}
                  onChange={handleSearch}
                  className="pl-10 h-12 bg-gray-50 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg transition-colors shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={selectedFacility}
                  onValueChange={handleFacilityChange}
                >
                  <SelectTrigger className="w-[220px] h-12 bg-gray-50 border-gray-200 hover:border-gray-300 transition-all shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users2 className="h-5 w-5 text-gray-500" />
                      <SelectValue placeholder={t('userSession.selectFacility')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-100 shadow-lg rounded-lg">
                    <SelectItem value="all" className="hover:bg-gray-50 py-2.5">
                      <div className="flex items-center">
                        <span>{t('userSession.allFacilities')}</span>
                      </div>
                    </SelectItem>
                    {facilities.map((facility) => (
                      <SelectItem
                        key={facility.id}
                        value={facility.id}
                        onClick={() => handleFacilityChange(facility.id)}
                        className="hover:bg-gray-50 py-2.5"
                      >
                        <div className="flex items-center">
                          <span>{facility.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={dateRange}
                  onValueChange={(value) => handleDateRange(value)}
                >
                  <SelectTrigger className="w-[220px] h-12 bg-gray-50 border-gray-200 hover:border-gray-300 transition-all shadow-sm">
                    <div className="flex items-center gap-2">
                      <CalendarRange className="h-5 w-5 text-gray-500" />
                      <SelectValue placeholder={t('userSession.selectTimePeriod')} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-100 shadow-lg rounded-lg">
                    <SelectItem value="all" className="hover:bg-gray-50 py-2.5">
                      <div className="flex items-center">
                        <span>{t('userSession.allTime')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="1d" className="hover:bg-gray-50 py-2.5">
                      <div className="flex items-center">
                        <span>{t('userSession.past24Hours')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="7d" className="hover:bg-gray-50 py-2.5">
                      <div className="flex items-center">
                        <span>{t('userSession.past7Days')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="30d" className="hover:bg-gray-50 py-2.5">
                      <div className="flex items-center">
                        <span>{t('userSession.past30Days')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 2 }}>
          <TableContainer>
            <Table
              stickyHeader
              sx={{ minWidth: 650 }}
              aria-label="sticky table"
            >
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold">{t('userSession.user')}</TableCell>
                  <TableCell className="!font-bold">{t('userSession.email')}</TableCell>
                  <TableCell className="!font-bold">{t('userSession.providerName')}</TableCell>
                  <TableCell className="!font-bold">{t('userSession.providerEmail')}</TableCell>
                  <TableCell className="!font-bold">{t('userSession.startTime')}</TableCell>
                  <TableCell className="!font-bold">{t('userSession.duration')}</TableCell>
                  <TableCell className="!font-bold">{t('userSession.totalSessions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sessions.length > 0 ? (
                  sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {session.first_name} {session.last_name}
                      </TableCell>
                      <TableCell>{session.user_email}</TableCell>
                      <TableCell>{session.facility_name}</TableCell>
                      <TableCell>{session.facility_email}</TableCell>
                      <TableCell>
                        {moment(session.start_time).format(
                          "MMM DD, YYYY hh:mm A"
                        )}
                      </TableCell>
                      <TableCell>{session.total_minutes}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {session.session_count}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" className="py-8">
                      <p className="text-gray-500">{t('userSession.noSessionsFound')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {sessions.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Paper>
      </div>
      <NewUsers />
      {/* Facilities and Branches Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <CalendarRange className="h-7 w-7 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-800">{t('userSession.branches')}</h2>
              </div>
              <Button
                onClick={() => setShowCreateBranchModal(true)}
                className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>{t('userSession.addBranch')}</span>
              </Button>
            </div>
            <div className="space-y-4">
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {branch.location}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {
                            facilities.filter((f) => f.branch_id === branch.id)
                              .length
                          }{" "}
                          {t('userSession.facilities')}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {moment(branch.created_at).format("MMM DD, YYYY")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-500">{t('userSession.noBranchesFound')}</p>
                </div>
              )}
            </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-7 w-7 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-800">{t('userSession.facilities')}</h2>
            </div>
            <Button
              onClick={() => {
                setSelectedUser(null);
                setShowCreateModal(true);
              }}
              className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('userSession.addFacility')}</span>
            </Button>
          </div>
          <div className="space-y-4">
            {facilities.length > 0 ? (
              facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {facility.name}
                      </h3>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {facility.branch_location} {t('userSession.branch')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">{t('userSession.noFacilitiesFound')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <User className="h-7 w-7 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-800">{t('userSession.providers')}</h2>
            </div>
            <Button
              onClick={() => {
                setSelectedUser(null);
                setShowCreateCustomerModal(true);
              }}
              className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('userSession.addProvider')}</span>
            </Button>
          </div>
          <div className="space-y-4">
            {customers.length > 0 ? (
              customers.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                >
                  <div className="flex flex-col items-start">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {customer.first_name} {customer.last_name}
                      </h3>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{customer.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{customer.phone_number}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-500">{t('userSession.noProvidersFound')}</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Facility Form Modal */}
      {/* {showFacilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-gray-100 shadow-lg relative">
            <button
              onClick={() => {
                setShowFacilityModal(false);
                setSelectedFacility(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <FacilityForm
              isOpen={showFacilityModal}
              setIsOpen={setShowFacilityModal}
              facility={selectedFacility}
              afterSuccess={handleFacilitySuccess}
            />
          </div>
        </div>
      )} */}

      {/* Create Branch Modal */}
      {showCreateBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-gray-100 shadow-lg relative">
            <button
              onClick={() => setShowCreateBranchModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <CreateBranch
              isAddBranchOpen={showCreateBranchModal}
              setIsAddBranchOpen={setShowCreateBranchModal}
              afterSuccess={handleCreateBranchSuccess}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && facilityToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-md bg-white p-6 rounded-xl border border-gray-100 shadow-lg relative">
            <button
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setFacilityToDelete(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('userSession.deleteProvider')}
              </h3>
              <p className="text-gray-500">
                {t('userSession.confirmDeleteProvider', { name: facilityToDelete.name })}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setFacilityToDelete(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                {t('userSession.cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  t('userSession.delete')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Update Facility Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-gray-100 shadow-lg relative">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <CreateFacility
              isOpen={showCreateModal}
              setIsOpen={setShowCreateModal}
              user={selectedUser}
              afterSuccess={handleCreateSuccess}
            />
          </div>
        </div>
      )}


    {showCreateCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-gray-100 shadow-lg relative">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setSelectedUser(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
            <CreateCustomer
              isOpen={showCreateCustomerModal}
              setIsOpen={setShowCreateCustomerModal}
              user={selectedUser}
              afterSuccess={handleCreateCustomerSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSession;
