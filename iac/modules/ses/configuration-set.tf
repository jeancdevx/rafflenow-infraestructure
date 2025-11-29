resource "aws_ses_configuration_set" "rafflenow" {
  name = "${var.name_prefix}-config-set"

  delivery_options {
    tls_policy = "Require"
  }

  reputation_metrics_enabled = true
}
