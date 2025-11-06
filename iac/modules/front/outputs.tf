output "cloudfront_domain" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "cloudfront_distribution_arn" {
  description = "arn of cloudfront distribution"
  value = aws_cloudfront_distribution.s3_distribution.arn
}