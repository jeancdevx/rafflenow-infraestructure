output "api_endpoints" {
  description = "Endpoints de la API (via CloudFront como single entry point)"
  value = {
    cloudfront_base_url = module.cdn.cloudfront_distribution_url

    production_base_url = "https://${var.domain_name}"

    public = {
      list_raffles = "${module.cdn.cloudfront_distribution_url}/api/v1/public/raffles"
      get_raffle   = "${module.cdn.cloudfront_distribution_url}/api/v1/public/raffles/{id}"

      _direct_base_url = module.api_gateway.public_api_url
    }

    authenticated = {
      create_raffle = "${module.cdn.cloudfront_distribution_url}/api/v1/raffles"
      participate   = "${module.cdn.cloudfront_distribution_url}/api/v1/raffles/{id}/participate"
      close_raffle  = "${module.cdn.cloudfront_distribution_url}/api/v1/raffles/{id}/close"
      upload_image  = "${module.cdn.cloudfront_distribution_url}/api/v1/assets/upload"

      _direct_base_url = module.api_gateway.authenticated_api_url
    }
  }
}

output "infrastructure" {
  description = "Recursos de infraestructura"
  value = {
    cognito = {
      user_pool_id = module.cognito.user_pool_id
      client_id    = module.cognito.user_pool_client_id
      domain       = module.cognito.user_pool_domain
      auth_url     = "https://${module.cognito.user_pool_domain}.auth.${var.aws_region}.amazoncognito.com"
    }

    storage = {
      s3_bucket               = module.storage.s3_assets_bucket_name
      dynamodb_raffles        = module.storage.dynamodb_raffles_table_name
      dynamodb_participations = module.storage.dynamodb_participations_table_name
      dynamodb_winners        = module.storage.dynamodb_winners_table_name
    }

    cdn = {
      cloudfront_url  = module.cdn.cloudfront_distribution_url
      distribution_id = module.cdn.cloudfront_distribution_id
      domain_name     = module.cdn.cloudfront_domain_name
    }

    eventbridge = {
      bus_name = module.eventbridge.event_bus_name
    }

    ses = {
      sender_email           = module.ses.sender_email
      configuration_set      = module.ses.configuration_set_name
      participation_template = module.ses.participation_template_name
      winner_template        = module.ses.winner_template_name
    }

    waf = {
      regional_web_acl_arn   = module.waf.regional_web_acl_arn
      regional_web_acl_id    = module.waf.regional_web_acl_id
      cloudfront_web_acl_arn = module.waf.cloudfront_web_acl_arn
      cloudfront_web_acl_id  = module.waf.cloudfront_web_acl_id
    }

    monitoring = {
      golden_signals_dashboard = module.monitoring.golden_signals_dashboard_name
      dashboards               = module.monitoring.dashboard_names
    }

    route53 = {
      zone_id      = module.route53.zone_id
      frontend_url = "https://${var.domain_name}"
    }
  }
}
