import { useState, useEffect, useContext } from "react";
import UserTable from "@/components/dashboard/UserTable";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { useNavigate } from "react-router-dom";
import { checkToken as apiCheckToken } from "@/src/api/api";
import { LoggedInUserContext } from "@/src/contexts/LoggedInUserContext";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { loggedInUser, setLoggedInUser } = useContext(LoggedInUserContext);

  const navigate = useNavigate();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await apiCheckToken();

        if (response.status !== 200) {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error verifying token:", error);
        navigate("/login");
      }
    };

    checkToken();
  }, [navigate, loggedInUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(
        data.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          phoneNumber: user.phone_number,
          medications: user.medications,
        })),
      );
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setIsLoading(false);
    }
  };

  const handleAddMedication = async (userId, medication) => {
    try {
      fetchUsers();
    } catch (error) {
      console.error("Error adding medication:", error);
      // You might want to add error handling UI here
    }
  };

  const handleDeleteMedication = async (userId, medicationId) => {
    try {
      fetchUsers();
    } catch (error) {
      console.error("Error deleting medication:", error);
      // You might want to add error handling UI here
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="p-5">
        {/* <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Users</h1>
        </div> */}
        <UserTable
          users={users}
          onAddMedication={handleAddMedication}
          onDeleteMedication={handleDeleteMedication}
          onUpdateUsers={fetchUsers}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      </div>
    </LocalizationProvider>
  );
}
