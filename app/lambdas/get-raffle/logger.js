class Logger {
  constructor(context) {
    this.functionName =
      context?.functionName ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      "unknown";
    this.requestId = context?.awsRequestId || "no-request-id";
    this.environment = process.env.ENVIRONMENT || "dev";
    this.startTime = Date.now();
  }

  sanitize(data) {
    if (!data) return data;

    const sensitiveFields = [
      "password",
      "token",
      "authorization",
      "secret",
      "apikey",
      "api_key",
      "credentials",
    ];

    if (typeof data === "object") {
      const sanitized = Array.isArray(data) ? [...data] : { ...data };

      for (const key in sanitized) {
        const lowerKey = key.toLowerCase();

        if (sensitiveFields.some((field) => lowerKey.includes(field))) {
          sanitized[key] = "[REDACTED]";
        } else if (
          lowerKey.includes("email") &&
          typeof sanitized[key] === "string"
        ) {
          const email = sanitized[key];
          const [local, domain] = email.split("@");
          if (local && domain) {
            sanitized[key] = `${local.substring(0, 2)}***@${domain}`;
          }
        } else if (typeof sanitized[key] === "object") {
          sanitized[key] = this.sanitize(sanitized[key]);
        }
      }

      return sanitized;
    }

    return data;
  }

  generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  buildLogEntry(level, message, metadata = {}) {
    const duration = Date.now() - this.startTime;

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      function: this.functionName,
      requestId: this.requestId,
      environment: this.environment,
      duration_ms: duration,
      ...this.sanitize(metadata),
    };
  }

  info(message, metadata = {}) {
    const logEntry = this.buildLogEntry("INFO", message, metadata);
    console.log(JSON.stringify(logEntry));
  }

  warn(message, metadata = {}) {
    const logEntry = this.buildLogEntry("WARN", message, metadata);
    console.warn(JSON.stringify(logEntry));
  }

  error(message, error = null, metadata = {}) {
    const logEntry = this.buildLogEntry("ERROR", message, {
      ...metadata,
      error: error
        ? {
            message: error.message,
            type: error.name,
            ...(this.environment !== "prod" && { stack: error.stack }),
          }
        : undefined,
    });
    console.error(JSON.stringify(logEntry));
  }

  logRequest(event) {
    this.info("Request received", {
      httpMethod: event.httpMethod,
      path: event.path,
      pathParameters: event.pathParameters,
      queryStringParameters: event.queryStringParameters,
      headers: this.sanitize(event.headers),
      sourceIp: event.requestContext?.identity?.sourceIp || "unknown",
    });
  }

  logResponse(statusCode, message) {
    const duration = Date.now() - this.startTime;

    this.info("Request completed", {
      statusCode,
      message,
      duration_ms: duration,
      metric: {
        name: "RequestDuration",
        value: duration,
        unit: "Milliseconds",
      },
    });
  }

  logDbOperation(operation, tableName, metadata = {}) {
    this.info(`DynamoDB ${operation}`, {
      table: tableName,
      operation,
      ...metadata,
    });
  }

  logExternalCall(service, operation, metadata = {}) {
    this.info(`External service call: ${service}`, {
      service,
      operation,
      ...metadata,
    });
  }

  logMetric(metricName, value, unit = "Count") {
    this.info("Performance metric", {
      metric: {
        name: metricName,
        value,
        unit,
      },
    });
  }
}

module.exports = Logger;
