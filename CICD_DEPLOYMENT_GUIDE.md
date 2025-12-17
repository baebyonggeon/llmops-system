# CI/CD 배포 가이드

## 개요

LLMOps 시스템은 GitHub Actions를 사용한 완전 자동화된 CI/CD 파이프라인을 통해 AWS ECS에 배포됩니다.

## 배포 아키텍처

```
GitHub Repository (main branch)
    ↓
GitHub Actions Workflow
    ↓
1. Build Docker Image
    ↓
2. Push to Amazon ECR
    ↓
3. Update ECS Task Definition
    ↓
4. Deploy to ECS Fargate
    ↓
Application Load Balancer
    ↓
Users
```

## 배포된 AWS 리소스

### 네트워크
- **VPC**: `vpc-0fb03a983e7eb3af7`
- **Public Subnets**: 2개 (ap-northeast-2a, ap-northeast-2c)
- **Private Subnets**: 2개 (ap-northeast-2a, ap-northeast-2c)
- **NAT Gateways**: 2개 (고가용성)
- **Internet Gateway**: 1개

### 컴퓨팅
- **ECS Cluster**: `prod-llmops-cluster`
- **ECS Service**: `prod-llmops-service`
- **Task Definition**: `prod-llmops-app`
- **Container**: `llmops-app` (512 CPU, 1024 MB Memory)
- **Desired Count**: 2 tasks (고가용성)

### 데이터베이스
- **RDS Instance**: `prod-llmops-postgres`
- **Engine**: PostgreSQL 16
- **Instance Class**: db.t3.micro
- **Storage**: 20 GB
- **Endpoint**: `prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432`

### 로드 밸런서
- **ALB**: `prod-llmops-alb`
- **DNS**: `prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com`
- **URL**: http://prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com

### 컨테이너 레지스트리
- **ECR Repository**: `083281668815.dkr.ecr.ap-northeast-2.amazonaws.com/prod-llmops-app`

### 스토리지
- **S3 Bucket**: `prod-llmops-static-assets-083281668815`

## GitHub Actions 워크플로우

### 트리거 조건

1. **자동 배포**: `main` 브랜치에 푸시할 때
2. **수동 배포**: GitHub Actions 탭에서 "Run workflow" 버튼 클릭

### 워크플로우 단계

#### 1. Build and Deploy Job
```yaml
- Checkout code
- Configure AWS credentials (OIDC)
- Login to Amazon ECR
- Build Docker image
- Tag image (commit SHA + latest)
- Push to ECR
- Get current ECS task definition
- Update task definition with new image
- Deploy to ECS
- Wait for service stability
```

#### 2. Test Job (병렬 실행)
```yaml
- Checkout code
- Setup Node.js 22
- Install pnpm
- Install dependencies
- Run tests
- Run type check
```

## 배포 방법

### 방법 1: 자동 배포 (권장)

1. 코드 변경사항을 커밋합니다:
```bash
git add .
git commit -m "feat: Add new feature"
```

2. `main` 브랜치에 푸시합니다:
```bash
git push origin main
```

3. GitHub Actions가 자동으로 배포를 시작합니다.

4. 배포 진행 상황 확인:
   - GitHub 저장소 → Actions 탭
   - "Deploy to AWS ECS" 워크플로우 클릭
   - 실시간 로그 확인

### 방법 2: 수동 배포

1. GitHub 저장소로 이동
2. Actions 탭 클릭
3. "Deploy to AWS ECS" 워크플로우 선택
4. "Run workflow" 버튼 클릭
5. 브랜치 선택 (기본: main)
6. "Run workflow" 확인

## 배포 확인

### 1. GitHub Actions 로그 확인

```
✅ Build, tag, and push image to Amazon ECR
✅ Get current task definition
✅ Fill in the new image ID
✅ Deploy Amazon ECS task definition
✅ Deployment successful!
```

### 2. AWS ECS 콘솔 확인

1. AWS Console → ECS → Clusters
2. `prod-llmops-cluster` 클릭
3. Services → `prod-llmops-service` 클릭
4. Tasks 탭에서 새로운 태스크 확인
5. Deployments 탭에서 배포 상태 확인

### 3. 애플리케이션 접속 확인

```bash
curl http://prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com/api/health
```

또는 브라우저에서:
```
http://prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com
```

## 롤백 방법

### 방법 1: 이전 태스크 정의로 롤백

1. AWS Console → ECS → Task Definitions
2. `prod-llmops-app` 클릭
3. 이전 리비전 선택
4. Actions → Update Service
5. `prod-llmops-service` 선택
6. Update 클릭

### 방법 2: Git 커밋 롤백 후 재배포

```bash
git revert <commit-hash>
git push origin main
```

## 환경 변수 관리

### ECS Task Definition에 설정된 환경 변수

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://postgres:llm1234!@prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432/llmops`
- `PORT=3000`

### 환경 변수 추가/수정 방법

1. Terraform 설정 수정:
```hcl
# terraform/main.tf
environment = [
  {
    name  = "NEW_VAR"
    value = "new_value"
  }
]
```

2. Terraform 적용:
```bash
cd terraform
terraform plan
terraform apply
```

3. 새로운 배포 트리거 (GitHub Actions)

## 모니터링

### CloudWatch Logs

1. AWS Console → CloudWatch → Log groups
2. `/ecs/prod-llmops-app` 로그 그룹 선택
3. 로그 스트림 확인

### ECS 서비스 메트릭

1. AWS Console → ECS → Clusters
2. `prod-llmops-cluster` → Services
3. `prod-llmops-service` → Metrics 탭

주요 메트릭:
- CPU Utilization
- Memory Utilization
- Running Tasks Count
- Pending Tasks Count

### ALB 메트릭

1. AWS Console → EC2 → Load Balancers
2. `prod-llmops-alb` 선택
3. Monitoring 탭

주요 메트릭:
- Request Count
- Target Response Time
- Healthy Host Count
- Unhealthy Host Count

## 비용 최적화

### 현재 구성 예상 비용 (월간)

- **ECS Fargate** (2 tasks, 0.5 vCPU, 1GB): ~$30
- **RDS db.t3.micro** (20GB): ~$15
- **ALB**: ~$20
- **NAT Gateway** (2개): ~$60
- **Data Transfer**: ~$10
- **총 예상 비용**: ~$135/월

### 비용 절감 방법

1. **개발/테스트 환경**:
   - Desired count를 1로 줄이기
   - NAT Gateway 1개만 사용
   - RDS 인스턴스 중지 (사용하지 않을 때)

2. **프로덕션 환경**:
   - Reserved Instances 사용 (RDS)
   - Savings Plans 사용 (Fargate)
   - CloudWatch Logs 보존 기간 단축

## 문제 해결

### 배포 실패 시

1. **GitHub Actions 로그 확인**:
   - 빌드 에러: Dockerfile 또는 코드 문제
   - ECR 푸시 에러: AWS 권한 문제
   - ECS 배포 에러: 태스크 정의 또는 서비스 설정 문제

2. **ECS 태스크 로그 확인**:
   - CloudWatch Logs에서 애플리케이션 에러 확인

3. **헬스 체크 실패**:
   - ALB 타겟 그룹의 헬스 체크 설정 확인
   - `/api/health` 엔드포인트 응답 확인

### 일반적인 문제

#### 1. 태스크가 계속 재시작됨

**원인**: 애플리케이션 크래시 또는 헬스 체크 실패

**해결**:
```bash
# CloudWatch Logs 확인
aws logs tail /ecs/prod-llmops-app --follow

# 태스크 상태 확인
aws ecs describe-tasks --cluster prod-llmops-cluster --tasks <task-id>
```

#### 2. 데이터베이스 연결 실패

**원인**: 보안 그룹 또는 연결 문자열 문제

**해결**:
1. RDS 보안 그룹에서 ECS 태스크 보안 그룹 허용 확인
2. DATABASE_URL 환경 변수 확인
3. RDS 엔드포인트 확인

#### 3. 502 Bad Gateway

**원인**: ECS 태스크가 정상적으로 시작되지 않음

**해결**:
1. ECS 서비스의 Events 탭 확인
2. 태스크 로그 확인
3. 헬스 체크 경로 확인 (`/api/health`)

## 보안 권장사항

1. **RDS 암호 관리**:
   - AWS Secrets Manager 사용 권장
   - 현재는 환경 변수로 관리 (프로덕션에서는 변경 필요)

2. **HTTPS 설정**:
   - ACM 인증서 발급
   - ALB에 HTTPS 리스너 추가
   - HTTP → HTTPS 리다이렉트 설정

3. **네트워크 보안**:
   - 보안 그룹 최소 권한 원칙 적용
   - VPC Flow Logs 활성화
   - WAF 설정 (선택사항)

## 추가 리소스

- [AWS ECS 문서](https://docs.aws.amazon.com/ecs/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Docker 문서](https://docs.docker.com/)

## 지원

문제가 발생하면 다음을 확인하세요:
1. GitHub Actions 로그
2. CloudWatch Logs
3. ECS 서비스 이벤트
4. ALB 타겟 그룹 헬스 체크

추가 지원이 필요한 경우 GitHub Issues에 문의하세요.
