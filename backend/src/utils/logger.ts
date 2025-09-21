// BACKEND -> SRC -> UTILS ->LOGGER.TS

interface LogLevel {
  INFO: "info";
  WARN: "warn";
  ERROR: "error";
  DEBUG: "debug";
}

interface Logger {
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
  debug: (message: string, ...args: any[]) => void;
}

const logLevel = process.env["LOG_LEVEL"] || "info";
const isDevelopment = process.env["NODE_ENV"] === "development";

const logger: Logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  },

  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  },

  debug: (message: string, ...args: any[]) => {
    if (isDevelopment || logLevel === "debug") {
      console.debug(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        ...args
      );
    }
  },
};

export { logger };
export default logger;
