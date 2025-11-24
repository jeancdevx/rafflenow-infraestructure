from aws_lambda_powertools import Logger, Tracer, Metrics
from aws_lambda_powertools.metrics import MetricUnit

SERVICE_NAME = "worker-process"

logger = Logger(service=SERVICE_NAME)
tracer = Tracer(service=SERVICE_NAME)
metrics = Metrics(namespace="RaffleNow", service=SERVICE_NAME)
