import { Navigate } from "react-router-dom";
import { logWarn } from "../utils/logger";
export const AuthRoute = ({ element }) => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("userData");
  const user = JSON.parse(userData);
  const role = user?.role;
  if (token) {
    logWarn("User is already logged in");
  }
  const redirectPath = role === "user" ? "/patient/dashboard" : role === "facility" ? "/dashboard/" + user?.facility_slug : "/";
  return token ? <Navigate to={redirectPath} /> : element;
};
