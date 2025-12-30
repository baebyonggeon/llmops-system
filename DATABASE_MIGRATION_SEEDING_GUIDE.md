# 📊 데이터베이스 마이그레이션 및 시딩 상세 가이드

## 개요

이 가이드는 배포 완료 후 RDS PostgreSQL 데이터베이스에 스키마를 생성하고 샘플 데이터를 삽입하는 완전한 단계별 절차를 설명합니다.

## 전제 조건

- ✅ AWS 인프라 배포 완료
- ✅ GitHub Actions Docker 배포 완료
- ✅ ECS 서비스 정상 작동 (Running 상태)
- ✅ ALB 헬스 체크 통과
- ✅ AWS CLI 설치 및 구성

## 🔍 배포 상태 확인

### 1단계: ECS 서비스 상태 확인

먼저 ECS 서비스가 정상적으로 배포되었는지 확인합니다.

**AWS 콘솔 확인 방법:**
```
1. AWS Console → ECS → Clusters
2. prod-llmops-cluster 선택
3. Services → prod-llmops-service 선택
4. 다음 항목 확인:
   - Status: ACTIVE
   - Desired count: 2
   - Running count: 2
   - Deployments: PRIMARY 상태 ACTIVE
```

**AWS CLI 확인 방법:**
```bash
aws ecs describe-services \
  --cluster prod-llmops-cluster \
  --services prod-llmops-service \
  --region ap-northeast-2 \
  --query 'services[0].[serviceName,status,desiredCount,runningCount]'
```

**예상 출력:**
```
[
    "prod-llmops-service",
    "ACTIVE",
    2,
    2
]
```

### 2단계: 실행 중인 태스크 ID 확인

데이터베이스 마이그레이션을 실행할 ECS 태스크의 ID를 확인합니다.

**AWS 콘솔 확인 방법:**
```
1. ECS → Clusters → prod-llmops-cluster
2. Services → prod-llmops-service
3. Tasks 탭 선택
4. 첫 번째 태스크 클릭 (Task ID 복사)
```

**AWS CLI 확인 방법:**
```bash
aws ecs list-tasks \
  --cluster prod-llmops-cluster \
  --service-name prod-llmops-service \
  --region ap-northeast-2 \
  --query 'taskArns[0]' \
  --output text
```

**출력 예시:**
```
arn:aws:ecs:ap-northeast-2:083281668815:task/prod-llmops-cluster/abc123def456789
```

**Task ID 추출:**
```bash
# 위 ARN에서 마지막 부분만 추출
TASK_ID="abc123def456789"
```

## 🔐 ECS 컨테이너에 접속

### 3단계: ECS Exec 권한 확인

ECS Exec를 사용하여 컨테이너에 접속합니다. 먼저 권한을 확인합니다.

```bash
# ECS Exec 활성화 여부 확인
aws ecs describe-services \
  --cluster prod-llmops-cluster \
  --services prod-llmops-service \
  --region ap-northeast-2 \
  --query 'services[0].enableExecuteCommand'
```

**출력:**
```
true  # 활성화됨
```

### 4단계: ECS 컨테이너에 접속

```bash
# 변수 설정
CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
CONTAINER="llmops-app"
REGION="ap-northeast-2"

# Task ID 확인 (위에서 얻은 ID 사용)
TASK_ID="abc123def456789"

# ECS 컨테이너에 접속
aws ecs execute-command \
  --cluster $CLUSTER \
  --task $TASK_ID \
  --container $CONTAINER \
  --interactive \
  --command "/bin/sh" \
  --region $REGION
```

**성공 시 프롬프트:**
```
The Session Manager plugin was installed successfully. Use AWS Systems Manager Session Manager to start and end sessions that connect you to your Amazon EC2 instances or on-premises servers.

sh-4.2#
```

## 📋 데이터베이스 마이그레이션 실행

### 5단계: 환경 변수 확인

컨테이너 내부에서 환경 변수가 올바르게 설정되었는지 확인합니다.

```bash
# DATABASE_URL 확인
echo $DATABASE_URL

# 출력 예시:
# postgresql://postgres:llm1234!@prod-llmops-postgres.czoesgq643h4.ap-northeast-2.rds.amazonaws.com:5432/llmops
```

### 6단계: 데이터베이스 연결 테스트

PostgreSQL 클라이언트를 사용하여 데이터베이스 연결을 테스트합니다.

```bash
# 데이터베이스 버전 확인
psql $DATABASE_URL -c "SELECT version();"
```

**성공 시 출력:**
```
                                                 version
─────────────────────────────────────────────────────────────────────────────────────
 PostgreSQL 16.1 on x86_64-pc-linux-gnu, compiled by gcc (GCC) 9.3.0, 64-bit
(1 row)
```

**실패 시 오류:**
```
psql: error: connection to server failed: Connection timed out
```

**해결 방법:**
- RDS 보안 그룹이 ECS 태스크 보안 그룹을 허용하는지 확인
- DATABASE_URL이 올바른지 확인
- RDS 인스턴스가 실행 중인지 확인

### 7단계: 기존 테이블 확인

기존 테이블이 있는지 확인합니다.

```bash
# 모든 테이블 목록 확인
psql $DATABASE_URL -c "\dt"
```

**출력 예시 (테이블 없음):**
```
Did not find any relations.
```

**출력 예시 (테이블 있음):**
```
                List of relations
 Schema |      Name       | Type  |  Owner
────────┼─────────────────┼───────┼──────────
 public | api_bas         | table | postgres
 public | apikey_bas      | table | postgres
 public | dp_bas          | table | postgres
 ...
```

### 8단계: Drizzle ORM으로 스키마 생성

Drizzle ORM을 사용하여 데이터베이스 스키마를 생성합니다.

```bash
# 스키마 생성 (마이그레이션 실행)
pnpm db:push
```

**상세 실행 과정:**

```
# 1. 마이그레이션 파일 생성
$ drizzle-kit generate:pg

# 2. 마이그레이션 실행
$ drizzle-kit migrate

# 3. 스키마 동기화
$ pnpm db:push
```

**성공 시 출력:**
```
✓ Schema pushed successfully
✓ 14 tables created:
  ✓ sys_com_cd
  ✓ mbr_bas
  ✓ pjt_bas
  ✓ pjt_mbr_aut_map
  ✓ llm_bas
  ✓ mdl_catalog
  ✓ llm_image
  ✓ dp_bas
  ✓ api_bas
  ✓ apikey_bas
  ✓ api_usage_realtime
  ✓ api_access_stat_daily
  ✓ notifications
  ✓ alert_conditions
```

**실패 시 오류 및 해결:**

**오류 1: "Failed to connect to database"**
```
Error: Failed to connect to database
```
해결: DATABASE_URL 확인, RDS 보안 그룹 확인

**오류 2: "Permission denied"**
```
Error: permission denied for schema public
```
해결: 데이터베이스 사용자 권한 확인

### 9단계: 스키마 생성 확인

스키마가 올바르게 생성되었는지 확인합니다.

```bash
# 생성된 테이블 목록 확인
psql $DATABASE_URL -c "\dt"
```

**성공 시 출력:**
```
                    List of relations
 Schema |          Name           | Type  |  Owner
────────┼─────────────────────────┼───────┼──────────
 public | alert_conditions        | table | postgres
 public | api_access_stat_daily   | table | postgres
 public | api_bas                 | table | postgres
 public | api_usage_realtime      | table | postgres
 public | apikey_bas              | table | postgres
 public | dp_bas                  | table | postgres
 public | llm_bas                 | table | postgres
 public | llm_image               | table | postgres
 public | mbr_bas                 | table | postgres
 public | mdl_catalog             | table | postgres
 public | pjt_bas                 | table | postgres
 public | pjt_mbr_aut_map         | table | postgres
 public | sys_com_cd              | table | postgres
 public | notifications           | table | postgres
(14 rows)
```

## 🌱 샘플 데이터 삽입

### 10단계: 시드 스크립트 실행

샘플 데이터를 삽입하는 시드 스크립트를 실행합니다.

```bash
# 시드 스크립트 실행
node scripts/seed-database.mjs
```

**실행 과정 및 출력:**

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

📊 Summary:
   - Common Codes: 15
   - Members: 3
   - Projects: 3
   - Project Mappings: 3
   - Models: 3
   - Catalog Entries: 2
   - Deployments: 2
   - APIs: 2
   - API Keys: 2

✅ All sample data has been inserted successfully!

👋 Database connection closed
```

**실패 시 오류 및 해결:**

**오류 1: "Cannot find module"**
```
Error: Cannot find module 'drizzle-orm'
```
해결: 
```bash
pnpm install
```

**오류 2: "Connection timeout"**
```
Error: Client network socket disconnected
```
해결: RDS 보안 그룹 및 네트워크 연결 확인

**오류 3: "Duplicate key"**
```
Error: duplicate key value violates unique constraint
```
해결: 시드 스크립트가 이미 실행되었을 수 있음. 다시 실행하면 자동으로 중복 방지됨.

### 11단계: 샘플 데이터 확인

삽입된 샘플 데이터를 확인합니다.

```bash
# 1. 공통 코드 확인
psql $DATABASE_URL -c "SELECT COUNT(*) as total_codes FROM sys_com_cd;"

# 2. 회원 확인
psql $DATABASE_URL -c "SELECT mbr_id, id, mbr_nm, mbr_type_cd FROM mbr_bas ORDER BY mbr_id;"

# 3. 프로젝트 확인
psql $DATABASE_URL -c "SELECT pjt_id, pjt_nm, state_cd FROM pjt_bas ORDER BY pjt_id;"

# 4. 모델 확인
psql $DATABASE_URL -c "SELECT llm_id, llm_nm, llm_type, llm_ver FROM llm_bas ORDER BY llm_id;"

# 5. 배포 확인
psql $DATABASE_URL -c "SELECT dp_id, dp_nm, dp_sttus FROM dp_bas ORDER BY dp_id;"

# 6. API 확인
psql $DATABASE_URL -c "SELECT api_id, api_nm, api_url FROM api_bas ORDER BY api_id;"
```

**성공 시 출력 예시:**

```
# 공통 코드
 total_codes
─────────────
          15
(1 row)

# 회원
 mbr_id |        id        |      mbr_nm      | mbr_type_cd
────────┼──────────────────┼──────────────────┼─────────────
      1 | admin@llmops.com | System Admin     | ADMIN
      2 | dev1@llmops.com  | John Developer   | DEVELOPER
      3 | user1@llmops.com | Jane User        | USER
(3 rows)

# 프로젝트
 pjt_id |           pjt_nm            | state_cd
────────┼─────────────────────────────┼──────────
      1 | GPT-4 Chatbot Development   | ACTIVE
      2 | Image Classification System | ACTIVE
      3 | Sentiment Analysis API      | COMPLETED
(3 rows)

# 모델
 llm_id |      llm_nm      | llm_type | llm_ver
────────┼──────────────────┼──────────┼─────────
      1 | GPT-4-Turbo      | LLM      | 1.0.0
      2 | ResNet-50        | CV       | 2.1.0
      3 | BERT-Base        | NLP      | 1.5.0
(3 rows)

# 배포
 dp_id |      dp_nm       | dp_sttus
───────┼──────────────────┼──────────
     1 | GPT-4-Production | RUNNING
     2 | ResNet-Staging   | RUNNING
(2 rows)

# API
 api_id |          api_nm          |                   api_url
────────┼──────────────────────────┼────────────────────────────────
      1 | Chat Completion API      | https://api.llmops.com/gpt4/chat
      2 | Image Classification API | https://staging.llmops.com/resnet/classify
(2 rows)
```

## 📊 데이터베이스 통계

### 12단계: 데이터베이스 통계 확인

전체 데이터베이스 통계를 확인합니다.

```bash
# 전체 테이블 레코드 수 조회
psql $DATABASE_URL << EOF
SELECT 
  'sys_com_cd' as table_name, COUNT(*) as count FROM sys_com_cd
UNION ALL
SELECT 'mbr_bas', COUNT(*) FROM mbr_bas
UNION ALL
SELECT 'pjt_bas', COUNT(*) FROM pjt_bas
UNION ALL
SELECT 'pjt_mbr_aut_map', COUNT(*) FROM pjt_mbr_aut_map
UNION ALL
SELECT 'llm_bas', COUNT(*) FROM llm_bas
UNION ALL
SELECT 'mdl_catalog', COUNT(*) FROM mdl_catalog
UNION ALL
SELECT 'dp_bas', COUNT(*) FROM dp_bas
UNION ALL
SELECT 'api_bas', COUNT(*) FROM api_bas
UNION ALL
SELECT 'apikey_bas', COUNT(*) FROM apikey_bas
ORDER BY table_name;
EOF
```

**성공 시 출력:**
```
     table_name      | count
─────────────────────┼───────
 api_bas             |     2
 apikey_bas          |     2
 dp_bas              |     2
 llm_bas             |     3
 mbr_bas             |     3
 mdl_catalog         |     2
 pjt_bas             |     3
 pjt_mbr_aut_map     |     3
 sys_com_cd          |    15
(9 rows)
```

## 🔍 데이터 검증

### 13단계: 데이터 무결성 검증

데이터 무결성을 검증합니다.

```bash
# 1. 외래 키 관계 확인
psql $DATABASE_URL << EOF
-- 프로젝트-회원 매핑 확인
SELECT 
  pm.pjt_id,
  p.pjt_nm,
  pm.mbr_uuid,
  m.mbr_nm
FROM pjt_mbr_aut_map pm
JOIN pjt_bas p ON pm.pjt_id = p.pjt_id
JOIN mbr_bas m ON pm.mbr_uuid = m.mbr_uuid
ORDER BY pm.pjt_id;
EOF

# 2. 모델-배포 관계 확인
psql $DATABASE_URL << EOF
SELECT 
  d.dp_id,
  d.dp_nm,
  l.llm_nm,
  d.dp_sttus
FROM dp_bas d
JOIN llm_bas l ON d.llm_id = l.llm_id
ORDER BY d.dp_id;
EOF

# 3. API 키 확인
psql $DATABASE_URL << EOF
SELECT 
  a.api_id,
  a.api_nm,
  ak.api_key_nm,
  ak.api_key_sttus
FROM api_bas a
LEFT JOIN apikey_bas ak ON a.api_id = ak.api_id
ORDER BY a.api_id;
EOF
```

## ✅ 완료 확인

### 14단계: 마이그레이션 완료 확인

모든 마이그레이션이 완료되었는지 확인합니다.

```bash
# 최종 확인 체크리스트
echo "=== 데이터베이스 마이그레이션 완료 확인 ==="
echo ""
echo "1. 테이블 생성 확인:"
psql $DATABASE_URL -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='public';"

echo ""
echo "2. 샘플 데이터 확인:"
psql $DATABASE_URL -c "SELECT COUNT(*) as total_records FROM (SELECT 1 FROM sys_com_cd UNION ALL SELECT 1 FROM mbr_bas UNION ALL SELECT 1 FROM pjt_bas UNION ALL SELECT 1 FROM llm_bas UNION ALL SELECT 1 FROM dp_bas UNION ALL SELECT 1 FROM api_bas) t;"

echo ""
echo "3. 데이터베이스 크기 확인:"
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;"

echo ""
echo "✅ 마이그레이션 완료!"
```

**성공 시 출력:**
```
=== 데이터베이스 마이그레이션 완료 확인 ===

1. 테이블 생성 확인:
 table_count
─────────────
          14
(1 row)

2. 샘플 데이터 확인:
 total_records
───────────────
             33
(1 row)

3. 데이터베이스 크기 확인:
 database_size
───────────────
 5312 kB
(1 row)

✅ 마이그레이션 완료!
```

## 🚪 컨테이너 종료

### 15단계: ECS 컨테이너 접속 종료

마이그레이션이 완료되면 컨테이너 접속을 종료합니다.

```bash
# 컨테이너 접속 종료
exit
```

**출력:**
```
Exiting session with botocore session user.
```

## 🔄 재시드 (필요한 경우)

기존 데이터를 삭제하고 다시 시드하려면:

```bash
# ⚠️ 주의: 모든 데이터가 삭제됩니다!
psql $DATABASE_URL << EOF
-- 모든 테이블 데이터 삭제
TRUNCATE TABLE api_access_stat_daily CASCADE;
TRUNCATE TABLE api_usage_realtime CASCADE;
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE alert_conditions CASCADE;
TRUNCATE TABLE apikey_bas CASCADE;
TRUNCATE TABLE api_bas CASCADE;
TRUNCATE TABLE dp_bas CASCADE;
TRUNCATE TABLE llm_image CASCADE;
TRUNCATE TABLE mdl_catalog CASCADE;
TRUNCATE TABLE llm_bas CASCADE;
TRUNCATE TABLE pjt_mbr_aut_map CASCADE;
TRUNCATE TABLE pjt_bas CASCADE;
TRUNCATE TABLE mbr_bas CASCADE;
TRUNCATE TABLE sys_com_cd CASCADE;
EOF

# 다시 시드 실행
node scripts/seed-database.mjs
```

## 📈 성능 최적화

### 인덱스 확인

```bash
# 생성된 인덱스 확인
psql $DATABASE_URL << EOF
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
EOF
```

**출력 예시:**
```
 schemaname |   tablename    |          indexname
────────────┼────────────────┼──────────────────────────────
 public     | api_bas        | api_bas_pkey
 public     | apikey_bas     | apikey_bas_pkey
 public     | dp_bas         | dp_bas_pkey
 public     | llm_bas        | idx_llm_bas_pjt_id
 public     | mbr_bas        | idx_mbr_bas_cust_cd
 public     | mbr_bas        | idx_mbr_bas_mbr_uuid
 public     | pjt_bas        | idx_pjt_bas_cust_cd
 public     | pjt_bas        | idx_pjt_bas_pjt_uuid
 ...
```

## 🐛 문제 해결

### 일반적인 문제 및 해결

| 문제 | 원인 | 해결 |
|------|------|------|
| Connection timeout | RDS 보안 그룹 설정 오류 | 보안 그룹에서 ECS 태스크 보안 그룹 허용 |
| Permission denied | 데이터베이스 사용자 권한 부족 | 사용자 권한 확인 및 수정 |
| Duplicate key error | 시드 스크립트 중복 실행 | 데이터 삭제 후 재시드 |
| Out of memory | 메모리 부족 | NODE_OPTIONS 설정 증가 |
| SSL connection error | SSL 설정 오류 | sslmode=disable 옵션 추가 |

### 로그 확인

```bash
# CloudWatch 로그 확인
aws logs tail /ecs/prod-llmops-app --follow --region ap-northeast-2
```

## 📝 체크리스트

마이그레이션 완료 확인:

- [ ] ECS 서비스 상태: ACTIVE
- [ ] 실행 중인 태스크: 2개
- [ ] 데이터베이스 연결: 성공
- [ ] 테이블 생성: 14개
- [ ] 샘플 데이터 삽입: 완료
- [ ] 데이터 무결성: 검증됨
- [ ] 성능 최적화: 완료

## 🎉 완료!

데이터베이스 마이그레이션 및 시딩이 완료되었습니다!

**다음 단계:**
1. 애플리케이션에서 데이터 조회 테스트
2. API 엔드포인트 기능 테스트
3. 성능 모니터링 시작
4. 프로덕션 데이터 마이그레이션 계획

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-12-23
**작성자**: LLMOps 팀
