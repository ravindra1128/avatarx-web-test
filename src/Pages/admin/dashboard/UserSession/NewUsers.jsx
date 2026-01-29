import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Building2, Loader2, Plus, Search, Users2 } from "lucide-react";
import moment from "moment";
import React from "react";
import { Button } from "../../../../Component/UI/button";
import { Input } from "../../../../Component/UI/input";
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
import { CreateUserModal } from "./CreateUserModal";
import { InviteUserModal } from "./InviteUserModal";
import { useNewUsers } from "./useNewUsers";
import { useTranslation } from 'react-i18next';

export default function NewUsers() {
  const { t } = useTranslation();
  const {
    newUsersFilter,
    setNewUsersFilter,
    selectedNewUserFacility,
    setSelectedNewUserFacility,
    filteredNewUsers,
    showCreateUserModal,
    showInviteModal,
    setShowCreateUserModal,
    selectedUser,
    setSelectedUser,
    inviteLoading,
    handleInviteUser,
    facilities,
    // fetchNewUsers,
    setShowInviteModal,
  } = useNewUsers();

  // Add helper to check invite cooldown
  const getInviteCooldown = (user) => {
    if (!user.message_sent_at) return 0;
    const lastInvite = moment(user.message_sent_at);
    const now = moment();
    const diffHours = now.diff(lastInvite, "hours", true);
    if (diffHours < 24) {
      return 24 - diffHours;
    }
    return 0;
  };

  return (
    <>
      {/* Create/Update User Modal */}
      <CreateUserModal
        showCreateUserModal={showCreateUserModal}
        setShowCreateUserModal={setShowCreateUserModal}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        afterSuccess={() => {
          setShowCreateUserModal(false);
          setSelectedUser(null);
          // fetchNewUsers();
        }}
        facilityList={facilities}
      />

      <InviteUserModal
        showInviteModal={showInviteModal}
        setShowInviteModal={setShowInviteModal}
        inviteLoading={inviteLoading}
        handleInviteUser={handleInviteUser}
      />
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users2 className="h-7 w-7 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-800">{t('newUsers.title')}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-[520px]">
              <Input
                type="text"
                value={newUsersFilter}
                placeholder={t('newUsers.searchPlaceholder')}
                onChange={(e) => setNewUsersFilter(e.target.value)}
                className="pl-10 h-10 bg-gray-50 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-blue-200 rounded-lg transition-colors shadow-sm"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Select
              value={selectedNewUserFacility}
              onValueChange={setSelectedNewUserFacility}
            >
              <SelectTrigger className="w-[220px] h-10 bg-gray-50 border-gray-200 hover:border-gray-300 transition-all shadow-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <SelectValue placeholder={t('newUsers.selectFacility')} />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-100 shadow-lg rounded-lg">
                <SelectItem value="all" className="hover:bg-gray-50 py-2.5">
                  <div className="flex items-center">
                    <span>{t('newUsers.allFacilities')}</span>
                  </div>
                </SelectItem>
                {facilities.map((facility) => (
                  <SelectItem
                    key={facility.id}
                    value={facility.id}
                    className="hover:bg-gray-50 py-2.5"
                  >
                    <div className="flex items-center">
                      <span>{facility.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                setSelectedUser(null);
                setShowCreateUserModal(true);
              }}
              className="h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>{t('newUsers.addNewUser')}</span>
            </Button>
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
                  <TableCell className=" !font-bold">{t('newUsers.fullName')}</TableCell>
                  <TableCell className=" !font-bold">{t('newUsers.mobileNumber')}</TableCell>
                  <TableCell className=" !font-bold">{t('newUsers.provider')}</TableCell>
                  <TableCell className=" !font-bold">{t('newUsers.status')}</TableCell>
                  <TableCell className=" !font-bold">{t('newUsers.action')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNewUsers.length > 0 ? (
                  filteredNewUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.phone_number}</TableCell>

                      <TableCell>
                        {facilities.find(
                          (f) => f.id === user.facility_id
                        )?.name || t('newUsers.na')}
                      </TableCell>
                      <TableCell>{user.is_consent_given ? t('newUsers.active') : t('newUsers.pending')}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleInviteUser(user)}
                          disabled={
                            user.is_consent_given || getInviteCooldown(user) > 0
                          }
                          className={`h-10 bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 w-32 ${
                            user.is_consent_given || getInviteCooldown(user) > 0
                              ? "bg-gray-600 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>
                                  {inviteLoading.show &&
                                  inviteLoading.user.id === user.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Plus className="h-4 w-4" />
                                      <span>{t('newUsers.invite')}</span>
                                    </>
                                  )}
                                </span>
                              </TooltipTrigger>
                              {getInviteCooldown(user) > 0 && (
                                <TooltipContent>
                                  {t('newUsers.invitationSent')} {moment(user.message_sent_at).fromNow()}.
                                  <br />
                                  {t('newUsers.anotherInviteCanBeSentIn')} {Math.ceil(getInviteCooldown(user))} {t('newUsers.hour')}(s).
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" className="py-8">
                      <p className="text-gray-500">{t('newUsers.noNewUsersFound')}</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
    </>
  );
}
