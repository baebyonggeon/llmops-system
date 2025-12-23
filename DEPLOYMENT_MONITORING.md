# 배포 진행 상황 모니터링 가이드

## 🚀 배포 시작됨

코드가 GitHub에 푸시되었으며, GitHub Actions 워크플로우가 자동으로 시작되었습니다.

**푸시 커밋**: `919f87f` (2025-12-23 04:12:00 UTC)

## 📊 실시간 모니터링

### 1단계: GitHub Actions 워크플로우 확인

**URL**: https://github.com/baebyonggeon/llmops-system/actions

**확인 사항**:
1. "Deploy to AWS ECS" 워크플로우 선택
2. 최신 실행 확인
3. 각 Job의 상태 확인:
   - ✅ Build and Push to ECR
   - ✅ Deploy to ECS
   - ✅ Run Tests

**예상 소요 시간**: 10-15분

### 2단계: AWS ECS 배포 확인

**URL**: https://console.aws.amazon.com/ecs/

**확인 단계**:

1. **클러스터 확인**
   - Clusters → `prod-llmops-cluster` 선택
   - Services → `prod-llmops-service` 선택

2. **배포 상태 확인**
   - Deployments 탭에서 새로운 배포 확인
   - Primary 배포 상태: `ACTIVE`
   - Running count: 2 (원하는 상태)

3. **태스크 상태 확인**
   - Tasks 탭에서 새로운 태스크 확인
   - 상태: `RUNNING`
   - Health: `HEALTHY`

### 3단계: CloudWatch 로그 확인

**URL**: https://console.aws.amazon.com/cloudwatch/

**로그 그룹**: `/ecs/prod-llmops-app`

**확인 사항**:
```
[04:12:03] · [04:12:04] [OAuth] Initialized with baseURL: https://api.manus.im
[04:12:05] Server running on http://localhost:3000/
```

### 4단계: ALB 헬스 체크 확인

**URL**: https://console.aws.amazon.com/ec2/

**확인 단계**:
1. Load Balancers → `prod-llmops-alb` 선택
2. Target Groups → `prod-llmops-tg` 선택
3. Targets 탭에서 모든 타겟이 `Healthy` 상태 확인

## 📈 배포 진행 상황

### 타임라인

| 시간 | 단계 | 상태 |
|------|------|------|
| T+0분 | 코드 푸시 | ✅ 완료 |
| T+0-2분 | GitHub Actions 트리거 | ⏳ 진행 중 |
| T+2-8분 | Docker 빌드 | ⏳ 진행 중 |
| T+8-10분 | ECR 푸시 | ⏳ 진행 중 |
| T+10-12분 | ECS 배포 | ⏳ 진행 중 |
| T+12-15분 | 헬스 체크 | ⏳ 진행 중 |

## 🔍 문제 해결

### 배포 실패 시

**1. GitHub Actions 로그 확인**
```
Actions → Deploy to AWS ECS → 최신 실행 → 실패한 Job 클릭
```

**일반적인 오류**:
- `Build failed`: Dockerfile 또는 코드 문제
- `ECR push failed`: AWS 권한 문제
- `ECS deployment failed`: 태스크 정의 또는 서비스 설정 문제

**2. ECS 이벤트 확인**
```
ECS → Clusters → prod-llmops-cluster → Services → prod-llmops-service
→ Events 탭에서 오류 메시지 확인
```

**3. CloudWatch 로그 확인**
```
CloudWatch → Log groups → /ecs/prod-llmops-app
→ 최신 로그 스트림에서 오류 확인
```

### 일반적인 문제

#### 문제: 태스크가 계속 재시작됨

**증상**: Tasks 탭에서 태스크가 `PENDING` → `RUNNING` → `STOPPED` 반복

**원인**: 애플리케이션 크래시 또는 헬스 체크 실패

**해결**:
1. CloudWatch 로그에서 오류 확인
2. Dockerfile 또는 애플리케이션 코드 검토
3. 환경 변수 확인 (DATABASE_URL 등)

#### 문제: 502 Bad Gateway

**증상**: ALB URL 접속 시 502 오류

**원인**: 
- ECS 태스크가 정상적으로 시작되지 않음
- 헬스 체크 경로 오류

**해결**:
1. ECS Tasks 탭에서 태스크 상태 확인
2. Target Groups에서 타겟 헬스 상태 확인
3. CloudWatch 로그에서 애플리케이션 오류 확인

#### 문제: 데이터베이스 연결 실패

**증상**: 로그에 `Failed to connect to database` 메시지

**원인**: 
- RDS 보안 그룹 설정 오류
- DATABASE_URL 환경 변수 오류

**해결**:
```bash
# ECS 태스크에 접속하여 환경 변수 확인
aws ecs execute-command \
  --cluster prod-llmops-cluster \
  --task <TASK_ID> \
  --container llmops-app \
  --interactive \
  --command "/bin/sh" \
  --region ap-northeast-2

# 컨테이너 내부에서
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT version();"
```

## ✅ 배포 완료 확인

배포가 완료되면 다음을 확인하세요:

### 1. 애플리케이션 접속

```bash
# ALB URL로 접속
curl http://prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com/api/health
```

**성공 응답**:
```json
{
  "status": "ok",
  "timestamp": "2025-12-23T04:12:00Z"
}
```

### 2. 데이터베이스 마이그레이션 실행

배포 후 데이터베이스 마이그레이션을 실행하세요:

```bash
# ECS 태스크에 접속
aws ecs execute-command \
  --cluster prod-llmops-cluster \
  --task <TASK_ID> \
  --container llmops-app \
  --interactive \
  --command "/bin/sh" \
  --region ap-northeast-2

# 컨테이너 내부에서
pnpm db:push
node scripts/seed-database.mjs
```

### 3. 로그 확인

```bash
# CloudWatch에서 로그 확인
aws logs tail /ecs/prod-llmops-app --follow
```

## 📞 지원

배포 중 문제가 발생하면:

1. **GitHub Actions 로그** 확인
2. **ECS 이벤트** 확인
3. **CloudWatch 로그** 확인
4. **AWS 콘솔**에서 리소스 상태 확인

## 🔗 유용한 링크

- [GitHub Actions 워크플로우](https://github.com/baebyonggeon/llmops-system/actions)
- [AWS ECS 콘솔](https://console.aws.amazon.com/ecs/)
- [AWS CloudWatch 콘솔](https://console.aws.amazon.com/cloudwatch/)
- [AWS RDS 콘솔](https://console.aws.amazon.com/rds/)
- [ALB URL](http://prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com)

## 📝 배포 기록

| 날짜 | 커밋 | 상태 | 비고 |
|------|------|------|------|
| 2025-12-23 | 919f87f | ⏳ 진행 중 | 데이터베이스 마이그레이션 스크립트 추가 |

---

**마지막 업데이트**: 2025-12-23 04:12:00 UTC
