#!/bin/bash

# AWS IAM 역할 및 정책 설정 스크립트
# 사용법: ./setup-iam.sh <AWS_ACCOUNT_ID> <GITHUB_REPO_OWNER> <GITHUB_REPO_NAME>

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 함수 정의
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 입력 검증
if [ $# -lt 3 ]; then
    log_error "사용법: $0 <AWS_ACCOUNT_ID> <GITHUB_REPO_OWNER> <GITHUB_REPO_NAME>"
    echo "예: $0 123456789012 aaa9785808 llmops-system"
    exit 1
fi

AWS_ACCOUNT_ID=$1
GITHUB_REPO_OWNER=$2
GITHUB_REPO_NAME=$3
AWS_REGION=${4:-us-east-1}

log_info "AWS IAM 설정 시작"
log_info "AWS Account ID: $AWS_ACCOUNT_ID"
log_info "GitHub Repository: $GITHUB_REPO_OWNER/$GITHUB_REPO_NAME"
log_info "AWS Region: $AWS_REGION"

# 1. Terraform 상태 저장소 S3 버킷 생성
log_info "Step 1: Terraform 상태 저장소 S3 버킷 생성"

BUCKET_NAME="llmops-terraform-state-${AWS_ACCOUNT_ID}"

if aws s3 ls "s3://${BUCKET_NAME}" 2>/dev/null; then
    log_warn "S3 버킷이 이미 존재합니다: $BUCKET_NAME"
else
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$AWS_REGION" \
        $([ "$AWS_REGION" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=$AWS_REGION" || echo "")
    
    # 버킷 버전 관리 활성화
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
    
    # 버킷 암호화 활성화
    aws s3api put-bucket-encryption \
        --bucket "$BUCKET_NAME" \
        --server-side-encryption-configuration '{
            "Rules": [{
                "ApplyServerSideEncryptionByDefault": {
                    "SSEAlgorithm": "AES256"
                }
            }]
        }'
    
    # 퍼블릭 액세스 차단
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    log_info "S3 버킷 생성 완료: $BUCKET_NAME"
fi

# 2. DynamoDB 테이블 생성 (Terraform 상태 잠금)
log_info "Step 2: DynamoDB 테이블 생성 (Terraform 상태 잠금)"

TABLE_NAME="llmops-terraform-locks"

if aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$AWS_REGION" 2>/dev/null; then
    log_warn "DynamoDB 테이블이 이미 존재합니다: $TABLE_NAME"
else
    aws dynamodb create-table \
        --table-name "$TABLE_NAME" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION"
    
    log_info "DynamoDB 테이블 생성 완료: $TABLE_NAME"
fi

# 3. Terraform 실행 역할 생성
log_info "Step 3: Terraform 실행 역할 생성"

TERRAFORM_ROLE_NAME="llmops-terraform-role"
TERRAFORM_POLICY_NAME="llmops-terraform-policy"

# 신뢰 정책 생성
cat > /tmp/trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${AWS_ACCOUNT_ID}:root"
      },
      "Action": "sts:AssumeRole",
      "Condition": {}
    }
  ]
}
EOF

# 역할 생성
if aws iam get-role --role-name "$TERRAFORM_ROLE_NAME" 2>/dev/null; then
    log_warn "IAM 역할이 이미 존재합니다: $TERRAFORM_ROLE_NAME"
else
    aws iam create-role \
        --role-name "$TERRAFORM_ROLE_NAME" \
        --assume-role-policy-document file:///tmp/trust-policy.json
    
    log_info "IAM 역할 생성 완료: $TERRAFORM_ROLE_NAME"
fi

# 정책 생성
POLICY_JSON=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2Permissions",
      "Effect": "Allow",
      "Action": ["ec2:*"],
      "Resource": "*"
    },
    {
      "Sid": "RDSPermissions",
      "Effect": "Allow",
      "Action": ["rds:*", "rds-db:connect"],
      "Resource": "*"
    },
    {
      "Sid": "ECSPermissions",
      "Effect": "Allow",
      "Action": ["ecs:*", "ec2:DescribeNetworkInterfaces"],
      "Resource": "*"
    },
    {
      "Sid": "ECRPermissions",
      "Effect": "Allow",
      "Action": ["ecr:*"],
      "Resource": "*"
    },
    {
      "Sid": "ELBPermissions",
      "Effect": "Allow",
      "Action": ["elasticloadbalancing:*"],
      "Resource": "*"
    },
    {
      "Sid": "S3Permissions",
      "Effect": "Allow",
      "Action": ["s3:*"],
      "Resource": "*"
    },
    {
      "Sid": "CloudFrontPermissions",
      "Effect": "Allow",
      "Action": ["cloudfront:*", "acm:*"],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchPermissions",
      "Effect": "Allow",
      "Action": ["cloudwatch:*", "logs:*"],
      "Resource": "*"
    },
    {
      "Sid": "IAMPermissions",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole", "iam:PutRolePolicy", "iam:AttachRolePolicy",
        "iam:DetachRolePolicy", "iam:DeleteRolePolicy", "iam:GetRole",
        "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies",
        "iam:PassRole", "iam:CreatePolicy", "iam:CreatePolicyVersion",
        "iam:DeletePolicy", "iam:DeletePolicyVersion", "iam:GetPolicy",
        "iam:GetPolicyVersion", "iam:ListPolicyVersions", "iam:ListPolicies",
        "iam:CreateInstanceProfile", "iam:DeleteInstanceProfile",
        "iam:AddRoleToInstanceProfile", "iam:RemoveRoleFromInstanceProfile",
        "iam:GetInstanceProfile", "iam:ListInstanceProfiles",
        "iam:ListInstanceProfilesForRole", "iam:CreateServiceLinkedRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Route53Permissions",
      "Effect": "Allow",
      "Action": ["route53:*"],
      "Resource": "*"
    },
    {
      "Sid": "SecretsManagerPermissions",
      "Effect": "Allow",
      "Action": ["secretsmanager:*"],
      "Resource": "*"
    },
    {
      "Sid": "SNSPermissions",
      "Effect": "Allow",
      "Action": ["sns:*"],
      "Resource": "*"
    },
    {
      "Sid": "AutoScalingPermissions",
      "Effect": "Allow",
      "Action": ["autoscaling:*", "application-autoscaling:*"],
      "Resource": "*"
    },
    {
      "Sid": "TerraformStatePermissions",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket",
        "dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:DeleteItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": [
        "arn:aws:s3:::llmops-terraform-state-*/*",
        "arn:aws:s3:::llmops-terraform-state-*",
        "arn:aws:dynamodb:*:*:table/llmops-terraform-locks"
      ]
    }
  ]
}
EOF
)

echo "$POLICY_JSON" > /tmp/terraform-policy.json

aws iam put-role-policy \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --policy-name "$TERRAFORM_POLICY_NAME" \
    --policy-document file:///tmp/terraform-policy.json

log_info "Terraform 정책 적용 완료"

# 4. GitHub Actions OIDC 공급자 생성
log_info "Step 4: GitHub Actions OIDC 공급자 생성"

OIDC_PROVIDER_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"

if aws iam list-open-id-connect-providers | grep -q "token.actions.githubusercontent.com"; then
    log_warn "OIDC 공급자가 이미 존재합니다"
else
    aws iam create-open-id-connect-provider \
        --url "https://token.actions.githubusercontent.com" \
        --client-id-list "sts.amazonaws.com" \
        --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"
    
    log_info "OIDC 공급자 생성 완료"
fi

# 5. GitHub Actions 역할 생성
log_info "Step 5: GitHub Actions 역할 생성"

GITHUB_ACTIONS_ROLE_NAME="llmops-github-actions-role"

# GitHub Actions 신뢰 정책
cat > /tmp/github-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}:*"
        }
      }
    }
  ]
}
EOF

if aws iam get-role --role-name "$GITHUB_ACTIONS_ROLE_NAME" 2>/dev/null; then
    log_warn "GitHub Actions 역할이 이미 존재합니다: $GITHUB_ACTIONS_ROLE_NAME"
else
    aws iam create-role \
        --role-name "$GITHUB_ACTIONS_ROLE_NAME" \
        --assume-role-policy-document file:///tmp/github-trust-policy.json
    
    log_info "GitHub Actions 역할 생성 완료: $GITHUB_ACTIONS_ROLE_NAME"
fi

# GitHub Actions 정책
GITHUB_POLICY_JSON=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPushPermissions",
      "Effect": "Allow",
      "Action": [
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:GetAuthorizationToken",
        "ecr:DescribeImages"
      ],
      "Resource": "arn:aws:ecr:*:*:repository/llmops-system"
    },
    {
      "Sid": "ECSDeployPermissions",
      "Effect": "Allow",
      "Action": [
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:DescribeTask",
        "ecs:ListTasks",
        "ecs:RegisterTaskDefinition"
      ],
      "Resource": [
        "arn:aws:ecs:*:*:service/llmops-cluster/llmops-service",
        "arn:aws:ecs:*:*:task-definition/llmops-task:*",
        "arn:aws:ecs:*:*:task/llmops-cluster/*"
      ]
    },
    {
      "Sid": "IAMPassRolePermissions",
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::*:role/ecsTaskExecutionRole",
        "arn:aws:iam::*:role/ecsTaskRole"
      ]
    }
  ]
}
EOF
)

echo "$GITHUB_POLICY_JSON" > /tmp/github-policy.json

aws iam put-role-policy \
    --role-name "$GITHUB_ACTIONS_ROLE_NAME" \
    --policy-name "llmops-github-actions-policy" \
    --policy-document file:///tmp/github-policy.json

log_info "GitHub Actions 정책 적용 완료"

# 6. ECS 작업 실행 역할 생성
log_info "Step 6: ECS 작업 실행 역할 생성"

ECS_TASK_EXECUTION_ROLE_NAME="ecsTaskExecutionRole"

# ECS 신뢰 정책
cat > /tmp/ecs-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

if aws iam get-role --role-name "$ECS_TASK_EXECUTION_ROLE_NAME" 2>/dev/null; then
    log_warn "ECS 작업 실행 역할이 이미 존재합니다: $ECS_TASK_EXECUTION_ROLE_NAME"
else
    aws iam create-role \
        --role-name "$ECS_TASK_EXECUTION_ROLE_NAME" \
        --assume-role-policy-document file:///tmp/ecs-trust-policy.json
    
    # AWS 관리 정책 연결
    aws iam attach-role-policy \
        --role-name "$ECS_TASK_EXECUTION_ROLE_NAME" \
        --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
    
    log_info "ECS 작업 실행 역할 생성 완료: $ECS_TASK_EXECUTION_ROLE_NAME"
fi

# 7. ECS 작업 역할 생성
log_info "Step 7: ECS 작업 역할 생성"

ECS_TASK_ROLE_NAME="ecsTaskRole"

if aws iam get-role --role-name "$ECS_TASK_ROLE_NAME" 2>/dev/null; then
    log_warn "ECS 작업 역할이 이미 존재합니다: $ECS_TASK_ROLE_NAME"
else
    aws iam create-role \
        --role-name "$ECS_TASK_ROLE_NAME" \
        --assume-role-policy-document file:///tmp/ecs-trust-policy.json
    
    log_info "ECS 작업 역할 생성 완료: $ECS_TASK_ROLE_NAME"
fi

# ECS 작업 역할 정책
ECS_TASK_POLICY_JSON=$(cat <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::llmops-assets/*",
        "arn:aws:s3:::llmops-assets"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:llmops/*"
    },
    {
      "Sid": "CloudWatchMetrics",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
EOF
)

echo "$ECS_TASK_POLICY_JSON" > /tmp/ecs-task-policy.json

aws iam put-role-policy \
    --role-name "$ECS_TASK_ROLE_NAME" \
    --policy-name "llmops-ecs-task-policy" \
    --policy-document file:///tmp/ecs-task-policy.json

log_info "ECS 작업 역할 정책 적용 완료"

# 8. 결과 출력
log_info "=========================================="
log_info "IAM 설정 완료!"
log_info "=========================================="
echo ""
echo "생성된 리소스:"
echo "  - S3 버킷: $BUCKET_NAME"
echo "  - DynamoDB 테이블: $TABLE_NAME"
echo "  - Terraform 역할: $TERRAFORM_ROLE_NAME"
echo "  - GitHub Actions 역할: $GITHUB_ACTIONS_ROLE_NAME"
echo "  - ECS 작업 실행 역할: $ECS_TASK_EXECUTION_ROLE_NAME"
echo "  - ECS 작업 역할: $ECS_TASK_ROLE_NAME"
echo ""
echo "다음 단계:"
echo "  1. GitHub 저장소 설정:"
echo "     - Settings → Secrets and variables → Actions"
echo "     - AWS_ROLE_TO_ASSUME 시크릿 추가:"
echo "       arn:aws:iam::${AWS_ACCOUNT_ID}:role/${GITHUB_ACTIONS_ROLE_NAME}"
echo ""
echo "  2. Terraform 설정:"
echo "     - terraform/terraform.tfvars 파일 생성"
echo "     - terraform/backend.tf 파일 생성:"
echo "       bucket = \"$BUCKET_NAME\""
echo "       dynamodb_table = \"$TABLE_NAME\""
echo ""
echo "  3. Terraform 초기화 및 배포:"
echo "     - cd terraform"
echo "     - terraform init"
echo "     - terraform plan"
echo "     - terraform apply"
echo ""

# 정리
rm -f /tmp/trust-policy.json /tmp/terraform-policy.json /tmp/github-trust-policy.json /tmp/github-policy.json /tmp/ecs-trust-policy.json /tmp/ecs-task-policy.json

log_info "완료!"
