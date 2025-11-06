resource "aws_cognito_user_pool" "rafflenow_pool" {
  name = "${var.name_prefix}-user-pool"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "RaffleNow - Código de verificación"
    email_message        = "Tu código de verificación es {####}"
  }

  mfa_configuration = "OFF"

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 5
      max_length = 256
    }
  }

  schema {
    name                = "name"
    attribute_data_type = "String"
    required            = false
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-user-pool"
    Type = "Cognito"
  })
}

resource "aws_cognito_user_pool_client" "rafflenow_client" {
  name         = "${var.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
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
  read_attributes  = ["email", "name", "email_verified"]
  write_attributes = ["email", "name"]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id
  description  = "Administrators with full access to create and manage raffles"
  precedence   = 1
}

resource "aws_cognito_user_group" "user" {
  name         = "User"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id
  description  = "Regular users who can participate in raffles"
  precedence   = 2
}

resource "aws_cognito_user_pool_domain" "rafflenow_domain" {
  domain       = "${var.name_prefix}-auth"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id
}
