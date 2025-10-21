output "aws_account_id" {
  description = "El ID de la cuenta de AWS"
  value       = data.aws_caller_identity.me.account_id
}

output "aws_region" {
  description = "La región de AWS utilizada"
  value       = var.region
}

output "environment" {
  description = "El entorno actual"
  value       = var.env
}

output "aws_profile" {
  description = "El perfil de AWS utilizado"
  value       = var.aws_profile
}
