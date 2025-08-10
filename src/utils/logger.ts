import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  ...(isProd
    ? {}
    : { transport: { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard", singleLine: true } } }),
});

export default logger;