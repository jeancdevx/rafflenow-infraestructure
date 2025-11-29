output "api_endpoints" {
  description = "Endpoints de la API"
  value = {
    # Public API (no authentication)
    public = {
      base_url     = module.api_gateway.public_api_url
      list_raffles = "${module.api_gateway.public_api_url}/api/v1/raffles"
      get_raffle   = "${module.api_gateway.public_api_url}/api/v1/raffles/{id}"
    }

    # Authenticated API (requires Cognito token)
    authenticated = {
      base_url      = module.api_gateway.authenticated_api_url
      create_raffle = "${module.api_gateway.authenticated_api_url}/api/v1/raffles"
      participate   = "${module.api_gateway.authenticated_api_url}/api/v1/raffles/{id}/participate"
      close_raffle  = "${module.api_gateway.authenticated_api_url}/api/v1/raffles/{id}/close"
      upload_image  = "${module.api_gateway.authenticated_api_url}/api/v1/assets/upload"
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
      auth_url     = "https://${module.cognito.user_pool_domain}.auth.${var.aws_region}.amazoncognito.com"
    }

    # Storage
    storage = {
      s3_bucket               = module.storage.s3_assets_bucket_name
      dynamodb_raffles        = module.storage.dynamodb_raffles_table_name
      dynamodb_participations = module.storage.dynamodb_participations_table_name
      dynamodb_winners        = module.storage.dynamodb_winners_table_name
    }

    # CDN
    cdn = {
      cloudfront_url  = module.cdn.cloudfront_distribution_url
      distribution_id = module.cdn.cloudfront_distribution_id
      domain_name     = module.cdn.cloudfront_domain_name
    }

    # EventBridge
    eventbridge = {
      bus_name = module.eventbridge.event_bus_name
    }

    # SES
    ses = {
      sender_email           = module.ses.sender_email
      configuration_set      = module.ses.configuration_set_name
      participation_template = module.ses.participation_template_name
      winner_template        = module.ses.winner_template_name
    }
  }
}
