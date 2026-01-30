import { shenaiEvents } from "../../../lib/constants";
import { logInfo, logError } from "../../../utils/logger";

const errCtx = (error, phase) => ({
  phase,
  message: error?.message ?? String(error),
  stack: error?.stack,
});

export const getShenaiEvents = ({ instance, navigate }) => (event) => {
  logInfo("ShenAI: SDK event received", { event });
  const isLoggedIn = localStorage.getItem("token");

  if (event === shenaiEvents.USER_FLOW_FINISHED) {
    logInfo("ShenAI: User flow finished", {
      isLoggedIn: !!isLoggedIn,
      destination: isLoggedIn ? "/profile" : "/demos",
    });
    if (instance) {
      try {
        instance.destroyRuntime();
        logInfo("ShenAI: SDK runtime destroyed on flow finish");
      } catch (err) {
        logError("ShenAI: Error destroying runtime on flow finish", errCtx(err, "destroy_runtime"));
      }
    }
    try {
      if (isLoggedIn) {
        navigate("/profile");
      } else {
        navigate("/demos");
      }
    } catch (err) {
      logError("ShenAI: Error navigating after flow finish", errCtx(err, "navigate_after_finish"));
    }
  }
};