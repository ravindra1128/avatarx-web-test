import { GoogleOAuthProvider } from "@react-oauth/google";
import AOS from "aos";
import "aos/dist/aos.css";
import React, { lazy, Suspense, useEffect, useContext } from "react";
import { Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Components
import AdminRoute from "./Component/AdminAccess.jsx";
import AdminPrivateRoute from "./Component/AdminAccessRoute.jsx";
import Footer from "./Component/Footer/Footer";
import Navbar from "./Component/NavBar";
import { AuthContext } from "./Component/AuthProvider";

// Pages
import { ErrorBoundary } from "react-error-boundary";
import Avatar from "./avatars/video/page";
import { LinkScroller } from "./Component/LinkScroller";
import ErrorFallback from "./ErrorBoundry/ErrorFallback.jsx";
import { useUser } from "./Hooks/useUser.js";
import { AuthRoute } from "./layout/AuthRoute.jsx";
import AccessDenied from "./Pages/AccessDenied.jsx";
import DashboardPage from "./Pages/admin/dashboard/page.jsx";
import UsersPage from "./Pages/admin/dashboard/users/page.jsx";
import NewUsers from "./Pages/admin/dashboard/UserSession/NewUsers.jsx";
import UserSession from "./Pages/admin/dashboard/UserSession/UserSession.jsx";
import Invite from "./Pages/admin/Invite.jsx";
import PageNotFound from "./Pages/admin/PageNotFound.jsx";
import Callback from "./Pages/auth/Callback.jsx";
import ChronicCareManagement from "./Pages/chronic-care-management/page.jsx";
import Consent from "./Pages/Consent/Consent";
import ContactUs from "./Pages/ContactUs/ContactUs";
import Depression from "./Pages/inference/depression/page";
import Inference from "./Pages/inference/page";
import Parkinsons from "./Pages/inference/parkinsons/page";
import LandingPage from "./Pages/LandingPage/LandingPage";
import Login from "./Pages/Login/Login";
import Privacy from "./Pages/Privacy.jsx";
import UserProfile from "./Pages/profile/UserProfile.jsx";
import RemotePatientMonitoring from "./Pages/remote-patient-monitoring/page.jsx";
import Terms from "./Pages/Terms.jsx";
import TryDemoPage from "./Pages/TryDemoPage";
import FoodScannerDemo from "./Pages/FoodScannerDemo.jsx";
import { initializeDatadog } from "./utils/logger";
import ProvidersPage from "./Pages/admin/dashboard/Providers/ProvidersPage.jsx";
import NotFoundLayout from "./layout/NotFoundLayout.jsx";
import Loader from "./Component/Loader.jsx";
import CaloriesCount from "./Pages/CaloriesCount/CaloriesCount.jsx";
import PatientDashboard from "./Pages/patientDashboard/PatientDashboard.jsx";
import Assistant from "./Pages/patientDashboard/Assistant.jsx";
import PatientProfile from "./Pages/profile/PatientProfile.jsx";
import TrailingSlashRedirect from "./Component/TrailingSlashRedirect.jsx";

// Lazy-loaded components
const FaceScan = lazy(() => import("./Pages/inference/face-scan/page.jsx"));
const ShenAi = lazy(() => import("./Pages/inference/shenai/page.jsx"));
const ShenAiWithToken = lazy(() =>
  import("./Pages/inference/shenaiWithToken/page.jsx")
);
const ShenAiWithAuth = lazy(() =>
  import("./Pages/inference/shenaiWithAuth/page.jsx")
);

const Unsubscribe = lazy(() => import("./Pages/Unsubscribe.jsx"));
const GlucosePrediction = lazy(() => import("./Pages/GlucosePrediction/GlucosePrediction.jsx"));
const NewShanAIGlucoseResults = lazy(() => import("./Pages/GlucosePrediction/NewShanAIGlucoseResults.jsx"));
const NewGlucosePredicttion = lazy(() => import("./Pages/GlucosePrediction/NewGlucosePredicttion.jsx"));
// Invite redirect component to handle query parameters
const InviteRedirect = () => {
  const [searchParams] = useSearchParams();

  const lang = searchParams.get('lang');

  // Store the lang value in localStorage if it exists
  if (lang && (lang === "en" || lang === "es")) {
    localStorage.setItem("userLanguage", lang);
    localStorage.setItem("selected_language", lang);
    localStorage.setItem("i18nextLng", lang);
  }
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/patient/dashboard" replace />;
  }

  return <Navigate to="/login/patient" replace />;
};

function App() {
  const { pathname } = useLocation();

  // Initialize SEO for the application

  useEffect(() => {
    AOS.init();
    initializeDatadog();
  }, []);

  const user = useUser();
  const slug = user.slug;
  const { authLoading } = useContext(AuthContext);
  if (authLoading) {
    return <div><Loader /></div>;
  }

  const userData = JSON.parse(localStorage.getItem("userData") || "{}");
  const adminSlug = userData.admin_slugs;
  const isAdmin = userData.is_admin;

  // Function to generate dynamic routes based on admin status
  const generateDashboardRoutes = () => {
    if (isAdmin && adminSlug && Array.isArray(adminSlug) && adminSlug.length > 0) {
      // Admin user with multiple slugs - create routes for each admin slug
      return adminSlug.map((adminSlugItem) => (
        <React.Fragment key={adminSlugItem}>
          <Route
            path={`/dashboard/${adminSlugItem}`}
            element={<AdminRoute element={DashboardPage} />}
          />
          <Route
            path={`/dashboard/${adminSlugItem}/patients`}
            element={<AdminRoute element={UsersPage} />}
          />
          <Route
            path={`/dashboard/${adminSlugItem}/providers`}
            element={<AdminRoute element={ProvidersPage} />}
          />
          <Route
            path={`/dashboard/${adminSlugItem}/patients/:patientSlug`}
            element={<AdminRoute element={PatientProfile} />}
          />
        </React.Fragment>
      ));
    } else {
      // Regular user or admin without adminSlug - use current slug-based routing
      return (
        <React.Fragment>
          <Route
            path={`/dashboard/${slug}`}
            element={<AdminRoute element={DashboardPage} />}
          />
          <Route
            path={`/dashboard/${slug}/patients`}
            element={<AdminRoute element={UsersPage} />}
          />
          <Route
            path={`/dashboard/${slug}/providers`}
            element={<AdminRoute element={ProvidersPage} />}
          />
          <Route
            path={`/dashboard/${slug}/patients/:patientSlug`}
            element={<AdminRoute element={PatientProfile} />}
          />
        </React.Fragment>
      );
    }
  };

  const shouldRenderFooter =
    ![
      "/demos/medical-checkin",
      "/check-vitals",
      "/patient/check-vitals",
      "/login",
      "/login/patient",
      "/login/provider",
      "/auth/callback",
      "/continue-login",
      "/demos/calories-count",
      "/demos/nvision"
    ].includes(pathname) &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/patients/medical-checkin/") &&
    !pathname.startsWith("/dashboard/");


  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <LinkScroller />
      <GoogleOAuthProvider clientId="139075123436-7q4gnhgc8fvm9nj60p23d9317alv9jgj.apps.googleusercontent.com">
        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 99999 }}
        />

        <Navbar />
        <TrailingSlashRedirect />
        <Suspense fallback={<div>Loading...</div>}>
          <div className="">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/try-demo" element={<TryDemoPage />} />

              <Route
                path="/invite"
                element={<InviteRedirect />}
              />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/demos" element={<Inference />} />
              <Route
                path="/login"
                element={<AuthRoute element={<Login />} />}
              />
              <Route
                path="/login/patient"
                element={<AuthRoute element={<Login />} />}
              />
              <Route
                path="/login/provider"
                element={<AuthRoute element={<Login />} />}
              />
              <Route path="/consent" element={<Consent />} />
              <Route
                path="/chronic-care-management"
                element={<ChronicCareManagement />}
              />
              <Route
                path="/remote-patient-monitoring"
                element={<RemotePatientMonitoring />}
              />
              <Route
                path="/patient/check-vitals"
                element={<ShenAiWithAuth />}
              />
              <Route
                path="/patient/check-calories"
                element={<CaloriesCount />}
              />
              <Route
                path="/patient/check-calories-v2"
                element={<CaloriesCount />}
              />
              <Route
                path="/patient/check-vitals_v2"
                element={<ShenAiWithAuth />}
              />
              <Route path="/demos/medical-checkin" element={<ShenAi />} />
              <Route path="/demos/nvision" element={<ShenAi />} />
              <Route path="/demos/calories-count" element={<CaloriesCount />} />
              <Route path="/demos/v2" element={<FaceScan />} />
              <Route
                path="/patients/medical-checkin/:token"
                element={<ShenAiWithToken />}
              />
              <Route path="/demos/depression" element={<Depression />} />
              <Route path="/demos/parkinsons" element={<Parkinsons />} />
              <Route path="/food-scanner-demo" element={<FoodScannerDemo />} />
              <Route path="/patient/dashboard" element={<PatientDashboard />} />
              {/* <Route path="/patient/assistant" element={<Assistant />} /> */}
              <Route path="/profile" element={<UserProfile />} />
              <Route
                path="/profile/:facilitySlug/:userSlug"
                element={<UserProfile />} />
              <Route
                path="/admin/invite"
                element={<AdminRoute element={Invite} />}
              />
                <Route
                  path="admin/dashboard/new-users"
                  element={<AdminRoute element={NewUsers} />}
                />
              {/* <Route path="/admin/root" element={<AdminPrivateRoute element={<CreateUser />} />} /> */}
              {/* <Route
                  path="/admin/dashboard/reminders"
                  element={<AdminRoute element={RemindersPage} />}
                  /> */}
              {/* Dynamic dashboard routes based on admin status and adminSlug */}
              {generateDashboardRoutes()}
              {/* <Route path="/admin/dashboard/pending-patients" element={<AdminRoute element={PendingPatientsPage} />} /> */}
              <Route
                path="/super-admin/dashboard"
                element={<AdminPrivateRoute element={<UserSession />} />}
              />
              <Route path="/auth/callback" element={<Callback />} />
              <Route path="/continue-login" element={<Login />} />
              <Route path="/access-denied" element={<AccessDenied />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/demos/avatar" element={<Avatar />} />
              <Route path="/data-capture" element={<GlucosePrediction />} />
              <Route path="/data-capture-result" element={<NewShanAIGlucoseResults />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="*" element={<NotFoundLayout element={<PageNotFound />} />} />
            </Routes>
          </div>
        </Suspense>

        {shouldRenderFooter && <Footer />}
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
