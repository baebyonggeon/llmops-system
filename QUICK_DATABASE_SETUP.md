# 빠른 데이터베이스 설정 가이드

## 🚀 빠른 시작

RDS PostgreSQL 데이터베이스에 스키마를 생성하고 샘플 데이터를 삽입하는 가장 빠른 방법입니다.

## 전제 조건

- AWS CLI 설치 및 구성
- ECS Exec 활성화 (이미 설정됨)
- Docker 이미지가 ECR에 푸시됨

## 단계별 가이드

### 1단계: 최신 Docker 이미지 배포

GitHub Actions를 통해 자동으로 배포되거나, 수동으로 트리거할 수 있습니다:

```bash
# GitHub 저장소 → Actions 탭 → "Deploy to AWS ECS" → Run workflow
```

또는 로컬에서:

```bash
git add .
git commit -m "feat: Add database seeding script"
git push origin main
```

### 2단계: ECS 태스크 ID 확인

```bash
aws ecs list-tasks \
  --cluster prod-llmops-cluster \
  --service-name prod-llmops-service \
  --region ap-northeast-2 \
  --query 'taskArns[0]' \
  --output text
```

출력 예시:
```
arn:aws:ecs:ap-northeast-2:083281668815:task/prod-llmops-cluster/abc123def456
```

### 3단계: ECS 컨테이너에 접속

```bash
# 태스크 ARN의 마지막 부분만 사용
TASK_ID="abc123def456"  # 위에서 확인한 태스크 ID

aws ecs execute-command \
  --cluster prod-llmops-cluster \
  --task $TASK_ID \
  --container llmops-app \
  --interactive \
  --command "/bin/sh" \
  --region ap-northeast-2
```

### 4단계: 데이터베이스 연결 확인

컨테이너 내부에서:

```bash
# 데이터베이스 연결 테스트
psql $DATABASE_URL -c "SELECT version();"
```

성공 시 PostgreSQL 버전 정보가 출력됩니다.

### 5단계: 스키마 생성

```bash
# Drizzle ORM으로 스키마 푸시
pnpm db:push
```

출력 예시:
```
✓ Schema pushed successfully
✓ 14 tables created
```

### 6단계: 샘플 데이터 삽입

```bash
# 시드 스크립트 실행
node scripts/seed-database.mjs
```

출력 예시:
```
🚀 Starting database seeding process...
📡 Connecting to database...
✅ Database connection established

📝 Inserting common codes...
✅ Inserted 15 common codes

👥 Inserting sample members...
✅ Inserted 3 members

📁 Inserting sample projects...
✅ Inserted 3 projects

🔗 Inserting project member mappings...
✅ Inserted 3 project member mappings

🤖 Inserting sample models...
✅ Inserted 3 models

📚 Inserting model catalog entries...
✅ Inserted 2 catalog entries

🚀 Inserting sample deployments...
✅ Inserted 2 deployments

🔌 Inserting sample APIs...
✅ Inserted 2 APIs

🔑 Inserting sample API keys...
✅ Inserted 2 API keys

🎉 Database seeding completed successfully!
```

### 7단계: 데이터 확인

```bash
# 프로젝트 목록 확인
psql $DATABASE_URL -c "SELECT pjt_id, pjt_nm, state_cd FROM pjt_bas;"

# 모델 목록 확인
psql $DATABASE_URL -c "SELECT llm_id, llm_nm, llm_type FROM llm_bas;"

# 배포 목록 확인
psql $DATABASE_URL -c "SELECT dp_id, dp_nm, dp_sttus FROM dp_bas;"
```

### 8단계: 컨테이너 종료

```bash
exit
```

## ✅ 완료!

이제 데이터베이스가 준비되었습니다. 애플리케이션을 통해 데이터를 확인할 수 있습니다:

```
http://prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com
```

## 🔧 문제 해결

### ECS Exec 권한 오류

**증상**:
```
An error occurred (InvalidParameterException) when calling the ExecuteCommand operation
```

**해결**:
ECS 서비스에서 Execute Command가 활성화되어 있는지 확인:

```bash
aws ecs describe-services \
  --cluster prod-llmops-cluster \
  --services prod-llmops-service \
  --region ap-northeast-2 \
  --query 'services[0].enableExecuteCommand'
```

### 데이터베이스 연결 실패

**증상**:
```
psql: error: connection to server failed: Connection timed out
```

**해결**:
1. RDS 보안 그룹이 ECS 태스크 보안 그룹을 허용하는지 확인
2. DATABASE_URL 환경 변수가 올바른지 확인:

```bash
echo $DATABASE_URL
```

### 스키마 푸시 실패

**증상**:
```
Error: Failed to push schema
```

**해결**:
1. 데이터베이스 연결 확인
2. 기존 테이블이 있는 경우 삭제 후 재시도:

```bash
# 주의: 모든 데이터가 삭제됩니다!
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm db:push
```

## 📝 참고 사항

- **샘플 데이터**: 시드 스크립트는 테스트용 샘플 데이터를 삽입합니다.
- **프로덕션 환경**: 프로덕션 환경에서는 실제 데이터로 교체하세요.
- **비밀번호**: 샘플 회원의 비밀번호는 해시되지 않은 더미 값입니다.
- **백업**: 중요한 작업 전에 항상 데이터베이스 백업을 생성하세요.

## 🔗 관련 문서

- [DATABASE_SETUP_GUIDE.md](./DATABASE_SETUP_GUIDE.md) - 상세한 데이터베이스 설정 가이드
- [CICD_DEPLOYMENT_GUIDE.md](./CICD_DEPLOYMENT_GUIDE.md) - CI/CD 배포 가이드
- [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md) - AWS 인프라 배포 가이드
