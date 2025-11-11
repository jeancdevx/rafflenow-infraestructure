# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "rafflenow_domain" {
  domain       = "${var.name_prefix}-auth"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id
}
