output "regional_web_acl_arn" {
  description = "ARN of the regional WAF WebACL"
  value       = aws_wafv2_web_acl.regional.arn
}

output "regional_web_acl_id" {
  description = "ID of the regional WAF WebACL"
  value       = aws_wafv2_web_acl.regional.id
}

output "cloudfront_web_acl_arn" {
  description = "ARN of the CloudFront WAF WebACL"
  value       = aws_wafv2_web_acl.cloudfront.arn
}

output "cloudfront_web_acl_id" {
  description = "ID of the CloudFront WAF WebACL"
  value       = aws_wafv2_web_acl.cloudfront.id
}
