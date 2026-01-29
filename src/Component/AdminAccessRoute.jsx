import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthProvider";
import Loader from "./Loader";
const AdminPrivateRoute = ({ element }) => {
  const { authData, authLoading } = useContext(AuthContext);
  const userRole = authData?.user?.role;

  const isAccess = userRole === "admin";
  const isLoggedIn = localStorage.getItem("token");

  return (
    <>
      {isLoggedIn ? (
        authLoading ? (
          <Loader />
        ) : isAccess ? (
          element
        ) : (
          <Navigate to="/access-denied" />
        )
      ) : (
        <Navigate to="/continue-login" />
      )}
    </>
  );
};

export default AdminPrivateRoute;
