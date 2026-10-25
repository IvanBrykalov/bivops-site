terraform {
  required_version = ">= 1.17.0, < 2.0.0"
  backend "s3" {}
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.70.0"
    }
  }
}
provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = { Project = "bivops-site", ManagedBy = "Terraform" }
  }
}
