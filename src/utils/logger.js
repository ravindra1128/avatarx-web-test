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

  // Initialize Datadog Logs (after RUM so logs can be correlated)
  datadogLogs.init({
    clientToken: "pubb81d9fa8c7da517899d3301893962664",
    site: "us5.datadoghq.com",
    forwardErrorsToLogs: true,
    sessionSampleRate: 100,
    service: VITE_AVATARX_SERVICE,
    env: VITE_AVATARX_ENV,
    version: VITE_APP_VERSION,
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

/**
 * Log an error. Datadog expects (message: string, context?: object, error?: Error).
 * Supports: logError(message), logError(message, context), logError(message, context, error), or logError(message, error).
 */
const logError = (messageOrError, contextOrError = {}, maybeError = undefined) => {
  const baseContext = { service: VITE_AVATARX_SERVICE, env: VITE_AVATARX_ENV };
  let message;
  let context = {};
  let errorObj;

  if (typeof messageOrError === "string") {
    message = messageOrError;
    if (contextOrError instanceof Error) {
      errorObj = contextOrError;
    } else if (contextOrError && typeof contextOrError === "object") {
      context = contextOrError;
    }
    if (maybeError instanceof Error) errorObj = maybeError;
  } else if (messageOrError instanceof Error) {
    errorObj = messageOrError;
    message = messageOrError.message || String(messageOrError);
    if (contextOrError && typeof contextOrError === "object" && !(contextOrError instanceof Error)) {
      context = contextOrError;
    }
  } else {
    message = String(messageOrError);
    if (contextOrError instanceof Error) errorObj = contextOrError;
  }

  if (isLocal) {
    console.error(message, context, errorObj ?? "");
    return;
  }
  datadogLogs.logger.error(message, { ...context, ...baseContext }, errorObj);
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
    console.error("CRITICAL:", message, context);
    return;
  }
  const fullContext = { ...context, service: VITE_AVATARX_SERVICE, env: VITE_AVATARX_ENV };
  datadogLogs.logger.critical(message, fullContext);
  // Also send as error so it appears in error-focused views and RUM
  const errorFromContext = context?.error instanceof Error ? context.error : undefined;
  datadogLogs.logger.error(message, fullContext, errorFromContext);
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
  const message = error?.message ?? String(error);
  const errObj = error instanceof Error ? error : undefined;
  const ctx = { ...context, ...(errObj && { error: errObj }) };
  if (shouldLogAsWarning(error)) {
    logError(`ShenAI: ${message}`, ctx, errObj);
  } else {
    logCritical(`ShenAI: ${message}`, ctx);
  }
};

export { initializeDatadog, logDebug, logError, logEvent, logInfo, logWarn, logCritical, logErrorSmart };