variable "aws_region" {
  description = "Region de aws"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Nombre de entorno"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "rafflenow"
}

variable "vpc_cidr" {
  description = "CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Zonas de disponibilidad"
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR de subredes publicas"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR de subredes privadas"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "api_throttle_rate" {
  description = "Tasa de limitacion de API Gateway"
  type        = number
  default     = 100
}

variable "api_throttle_burst" {
  description = "Límite de sobrecarga de API Gateway"
  type        = number
  default     = 200
}

variable "lambda_memory_size" {
  description = "Tamaño de memoria para las funciones Lambda"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Timeout para las funciones Lambda"
  type        = number
  default     = 30
}

variable "dynamodb_billing_mode" {
  description = "Modo de facturación de DynamoDB"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_read_capacity" {
  description = "Unidades de capacidad de lectura de DynamoDB (solo para modo PROVISIONED)"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "Unidades de capacidad de escritura de DynamoDB (solo para modo PROVISIONED)"
  type        = number
  default     = 5
}

variable "ses_sender_email" {
  description = "Email address to use as sender for SES (must be verified)"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the application"
  type        = string
  default     = "rafflenow.es"
}

variable "origin_verify_header_value" {
  description = "Secret value for X-Origin-Verify header to validate requests come from CloudFront. Generate with: openssl rand -hex 32"
  type        = string
  sensitive   = true
}
