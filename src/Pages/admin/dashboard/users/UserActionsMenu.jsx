import { Loader2, MoreVertical, StopCircle } from "lucide-react";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../Component/UI/dropdown-menu";

const UserActionsMenu = ({ onUnsubscribe, loading, disabled }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="d-inline-block cursor-pointer ml-1 hover:bg-gray-100 p-2 rounded-md data-[state=open]:shadow-md data-[state=open]:bg-gray-200"
          disabled={disabled}
          aria-label="Open actions menu"
        >
          <MoreVertical className="h-5 w-5" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-white !p-0">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            if (!loading && !disabled) onUnsubscribe();
          }}
          disabled={loading || disabled}
          className="text-black focus:bg-black focus:text-white cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <StopCircle className="h-4 w-4 mr-2" />
          )}
          Unsubscribe
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActionsMenu; 