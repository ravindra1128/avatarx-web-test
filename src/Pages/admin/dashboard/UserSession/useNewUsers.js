import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AuthContext } from "../../../../Component/AuthProvider";
import { sendInvite } from "../../../../api/invite.service";
import apiClient from "../../../../config/APIConfig";
import { logCritical, logError, logInfo } from "../../../../utils/logger";
import { useTranslation } from 'react-i18next';

export const useNewUsers = () => {
  const { t } = useTranslation();
  const [newUsersFilter, setNewUsersFilter] = useState("");
  const [selectedNewUserFacility, setSelectedNewUserFacility] = useState("all");
  const [facilities, setFacilities] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [newUsers, setNewUsers] = useState([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState({
    show: false,
    user: null,
    shortUrl: null,
    facility_name: null,
    dr_name: null,
  });
  const { authData } = useContext(AuthContext);

  const handleInviteUser = async (user, invite = false, lang = 'en') => {
    try {
      setInviteLoading({
        show: true,
        user: user,
      });
      const response = await sendInvite({
        executive_name: authData?.user?.dr_name || authData?.user?.last_name || authData?.user?.first_name,
        facility_slug: user.facility_slug,
        user_id: user.id,
        invite: invite,
        lang: lang,
      });
      if (!invite) {
        setShowInviteModal({
          show: true,
          user: user,
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name,
          shortUrl: response.data.invite_link,
          facility_name: response.data.user.facility_name,
          dr_name: response.data.user.dr_name,
        });
      } else {
        toast.success(t('newUsers.inviteSentSuccess'));
        setShowInviteModal({
          show: false,
          user: null,
          shortUrl: null,
        });
      }
    } catch (error) {
      logCritical("Error inviting user", error);
      toast.error(error?.response?.data?.message || t('newUsers.inviteFailed'));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleSendReminder = async (user, lang = 'en') => {
    try {
      setInviteLoading({
        show: true,
        user: user,
      });
      await apiClient.post("/invite/send-login-reminder", {
        executive_name: authData?.user?.dr_name || authData?.user?.last_name || authData?.user?.first_name,
        facility_slug: user.facility_slug,
        user_id: user.id,
        lang: lang,
      });
      toast.success(t('users.reminderSentSuccess'));
      setShowInviteModal({
        show: false,
        user: null,
        shortUrl: null,
      });
    } catch (error) {
      logCritical("Error sending reminder", error);
      toast.error(error?.response?.data?.message || t('users.sendReminderFailed'));
    } finally {
      setInviteLoading(false);
    }
  }

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
        error?.response?.data?.message || t('newUsers.fetchFacilitiesFailed')
      );
    }
  };

  const fetchNewUsers = async () => {
    try {
      const response = await apiClient.post("/user/get_all_inactive_users");
      if (response?.status === 200) {
        setNewUsers(response.data.data);
        logInfo("New users fetched successfully");
      }
    } catch (error) {
      logCritical("Error fetching facilities", error);
      toast.error(
        error?.response?.data?.message || t('newUsers.fetchFacilitiesFailed')
      );
    }
  };

  const filteredNewUsers = newUsers.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const phoneNumber = user.phone_number?.toLowerCase() || "";
    const searchTerm = newUsersFilter.toLowerCase();

    const matchesSearch =
      fullName.includes(searchTerm) || phoneNumber.includes(searchTerm);
    const matchesFacility =
      selectedNewUserFacility === "all" ||
      user.facility_id === selectedNewUserFacility;

    return matchesSearch && matchesFacility;
  });

  useEffect(() => {
    // fetchFacilities();
    // fetchNewUsers();
  }, []);

  return {
    newUsersFilter,
    setNewUsersFilter,
    selectedNewUserFacility,
    setSelectedNewUserFacility,
    filteredNewUsers,
    showCreateUserModal,
    setShowCreateUserModal,
    selectedUser,
    setSelectedUser,
    facilities,
    inviteLoading,
    handleInviteUser,
    showInviteModal,
    // fetchNewUsers,
    setShowInviteModal,
    handleSendReminder
  };
};
