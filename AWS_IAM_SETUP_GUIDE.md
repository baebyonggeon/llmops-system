# AWS IAM 설정 가이드 - LLMOps 시스템

이 가이드는 LLMOps 시스템을 AWS에 배포하기 위한 IAM 역할, 정책, OIDC 설정을 단계별로 설명합니다.

---

## 📋 사전 요구사항

- AWS 계정 (루트 사용자 또는 IAM 권한이 있는 사용자)
- AWS CLI 설치 및 구성
- GitHub 저장소 접근 권한
- 기본 AWS 개념 이해

---

## 🚀 자동 설정 (권장)

### 1단계: 스크립트 실행

```bash
# 저장소 클론
git clone https://github.com/aaa9785808/llmops-system.git
cd llmops-system

# 스크립트 실행 권한 설정
chmod +x terraform/setup-iam.sh

# 스크립트 실행
# 사용법: ./terraform/setup-iam.sh <AWS_ACCOUNT_ID> <GITHUB_REPO_OWNER> <GITHUB_REPO_NAME>
./terraform/setup-iam.sh 123456789012 aaa9785808 llmops-system
```

**AWS Account ID 확인 방법:**
```bash
aws sts get-caller-identity --query Account --output text
```

### 2단계: GitHub 시크릿 설정

스크립트 실행 후 다음 단계를 따릅니다:

1. GitHub 저장소로 이동
2. **Settings** → **Secrets and variables** → **Actions** 클릭
3. **New repository secret** 클릭
4. 다음 정보 입력:
   - **Name**: `AWS_ROLE_TO_ASSUME`
   - **Secret**: 스크립트 출력에서 제공된 역할 ARN
     ```
     arn:aws:iam::123456789012:role/llmops-github-actions-role
     ```

### 3단계: Terraform 설정

```bash
cd terraform

# backend.tf 파일 수정
nano backend.tf
# bucket 값을 실제 S3 버킷 이름으로 변경

# terraform.tfvars 파일 생성
cp terraform.tfvars.example terraform.tfvars

# 필수 값 입력
nano terraform.tfvars
# - aws_region: AWS 리전 (예: us-east-1)
# - db_password: 강력한 데이터베이스 비밀번호
# - alarm_email: 알림 받을 이메일 주소
```

### 4단계: Terraform 초기화 및 배포

```bash
# Terraform 초기화
terraform init

# 배포 계획 검토
terraform plan

# 배포 실행
terraform apply
```

---

## 🔧 수동 설정 (고급)

### 1. S3 버킷 생성 (Terraform 상태 저장소)

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET_NAME="llmops-terraform-state-${AWS_ACCOUNT_ID}"

# 버킷 생성
aws s3api create-bucket \
    --bucket "$BUCKET_NAME" \
    --region us-east-1

# 버전 관리 활성화
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled

# 암호화 활성화
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
```

### 2. DynamoDB 테이블 생성 (Terraform 잠금)

```bash
aws dynamodb create-table \
    --table-name llmops-terraform-locks \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region us-east-1
```

### 3. Terraform 실행 역할 생성

```bash
# 신뢰 정책 생성
cat > trust-policy.json <<EOF
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
aws iam create-role \
    --role-name llmops-terraform-role \
    --assume-role-policy-document file://trust-policy.json

# 정책 적용 (iam-policies.json 파일 사용)
aws iam put-role-policy \
    --role-name llmops-terraform-role \
    --policy-name llmops-terraform-policy \
    --policy-document file://iam-policies.json
```

### 4. GitHub Actions OIDC 공급자 생성

```bash
# OIDC 공급자 생성
aws iam create-open-id-connect-provider \
    --url "https://token.actions.githubusercontent.com" \
    --client-id-list "sts.amazonaws.com" \
    --thumbprint-list "6938fd4d98bab03faadb97b34396831e3780aea1"

# 공급자 확인
aws iam list-open-id-connect-providers
```

### 5. GitHub Actions 역할 생성

```bash
GITHUB_REPO_OWNER="aaa9785808"
GITHUB_REPO_NAME="llmops-system"

# 신뢰 정책 생성
cat > github-trust-policy.json <<EOF
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

# 역할 생성
aws iam create-role \
    --role-name llmops-github-actions-role \
    --assume-role-policy-document file://github-trust-policy.json

# GitHub Actions 정책 적용
aws iam put-role-policy \
    --role-name llmops-github-actions-role \
    --policy-name llmops-github-actions-policy \
    --policy-document file://iam-policies.json
```

### 6. ECS 작업 역할 생성

```bash
# ECS 신뢰 정책
cat > ecs-trust-policy.json <<EOF
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

# 작업 실행 역할 생성
aws iam create-role \
    --role-name ecsTaskExecutionRole \
    --assume-role-policy-document file://ecs-trust-policy.json

# AWS 관리 정책 연결
aws iam attach-role-policy \
    --role-name ecsTaskExecutionRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# 작업 역할 생성
aws iam create-role \
    --role-name ecsTaskRole \
    --assume-role-policy-document file://ecs-trust-policy.json

# 작업 역할 정책 적용
aws iam put-role-policy \
    --role-name ecsTaskRole \
    --policy-name llmops-ecs-task-policy \
    --policy-document file://iam-policies.json
```

---

## 📊 생성된 리소스 확인

### IAM 역할 확인

```bash
# 모든 역할 나열
aws iam list-roles --query 'Roles[?contains(RoleName, `llmops`)].RoleName'

# 특정 역할 상세 정보
aws iam get-role --role-name llmops-terraform-role

# 역할 정책 확인
aws iam list-role-policies --role-name llmops-terraform-role
```

### S3 버킷 확인

```bash
# 버킷 존재 확인
aws s3 ls | grep llmops-terraform-state

# 버킷 설정 확인
aws s3api get-bucket-versioning --bucket llmops-terraform-state-123456789012
aws s3api get-bucket-encryption --bucket llmops-terraform-state-123456789012
```

### DynamoDB 테이블 확인

```bash
# 테이블 존재 확인
aws dynamodb describe-table --table-name llmops-terraform-locks
```

### OIDC 공급자 확인

```bash
# OIDC 공급자 나열
aws iam list-open-id-connect-providers

# 공급자 상세 정보
aws iam get-open-id-connect-provider \
    --open-id-connect-provider-arn arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

---

## 🔒 보안 모범 사례

### 1. 최소 권한 원칙

생성된 정책은 필요한 최소 권한만 제공합니다. 추가 권한이 필요한 경우:

```bash
# 정책 업데이트
aws iam put-role-policy \
    --role-name llmops-terraform-role \
    --policy-name llmops-terraform-policy \
    --policy-document file://updated-policy.json
```

### 2. 정기적인 권한 감사

```bash
# 역할 권한 정기적으로 검토
aws iam list-role-policies --role-name llmops-terraform-role
aws iam get-role-policy \
    --role-name llmops-terraform-role \
    --policy-name llmops-terraform-policy
```

### 3. 액세스 로깅

```bash
# CloudTrail 활성화 (선택사항)
aws cloudtrail create-trail \
    --name llmops-trail \
    --s3-bucket-name llmops-audit-logs

# CloudTrail 시작
aws cloudtrail start-logging --trail-name llmops-trail
```

### 4. 정기적인 자격증명 회전

GitHub Actions 토큰은 자동으로 관리되므로 수동 회전이 필요하지 않습니다.

---

## 🐛 문제 해결

### 역할 생성 실패

```bash
# 역할 존재 여부 확인
aws iam get-role --role-name llmops-terraform-role

# 역할이 이미 존재하는 경우, 정책만 업데이트
aws iam put-role-policy \
    --role-name llmops-terraform-role \
    --policy-name llmops-terraform-policy \
    --policy-document file://iam-policies.json
```

### S3 버킷 생성 실패

```bash
# 버킷 이름이 전역적으로 고유한지 확인
aws s3 ls | grep llmops-terraform-state

# 다른 이름으로 재시도
BUCKET_NAME="llmops-terraform-state-$(date +%s)"
aws s3api create-bucket --bucket "$BUCKET_NAME"
```

### OIDC 공급자 생성 실패

```bash
# 공급자가 이미 존재하는지 확인
aws iam list-open-id-connect-providers

# 기존 공급자 사용
aws iam get-open-id-connect-provider \
    --open-id-connect-provider-arn arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com
```

### GitHub Actions 배포 실패

1. **역할 ARN 확인**
   ```bash
   aws iam get-role --role-name llmops-github-actions-role --query 'Role.Arn'
   ```

2. **GitHub 시크릿 확인**
   - GitHub 저장소 → Settings → Secrets
   - `AWS_ROLE_TO_ASSUME` 시크릿이 올바른 ARN을 포함하는지 확인

3. **OIDC 신뢰 정책 확인**
   ```bash
   aws iam get-role \
       --role-name llmops-github-actions-role \
       --query 'Role.AssumeRolePolicyDocument'
   ```

---

## 📚 추가 리소스

- [AWS IAM 문서](https://docs.aws.amazon.com/iam/)
- [GitHub Actions AWS 인증](https://github.com/aws-actions/configure-aws-credentials)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS 보안 모범 사례](https://docs.aws.amazon.com/security/)

---

## ✅ 체크리스트

배포 전 다음 항목을 확인하세요:

- [ ] AWS 계정 생성 및 로그인
- [ ] AWS CLI 설치 및 구성
- [ ] IAM 설정 스크립트 실행 완료
- [ ] S3 버킷 생성 확인
- [ ] DynamoDB 테이블 생성 확인
- [ ] Terraform 역할 생성 확인
- [ ] GitHub Actions 역할 생성 확인
- [ ] OIDC 공급자 생성 확인
- [ ] ECS 작업 역할 생성 확인
- [ ] GitHub 시크릿 설정 완료
- [ ] Terraform backend.tf 수정 완료
- [ ] terraform.tfvars 파일 생성 및 설정 완료
- [ ] Terraform 초기화 완료
- [ ] Terraform 배포 계획 검토 완료
- [ ] Terraform 배포 실행 완료

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. AWS CloudTrail 로그 확인
2. IAM 역할 및 정책 검증
3. GitHub Actions 워크플로우 로그 확인
4. AWS 서비스 상태 페이지 확인
