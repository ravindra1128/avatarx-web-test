import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
const VITE_AVATARX_SERVICE =
  import.meta.env.VITE_AVATARX_SERVICE || "avatarx_local_fe";
const VITE_AVATARX_ENV = import.meta.env.VITE_AVATARX_ENV || "avatarx_local_fe";
const VITE_APP_VERSION = import.meta.env.VITE_APP_VERSION;
const isLocal = VITE_AVATARX_ENV === "avatarx_local_fe";
const initializeDatadog = () => {
  if (isLocal) return;
  
  datadogRum.init({
    applicationId: "ed5e4bb6-58d3-4528-8057-bd3fc6388530",
    clientToken: "pubb81d9fa8c7da517899d3301893962664",
    site: "us5.datadoghq.com",
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV,
    version: VITE_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: "mask-user-input",
    forwardErrorsToLogs: true,
  });

  // Initialize Datadog Logs
  datadogLogs.init({
    clientToken: "pubb81d9fa8c7da517899d3301893962664",
    site: "us5.datadoghq.com",
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV,
  });

  logInfo("Datadog initialized");
};

const logInfo = (message, context = {}) => {
  if (isLocal) {
    console.log(message, context);
    return;
  }
  datadogLogs.logger.info(message, {
    ...context,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV
  });
};

const logError = (error, msg = "") => {
  if (isLocal) {
    console.error(error, msg);
    return;
  }
  datadogLogs.logger.error(error, {
    message: msg,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV
  });
};

const logWarn = (message, context = {}) => {
  if (isLocal) {
    console.warn(message, context);
    return;
  }
  datadogLogs.logger.warn(message, {
    ...context,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV
  });
};

const logDebug = (message, context = {}) => {
  if (isLocal) {
    console.debug(message, context);
    return;
  }
  datadogLogs.logger.debug(message, {
    ...context,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV
  });
};

const logCritical = (message, context = {}) => {
  if (isLocal) {
    console.error('CRITICAL:', message, context);
    return;
  }
  datadogLogs.logger.critical(message, {
    ...context,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV
  });
};

const logEvent = (eventName, context = {}) => {
  if (isLocal) {
    console.log("Event: ", eventName, context);
    return;
  }
  datadogLogs.logger.info(`Event: ${eventName}`, {
    ...context,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV
  });
};

const shouldLogAsWarning = (error) => {
  if (!error) return false;
  
  const errorString = error.toString().toLowerCase();
  const errorMessage = error.message ? error.message.toLowerCase() : '';
  const errorName = error.name ? error.name.toLowerCase() : '';
  
  // List of error patterns that should be treated as warnings
  const warningPatterns = [
    'permission was denied',
    'notallowederror',
    'falling back to arraybuffer instantiation',
    'camera initialization',
    'user denied',
    'access denied',
    'permission denied',
    'camera access',
    'microphone access',
    'media access',
    'getusermedia',
    'constraint not satisfied',
    'overconstrainederror',
    'notreadableerror',
    'notsupportederror',
    'aborterror',
    'network error',
    'timeout',
    'connection timeout',
    'request timeout'
  ];
  
  // Check if error matches any warning pattern
  return warningPatterns.some(pattern => 
    errorString.includes(pattern) || 
    errorMessage.includes(pattern) || 
    errorName.includes(pattern)
  );
};

// Smart error logging function that categorizes errors appropriately
const logErrorSmart = (error, context = {}) => {
  if (shouldLogAsWarning(error)) {
    logError(`ShenAI: ${error}`, context);
  } else {
    logCritical(`ShenAI: ${error}`, context);
  }
};

export { initializeDatadog, logDebug, logError, logEvent, logInfo, logWarn, logCritical, logErrorSmart };