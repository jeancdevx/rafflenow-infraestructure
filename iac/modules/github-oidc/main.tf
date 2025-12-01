resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = ["ffffffffffffffffffffffffffffffffffffffff"]

  tags = var.tags
}

resource "aws_iam_role" "github_actions" {
  name = "${var.project_name}-github-actions"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:*"
          }
        }
      }
    ]
  })

  tags = var.tags
}

resource "aws_iam_role_policy" "terraform_permissions" {
  name = "terraform-permissions"
  role = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "TerraformStateAccess"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetBucketNotification",
          "s3:PutBucketNotification"
        ]
        Resource = [
          "arn:aws:s3:::${var.terraform_state_bucket}",
          "arn:aws:s3:::${var.terraform_state_bucket}/*",
          "arn:aws:s3:::*"
        ]
      },
      {
        Sid    = "TerraformLockAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${var.terraform_lock_table}"
      },
      {
        Sid    = "IAMPermissions"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:GetPolicy",
          "iam:GetPolicyVersion",
          "iam:ListRolePolicies",
          "iam:ListAttachedRolePolicies",
          "iam:ListInstanceProfilesForRole",
          "iam:GetOpenIDConnectProvider",
          "iam:ListOpenIDConnectProviders"
        ]
        Resource = "*"
      },
      {
        Sid    = "LambdaPermissions"
        Effect = "Allow"
        Action = [
          "lambda:GetFunction",
          "lambda:GetFunctionConfiguration",
          "lambda:GetPolicy",
          "lambda:ListVersionsByFunction",
          "lambda:GetFunctionCodeSigningConfig",
          "lambda:GetEventSourceMapping",
          "lambda:ListEventSourceMappings"
        ]
        Resource = "*"
      },
      {
        Sid    = "APIGatewayPermissions"
        Effect = "Allow"
        Action = [
          "apigateway:GET"
        ]
        Resource = "*"
      },
      {
        Sid    = "DynamoDBPermissions"
        Effect = "Allow"
        Action = [
          "dynamodb:DescribeTable",
          "dynamodb:DescribeContinuousBackups",
          "dynamodb:DescribeTimeToLive",
          "dynamodb:ListTagsOfResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "S3Permissions"
        Effect = "Allow"
        Action = [
          "s3:GetBucketPolicy",
          "s3:GetBucketAcl",
          "s3:GetBucketCORS",
          "s3:GetBucketWebsite",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketTagging",
          "s3:GetLifecycleConfiguration",
          "s3:GetReplicationConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketPublicAccessBlock",
          "s3:GetBucketOwnershipControls",
          "s3:GetBucketNotification",
          "s3:GetAccelerateConfiguration"
        ]
        Resource = "*"
      },
      {
        Sid    = "CognitoPermissions"
        Effect = "Allow"
        Action = [
          "cognito-idp:DescribeUserPool",
          "cognito-idp:DescribeUserPoolClient",
          "cognito-idp:GetUserPoolMfaConfig",
          "cognito-idp:DescribeUserPoolDomain",
          "cognito-idp:GetGroup",
          "cognito-idp:ListGroups"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudFrontPermissions"
        Effect = "Allow"
        Action = [
          "cloudfront:GetDistribution",
          "cloudfront:GetDistributionConfig",
          "cloudfront:GetCachePolicy",
          "cloudfront:GetOriginAccessControl",
          "cloudfront:GetResponseHeadersPolicy",
          "cloudfront:ListCachePolicies",
          "cloudfront:ListOriginRequestPolicies",
          "cloudfront:GetCloudFrontOriginAccessIdentity",
          "cloudfront:ListCloudFrontOriginAccessIdentities",
          "cloudfront:GetOriginRequestPolicy",
          "cloudfront:ListResponseHeadersPolicies"
        ]
        Resource = "*"
      },
      {
        Sid    = "EventBridgePermissions"
        Effect = "Allow"
        Action = [
          "events:DescribeRule",
          "events:ListTargetsByRule",
          "events:DescribeEventBus",
          "events:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "SQSPermissions"
        Effect = "Allow"
        Action = [
          "sqs:GetQueueAttributes",
          "sqs:GetQueueUrl",
          "sqs:ListQueueTags"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogsPermissions"
        Effect = "Allow"
        Action = [
          "logs:DescribeLogGroups",
          "logs:ListTagsLogGroup",
          "logs:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "SESPermissions"
        Effect = "Allow"
        Action = [
          "ses:GetIdentityVerificationAttributes",
          "ses:GetIdentityDkimAttributes",
          "ses:DescribeConfigurationSet",
          "ses:GetIdentityMailFromDomainAttributes",
          "ses:GetTemplate",
          "ses:ListTemplates"
        ]
        Resource = "*"
      },
      {
        Sid    = "WAFPermissions"
        Effect = "Allow"
        Action = [
          "wafv2:GetWebACL",
          "wafv2:ListTagsForResource",
          "wafv2:GetLoggingConfiguration",
          "wafv2:GetWebACLForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "Route53Permissions"
        Effect = "Allow"
        Action = [
          "route53:GetHostedZone",
          "route53:ListResourceRecordSets",
          "route53:ListHostedZones",
          "route53:ListHostedZonesByName",
          "route53:ListTagsForResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "ACMPermissions"
        Effect = "Allow"
        Action = [
          "acm:DescribeCertificate",
          "acm:ListTagsForCertificate",
          "acm:ListCertificates"
        ]
        Resource = "*"
      },
      {
        Sid    = "SchedulerPermissions"
        Effect = "Allow"
        Action = [
          "scheduler:GetSchedule",
          "scheduler:GetScheduleGroup",
          "scheduler:ListSchedules"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchPermissions"
        Effect = "Allow"
        Action = [
          "cloudwatch:DescribeAlarms",
          "cloudwatch:ListTagsForResource",
          "cloudwatch:DescribeInsightRules"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy" "terraform_apply_permissions" {
  count = var.allow_apply ? 1 : 0
  name  = "terraform-apply-permissions"
  role  = aws_iam_role.github_actions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "IAMApplyPermissions"
        Effect = "Allow"
        Action = [
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:UpdateRole",
          "iam:PutRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:TagRole",
          "iam:UntagRole",
          "iam:PassRole",
          "iam:CreatePolicy",
          "iam:DeletePolicy",
          "iam:CreatePolicyVersion",
          "iam:DeletePolicyVersion",
          "iam:CreateOpenIDConnectProvider",
          "iam:DeleteOpenIDConnectProvider",
          "iam:UpdateOpenIDConnectProviderThumbprint",
          "iam:TagOpenIDConnectProvider"
        ]
        Resource = "*"
      },
      {
        Sid    = "LambdaApplyPermissions"
        Effect = "Allow"
        Action = [
          "lambda:CreateFunction",
          "lambda:DeleteFunction",
          "lambda:UpdateFunctionCode",
          "lambda:UpdateFunctionConfiguration",
          "lambda:AddPermission",
          "lambda:RemovePermission",
          "lambda:TagResource",
          "lambda:UntagResource",
          "lambda:PublishVersion",
          "lambda:CreateAlias",
          "lambda:DeleteAlias",
          "lambda:UpdateAlias",
          "lambda:PutFunctionConcurrency",
          "lambda:CreateEventSourceMapping",
          "lambda:DeleteEventSourceMapping",
          "lambda:UpdateEventSourceMapping"
        ]
        Resource = "*"
      },
      {
        Sid    = "APIGatewayApplyPermissions"
        Effect = "Allow"
        Action = [
          "apigateway:POST",
          "apigateway:PUT",
          "apigateway:PATCH",
          "apigateway:DELETE"
        ]
        Resource = "*"
      },
      {
        Sid    = "DynamoDBApplyPermissions"
        Effect = "Allow"
        Action = [
          "dynamodb:CreateTable",
          "dynamodb:DeleteTable",
          "dynamodb:UpdateTable",
          "dynamodb:TagResource",
          "dynamodb:UntagResource",
          "dynamodb:UpdateTimeToLive",
          "dynamodb:UpdateContinuousBackups"
        ]
        Resource = "*"
      },
      {
        Sid    = "S3ApplyPermissions"
        Effect = "Allow"
        Action = [
          "s3:CreateBucket",
          "s3:DeleteBucket",
          "s3:PutBucketPolicy",
          "s3:DeleteBucketPolicy",
          "s3:PutBucketCORS",
          "s3:PutBucketVersioning",
          "s3:PutBucketLogging",
          "s3:PutBucketTagging",
          "s3:PutLifecycleConfiguration",
          "s3:PutEncryptionConfiguration",
          "s3:PutBucketPublicAccessBlock",
          "s3:PutBucketOwnershipControls",
          "s3:PutBucketNotification"
        ]
        Resource = "*"
      },
      {
        Sid    = "CognitoApplyPermissions"
        Effect = "Allow"
        Action = [
          "cognito-idp:CreateUserPool",
          "cognito-idp:DeleteUserPool",
          "cognito-idp:UpdateUserPool",
          "cognito-idp:CreateUserPoolClient",
          "cognito-idp:DeleteUserPoolClient",
          "cognito-idp:UpdateUserPoolClient",
          "cognito-idp:SetUserPoolMfaConfig",
          "cognito-idp:CreateUserPoolDomain",
          "cognito-idp:DeleteUserPoolDomain",
          "cognito-idp:CreateGroup",
          "cognito-idp:DeleteGroup",
          "cognito-idp:UpdateGroup"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudFrontApplyPermissions"
        Effect = "Allow"
        Action = [
          "cloudfront:CreateDistribution",
          "cloudfront:DeleteDistribution",
          "cloudfront:UpdateDistribution",
          "cloudfront:CreateCachePolicy",
          "cloudfront:DeleteCachePolicy",
          "cloudfront:UpdateCachePolicy",
          "cloudfront:CreateOriginAccessControl",
          "cloudfront:DeleteOriginAccessControl",
          "cloudfront:CreateInvalidation",
          "cloudfront:TagResource",
          "cloudfront:CreateResponseHeadersPolicy",
          "cloudfront:DeleteResponseHeadersPolicy",
          "cloudfront:UpdateResponseHeadersPolicy",
          "cloudfront:CreateCloudFrontOriginAccessIdentity",
          "cloudfront:DeleteCloudFrontOriginAccessIdentity",
          "cloudfront:UpdateCloudFrontOriginAccessIdentity",
          "cloudfront:CreateOriginRequestPolicy",
          "cloudfront:DeleteOriginRequestPolicy",
          "cloudfront:UpdateOriginRequestPolicy"
        ]
        Resource = "*"
      },
      {
        Sid    = "EventBridgeApplyPermissions"
        Effect = "Allow"
        Action = [
          "events:PutRule",
          "events:DeleteRule",
          "events:PutTargets",
          "events:RemoveTargets",
          "events:TagResource",
          "events:UntagResource",
          "events:CreateEventBus",
          "events:DeleteEventBus",
          "events:UpdateEventBus"
        ]
        Resource = "*"
      },
      {
        Sid    = "SQSApplyPermissions"
        Effect = "Allow"
        Action = [
          "sqs:CreateQueue",
          "sqs:DeleteQueue",
          "sqs:SetQueueAttributes",
          "sqs:TagQueue",
          "sqs:UntagQueue"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchLogsApplyPermissions"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:DeleteLogGroup",
          "logs:PutRetentionPolicy",
          "logs:TagLogGroup",
          "logs:UntagLogGroup",
          "logs:TagResource",
          "logs:UntagResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "SESApplyPermissions"
        Effect = "Allow"
        Action = [
          "ses:VerifyDomainIdentity",
          "ses:DeleteIdentity",
          "ses:VerifyDomainDkim",
          "ses:SetIdentityDkimEnabled",
          "ses:CreateEmailIdentity",
          "ses:DeleteEmailIdentity",
          "ses:CreateConfigurationSet",
          "ses:DeleteConfigurationSet",
          "ses:SetIdentityMailFromDomain",
          "ses:CreateTemplate",
          "ses:DeleteTemplate",
          "ses:UpdateTemplate",
          "ses:VerifyEmailIdentity"
        ]
        Resource = "*"
      },
      {
        Sid    = "WAFApplyPermissions"
        Effect = "Allow"
        Action = [
          "wafv2:CreateWebACL",
          "wafv2:DeleteWebACL",
          "wafv2:UpdateWebACL",
          "wafv2:AssociateWebACL",
          "wafv2:DisassociateWebACL",
          "wafv2:TagResource",
          "wafv2:UntagResource",
          "wafv2:PutLoggingConfiguration",
          "wafv2:DeleteLoggingConfiguration"
        ]
        Resource = "*"
      },
      {
        Sid    = "Route53ApplyPermissions"
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:CreateHostedZone",
          "route53:DeleteHostedZone"
        ]
        Resource = "*"
      },
      {
        Sid    = "ACMApplyPermissions"
        Effect = "Allow"
        Action = [
          "acm:RequestCertificate",
          "acm:DeleteCertificate",
          "acm:AddTagsToCertificate"
        ]
        Resource = "*"
      },
      {
        Sid    = "SchedulerApplyPermissions"
        Effect = "Allow"
        Action = [
          "scheduler:CreateSchedule",
          "scheduler:DeleteSchedule",
          "scheduler:UpdateSchedule",
          "scheduler:CreateScheduleGroup",
          "scheduler:DeleteScheduleGroup",
          "scheduler:TagResource",
          "scheduler:UntagResource"
        ]
        Resource = "*"
      },
      {
        Sid    = "CloudWatchApplyPermissions"
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:TagResource",
          "cloudwatch:UntagResource",
          "cloudwatch:PutInsightRule",
          "cloudwatch:DeleteInsightRules",
          "cloudwatch:EnableInsightRules",
          "cloudwatch:DisableInsightRules"
        ]
        Resource = "*"
      }
    ]
  })
}

data "aws_caller_identity" "current" {}
