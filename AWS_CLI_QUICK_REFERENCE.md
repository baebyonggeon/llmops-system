# 🔧 AWS CLI 빠른 참조 가이드

## 설정

### AWS CLI 설치 및 구성

```bash
# AWS CLI 설치 (macOS)
brew install awscli

# AWS CLI 설치 (Ubuntu/Debian)
sudo apt-get install awscli

# AWS 자격증명 설정
aws configure
# 다음 정보 입력:
# AWS Access Key ID: [YOUR_ACCESS_KEY_ID]
# AWS Secret Access Key: [YOUR_SECRET_ACCESS_KEY]
# Default region: ap-northeast-2
# Default output format: json
```

## ECS 관련 명령어

### 1. ECS 서비스 정보 조회

```bash
# 서비스 상태 확인
aws ecs describe-services \
  --cluster prod-llmops-cluster \
  --services prod-llmops-service \
  --region ap-northeast-2

# 간단한 형식으로 출력
aws ecs describe-services \
  --cluster prod-llmops-cluster \
  --services prod-llmops-service \
  --region ap-northeast-2 \
  --query 'services[0].[serviceName,status,desiredCount,runningCount]' \
  --output table
```

### 2. ECS 태스크 목록 조회

```bash
# 실행 중인 태스크 목록
aws ecs list-tasks \
  --cluster prod-llmops-cluster \
  --service-name prod-llmops-service \
  --region ap-northeast-2

# Task ID만 추출
aws ecs list-tasks \
  --cluster prod-llmops-cluster \
  --service-name prod-llmops-service \
  --region ap-northeast-2 \
  --query 'taskArns[0]' \
  --output text

# 모든 Task ID 추출
aws ecs list-tasks \
  --cluster prod-llmops-cluster \
  --service-name prod-llmops-service \
  --region ap-northeast-2 \
  --query 'taskArns[]' \
  --output text
```

### 3. ECS 태스크 상세 정보 조회

```bash
# Task ID 설정
TASK_ID="abc123def456789"

# 태스크 상세 정보 조회
aws ecs describe-tasks \
  --cluster prod-llmops-cluster \
  --tasks $TASK_ID \
  --region ap-northeast-2

# 태스크 상태만 조회
aws ecs describe-tasks \
  --cluster prod-llmops-cluster \
  --tasks $TASK_ID \
  --region ap-northeast-2 \
  --query 'tasks[0].[taskArn,lastStatus,desiredStatus]' \
  --output table
```

### 4. ECS 컨테이너에 접속 (ECS Exec)

```bash
# 변수 설정
CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
CONTAINER="llmops-app"
REGION="ap-northeast-2"

# Task ID 자동 조회
TASK_ID=$(aws ecs list-tasks \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --region $REGION \
  --query 'taskArns[0]' \
  --output text | cut -d'/' -f3)

# 컨테이너에 접속
aws ecs execute-command \
  --cluster $CLUSTER \
  --task $TASK_ID \
  --container $CONTAINER \
  --interactive \
  --command "/bin/sh" \
  --region $REGION
```

### 5. ECS 서비스 업데이트

```bash
# 원하는 태스크 수 변경
aws ecs update-service \
  --cluster prod-llmops-cluster \
  --service prod-llmops-service \
  --desired-count 3 \
  --region ap-northeast-2

# 새로운 태스크 정의 배포
aws ecs update-service \
  --cluster prod-llmops-cluster \
  --service prod-llmops-service \
  --task-definition prod-llmops-app:2 \
  --region ap-northeast-2

# 서비스 강제 재배포
aws ecs update-service \
  --cluster prod-llmops-cluster \
  --service prod-llmops-service \
  --force-new-deployment \
  --region ap-northeast-2
```

## RDS 관련 명령어

### 1. RDS 인스턴스 정보 조회

```bash
# 모든 RDS 인스턴스 조회
aws rds describe-db-instances \
  --region ap-northeast-2

# 특정 RDS 인스턴스 조회
aws rds describe-db-instances \
  --db-instance-identifier prod-llmops-postgres \
  --region ap-northeast-2

# RDS 엔드포인트 조회
aws rds describe-db-instances \
  --db-instance-identifier prod-llmops-postgres \
  --region ap-northeast-2 \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# RDS 상태 조회
aws rds describe-db-instances \
  --db-instance-identifier prod-llmops-postgres \
  --region ap-northeast-2 \
  --query 'DBInstances[0].[DBInstanceIdentifier,DBInstanceStatus,Engine,EngineVersion]' \
  --output table
```

### 2. RDS 보안 그룹 확인

```bash
# RDS 보안 그룹 조회
aws rds describe-db-instances \
  --db-instance-identifier prod-llmops-postgres \
  --region ap-northeast-2 \
  --query 'DBInstances[0].VpcSecurityGroups' \
  --output table
```

## ECR 관련 명령어

### 1. ECR 저장소 정보 조회

```bash
# 모든 ECR 저장소 조회
aws ecr describe-repositories \
  --region ap-northeast-2

# 특정 저장소 조회
aws ecr describe-repositories \
  --repository-names prod-llmops-app \
  --region ap-northeast-2

# 저장소 URI 조회
aws ecr describe-repositories \
  --repository-names prod-llmops-app \
  --region ap-northeast-2 \
  --query 'repositories[0].repositoryUri' \
  --output text
```

### 2. ECR 이미지 목록 조회

```bash
# 저장소의 모든 이미지 조회
aws ecr describe-images \
  --repository-name prod-llmops-app \
  --region ap-northeast-2

# 최신 이미지 조회
aws ecr describe-images \
  --repository-name prod-llmops-app \
  --region ap-northeast-2 \
  --query 'imageDetails[0].[imageTags,imagePushedAt]' \
  --output table

# 이미지 태그별 조회
aws ecr describe-images \
  --repository-name prod-llmops-app \
  --region ap-northeast-2 \
  --query 'imageDetails[].imageTags[]' \
  --output text
```

### 3. ECR 로그인

```bash
# ECR 로그인 (Docker)
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin \
  083281668815.dkr.ecr.ap-northeast-2.amazonaws.com
```

## CloudWatch 관련 명령어

### 1. 로그 그룹 조회

```bash
# 모든 로그 그룹 조회
aws logs describe-log-groups \
  --region ap-northeast-2

# 특정 로그 그룹 조회
aws logs describe-log-groups \
  --log-group-name-prefix /ecs/prod-llmops-app \
  --region ap-northeast-2
```

### 2. 로그 스트림 조회

```bash
# 로그 스트림 목록 조회
aws logs describe-log-streams \
  --log-group-name /ecs/prod-llmops-app \
  --region ap-northeast-2

# 최신 로그 스트림 조회
aws logs describe-log-streams \
  --log-group-name /ecs/prod-llmops-app \
  --order-by LastEventTime \
  --descending \
  --region ap-northeast-2 \
  --query 'logStreams[0].logStreamName' \
  --output text
```

### 3. 로그 조회

```bash
# 최신 로그 조회
aws logs tail /ecs/prod-llmops-app \
  --follow \
  --region ap-northeast-2

# 특정 시간 범위의 로그 조회
aws logs filter-log-events \
  --log-group-name /ecs/prod-llmops-app \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region ap-northeast-2

# 특정 키워드 검색
aws logs filter-log-events \
  --log-group-name /ecs/prod-llmops-app \
  --filter-pattern "ERROR" \
  --region ap-northeast-2
```

## ALB 관련 명령어

### 1. ALB 정보 조회

```bash
# 모든 ALB 조회
aws elbv2 describe-load-balancers \
  --region ap-northeast-2

# 특정 ALB 조회
aws elbv2 describe-load-balancers \
  --load-balancer-arns arn:aws:elasticloadbalancing:ap-northeast-2:083281668815:loadbalancer/app/prod-llmops-alb/abc123 \
  --region ap-northeast-2

# ALB DNS 이름 조회
aws elbv2 describe-load-balancers \
  --names prod-llmops-alb \
  --region ap-northeast-2 \
  --query 'LoadBalancers[0].DNSName' \
  --output text
```

### 2. 타겟 그룹 정보 조회

```bash
# 타겟 그룹 조회
aws elbv2 describe-target-groups \
  --names prod-llmops-tg \
  --region ap-northeast-2

# 타겟 상태 조회
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:083281668815:targetgroup/prod-llmops-tg/abc123 \
  --region ap-northeast-2

# 타겟 상태 테이블 형식
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:ap-northeast-2:083281668815:targetgroup/prod-llmops-tg/abc123 \
  --region ap-northeast-2 \
  --query 'TargetHealthDescriptions[].[Target.Id,TargetHealth.State,TargetHealth.Reason]' \
  --output table
```

## VPC 관련 명령어

### 1. VPC 정보 조회

```bash
# 모든 VPC 조회
aws ec2 describe-vpcs \
  --region ap-northeast-2

# 특정 VPC 조회
aws ec2 describe-vpcs \
  --vpc-ids vpc-0fb03a983e7eb3af7 \
  --region ap-northeast-2
```

### 2. 보안 그룹 조회

```bash
# 모든 보안 그룹 조회
aws ec2 describe-security-groups \
  --region ap-northeast-2

# 특정 VPC의 보안 그룹 조회
aws ec2 describe-security-groups \
  --filters "Name=vpc-id,Values=vpc-0fb03a983e7eb3af7" \
  --region ap-northeast-2

# 보안 그룹 규칙 조회
aws ec2 describe-security-groups \
  --group-ids sg-0d414112cd24ceb1d \
  --region ap-northeast-2 \
  --query 'SecurityGroups[0].[GroupId,GroupName,IpPermissions,IpPermissionsEgress]' \
  --output table
```

## 자동화 스크립트

### 1. ECS 컨테이너 접속 자동화

```bash
#!/bin/bash
# ecs-connect.sh

CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
CONTAINER="llmops-app"
REGION="ap-northeast-2"

# Task ID 자동 조회
echo "Task ID를 조회 중입니다..."
TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --region $REGION \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$TASK_ARN" ]; then
  echo "실행 중인 태스크를 찾을 수 없습니다."
  exit 1
fi

TASK_ID=$(echo $TASK_ARN | cut -d'/' -f3)
echo "Task ID: $TASK_ID"

# 컨테이너에 접속
echo "컨테이너에 접속합니다..."
aws ecs execute-command \
  --cluster $CLUSTER \
  --task $TASK_ID \
  --container $CONTAINER \
  --interactive \
  --command "/bin/sh" \
  --region $REGION
```

### 2. 배포 상태 모니터링 스크립트

```bash
#!/bin/bash
# monitor-deployment.sh

CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
REGION="ap-northeast-2"

echo "배포 상태를 모니터링합니다..."
echo ""

while true; do
  clear
  echo "=== ECS 배포 상태 ==="
  echo "시간: $(date)"
  echo ""
  
  aws ecs describe-services \
    --cluster $CLUSTER \
    --services $SERVICE \
    --region $REGION \
    --query 'services[0].[serviceName,status,desiredCount,runningCount,deployments[0].status,deployments[0].runningCount]' \
    --output table
  
  echo ""
  echo "=== 태스크 상태 ==="
  aws ecs list-tasks \
    --cluster $CLUSTER \
    --service-name $SERVICE \
    --region $REGION \
    --query 'taskArns[]' \
    --output text | while read TASK_ARN; do
    TASK_ID=$(echo $TASK_ARN | cut -d'/' -f3)
    aws ecs describe-tasks \
      --cluster $CLUSTER \
      --tasks $TASK_ID \
      --region $REGION \
      --query 'tasks[0].[taskArn,lastStatus,desiredStatus]' \
      --output table
  done
  
  echo ""
  echo "5초 후 새로고침... (Ctrl+C로 종료)"
  sleep 5
done
```

### 3. 데이터베이스 마이그레이션 자동화 스크립트

```bash
#!/bin/bash
# migrate-database.sh

CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
CONTAINER="llmops-app"
REGION="ap-northeast-2"

echo "데이터베이스 마이그레이션을 시작합니다..."
echo ""

# Task ID 조회
TASK_ARN=$(aws ecs list-tasks \
  --cluster $CLUSTER \
  --service-name $SERVICE \
  --region $REGION \
  --query 'taskArns[0]' \
  --output text)

TASK_ID=$(echo $TASK_ARN | cut -d'/' -f3)

echo "Task ID: $TASK_ID"
echo ""

# 스키마 생성
echo "1. 스키마를 생성합니다..."
aws ecs execute-command \
  --cluster $CLUSTER \
  --task $TASK_ID \
  --container $CONTAINER \
  --command "pnpm db:push" \
  --region $REGION

echo ""
echo "2. 샘플 데이터를 삽입합니다..."
aws ecs execute-command \
  --cluster $CLUSTER \
  --task $TASK_ID \
  --container $CONTAINER \
  --command "node scripts/seed-database.mjs" \
  --region $REGION

echo ""
echo "✅ 데이터베이스 마이그레이션이 완료되었습니다!"
```

## 팁 및 트릭

### 1. 출력 형식 변경

```bash
# JSON 형식
aws ecs describe-services ... --output json

# 테이블 형식
aws ecs describe-services ... --output table

# 텍스트 형식
aws ecs describe-services ... --output text

# YAML 형식
aws ecs describe-services ... --output yaml
```

### 2. JMESPath 쿼리 활용

```bash
# 특정 필드만 추출
aws ecs describe-services ... --query 'services[0].serviceName' --output text

# 여러 필드 추출
aws ecs describe-services ... --query 'services[0].[serviceName,status]' --output table

# 필터링
aws ecs list-tasks ... --query 'taskArns[?contains(@, `prod`)]' --output text
```

### 3. 환경 변수 활용

```bash
# 환경 변수 설정
export AWS_REGION="ap-northeast-2"
export AWS_PROFILE="default"

# 환경 변수 사용
aws ecs describe-services \
  --cluster prod-llmops-cluster \
  --services prod-llmops-service
  # --region 옵션 생략 가능
```

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-12-23
