variable "free_plan_eligibility_confirmed" {
  description = "Set true only after checking that this AWS account can use the CloudFront Free flat-rate plan."
  type        = bool
  default     = false
  validation {
    condition     = var.free_plan_eligibility_confirmed
    error_message = "Check CloudFront Free flat-rate plan eligibility before provisioning. Read DEPLOY.md first."
  }
}
variable "hosted_zone_id" {
  description = "ID of the existing public bivops.com Route 53 zone. Do not create a second zone."
  type        = string
  validation {
    condition     = can(regex("^Z[A-Z0-9]+$", var.hosted_zone_id))
    error_message = "Enter a hosted zone ID such as Z0123456789, without /hostedzone/."
  }
}
variable "github_repository" {
  description = "Exact GitHub OWNER/REPO, including case."
  type        = string
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Use OWNER/REPO."
  }
}
variable "existing_github_oidc_provider_arn" {
  description = "Reuse an existing token.actions.githubusercontent.com IAM provider if present."
  type        = string
  default     = ""
}
