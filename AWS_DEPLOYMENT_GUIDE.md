# AWS 배포 가이드 - LLMOps 시스템

이 가이드는 LLMOps 시스템을 AWS에 프로덕션급으로 배포하는 방법을 설명합니다.

---

## 📋 사전 요구사항

### 1. AWS 계정 설정

- AWS 계정 생성 및 로그인
- IAM 사용자 생성 (프로그래매틱 접근 권한)
- AWS CLI 설치 및 구성

```bash
# AWS CLI 설치
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# AWS 자격증명 설정
aws configure
# AWS Access Key ID: [YOUR_ACCESS_KEY]
# AWS Secret Access Key: [YOUR_SECRET_KEY]
# Default region: us-east-1
# Default output format: json
```

### 2. 필수 도구 설치

```bash
# Terraform 설치
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
unzip terraform_1.6.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Docker 설치
sudo apt-get update
sudo apt-get install -y docker.io docker-compose

# GitHub CLI (선택사항)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh
```

### 3. AWS IAM 권한 설정

필요한 IAM 정책:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "rds:*",
        "ecs:*",
        "ecr:*",
        "elasticloadbalancing:*",
        "s3:*",
        "cloudfront:*",
        "cloudwatch:*",
        "logs:*",
        "iam:*",
        "acm:*",
        "route53:*"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🚀 배포 단계

### 1단계: 소스 코드 준비

```bash
# 저장소 클론
git clone https://github.com/your-username/llmops-system.git
cd llmops-system

# 브랜치 확인
git branch -a
git checkout main
```

### 2단계: Docker 이미지 빌드 및 테스트

```bash
# 로컬에서 Docker 이미지 빌드
docker build -t llmops-system:latest .

# 이미지 테스트
docker run -p 3000:3000 llmops-system:latest

# 브라우저에서 http://localhost:3000 접속 확인
```

### 3단계: Terraform 설정

```bash
# Terraform 디렉토리로 이동
cd terraform

# terraform.tfvars 파일 생성
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars 편집 (중요!)
nano terraform.tfvars
# 다음 항목을 반드시 수정:
# - db_password: 강력한 비밀번호 설정
# - alarm_email: 알림 받을 이메일
# - domain_name: 사용할 도메인 (선택사항)
# - acm_certificate_arn: ACM 인증서 ARN (선택사항)

# Terraform 초기화
terraform init

# 계획 검토
terraform plan

# 변경사항 저장
terraform plan -out=tfplan
```

### 4단계: AWS 인프라 배포

```bash
# Terraform 적용 (10-15분 소요)
terraform apply tfplan

# 출력값 확인
terraform output

# 주요 출력값:
# - alb_dns_name: 로드 밸런서 DNS
# - ecr_repository_url: ECR 저장소 URL
# - rds_endpoint: RDS 데이터베이스 엔드포인트
# - ecs_cluster_name: ECS 클러스터 이름
```

### 5단계: ECR에 Docker 이미지 푸시

```bash
# ECR 로그인
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# 이미지 태그 지정
docker tag llmops-system:latest <ECR_REPOSITORY_URL>:latest

# ECR에 푸시
docker push <ECR_REPOSITORY_URL>:latest

# 이미지 확인
aws ecr describe-images --repository-name llmops-system
```

### 6단계: ECS 작업 정의 업데이트

```bash
# ECS 작업 정의 생성/업데이트
aws ecs register-task-definition \
  --family llmops-task \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu 512 \
  --memory 1024 \
  --container-definitions file://ecs-task-definition.json

# 서비스 업데이트
aws ecs update-service \
  --cluster llmops-cluster \
  --service llmops-service \
  --force-new-deployment
```

### 7단계: 배포 검증

```bash
# ECS 서비스 상태 확인
aws ecs describe-services \
  --cluster llmops-cluster \
  --services llmops-service

# 작업 실행 상태 확인
aws ecs list-tasks --cluster llmops-cluster

# 로드 밸런서 상태 확인
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# CloudWatch 로그 확인
aws logs tail /ecs/llmops-task --follow
```

### 8단계: 도메인 설정 (선택사항)

```bash
# Route 53에서 DNS 레코드 생성
aws route53 change-resource-record-sets \
  --hosted-zone-id <ZONE_ID> \
  --change-batch file://dns-change.json

# CloudFront 배포 확인
aws cloudfront list-distributions
```

---

## 🔐 보안 설정

### 1. AWS Secrets Manager 사용

```bash
# 데이터베이스 비밀번호 저장
aws secretsmanager create-secret \
  --name llmops/db/password \
  --secret-string "your-secure-password"

# 환경 변수 저장
aws secretsmanager create-secret \
  --name llmops/app/env \
  --secret-string file://env-secrets.json
```

### 2. IAM 역할 설정

```bash
# ECS 작업 실행 역할 생성
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# 정책 연결
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### 3. SSL/TLS 인증서 설정

```bash
# ACM에서 인증서 요청
aws acm request-certificate \
  --domain-name example.com \
  --validation-method DNS

# 인증서 ARN 확인
aws acm list-certificates
```

---

## 📊 모니터링 및 로깅

### CloudWatch 대시보드 생성

```bash
# CloudWatch 대시보드 생성
aws cloudwatch put-dashboard \
  --dashboard-name llmops-dashboard \
  --dashboard-body file://dashboard-config.json
```

### CloudWatch 알람 설정

```bash
# CPU 사용률 알람
aws cloudwatch put-metric-alarm \
  --alarm-name llmops-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT_ID>:llmops-alerts
```

### 로그 조회

```bash
# 최근 로그 확인
aws logs tail /ecs/llmops-task --follow

# 특정 시간대 로그 조회
aws logs filter-log-events \
  --log-group-name /ecs/llmops-task \
  --start-time $(date -d '1 hour ago' +%s)000
```

---

## 🔄 CI/CD 파이프라인 설정

### GitHub Actions 설정

```bash
# GitHub 저장소 설정
# 1. Settings → Secrets and variables → Actions
# 2. 다음 시크릿 추가:
#    - AWS_ROLE_TO_ASSUME: IAM 역할 ARN
#    - SLACK_WEBHOOK: Slack 웹훅 URL (선택사항)

# 3. .github/workflows/deploy-aws.yml 파일 확인
```

### 배포 트리거

```bash
# main 브랜치에 푸시하면 자동 배포
git add .
git commit -m "Deploy to AWS"
git push origin main

# GitHub Actions 워크플로우 상태 확인
gh run list --repo your-username/llmops-system
```

---

## 📈 스케일링 설정

### Auto Scaling 정책 설정

```bash
# Target Tracking Scaling Policy 생성
aws application-autoscaling put-scaling-policy \
  --policy-name llmops-cpu-scaling \
  --service-namespace ecs \
  --resource-id service/llmops-cluster/llmops-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

### 수동 스케일링

```bash
# 원하는 작업 수 변경
aws ecs update-service \
  --cluster llmops-cluster \
  --service llmops-service \
  --desired-count 4
```

---

## 🛠️ 유지보수

### 데이터베이스 백업

```bash
# RDS 스냅샷 생성
aws rds create-db-snapshot \
  --db-instance-identifier llmops-db \
  --db-snapshot-identifier llmops-backup-$(date +%Y%m%d)

# 스냅샷 목록 조회
aws rds describe-db-snapshots
```

### 업데이트 배포

```bash
# 새 버전 빌드 및 푸시
docker build -t <ECR_URL>:v1.1.0 .
docker push <ECR_URL>:v1.1.0

# ECS 서비스 업데이트
aws ecs update-service \
  --cluster llmops-cluster \
  --service llmops-service \
  --force-new-deployment
```

### 롤백

```bash
# 이전 작업 정의로 롤백
aws ecs update-service \
  --cluster llmops-cluster \
  --service llmops-service \
  --task-definition llmops-task:2 \
  --force-new-deployment
```

---

## 💰 비용 최적화

### 1. 인스턴스 크기 최적화

```bash
# 현재 리소스 사용률 확인
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=llmops-service \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

### 2. Reserved Instances 구매

```bash
# Reserved Instance 추천 확인
aws ce get-reservation-purchase-recommendation \
  --service "Amazon Elastic Container Service"
```

### 3. 비용 모니터링

```bash
# 월별 비용 조회
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d '30 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🐛 문제 해결

### ECS 작업 시작 실패

```bash
# 작업 정의 확인
aws ecs describe-task-definition --task-definition llmops-task

# 작업 로그 확인
aws logs tail /ecs/llmops-task --follow

# 보안 그룹 확인
aws ec2 describe-security-groups --filters "Name=group-name,Values=llmops-*"
```

### 데이터베이스 연결 오류

```bash
# RDS 인스턴스 상태 확인
aws rds describe-db-instances --db-instance-identifier llmops-db

# 보안 그룹 규칙 확인
aws ec2 describe-security-group-rules \
  --filters "Name=group-id,Values=<SECURITY_GROUP_ID>"
```

### 로드 밸런서 헬스 체크 실패

```bash
# 대상 그룹 헬스 상태 확인
aws elbv2 describe-target-health \
  --target-group-arn <TARGET_GROUP_ARN>

# 대상 그룹 속성 확인
aws elbv2 describe-target-groups \
  --names llmops-targets
```

---

## 📞 지원 및 리소스

- [AWS ECS 문서](https://docs.aws.amazon.com/ecs/)
- [AWS RDS 문서](https://docs.aws.amazon.com/rds/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS CLI 참고](https://docs.aws.amazon.com/cli/latest/userguide/)

---

## 📝 라이선스

이 프로젝트는 MIT 라이선스를 따릅니다.
