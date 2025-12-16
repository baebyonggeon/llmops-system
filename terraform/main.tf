terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment to use S3 backend for state management
  # backend "s3" {
  #   bucket         = "llmops-terraform-state"
  #   key            = "prod/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "LLMOps"
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# VPC
module "vpc" {
  source = "./modules/vpc"

  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  private_subnet_cidrs = var.private_subnet_cidrs
  public_subnet_cidrs  = var.public_subnet_cidrs
}

# RDS PostgreSQL
module "rds" {
  source = "./modules/rds"

  environment              = var.environment
  db_instance_class        = var.db_instance_class
  db_allocated_storage     = var.db_allocated_storage
  db_name                  = var.db_name
  db_username              = var.db_username
  db_password              = var.db_password
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  enable_multi_az          = var.enable_multi_az
  backup_retention_days    = var.backup_retention_days
  skip_final_snapshot      = var.skip_final_snapshot
}

# ECR Repository
module "ecr" {
  source = "./modules/ecr"

  environment             = var.environment
  repository_name         = var.ecr_repository_name
  image_tag_mutability    = var.image_tag_mutability
  scan_on_push            = var.scan_on_push
  image_retention_count   = var.image_retention_count
}

# ECS Cluster and Service
module "ecs" {
  source = "./modules/ecs"

  environment           = var.environment
  cluster_name          = var.ecs_cluster_name
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  public_subnet_ids     = module.vpc.public_subnet_ids
  ecr_repository_url    = module.ecr.repository_url
  ecr_image_tag         = var.ecr_image_tag
  
  # Container Configuration
  container_name        = var.container_name
  container_port        = var.container_port
  container_cpu         = var.container_cpu
  container_memory      = var.container_memory
  desired_count         = var.desired_count
  
  # Database Configuration
  db_host               = module.rds.db_endpoint
  db_name               = var.db_name
  db_username           = var.db_username
  db_password           = var.db_password
  
  # Application Configuration
  app_environment_vars  = var.app_environment_vars
  
  # Auto Scaling
  min_capacity          = var.ecs_min_capacity
  max_capacity          = var.ecs_max_capacity
  cpu_target_percentage = var.cpu_target_percentage
  memory_target_percentage = var.memory_target_percentage

  depends_on = [module.rds]
}

# S3 Bucket for Static Assets
module "s3" {
  source = "./modules/s3"

  environment         = var.environment
  bucket_name         = var.s3_bucket_name
  enable_versioning   = var.enable_s3_versioning
  enable_encryption   = var.enable_s3_encryption
  block_public_access = var.block_public_access
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"

  environment         = var.environment
  s3_bucket_domain    = module.s3.bucket_domain_name
  s3_bucket_id        = module.s3.bucket_id
  alb_domain_name     = module.ecs.alb_dns_name
  enable_waf          = var.enable_waf
  certificate_arn     = var.acm_certificate_arn
  domain_name         = var.domain_name
}

# Monitoring and Logging
module "monitoring" {
  source = "./modules/monitoring"

  environment         = var.environment
  ecs_cluster_name    = module.ecs.cluster_name
  ecs_service_name    = module.ecs.service_name
  rds_db_instance_id  = module.rds.db_instance_id
  alb_target_group_arn = module.ecs.alb_target_group_arn
  
  # CloudWatch Alarms
  alarm_email         = var.alarm_email
  cpu_threshold       = var.alarm_cpu_threshold
  memory_threshold    = var.alarm_memory_threshold
}

# Outputs
output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = module.ecs.alb_dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.domain_name
}

output "rds_endpoint" {
  description = "RDS database endpoint"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "ecr_repository_url" {
  description = "ECR repository URL"
  value       = module.ecr.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}
