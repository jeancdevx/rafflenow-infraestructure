resource "aws_ses_template" "participation_confirmation" {
  name    = "${var.name_prefix}-participation-confirmation"
  subject = "Confirmación de participación en {{raffle_title}}"
  html    = file("${path.module}/templates/participation-confirmation.html")
  text    = file("${path.module}/templates/participation-confirmation.txt")
}

resource "aws_ses_template" "winner_notification" {
  name    = "${var.name_prefix}-winner-notification"
  subject = "¡Felicidades! Ganaste en {{raffle_title}}"
  html    = file("${path.module}/templates/winner-notification.html")
  text    = file("${path.module}/templates/winner-notification.txt")
}
