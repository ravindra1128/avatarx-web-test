import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const useUser = () => {
  const [user, setUser] = useState({});
  const localStorageSlug = JSON.parse(localStorage.getItem("user")|| '{}') || {};
  const is_admin = localStorageSlug.is_admin;
  const params = useParams();
  const facilitySlug = is_admin ? params?.slug || localStorage.getItem("facility_slug") : localStorage.getItem("facility_slug"); 
  const patientSlug = localStorage.getItem("patient_slug");
  const userFacilitySlug = localStorage.getItem("userFacilitySlug");

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const slug = userData?.role === "facility" ? facilitySlug : patientSlug;

    // Combine all user data including slugs
    setUser({ 
      ...userData,
      slug,
      userFacilitySlug, // Facility slug associated with user
      facilitySlug // Current facility slug from URL
    });
  }, [facilitySlug, patientSlug, userFacilitySlug]);

  return user;
};
