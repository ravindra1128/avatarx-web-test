import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkAccess } from "../api/user.service.js";
import AdminDashboard from "../layout/AdminDashboard.jsx";
import { logError, logWarn } from "../utils/logger";
import { AuthContext } from "./AuthProvider.jsx";
import Loader from "./Loader.jsx";
import { useUser } from "../Hooks/useUser.js";
const AdminRoute = ({ element: Element, ...rest }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { authData } = useContext(AuthContext);
  const [hasAccess, setHasAccess] = useState(true);
  const navigate = useNavigate();
  const currentUrl = window.location.pathname;
  const { slug } = useUser();
  
  // Get admin data from localStorage
  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const adminSlug = userData.admin_slugs;
  const isAdmin = userData.is_admin;
  
  useEffect(() => {
    // Extract slug from current URL
    const urlParts = currentUrl.split('/');
    const currentSlug = urlParts[2]; // /dashboard/{slug}/...
    
    // Check if user is admin and has access to this specific slug
    if (isAdmin && adminSlug && Array.isArray(adminSlug)) {
      // Admin user - check if current slug is in their adminSlug array
      if (!adminSlug.includes(currentSlug)) {
        navigate("/access-denied");
        return;
      }
    } else if (!authData?.user?.is_admin && currentUrl === `/dashboard/${slug}/providers`) {
      // Regular user trying to access providers page
      navigate("/access-denied");
      return;
    }
    
    checkAccess()
      .then((data) => {
        setHasAccess(data.has_access);
        if (!data.has_access) {
          navigate("/access-denied");
          logWarn("User does not have access to admin dashboard");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        navigate("/access-denied");
        logError("Error checking access", err);
        setIsLoading(false);
      });
  }, [authData, currentUrl, isAdmin, adminSlug, slug]);

  if (hasAccess) {
    return (
      <AdminDashboard>
        {isLoading ? <Loader /> : <Element {...rest} />}
      </AdminDashboard>
    );
  }
};

export default AdminRoute;
