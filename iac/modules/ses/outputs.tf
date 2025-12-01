output "domain_identity_arn" {
  description = "ARN of the verified domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "domain_identity_verified" {
  description = "Whether the domain identity is verified"
  value       = aws_ses_domain_identity_verification.main.id != null
}

output "sender_email" {
  description = "Verified sender email address"
  value       = aws_ses_email_identity.sender.email
}

output "sender_email_arn" {
  description = "ARN of the verified sender email identity"
  value       = aws_ses_email_identity.sender.arn
}

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.rafflenow.name
}

output "participation_template_name" {
  description = "Name of the participation confirmation email template"
  value       = aws_ses_template.participation_confirmation.name
}

output "winner_template_name" {
  description = "Name of the winner notification email template"
  value       = aws_ses_template.winner_notification.name
}
