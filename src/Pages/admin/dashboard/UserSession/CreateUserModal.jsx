import { X } from "lucide-react";
import CreateUser from "../../root/CreateUser";

export const CreateUserModal = ({
  showCreateUserModal,
  setShowCreateUserModal,
  selectedUser,
  setSelectedUser,
  afterSuccess,
  facilityList,
  customerDashboard,
}) => {
  return (
    showCreateUserModal && (
      <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl border border-gray-100 shadow-lg relative">
          <button
            onClick={() => {
              setShowCreateUserModal(false);
              setSelectedUser(null);
            }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
          <CreateUser
            isOpen={showCreateUserModal}
            setIsOpen={setShowCreateUserModal}
            user={selectedUser}
            afterSuccess={afterSuccess}
            facilityList={facilityList}
            customerDashboard={customerDashboard}
          />
        </div>
      </div>
    )
  );
};
