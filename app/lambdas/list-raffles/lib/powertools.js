import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";

export const logger = new Logger({
  serviceName: "list-raffles",
  logLevel: process.env.LOG_LEVEL || "INFO",
});

export const tracer = new Tracer({
  serviceName: "list-raffles",
  captureHTTPsRequests: true,
});

export const metrics = new Metrics({
  namespace: "RaffleNow",
  serviceName: "list-raffles",
});
