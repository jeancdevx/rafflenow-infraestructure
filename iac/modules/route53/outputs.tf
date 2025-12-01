output "zone_id" {
  description = "Route53 Hosted Zone ID"
  value       = data.aws_route53_zone.main.zone_id
}

output "hosted_zone_id" {
  description = "Route53 Hosted Zone ID (alias for zone_id)"
  value       = data.aws_route53_zone.main.zone_id
}

output "zone_name" {
  description = "Route53 Hosted Zone name"
  value       = data.aws_route53_zone.main.name
}

output "certificate_arn" {
  description = "ARN of the ACM certificate for CloudFront"
  value       = aws_acm_certificate.main.arn
}

output "cloudfront_certificate_arn" {
  description = "ARN of the validated ACM certificate for CloudFront (us-east-1)"
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "domain_name" {
  description = "Primary domain name"
  value       = var.domain_name
}

output "frontend_url" {
  description = "Frontend URL (CloudFront is single entry point)"
  value       = "https://${var.domain_name}"
}

# API URLs via CloudFront paths
output "api_public_url" {
  description = "Public API URL (via CloudFront)"
  value       = "https://${var.domain_name}/api/v1/public"
}

output "api_authenticated_url" {
  description = "Authenticated API URL (via CloudFront)"
  value       = "https://${var.domain_name}/api/v1"
}

output "nameservers" {
  description = "Nameservers for the hosted zone"
  value       = data.aws_route53_zone.main.name_servers
}
