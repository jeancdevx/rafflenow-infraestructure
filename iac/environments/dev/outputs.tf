output "deployment_summary" {
  description = "Resumen del despliegue"
  value       = <<-EOT
  
  ╔════════════════════════════════════════════════════════════════════════════╗
  ║                           RAFFLENOW DEPLOYMENT                             ║
  ║                         Environment: ${var.env}                                  ║
  ╚════════════════════════════════════════════════════════════════════════════╝
  
  AWS Configuration
     Region:         ${var.region}
     Account ID:     ${data.aws_caller_identity.me.account_id}
     Profile:        ${var.aws_profile}
  
  API Gateway
     Base URL:       ${module.api_gateway.api_gateway_url}
  
  Cognito Authentication
     User Pool ID:   ${module.cognito.user_pool_id}
     Client ID:      ${module.cognito.user_pool_client_id}
     Auth Domain:    https://${module.cognito.user_pool_domain}.auth.${var.region}.amazoncognito.com
  
  Storage
     S3 Bucket:      ${module.storage.s3_assets_bucket_name}
     DynamoDB:       ${module.storage.dynamodb_raffles_table_name}
     Participants:   ${module.storage.dynamodb_participants_table_name}
  
  CDN
     CloudFront:     ${module.cdn.cloudfront_distribution_url}
     Distribution:   ${module.cdn.cloudfront_distribution_id}
  
  Event-Driven Architecture (EventBridge + SQS)
     Event Bus:      rafflenow-${var.env}-${data.aws_caller_identity.me.account_id}-event-bus
     Queues:
       • participations-queue (batch: 100, concurrency: 50)
       • raffle-winner-queue (batch: 1, concurrency: 10)
       • image-optimizer-queue (batch: 1, concurrency: 5)
  
  Lambda Functions (Event-Driven)
     API Lambdas:
       • ingest-participation → Emite evento participation.received
       • create-raffle → Emite raffle.created
       • close-raffle → Emite raffle.closed
       • upload-image → Genera presigned URL (retorna URLs optimizadas)
       • check-expired-raffles → Emite raffle.closed (cron automático)
     
     Event Triggers:
       • S3 → Emite s3:ObjectCreated → image-optimizer-queue
     
     Consumers (SQS → Lambda):
       • participation-process → Escribe participaciones a DynamoDB
       • worker-process → Selecciona ganadores (consume raffle.closed)
       • image-optimizer → Optimiza imágenes a WebP
     
     Readers (API):
       • list-raffles, get-raffle → Consultan DynamoDB
  EOT
}

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
