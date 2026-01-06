# 📈 CloudWatch 모니터링 및 성능 최적화 완전 가이드

## 개요

이 가이드는 배포된 LLMOps 시스템의 성능을 모니터링하고 최적화하는 방법을 설명합니다. CloudWatch를 사용한 실시간 모니터링부터 성능 튜닝까지 모든 단계를 다룹니다.

## 📊 CloudWatch 모니터링

### 1단계: CloudWatch 대시보드 생성

#### AWS 콘솔에서 대시보드 생성

```
1. AWS Console → CloudWatch → Dashboards
2. "Create dashboard" 클릭
3. 대시보드 이름: "llmops-production-dashboard"
4. "Create dashboard" 클릭
```

#### CLI로 대시보드 생성

```bash
# 대시보드 JSON 파일 생성
cat > dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          [ "AWS/ECS", "CPUUtilization", { "stat": "Average" } ],
          [ ".", "MemoryUtilization", { "stat": "Average" } ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "ap-northeast-2",
        "title": "ECS Service Metrics"
      }
    },
    {
      "type": "log",
      "properties": {
        "query": "fields @timestamp, @message | stats count() by bin(5m)",
        "region": "ap-northeast-2",
        "title": "Log Events"
      }
    }
  ]
}
EOF

# 대시보드 생성
aws cloudwatch put-dashboard \
  --dashboard-name llmops-production-dashboard \
  --dashboard-body file://dashboard.json \
  --region ap-northeast-2
```

### 2단계: 주요 메트릭 모니터링

#### ECS 메트릭

**CPU 사용률 모니터링:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=prod-llmops-service \
               Name=ClusterName,Value=prod-llmops-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2
```

**메모리 사용률 모니터링:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=prod-llmops-service \
               Name=ClusterName,Value=prod-llmops-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2
```

#### RDS 메트릭

**데이터베이스 CPU 사용률:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2
```

**데이터베이스 연결 수:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2
```

**데이터베이스 스토리지:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name FreeStorageSpace \
  --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-northeast-2
```

#### ALB 메트릭

**요청 수:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name RequestCount \
  --dimensions Name=LoadBalancer,Value=app/prod-llmops-alb/abc123 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region ap-northeast-2
```

**응답 시간:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/prod-llmops-alb/abc123 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2
```

**HTTP 오류 코드:**
```bash
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --dimensions Name=LoadBalancer,Value=app/prod-llmops-alb/abc123 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region ap-northeast-2
```

### 3단계: 로그 분석

#### 로그 조회

**최신 로그 확인:**
```bash
aws logs tail /ecs/prod-llmops-app --follow --region ap-northeast-2
```

**특정 시간 범위의 로그:**
```bash
# 지난 1시간의 로그
aws logs filter-log-events \
  --log-group-name /ecs/prod-llmops-app \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --region ap-northeast-2
```

**오류 로그 필터링:**
```bash
aws logs filter-log-events \
  --log-group-name /ecs/prod-llmops-app \
  --filter-pattern "ERROR" \
  --region ap-northeast-2
```

**특정 키워드 검색:**
```bash
aws logs filter-log-events \
  --log-group-name /ecs/prod-llmops-app \
  --filter-pattern "database connection" \
  --region ap-northeast-2
```

#### CloudWatch Logs Insights 쿼리

**요청 수 분석:**
```
fields @timestamp, @message
| filter @message like /request/
| stats count() as request_count by bin(5m)
```

**응답 시간 분석:**
```
fields @timestamp, response_time
| stats avg(response_time) as avg_response_time, 
        max(response_time) as max_response_time 
  by bin(5m)
```

**오류율 분석:**
```
fields @timestamp, status_code
| stats count() as total_requests,
        sum(case when status_code >= 400 then 1 else 0 end) as error_count
  by bin(5m)
| fields @timestamp, error_count, total_requests, 
         (error_count * 100.0 / total_requests) as error_rate
```

**API 엔드포인트별 성능:**
```
fields @timestamp, endpoint, response_time, status_code
| stats count() as request_count,
        avg(response_time) as avg_response_time,
        max(response_time) as max_response_time,
        pct(response_time, 95) as p95_response_time
  by endpoint
| sort request_count desc
```

**데이터베이스 쿼리 성능:**
```
fields @timestamp, query, duration
| filter @message like /database/
| stats count() as query_count,
        avg(duration) as avg_duration,
        max(duration) as max_duration,
        pct(duration, 95) as p95_duration
  by query
| sort max_duration desc
```

### 4단계: 알람 설정

#### CPU 사용률 알람

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ecs-cpu-high \
  --alarm-description "Alert when ECS CPU is high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=prod-llmops-service \
               Name=ClusterName,Value=prod-llmops-cluster \
  --region ap-northeast-2
```

#### 메모리 사용률 알람

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name ecs-memory-high \
  --alarm-description "Alert when ECS memory is high" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 85 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --dimensions Name=ServiceName,Value=prod-llmops-service \
               Name=ClusterName,Value=prod-llmops-cluster \
  --region ap-northeast-2
```

#### 데이터베이스 연결 알람

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name rds-connections-high \
  --alarm-description "Alert when RDS connections are high" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
  --region ap-northeast-2
```

#### 스토리지 부족 알람

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name rds-storage-low \
  --alarm-description "Alert when RDS storage is low" \
  --metric-name FreeStorageSpace \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 2147483648 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
  --region ap-northeast-2
```

#### HTTP 오류 알람

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name alb-5xx-errors \
  --alarm-description "Alert on 5XX errors" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --region ap-northeast-2
```

## 🚀 성능 최적화

### 1단계: 병목 지점 식별

#### 응답 시간 분석

```bash
# 느린 요청 식별
aws logs start-query \
  --log-group-name /ecs/prod-llmops-app \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --query-string 'fields @timestamp, @duration | stats avg(@duration), max(@duration), pct(@duration, 95) by bin(5m)' \
  --region ap-northeast-2
```

#### 데이터베이스 쿼리 성능

```bash
# PostgreSQL 느린 쿼리 로그 활성화
aws rds modify-db-parameter-group \
  --db-parameter-group-name default.postgres16 \
  --parameters "ParameterName=log_min_duration_statement,ParameterValue=1000,ApplyMethod=immediate" \
  --region ap-northeast-2
```

#### 메모리 사용 분석

```bash
# 메모리 누수 감지
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name MemoryUtilization \
  --dimensions Name=ServiceName,Value=prod-llmops-service \
               Name=ClusterName,Value=prod-llmops-cluster \
  --start-time $(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average \
  --region ap-northeast-2
```

### 2단계: ECS 최적화

#### 태스크 CPU/메모리 조정

```bash
# 현재 태스크 정의 조회
aws ecs describe-task-definition \
  --task-definition prod-llmops-app \
  --region ap-northeast-2 \
  --query 'taskDefinition.[cpu,memory,containerDefinitions[0].[cpu,memory]]'

# 새로운 태스크 정의 등록 (CPU/메모리 증가)
aws ecs register-task-definition \
  --family prod-llmops-app \
  --cpu 512 \
  --memory 1024 \
  --container-definitions '[
    {
      "name": "llmops-app",
      "image": "083281668815.dkr.ecr.ap-northeast-2.amazonaws.com/prod-llmops-app:latest",
      "cpu": 512,
      "memory": 1024,
      "portMappings": [{"containerPort": 3000}]
    }
  ]' \
  --region ap-northeast-2

# 서비스 업데이트
aws ecs update-service \
  --cluster prod-llmops-cluster \
  --service prod-llmops-service \
  --task-definition prod-llmops-app:2 \
  --region ap-northeast-2
```

#### 자동 스케일링 설정

```bash
# 스케일링 대상 등록
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/prod-llmops-cluster/prod-llmops-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10 \
  --region ap-northeast-2

# CPU 기반 스케일링 정책
aws application-autoscaling put-scaling-policy \
  --policy-name cpu-scaling-policy \
  --service-namespace ecs \
  --resource-id service/prod-llmops-cluster/prod-llmops-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 70.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region ap-northeast-2

# 메모리 기반 스케일링 정책
aws application-autoscaling put-scaling-policy \
  --policy-name memory-scaling-policy \
  --service-namespace ecs \
  --resource-id service/prod-llmops-cluster/prod-llmops-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration '{
    "TargetValue": 80.0,
    "PredefinedMetricSpecification": {
      "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
    },
    "ScaleOutCooldown": 60,
    "ScaleInCooldown": 300
  }' \
  --region ap-northeast-2
```

### 3단계: RDS 최적화

#### 인스턴스 크기 조정

```bash
# 현재 인스턴스 클래스 확인
aws rds describe-db-instances \
  --db-instance-identifier prod-llmops-postgres \
  --region ap-northeast-2 \
  --query 'DBInstances[0].DBInstanceClass'

# 인스턴스 클래스 변경 (db.t3.micro → db.t3.small)
aws rds modify-db-instance \
  --db-instance-identifier prod-llmops-postgres \
  --db-instance-class db.t3.small \
  --apply-immediately \
  --region ap-northeast-2
```

#### 스토리지 확장

```bash
# 스토리지 크기 증가 (20GB → 50GB)
aws rds modify-db-instance \
  --db-instance-identifier prod-llmops-postgres \
  --allocated-storage 50 \
  --apply-immediately \
  --region ap-northeast-2
```

#### 백업 설정

```bash
# 자동 백업 설정
aws rds modify-db-instance \
  --db-instance-identifier prod-llmops-postgres \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --region ap-northeast-2
```

#### 읽기 복제본 생성

```bash
# 읽기 복제본 생성
aws rds create-db-instance-read-replica \
  --db-instance-identifier prod-llmops-postgres-replica \
  --source-db-instance-identifier prod-llmops-postgres \
  --db-instance-class db.t3.micro \
  --region ap-northeast-2
```

### 4단계: 애플리케이션 최적화

#### 데이터베이스 쿼리 최적화

```bash
# 느린 쿼리 확인
psql $DATABASE_URL << EOF
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
EOF

# 인덱스 생성
psql $DATABASE_URL << EOF
CREATE INDEX idx_pjt_bas_cust_cd ON pjt_bas(cust_cd);
CREATE INDEX idx_mbr_bas_mbr_uuid ON mbr_bas(mbr_uuid);
CREATE INDEX idx_dp_bas_pjt_id ON dp_bas(pjt_id);
EOF
```

#### 캐싱 전략

```typescript
// Redis 캐싱 예제 (server/routers.ts)
import { createClient } from 'redis';

const redis = createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

export const appRouter = router({
  projects: router({
    list: publicProcedure.query(async () => {
      // 캐시 확인
      const cached = await redis.get('projects:list');
      if (cached) {
        return JSON.parse(cached);
      }

      // 데이터베이스에서 조회
      const projects = await db.query.pjtBas.findMany();

      // 캐시에 저장 (1시간)
      await redis.setex('projects:list', 3600, JSON.stringify(projects));

      return projects;
    }),
  }),
});
```

#### 연결 풀 최적화

```typescript
// Drizzle ORM 연결 풀 설정 (server/db.ts)
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,  // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool);
```

### 5단계: 네트워크 최적화

#### CDN 설정 (CloudFront)

```bash
# CloudFront 배포 생성
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "llmops-cdn-'$(date +%s)'",
    "Comment": "LLMOps CDN",
    "Enabled": true,
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "alb-origin",
          "DomainName": "prod-llmops-alb-1136603678.ap-northeast-2.elb.amazonaws.com",
          "CustomOriginConfig": {
            "HTTPPort": 80,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "http-only"
          }
        }
      ]
    },
    "DefaultCacheBehavior": {
      "TargetOriginId": "alb-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TrustedSigners": {
        "Enabled": false,
        "Quantity": 0
      },
      "ForwardedValues": {
        "QueryString": true,
        "Cookies": {
          "Forward": "all"
        }
      },
      "MinTTL": 0,
      "DefaultTTL": 86400,
      "MaxTTL": 31536000
    }
  }' \
  --region ap-northeast-2
```

## 📋 성능 최적화 체크리스트

### 모니터링 설정
- [ ] CloudWatch 대시보드 생성
- [ ] 주요 메트릭 모니터링 설정
- [ ] 알람 설정 (CPU, 메모리, 스토리지)
- [ ] 로그 분석 쿼리 작성

### ECS 최적화
- [ ] 태스크 CPU/메모리 조정
- [ ] 자동 스케일링 정책 설정
- [ ] 헬스 체크 설정 검증

### RDS 최적화
- [ ] 인스턴스 크기 평가
- [ ] 스토리지 크기 확인
- [ ] 백업 정책 설정
- [ ] 읽기 복제본 고려

### 애플리케이션 최적화
- [ ] 느린 쿼리 분석
- [ ] 인덱스 생성
- [ ] 캐싱 전략 구현
- [ ] 연결 풀 최적화

### 네트워크 최적화
- [ ] CDN 설정 고려
- [ ] 압축 활성화
- [ ] 정적 자산 캐싱

## 🎯 성능 목표

| 메트릭 | 목표 | 경고 | 심각 |
|--------|------|------|------|
| CPU 사용률 | < 60% | > 70% | > 85% |
| 메모리 사용률 | < 70% | > 80% | > 90% |
| 응답 시간 | < 200ms | > 500ms | > 1000ms |
| 오류율 | < 0.1% | > 1% | > 5% |
| 데이터베이스 연결 | < 50 | > 80 | > 100 |
| 스토리지 여유 | > 30% | < 20% | < 10% |

## 🔍 성능 분석 스크립트

```bash
#!/bin/bash
# performance-analysis.sh

echo "=== LLMOps 성능 분석 ==="
echo ""

# ECS 메트릭
echo "1. ECS 메트릭:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=prod-llmops-service \
               Name=ClusterName,Value=prod-llmops-cluster \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2 \
  --query 'Datapoints[].[Timestamp,Average,Maximum]' \
  --output table

echo ""
echo "2. RDS 메트릭:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=prod-llmops-postgres \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2 \
  --query 'Datapoints[].[Timestamp,Average,Maximum]' \
  --output table

echo ""
echo "3. ALB 메트릭:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name TargetResponseTime \
  --dimensions Name=LoadBalancer,Value=app/prod-llmops-alb/abc123 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum \
  --region ap-northeast-2 \
  --query 'Datapoints[].[Timestamp,Average,Maximum]' \
  --output table

echo ""
echo "=== 분석 완료 ==="
```

## 📞 문제 해결

### 높은 CPU 사용률
**원인**: 무거운 연산, 메모리 누수, 비효율적인 쿼리
**해결**:
1. 느린 쿼리 분석
2. 인덱스 추가
3. 캐싱 구현
4. 태스크 CPU 증가

### 높은 메모리 사용률
**원인**: 메모리 누수, 큰 데이터셋 로드
**해결**:
1. 메모리 프로파일링
2. 페이지네이션 구현
3. 스트리밍 처리
4. 태스크 메모리 증가

### 느린 응답 시간
**원인**: 데이터베이스 쿼리, 네트워크 지연, 애플리케이션 병목
**해결**:
1. 쿼리 최적화
2. 캐싱 추가
3. CDN 설정
4. 비동기 처리

### 높은 오류율
**원인**: 애플리케이션 버그, 리소스 부족, 외부 서비스 장애
**해결**:
1. 로그 분석
2. 에러 추적 활성화
3. 리소스 확인
4. 외부 서비스 상태 확인

---

**문서 버전**: 1.0
**마지막 업데이트**: 2025-12-23
**다음 업데이트**: 성능 최적화 완료 후
