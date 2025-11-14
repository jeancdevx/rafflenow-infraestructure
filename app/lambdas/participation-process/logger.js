class Logger {
  constructor(context) {
    this.requestId = context.requestId || "unknown";
    this.functionName = context.functionName || "unknown";
  }

  info(message, metadata = {}) {
    console.log(
      JSON.stringify({
        level: "INFO",
        message,
        requestId: this.requestId,
        functionName: this.functionName,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  }

  warn(message, metadata = {}) {
    console.warn(
      JSON.stringify({
        level: "WARN",
        message,
        requestId: this.requestId,
        functionName: this.functionName,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  }

  error(message, error, metadata = {}) {
    console.error(
      JSON.stringify({
        level: "ERROR",
        message,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
        requestId: this.requestId,
        functionName: this.functionName,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  }

  logBatchProcessing(totalRecords, metadata = {}) {
    this.info("Processing SQS batch", {
      operation: "batch-processing",
      total_records: totalRecords,
      ...metadata,
    });
  }

  logBatchItemSuccess(recordId, metadata = {}) {
    this.info("Batch item processed successfully", {
      operation: "batch-item-success",
      record_id: recordId,
      ...metadata,
    });
  }

  logBatchItemFailure(recordId, error, metadata = {}) {
    this.error("Batch item processing failed", error, {
      operation: "batch-item-failure",
      record_id: recordId,
      ...metadata,
    });
  }
}

module.exports = Logger;
