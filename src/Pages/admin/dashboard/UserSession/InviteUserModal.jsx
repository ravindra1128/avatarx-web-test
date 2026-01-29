import { Loader2, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../../Component/UI/button";
import { prepareInviteMessage } from "./utils";

export const InviteUserModal = ({
  showInviteModal,
  setShowInviteModal,
  inviteLoading,
  handleInviteUser,
}) => {
  const [copied, setCopied] = useState(false);
  const message = prepareInviteMessage(
    showInviteModal?.user,
    showInviteModal?.dr_name || ""
  );
  return (
    showInviteModal.show && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-gray-100 shadow-lg relative">
          <button
            onClick={() => {
              setShowInviteModal({
                show: false,
                user: null,
              });
              setCopied(false);
            }}
            className="cursor-pointer absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="whitespace-pre-wrap font-mono text-sm text-left bg-gray-100 p-4 rounded-lg">
            {message}
          </div>
          <div className="flex justify-end mt-6 gap-4">
            <Button
              onClick={() => {
                navigator.clipboard.writeText(message);
                setCopied(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2"
            >
              {copied ? "Copied to clipboard!" : "Copy"}
            </Button>
            <Button
              onClick={() => {
                handleInviteUser(showInviteModal?.user, true);
              }}
              className="bg-black hover:bg-gray-700 text-white font-medium rounded-lg shadow-sm transition-all duration-200 flex items-center gap-2 w-22"
            >
              {inviteLoading.show &&
              inviteLoading.user.id === showInviteModal?.user.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Invite</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  );
};
