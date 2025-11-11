# Admin Group
resource "aws_cognito_user_group" "admin" {
  name         = "Admin"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id
  description  = "Administrators with full access to create and manage raffles"
  precedence   = 1
}

# User Group
resource "aws_cognito_user_group" "user" {
  name         = "User"
  user_pool_id = aws_cognito_user_pool.rafflenow_pool.id
  description  = "Regular users who can participate in raffles"
  precedence   = 2
}
