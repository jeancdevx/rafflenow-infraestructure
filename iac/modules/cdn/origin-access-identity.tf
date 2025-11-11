# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "assets_oai" {
  comment = "OAI for ${var.name_prefix} assets bucket"
}
