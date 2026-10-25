# Native CloudFront response headers policies have no additional usage fee.
# This site loads only local assets and does not send tool input over the network.
resource "aws_cloudfront_response_headers_policy" "security" {
  name    = "bivops-site-security"
  comment = "Restrict browser resources and protect the static BIVOPS site"

  security_headers_config {
    content_security_policy {
      content_security_policy = "default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; img-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; upgrade-insecure-requests"
      override                = true
    }
    content_type_options {
      override = true
    }
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      preload                    = false
      override                   = true
    }
    # Disable the obsolete browser XSS filter; CSP is the modern control.
    xss_protection {
      protection = false
      override   = true
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}
