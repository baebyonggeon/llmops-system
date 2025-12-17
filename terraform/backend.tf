terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # AWS S3 + DynamoDB를 사용한 원격 상태 저장소
  # 주의: 아래 값을 실제 AWS 계정에 맞게 수정하세요
  backend "s3" {
    bucket         = "llmops-terraform-state-083281668815"
    key            = "llmops/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "llmops-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "LLMOps"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
