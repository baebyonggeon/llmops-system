variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

# VPC Variables
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# RDS Variables
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "llmops"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot on deletion"
  type        = bool
  default     = false
}

# ECR Variables
variable "ecr_repository_name" {
  description = "ECR repository name"
  type        = string
  default     = "llmops-system"
}

variable "image_tag_mutability" {
  description = "Image tag mutability (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "image_retention_count" {
  description = "Number of images to retain"
  type        = number
  default     = 10
}

# ECS Variables
variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
  default     = "llmops-cluster"
}

variable "container_name" {
  description = "Container name"
  type        = string
  default     = "llmops-app"
}

variable "container_port" {
  description = "Container port"
  type        = number
  default     = 3000
}

variable "container_cpu" {
  description = "Container CPU units (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Container memory in MB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
  default     = 2
}

variable "ecr_image_tag" {
  description = "ECR image tag"
  type        = string
  default     = "latest"
}

variable "ecs_min_capacity" {
  description = "Minimum ECS task count"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum ECS task count"
  type        = number
  default     = 6
}

variable "cpu_target_percentage" {
  description = "Target CPU percentage for auto-scaling"
  type        = number
  default     = 70
}

variable "memory_target_percentage" {
  description = "Target memory percentage for auto-scaling"
  type        = number
  default     = 80
}

# S3 Variables
variable "s3_bucket_name" {
  description = "S3 bucket name"
  type        = string
  default     = "llmops-assets"
}

variable "enable_s3_versioning" {
  description = "Enable S3 versioning"
  type        = bool
  default     = true
}

variable "enable_s3_encryption" {
  description = "Enable S3 encryption"
  type        = bool
  default     = true
}

variable "block_public_access" {
  description = "Block public access to S3 bucket"
  type        = bool
  default     = true
}

# CloudFront Variables
variable "enable_waf" {
  description = "Enable AWS WAF for CloudFront"
  type        = bool
  default     = false
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = ""
}

# Monitoring Variables
variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
}

variable "alarm_cpu_threshold" {
  description = "CPU threshold for alarms (%)"
  type        = number
  default     = 80
}

variable "alarm_memory_threshold" {
  description = "Memory threshold for alarms (%)"
  type        = number
  default     = 90
}

# Application Variables
variable "app_environment_vars" {
  description = "Application environment variables"
  type        = map(string)
  default = {
    NODE_ENV                    = "production"
    VITE_APP_TITLE              = "LLMOps System"
    VITE_APP_LOGO               = "/logo.svg"
  }
}
