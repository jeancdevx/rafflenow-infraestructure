import { Logger } from "@aws-lambda-powertools/logger";
import { Tracer } from "@aws-lambda-powertools/tracer";
import { Metrics } from "@aws-lambda-powertools/metrics";

export const logger = new Logger({
  serviceName: "ingest-participation",
  logLevel: process.env.LOG_LEVEL || "INFO",
});

export const tracer = new Tracer({
  serviceName: "ingest-participation",
});

export const metrics = new Metrics({
  namespace: "RaffleNow",
  serviceName: "ingest-participation",
});
