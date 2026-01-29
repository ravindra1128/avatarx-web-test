import { useContext, useEffect, useState, useRef } from "react";
import { Button } from "../../../../Component/UI/button";
import { Input } from "../../../../Component/UI/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../Component/UI/table";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useToast } from "@/hooks/use-toast";
import { TablePagination } from "@mui/material";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CheckCircle,
  Clock,
  Filter,
  Loader2,
  Mail,
  PencilIcon,
  Plus,
  Search,
  StopCircle,
  UserIcon
} from "lucide-react";
import moment from "moment";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import "react-phone-input-2/lib/style.css";
import { Link, useLocation } from "react-router-dom";

import { AuthContext } from "../../../../Component/AuthProvider";
import { CommentSection } from "../../../../Component/CommentSection";
import Loader from "../../../../Component/Loader";
import LanguageSelectModal from "../../../../Component/UI/LanguageSelectModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../Component/UI/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../../Component/UI/tooltip";
import apiClient from "../../../../config/APIConfig";
import { useDebounce } from "../../../../Hooks/useDebounceHook";
import { useUser } from "../../../../Hooks/useUser";
import { logCritical, logInfo } from "../../../../utils/logger";
import { CreateUserModal } from "../UserSession/CreateUserModal";
import { useNewUsers } from "../UserSession/useNewUsers";
import UserActionsMenu from "./UserActionsMenu";
import { toast } from "react-toastify";

function UsersPage() {
  const { t } = useTranslation();
  // Unique sessionStorage key for this page
  const SESSION_KEY = "adminUsersPageState";
  const SCROLL_KEY = "adminUsersPageScroll";
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt"); // default sort field
  const [sortOrder, setSortOrder] = useState("desc"); // default sort order
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { authData } = useContext(AuthContext);
  const { inviteLoading, handleInviteUser, handleSendReminder } = useNewUsers();
  const { slug } = useUser();
  const [showLangModal, setShowLangModal] = useState(false);
  const [inviteUser, setInviteUser] = useState(null);
  const [unsubscribeLoadingId, setUnsubscribeLoadingId] = useState(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhoneNumber, setEditedPhoneNumber] = useState(null);
  const [savingPhoneUserId, setSavingPhoneUserId] = useState(null);
  const [globalEditing, setGlobalEditing] = useState({
    userId: null,
    commentId: null,
  });
  const tableContainerRef = useRef(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const {pathname} = useLocation();
const facilitySlug = pathname.split("/")[2];


  const debouncedSetSearchTerm = useDebounce((value) => {
    setSearchTerm(value);
    setPage(0);
  }, 400);

  const USER_DISPLAY_STATUS = {
    ACCEPTED: "ACCEPTED",
    MESSAGE_SENT: "MESSAGE SENT",
    STOPPED: "STOPPED",
  };

  const API_USER_STATUS = {
    ACTIVE: "ACTIVE",
    MESSAGE_SENT: "MESSAGE_SENT",
    STOP: "STOP",
  };

  const API_SMS_STATUS = {
    STOP: "STOP",
    START: "START",
    SENT: "SENT",
    FAILED: "FAILED",
  };

  // Status filter options
  const statusFilterOptions = [
    { value: "all", label: t("users.allStatus") },
    { value: "ACTIVE", label: t("users.accepted") },
    { value: "MESSAGE_SENT", label: t("users.messageSent") },
    { value: "STOP", label: t("users.stopped") },
    { value: "FAILED", label: t("users.failed") },
  ];

  const isUserInvitable = (user) => {
    return (
      // user.status !== API_USER_STATUS.ACTIVE &&
      user.sms_status !== API_SMS_STATUS.STOP &&
      (user.phone_type !== "landline" || user.status === API_USER_STATUS.ACTIVE)
    );
  };

  const getUserStatusClassName = (user) => {
    // Add color for FAILED status
    if (user.sms_status === API_SMS_STATUS.FAILED) {
      return "!bg-orange-100 !text-orange-800";
    }
    if (user.sms_status === API_SMS_STATUS.STOP) {
      return "!bg-red-100 !text-red-800";
    }
    switch (user.status) {
      case API_USER_STATUS.STOP:
        return "!bg-red-100 !text-red-800";
      case API_USER_STATUS.ACTIVE:
        return "!bg-green-100 !text-green-800";
      case API_USER_STATUS.MESSAGE_SENT:
        return "!bg-blue-100 !text-blue-800";
      case API_USER_STATUS.PENDING:
        return "!bg-yellow-100 !text-yellow-800";
      default:
        return "!bg-gray-100 !text-gray-800";
    }
  };

  const unsubscribePatient = async (user) => {
    setUnsubscribeLoadingId(user.id);
    try {
      await apiClient.put(`/user/${user.id}`, {
        sms_status: "STOP",
      });
      toast.success(t("users.unsubscribePatientSuccess"));
      fetchPatients();
    } catch (err) {
      toast.error(
        err.response.data.message || t("users.unsubscribePatientError")
      );
      logCritical("Failed to unsubscribe user", err);
    } finally {
      setUnsubscribeLoadingId(null);
    }
  };

  const getUserStatus = (user) => {
    // we have 2 fields in db: status and sms_status
    // IMPORTANT! If sms_status is STOP - display 'STOPPED'. It's priority is the highest!
    if (user.sms_status === API_SMS_STATUS.STOP) {
      return USER_DISPLAY_STATUS.STOPPED;
    }
    // If sms_status is FAILED, display 'FAILED'
    if (user.sms_status === API_SMS_STATUS.FAILED) {
      return "FAILED";
    }
    // if status === 'ACTIVE' - display 'ACCEPTED'
    if (user.status === API_USER_STATUS.ACTIVE) {
      return USER_DISPLAY_STATUS.ACCEPTED;
    }
    if (user.status === API_USER_STATUS.MESSAGE_SENT) {
      return USER_DISPLAY_STATUS.MESSAGE_SENT;
    }
    // If it's different from 'ACCEPTED' then we should display sms_status
    if (user.sms_status) {
      return user.sms_status;
    }
    // Finally - if there's no sms_status - just return status. It's gonna be 'MESSAGE_SENT' in that case
    return user.status;
  };

  const getUserStatusIcon = (user) => {
    if (user.sms_status === API_SMS_STATUS.STOP) {
      return <StopCircle className="w-4 h-4 mr-1" />;
    }
    if (user.sms_status === API_SMS_STATUS.FAILED) {
      return <AlertTriangle className="w-4 h-4 mr-1" />;
    }
    if (user.status === API_USER_STATUS.ACTIVE) {
      return <CheckCircle className="w-4 h-4 mr-1" />;
    }
    if (user.status === API_USER_STATUS.MESSAGE_SENT) {
      return <Mail className="w-4 h-4 mr-1" />;
    }
    if (user.status === API_USER_STATUS.PENDING) {
      return <Clock className="w-4 h-4 mr-1" />;
    }
    return <AlertTriangle className="w-4 h-4 mr-1" />;
  };

  const getUserStatusTooltipBgColor = (user) => {
    if (user.sms_status === API_SMS_STATUS.STOP) {
      return "bg-red-100";
    }
    if (user.sms_status === API_SMS_STATUS.FAILED) {
      return "bg-red-100";
    }
    if (user.status === API_USER_STATUS.ACTIVE) {
      return "bg-green-100";
    }
    if (user.status === API_USER_STATUS.MESSAGE_SENT) {
      return "bg-blue-100";
    }
    if (user.status === API_USER_STATUS.PENDING) {
      return "bg-yellow-100";
    }
    return "bg-gray-100";
  };

  const getUserStatusTooltipTextColor = (user) => {
    if (user.sms_status === API_SMS_STATUS.STOP) {
      return "text-red-800";
    }
    if (user.sms_status === API_SMS_STATUS.FAILED) {
      return "text-red-800";
    }
    if (user.status === API_USER_STATUS.ACTIVE) {
      return "text-green-800";
    }
    if (user.status === API_USER_STATUS.MESSAGE_SENT) {
      return "text-blue-800";
    }
    if (user.status === API_USER_STATUS.PENDING) {
      return "text-yellow-800";
    }
    return "text-gray-800";
  };

  const getUserStatusTooltip = (user) => {
    const textColor = getUserStatusTooltipTextColor(user);
    if (user.sms_status === API_SMS_STATUS.STOP) {
      return (
        <div className={`text-center ${textColor}`}>
          {t("users.tooltipUnsubscribed")}
          <br />
          {t("users.fromYourLists")}
        </div>
      );
    }
    if (user.sms_status === API_SMS_STATUS.FAILED) {
      return (
        <div className={`text-center ${textColor}`}>
          {t("users.messageNotDelivered")}
          <br />
          {t("users.tooltipFailedPossibleReasons")}
          <br />
          {t("users.otherReasons")}
        </div>
      );
    }
    if (user.status === API_USER_STATUS.ACTIVE) {
      return (
        <div className={`text-center ${textColor}`}>
          {t("users.tooltipAccepted")}
          <br />
          {t("users.your_invitation")}
        </div>
      );
    }
    if (user.status === API_USER_STATUS.MESSAGE_SENT) {
      return (
        <div className={`text-center ${textColor}`}>
          {t("users.tooltipMessageSent")}
          <br />
          {t("users.toThisContact")}
        </div>
      );
    }
    if (user.status === API_USER_STATUS.PENDING) {
      return (
        <div className={`text-center ${textColor}`}>
          {t("users.tooltipPending")}
          <br />
          {t("users.forThisContact")}
        </div>
      );
    }
    return (
      <div className={`text-center ${textColor}`}>
        {t("users.tooltipUnknown")}
      </div>
    );
  };

  // Add helper to check invite cooldown
  const getInviteCooldown = (user) => {
    // if (user.status === API_USER_STATUS.ACTIVE) {
    //   return getLastMessageSentCooldown(user);
    // }
    if (!user.message_sent_at) return 0;
    const lastInvite = moment(user.message_sent_at);
    const now = moment();
    const diffHours = now.diff(lastInvite, "hours", true);
    if (diffHours < 24) {
      return 24 - diffHours;
    }
    return 0;
  };

  // last message sent at
  const getLastMessageSentCooldown = (user) => {
    if (!user.message_sent_at) return 0;
    const lastInvite = moment(user.message_sent_at);
    const now = moment();
    const diffMinutes = now.diff(lastInvite, "minutes", true);
    if (diffMinutes < 60) {
      return 60 - diffMinutes;
    }
    return 0;
  };

  // Filter users by status
  const filterUsersByStatus = (user) => {
    if (statusFilter === "all") return true;

    const userStatus = getUserStatus(user);
    return userStatus === statusFilter;
  };

  // if count is greate than 3
  const isCountGreaterThan3 = (count) => {
    return count > 3;
  };

  const handlePhoneNumberBlur = async (user) => {
    // Remove any non-digit characters
    const cleanNumber = editedPhoneNumber ? editedPhoneNumber.replace(/\D/g, '').replace(/^\+?1/, '') : '';
    // Check for exactly 10 digits
    if (!cleanNumber || cleanNumber.length !== 10) {
      toast.error(t("users.phoneNumberInvalid"));
      return;
    }
    const formattedPhone = `+1${cleanNumber}`;
    if (user.phone_number === formattedPhone) {
      setIsEditingPhone(false);
      return;
    }

    try {
      setSavingPhoneUserId(user.id);
      await apiClient.post("/user/update_phone_number", {
        user_id: user.id,
        phone_number: formattedPhone,
      });
      toast.success(t("users.phoneNumberUpdated"));
      setUsers(users.map(user => user.id === user.id ? { ...user, phone_number: formattedPhone } : user));
    } catch (error) {
      logCritical("Error updating phone number", error);
      toast.error(error.response?.data?.message || t("users.errorUpdatingPhoneNumber"));
    } finally {
      setSavingPhoneUserId(null);
    }
    setIsEditingPhone(false);
    setSelectedUser(null);
    setEditedPhoneNumber(null);
  };

  useEffect(() => {
    // const filtered = users.filter((user) => {
    //   const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    //   const phone = user.phone_number?.toLowerCase() || "";
    //   const searchLower = searchTerm.toLowerCase();

    //   const matchesSearch = fullName.includes(searchLower) || phone.includes(searchLower);
    //   // const matchesStatus = filterUsersByStatus(user);

    //   return matchesSearch;
    // });
    setFilteredUsers(users);
  }, [searchTerm, users, statusFilter]);

  // Restore state from sessionStorage on mount and fetch patients only once
  useEffect(() => {
    const savedState = sessionStorage.getItem(SESSION_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.searchInput !== undefined) setSearchInput(parsed.searchInput);
        if (parsed.searchTerm !== undefined) setSearchTerm(parsed.searchTerm);
        if (parsed.statusFilter !== undefined) setStatusFilter(parsed.statusFilter);
        if (parsed.page !== undefined) setPage(parsed.page);
        if (parsed.rowsPerPage !== undefined) setRowsPerPage(parsed.rowsPerPage);
        if (parsed.sortBy !== undefined) setSortBy(parsed.sortBy);
        if (parsed.sortOrder !== undefined) setSortOrder(parsed.sortOrder);
        // Wait for all state updates to finish before fetching
        setTimeout(() => {
          fetchPatients(
            parsed.page ?? page,
            parsed.rowsPerPage ?? rowsPerPage,
            parsed.searchTerm ?? searchTerm,
            parsed.sortBy ?? sortBy,
            parsed.sortOrder ?? sortOrder,
            parsed.statusFilter ?? statusFilter
          );
          setHasInitialized(true);
        }, 0);
        return;
      } catch (e) {
        // ignore
      }
    }
    // If no session state, fetch with defaults
    fetchPatients(page, rowsPerPage, searchTerm, sortBy, sortOrder, statusFilter);
    setHasInitialized(true);
  }, []);

  // Save state to sessionStorage whenever relevant state changes
  useEffect(() => {
    const state = {
      // searchInput,
      // searchTerm,
      statusFilter,
      page,
      rowsPerPage,
      sortBy,
      sortOrder,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [statusFilter, page, rowsPerPage, sortBy, sortOrder]);

  // Only fetch patients on state change after initial load
  useEffect(() => {
    if (!hasInitialized) return;
    fetchPatients();
  }, [page, rowsPerPage, searchTerm, sortBy, sortOrder, statusFilter, hasInitialized]);

  // Update fetchPatients to accept optional params for initial load
  const fetchPatients = async (
    customPage = page,
    customRowsPerPage = rowsPerPage,
    customSearchTerm = searchTerm,
    customSortBy = sortBy,
    customSortOrder = sortOrder,
    customStatusFilter = statusFilter
  ) => {
    setIsLoading(true);
    apiClient
      .post(`/user/get_my_patients`, {
        page: customPage,
        limit: customRowsPerPage,
        search: customSearchTerm
          ? customSearchTerm.replace(/[-,]/g, '').trim()
          : customSearchTerm,
        sortBy: customSortBy,
        sortOrder: customSortOrder,
        statusFilter: customStatusFilter === "all" ? undefined : customStatusFilter,
        slug: facilitySlug,
      })
      .then((res) => {
        setIsLoading(false);
        setTotalCount(res.data.pagination.totalCount);
        console.log("res.data.data", res.data.data);
        setUsers(res.data.data);
        logInfo("Patients data fetched successfully");
      })
      .catch((err) => {
        setIsLoading(false);
        logCritical("Error fetching patients list", err);
        toast.error(err?.response?.data?.message || "Failed to fetch patients");
      });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const inviteButtonTooltip = (user) => {
    if (user.phone_type === "landline" && user.status !== API_USER_STATUS.ACTIVE) {
      return (
        <TooltipContent>{t("users.inviteDisabledTooltip")}</TooltipContent>
      );
    }
    if (isCountGreaterThan3(user.message_sent_count)) {
      return (
        <TooltipContent>{t("users.inviteDisabledTooltipCount")}</TooltipContent>
      );
    }
    if (getInviteCooldown(user) > 0) {
      return (
        <TooltipContent>
          {t("userProfile.invitationSent")}{" "}
          {moment(user.message_sent_at).fromNow()}.
          <br />
          { t("userProfile.anotherInviteCanBeSentIn")}{" "}
          {Math.ceil(getInviteCooldown(user))} {t("userProfile.hour")}(s).
        </TooltipContent>
      );
    }
    return null;
  };
  const cleanPhoneNumber = (phoneNumber) => {
    return phoneNumber.replace(/\D/g, '').replace(/^\+?1/, '');
  };
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t("users.patients")}</h1>
        <Button
          onClick={() => {
            setSelectedUser(null);
            setShowCreateUserModal(true);
          }}
          className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>{t("users.addNewPatient")}</span>
        </Button>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={t("users.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSetSearchTerm(e.target.value);
            }}
            className="pl-10 h-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[180px] bg-white border-gray-300 hover:border-blue-400 transition-colors h-12">
              <SelectValue placeholder={t("users.filterByStatus")} />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#e4ebf4] text-xs">
              {statusFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div ref={tableContainerRef} className="max-h-100 table-container">
        <Table className="!border-0">
          <TableHeader>
            <TableRow>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t("users.name")}
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t("users.phoneNumber")}
              </TableHead>
              <TableHead
                className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 cursor-pointer hover:bg-gray-50 whitespace-nowrap overflow-hidden !px-[12px]"
                onClick={() => {
                  if (sortBy === "last_login_time") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("last_login_time");
                    setSortOrder("asc");
                  }
                }}
              >
                {t("users.lastLoginTime")}
                <span className="ml-1 inline-flex align-middle">
                  {sortBy === "last_login_time" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </TableHead>
              <TableHead
                className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 cursor-pointer hover:bg-gray-50 whitespace-nowrap overflow-hidden !px-[12px]"
                onClick={() => {
                  if (sortBy === "last_visit_time") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("last_visit_time");
                    setSortOrder("asc");
                  }
                }}
              >
                {t("users.lastVisitTime")}
                <span className="ml-1 inline-flex align-middle">
                  {sortBy === "last_visit_time" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </TableHead>
              <TableHead
                className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 cursor-pointer hover:bg-gray-50 whitespace-nowrap overflow-hidden !px-[12px]"
                onClick={() => {
                  if (sortBy === "message_sent_at") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("message_sent_at");
                    setSortOrder("asc");
                  }
                }}
              >
                {t("users.messageSentAt")}
                <span className="ml-1 inline-flex align-middle">
                  {sortBy === "message_sent_at" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </TableHead>
              <TableHead
                className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 cursor-pointer hover:bg-gray-50 whitespace-nowrap overflow-hidden !px-[12px]"
                onClick={() => {
                  if (sortBy === "status") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("status");
                    setSortOrder("asc");
                  }
                }}
              >
                {t("users.status")}
                <span className="ml-1 inline-flex align-middle">
                  {sortBy === "status" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t("users.actions")}
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 !px-[12px] w-[300px]">
                {t("users.comment")}
              </TableHead>
              <TableHead
                className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 cursor-pointer hover:bg-gray-50 whitespace-nowrap overflow-hidden !px-[12px]"
                onClick={() => {
                  if (sortBy === "date_of_service") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortBy("date_of_service");
                    setSortOrder("asc");
                  }
                }}
              >
                {t("users.dateOfService")}
                <span className="ml-1 inline-flex align-middle">
                  {sortBy === "date_of_service" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]"
              onClick={() => {
                if (sortBy === "birth_date") {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy("birth_date");
                  setSortOrder("asc");
                }
              }}>
                {t("users.birthDate")}
                <span className="ml-1 inline-flex align-middle">
                  {sortBy === "birth_date" ? (
                    sortOrder === "asc" ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-gray-400" />
                  )}
                </span>
              </TableHead>

              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t("users.mdrc")}
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t("users.payerName")}
              </TableHead>
              <TableHead className="!border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                {t("users.secPayer")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-16">
                  <Loader className="w-16 h-16" />
                </TableCell>
              </TableRow>
            )}
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="text-center py-16 !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4"
                >
                  <div className="flex flex-col items-center justify-center">
                    <UserIcon className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      {t("users.noPatientsFound")}
                    </h3>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    <div className="flex items-center">
                      <Link
                        to={`/dashboard/${facilitySlug}/patients/${user.slug}`}
                        className="!text-blue-500 hover:!underline !transform hover:!translate-y-[-2px] !transition-transform !duration-200"
                      >
                        {user.first_name} {user.last_name}
                      </Link>
                    </div>
                  </TableCell>

                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    <div className="flex items-center gap-2 w-40">
                      {isEditingPhone && user.id === selectedUser?.id ? (
                        <>
                          <div className="relative w-40 flex items-center">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <span className="text-gray-500">+1</span>
                            </div>
                            <input
                              type="tel"
                              value={editedPhoneNumber
                                .replace(/\D/g, "")
                                .replace(/^\+?1/, "")}
                              maxLength={10}
                              autoFocus
                              placeholder="(555) 555-5555"
                              className="w-32 px-2 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, "");
                                setEditedPhoneNumber(value);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handlePhoneNumberBlur(user);
                                }
                              }}
                              onBlur={() => {
                                handlePhoneNumberBlur(user);
                              }}
                              disabled={savingPhoneUserId === user.id}
                            />
                            <button
                              className={`${cleanPhoneNumber(editedPhoneNumber)?.length === 10 ? 'text-green-500 hover:text-green-600 cursor-pointer' : 'text-gray-300'} ml-2`}
                              disabled={cleanPhoneNumber(editedPhoneNumber)?.length !== 10}
                              title="Update phone number"
                            >
                              {savingPhoneUserId === user.id ? (
                                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                              ) : (
                                <CheckCircle
                                  className={`h-6 w-6 ${
                                    cleanPhoneNumber(editedPhoneNumber)
                                      ?.length === 10
                                      ? "text-green-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          {user.phone_number} 
                          <button 
                            className="hover:text-blue-500"
                            onClick={() => {
                              setIsEditingPhone(true);
                              setEditedPhoneNumber(user.phone_number);
                              setSelectedUser(user);
                            }}
                          >
                            <PencilIcon className="h-4 w-4 cursor-pointer" />
                          </button>
                        </>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.last_login_time
                      ? moment(user.last_login_time).fromNow()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.last_visit_time
                      ? moment(user.last_visit_time).fromNow()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.message_sent_at
                      ? moment(user.message_sent_at).fromNow()
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    <div>
                      {user.status ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`inline-flex items-center cursor-pointer px-2.5 py-1 rounded-full text-xs font-medium ${getUserStatusClassName(
                                  user
                                )}`}
                              >
                                {getUserStatusIcon(user)}
                                {getUserStatus(user)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              color={getUserStatusTooltipBgColor(user)}
                            >
                              {getUserStatusTooltip(user)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          N/A
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px] justify-between">
                                        <div className="flex items-center gap-2">

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button
                              onClick={() => {
                                setInviteUser(user);
                                setShowLangModal(true);
                              }}
                              disabled={
                                !isUserInvitable(user) 
                                || getInviteCooldown(user) > 0
                                || isCountGreaterThan3(user.message_sent_count)
                              }
                              className={`h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 min-w-fit ${
                                !isUserInvitable(user) 
                                || getInviteCooldown(user) > 0
                                || isCountGreaterThan3(user.message_sent_count)
                                  ? "bg-gray-600 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              {inviteLoading.show &&
                              inviteLoading.user.id === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4" />
                                  <span className="whitespace-nowrap">
                                    {user.status === "ACTIVE"
                                      ? t("users.sendReminder")
                                      : user.status === "MESSAGE_SENT"
                                      ? t("users.resendInvite")
                                      : t("users.invite")}
                                  </span>
                                </>
                              )}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        {inviteButtonTooltip(user)}
                      </Tooltip>
                      {user.sms_status !== API_SMS_STATUS.STOP && (
                          <UserActionsMenu
                            onUnsubscribe={() => unsubscribePatient(user)}
                            loading={unsubscribeLoadingId === user.id}
                            disabled={unsubscribeLoadingId === user.id}
                          />
                        )}
                    </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-3 !px-[12px] w-[300px] min-w-[300px] max-w-[300px]">
                    <CommentSection patientId={user.id} comments={user.comments} onCommentAdded={(response, type) => {
                      if (type === "update") {
                        setFilteredUsers(filteredUsers.map(usr => usr.id === user.id ? { ...usr, comments: user.comments.map(comment => comment.id === response.id ? { ...comment, content: response.content } : comment) } : usr));
                      } else {
                        setFilteredUsers(filteredUsers.map(usr => usr.id === user.id ? { ...usr, comments: [...usr.comments, response] } : usr));
                      }
                    }} globalEditing={globalEditing} setGlobalEditing={setGlobalEditing} />
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.date_of_service
                      ? moment(user.date_of_service).format("MM/DD/YYYY")
                      : ""}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.dob
                      ? user.dob
                      : user.year ? user.year : ""}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.md_rc}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.payer_name}
                  </TableCell>
                  <TableCell className="text-left !border-x-0 !border-t-0 !border-[#e5e7eb] !py-4 whitespace-nowrap overflow-hidden !px-[12px]">
                    {user.sec_payer}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </div>

      <CreateUserModal
        showCreateUserModal={showCreateUserModal}
        setShowCreateUserModal={setShowCreateUserModal}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        afterSuccess={() => {
          setShowCreateUserModal(false);
          setSelectedUser(null);
          fetchPatients();
        }}
        facilityList={[
          {
            id: authData?.user?.id,
            name: `${authData?.user?.first_name || ""} ${authData?.user?.last_name || ""
              }`,
          },
        ]}
        customerDashboard={true}
      />
      {showLangModal && <LanguageSelectModal
        open={showLangModal}
        onClose={() => {
          setShowLangModal(false);
          setInviteUser(null);
        }}
        onSelect={async (lang) => {
          setShowLangModal(false);
          if (inviteUser) {
            if (inviteUser.status === API_USER_STATUS.ACTIVE) {
              await handleSendReminder({...inviteUser, facility_slug: facilitySlug}, lang);
            } else {
              await handleInviteUser({...inviteUser, facility_slug: facilitySlug}, true, lang);
            }
            fetchPatients();
            setInviteUser(null);
          }
        }}
        loading={inviteLoading.show}
      />}
    </div>
  );
}

export default UsersPage;