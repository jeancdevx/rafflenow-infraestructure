output "api_endpoints" {
  description = "Endpoints de la API"
  value = {
    base_url = module.api_gateway.api_gateway_url
    endpoints = {
      # Raffles
      list_raffles  = "${module.api_gateway.api_gateway_url}/api/v1/raffles"
      get_raffle    = "${module.api_gateway.api_gateway_url}/api/v1/raffles/{id}"
      create_raffle = "${module.api_gateway.api_gateway_url}/api/v1/raffles"
      close_raffle  = "${module.api_gateway.api_gateway_url}/api/v1/raffles/{id}/close"
      # Participations
      participate = "${module.api_gateway.api_gateway_url}/api/v1/raffles/{id}/participate"
      # Assets
      upload_image = "${module.api_gateway.api_gateway_url}/api/v1/assets/upload"
    }
  }
}

output "infrastructure" {
  description = "Recursos de infraestructura"
  value = {
    # Cognito
    cognito = {
      user_pool_id = module.cognito.user_pool_id
      client_id    = module.cognito.user_pool_client_id
      domain       = module.cognito.user_pool_domain
      auth_url     = "https://${module.cognito.user_pool_domain}.auth.${var.region}.amazoncognito.com"
    }

    # Storage
    storage = {
      s3_bucket             = module.storage.s3_assets_bucket_name
      dynamodb_raffles      = module.storage.dynamodb_raffles_table_name
      dynamodb_participants = module.storage.dynamodb_participants_table_name
    }

    # CDN
    cdn = {
      cloudfront_url  = module.cdn.cloudfront_distribution_url
      distribution_id = module.cdn.cloudfront_distribution_id
      domain_name     = module.cdn.cloudfront_domain_name
    }

    # EventBridge
    eventbridge = {
      bus_name = "rafflenow-${var.env}-${data.aws_caller_identity.me.account_id}-event-bus"
    }
  }
}
