# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "rafflenow_client" {
  name         = "${var.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_ADMIN_USER_PASSWORD_AUTH"
  ]

  refresh_token_validity = 30 # días
  access_token_validity  = 60 # minutos
  id_token_validity      = 60 # minutos

  token_validity_units {
    refresh_token = "days"
    access_token  = "minutes"
    id_token      = "minutes"
  }

  generate_secret = false

  # Scopes permitidos
  read_attributes  = ["email", "name", "email_verified", "given_name", "family_name"]
  write_attributes = ["email", "name", "given_name", "family_name"]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  prevent_user_existence_errors = "ENABLED"
}
