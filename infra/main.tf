data "aws_caller_identity" "current" {}
data "aws_route53_zone" "existing" {
  zone_id = var.hosted_zone_id
  lifecycle {
    postcondition {
      condition     = trimsuffix(self.name, ".") == "bivops.com" && !self.private_zone
      error_message = "Select the existing public Route 53 zone for bivops.com."
    }
  }
}
resource "aws_s3_bucket" "site" {
  bucket        = "bivops-site-${data.aws_caller_identity.current.account_id}"
  force_destroy = false
  lifecycle {
    prevent_destroy = true
  }
}
resource "aws_s3_bucket_public_access_block" "site" {
  bucket                  = aws_s3_bucket.site.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}
resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id
  versioning_configuration {
    status = "Enabled"
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket     = aws_s3_bucket.site.id
  depends_on = [aws_s3_bucket_versioning.site]
  rule {
    id     = "remove-old-versions"
    status = "Enabled"
    filter {}
    noncurrent_version_expiration {
      noncurrent_days = 30
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}
resource "aws_acm_certificate" "site" {
  domain_name       = "bivops.com"
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}
resource "aws_route53_record" "certificate" {
  for_each = {
    for option in aws_acm_certificate.site.domain_validation_options : option.domain_name => option
  }
  zone_id = data.aws_route53_zone.existing.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 300
}
resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate : record.fqdn]
}
resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "bivops-site"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}
resource "aws_wafv2_web_acl" "site" {
  name  = "bivops-site"
  scope = "CLOUDFRONT"
  default_action {
    allow {}
  }
  visibility_config {
    cloudwatch_metrics_enabled = false
    metric_name                = "bivops-site"
    sampled_requests_enabled   = false
  }
  rule {
    name     = "per-ip-rate-limit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        aggregate_key_type    = "IP"
        limit                 = 100
        evaluation_window_sec = 300
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = false
      metric_name                = "bivops-rate-limit"
      sampled_requests_enabled   = false
    }
  }
}
data "aws_cloudfront_cache_policy" "managed" {
  name = "Managed-CachingOptimized"
}
# CloudFront Free supports managed response header policies.
# The CSP is delivered in each HTML page before any resource loads.
data "aws_cloudfront_response_headers_policy" "security" {
  name = "Managed-SecurityHeadersPolicy"
}
resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["bivops.com"]
  comment             = "BIVOPS static website"
  price_class         = "PriceClass_All"
  http_version        = "http2and3"
  web_acl_id          = aws_wafv2_web_acl.site.arn
  wait_for_deployment = true
  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "private-s3"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }
  default_cache_behavior {
    target_origin_id           = "private-s3"
    viewer_protocol_policy     = "redirect-to-https"
    allowed_methods            = ["GET", "HEAD"]
    cached_methods             = ["GET", "HEAD"]
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.managed.id
    response_headers_policy_id = data.aws_cloudfront_response_headers_policy.security.id
  }
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowOnlyThisCloudFront", Effect = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.site.arn}/*"
        Condition = { StringEquals = { "AWS:SourceArn" = aws_cloudfront_distribution.site.arn } }
      },
      {
        Sid       = "DenyInsecureTransport", Effect = "Deny", Principal = "*", Action = "s3:*"
        Resource  = [aws_s3_bucket.site.arn, "${aws_s3_bucket.site.arn}/*"]
        Condition = { Bool = { "aws:SecureTransport" = "false" } }
      }
    ]
  })
}
# This exact tier is intentional. There is no automatic paid fallback.
resource "aws_pricingplanmanager_subscription" "site" {
  plan_family   = "CloudFront"
  plan_tier     = "FREE"
  approval_mode = "IMMEDIATE"
  resource_arns = [
    aws_cloudfront_distribution.site.arn,
    aws_wafv2_web_acl.site.arn,
    data.aws_route53_zone.existing.arn,
  ]
  lifecycle {
    prevent_destroy = true
    postcondition {
      condition     = self.status == "ACTIVE"
      error_message = "The Free plan is not ACTIVE. Inspect AWS before publishing; existing resources can incur pay-as-you-go charges."
    }
  }
}
resource "aws_route53_record" "site" {
  for_each = toset(["A", "AAAA"])
  zone_id  = data.aws_route53_zone.existing.zone_id
  name     = "bivops.com"
  type     = each.value
  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
  depends_on = [aws_pricingplanmanager_subscription.site, aws_s3_bucket_policy.site]
}
