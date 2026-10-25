output "account_id" {
  value = data.aws_caller_identity.current.account_id
}
output "github_repository" {
  value = var.github_repository
}
output "site_bucket" {
  value = aws_s3_bucket.site.id
}
output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}
output "distribution_arn" {
  value = aws_cloudfront_distribution.site.arn
}
output "cloudfront_domain" {
  value = aws_cloudfront_distribution.site.domain_name
}
output "deploy_role_arn" {
  value = aws_iam_role.deploy.arn
}
output "subscription_arn" {
  value = aws_pricingplanmanager_subscription.site.arn
}
output "subscription_status" {
  value = aws_pricingplanmanager_subscription.site.status
}
output "hosted_zone_arn" {
  value = data.aws_route53_zone.existing.arn
}
output "site_url" {
  value = "https://bivops.com"
}
