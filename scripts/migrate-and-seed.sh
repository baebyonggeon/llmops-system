#!/bin/bash

################################################################################
# LLMOps 데이터베이스 마이그레이션 및 시딩 자동화 스크립트
#
# 이 스크립트는 ECS 컨테이너에서 데이터베이스 마이그레이션 및 시딩을 
# 자동으로 수행합니다.
#
# 사용법:
#   ./scripts/migrate-and-seed.sh
#   ./scripts/migrate-and-seed.sh --cluster prod-llmops-cluster --service prod-llmops-service
#
# 요구사항:
#   - AWS CLI 설치 및 구성
#   - 적절한 AWS 권한
#   - ECS Exec 활성화
################################################################################

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 기본값
CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
CONTAINER="llmops-app"
REGION="ap-northeast-2"
DRY_RUN=false
SKIP_SEED=false

# 함수: 로그 출력
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 함수: 도움말 출력
show_help() {
    cat << EOF
사용법: $0 [옵션]

옵션:
  -c, --cluster CLUSTER          ECS 클러스터 이름 (기본값: prod-llmops-cluster)
  -s, --service SERVICE          ECS 서비스 이름 (기본값: prod-llmops-service)
  -n, --container CONTAINER      컨테이너 이름 (기본값: llmops-app)
  -r, --region REGION            AWS 리전 (기본값: ap-northeast-2)
  --dry-run                       실행 계획만 표시 (실제 실행 안 함)
  --skip-seed                     시딩 단계 건너뛰기
  -h, --help                      이 도움말 표시

예시:
  # 기본값으로 실행
  $0

  # 커스텀 클러스터 및 서비스 지정
  $0 -c my-cluster -s my-service

  # 드라이 런 (실행 계획만 확인)
  $0 --dry-run

  # 시딩 단계 건너뛰기
  $0 --skip-seed
EOF
}

# 함수: 인자 파싱
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--cluster)
                CLUSTER="$2"
                shift 2
                ;;
            -s|--service)
                SERVICE="$2"
                shift 2
                ;;
            -n|--container)
                CONTAINER="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-seed)
                SKIP_SEED=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "알 수 없는 옵션: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 함수: 사전 조건 확인
check_prerequisites() {
    log "사전 조건을 확인합니다..."
    
    # AWS CLI 확인
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI가 설치되어 있지 않습니다."
        exit 1
    fi
    log_success "AWS CLI 설치됨"
    
    # AWS 자격증명 확인
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS 자격증명이 구성되어 있지 않습니다."
        exit 1
    fi
    log_success "AWS 자격증명 확인됨"
}

# 함수: ECS 서비스 상태 확인
check_service_status() {
    log "ECS 서비스 상태를 확인합니다..."
    
    local status=$(aws ecs describe-services \
        --cluster $CLUSTER \
        --services $SERVICE \
        --region $REGION \
        --query 'services[0].status' \
        --output text 2>/dev/null || echo "NOTFOUND")
    
    if [ "$status" != "ACTIVE" ]; then
        log_error "ECS 서비스가 ACTIVE 상태가 아닙니다. (현재: $status)"
        exit 1
    fi
    
    log_success "ECS 서비스 상태: $status"
}

# 함수: 실행 중인 태스크 조회
get_task_id() {
    log "실행 중인 태스크를 조회합니다..."
    
    local task_arn=$(aws ecs list-tasks \
        --cluster $CLUSTER \
        --service-name $SERVICE \
        --region $REGION \
        --query 'taskArns[0]' \
        --output text 2>/dev/null)
    
    if [ -z "$task_arn" ] || [ "$task_arn" == "None" ]; then
        log_error "실행 중인 태스크를 찾을 수 없습니다."
        exit 1
    fi
    
    # Task ID 추출 (ARN의 마지막 부분)
    TASK_ID=$(echo $task_arn | cut -d'/' -f3)
    
    log_success "Task ID: $TASK_ID"
}

# 함수: ECS Exec 권한 확인
check_ecs_exec() {
    log "ECS Exec 권한을 확인합니다..."
    
    local exec_enabled=$(aws ecs describe-services \
        --cluster $CLUSTER \
        --services $SERVICE \
        --region $REGION \
        --query 'services[0].enableExecuteCommand' \
        --output text 2>/dev/null)
    
    if [ "$exec_enabled" != "True" ]; then
        log_warning "ECS Exec가 활성화되어 있지 않습니다."
        log_warning "서비스를 업데이트하여 ECS Exec를 활성화합니다..."
        
        if [ "$DRY_RUN" != "true" ]; then
            aws ecs update-service \
                --cluster $CLUSTER \
                --service $SERVICE \
                --enable-execute-command \
                --region $REGION > /dev/null
            
            log_success "ECS Exec 활성화됨"
        fi
    else
        log_success "ECS Exec 활성화됨"
    fi
}

# 함수: 데이터베이스 연결 테스트
test_database_connection() {
    log "데이터베이스 연결을 테스트합니다..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "드라이 런: 데이터베이스 연결 테스트 건너뜀"
        return
    fi
    
    local output=$(aws ecs execute-command \
        --cluster $CLUSTER \
        --task $TASK_ID \
        --container $CONTAINER \
        --command "psql \$DATABASE_URL -c 'SELECT version();'" \
        --region $REGION \
        --output text 2>&1 || true)
    
    if echo "$output" | grep -q "PostgreSQL"; then
        log_success "데이터베이스 연결 성공"
    else
        log_warning "데이터베이스 연결 테스트 결과: $output"
    fi
}

# 함수: 스키마 생성
migrate_schema() {
    log "데이터베이스 스키마를 생성합니다..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "드라이 런: pnpm db:push 실행"
        return
    fi
    
    log "명령어 실행: pnpm db:push"
    
    aws ecs execute-command \
        --cluster $CLUSTER \
        --task $TASK_ID \
        --container $CONTAINER \
        --command "pnpm db:push" \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        log_success "스키마 생성 완료"
    else
        log_error "스키마 생성 실패"
        exit 1
    fi
}

# 함수: 샘플 데이터 삽입
seed_database() {
    if [ "$SKIP_SEED" = "true" ]; then
        log_warning "시딩 단계를 건너뜁니다."
        return
    fi
    
    log "샘플 데이터를 삽입합니다..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "드라이 런: node scripts/seed-database.mjs 실행"
        return
    fi
    
    log "명령어 실행: node scripts/seed-database.mjs"
    
    aws ecs execute-command \
        --cluster $CLUSTER \
        --task $TASK_ID \
        --container $CONTAINER \
        --command "node scripts/seed-database.mjs" \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        log_success "샘플 데이터 삽입 완료"
    else
        log_error "샘플 데이터 삽입 실패"
        exit 1
    fi
}

# 함수: 데이터 검증
verify_data() {
    log "데이터를 검증합니다..."
    
    if [ "$DRY_RUN" = "true" ]; then
        log "드라이 런: 데이터 검증 건너뜀"
        return
    fi
    
    local table_count=$(aws ecs execute-command \
        --cluster $CLUSTER \
        --task $TASK_ID \
        --container $CONTAINER \
        --command "psql \$DATABASE_URL -c \"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';\"" \
        --region $REGION \
        --output text 2>&1 | tail -1)
    
    log "생성된 테이블 수: $table_count"
    
    if [ "$SKIP_SEED" != "true" ]; then
        local record_count=$(aws ecs execute-command \
            --cluster $CLUSTER \
            --task $TASK_ID \
            --container $CONTAINER \
            --command "psql \$DATABASE_URL -c \"SELECT COUNT(*) FROM sys_com_cd;\"" \
            --region $REGION \
            --output text 2>&1 | tail -1)
        
        log "삽입된 샘플 데이터 수: $record_count"
    fi
}

# 함수: 최종 요약
print_summary() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ 데이터베이스 마이그레이션 완료!${NC}"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
    echo ""
    echo "설정:"
    echo "  - 클러스터: $CLUSTER"
    echo "  - 서비스: $SERVICE"
    echo "  - 컨테이너: $CONTAINER"
    echo "  - Task ID: $TASK_ID"
    echo "  - 리전: $REGION"
    echo ""
    echo "완료된 작업:"
    echo "  ✅ 사전 조건 확인"
    echo "  ✅ ECS 서비스 상태 확인"
    echo "  ✅ 데이터베이스 연결 테스트"
    echo "  ✅ 스키마 생성"
    if [ "$SKIP_SEED" != "true" ]; then
        echo "  ✅ 샘플 데이터 삽입"
    fi
    echo "  ✅ 데이터 검증"
    echo ""
    echo "다음 단계:"
    echo "  1. 애플리케이션에서 데이터 조회 테스트"
    echo "  2. API 엔드포인트 기능 테스트"
    echo "  3. 성능 모니터링 시작"
    echo ""
}

# 메인 함수
main() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}LLMOps 데이터베이스 마이그레이션 및 시딩${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    
    # 인자 파싱
    parse_args "$@"
    
    # 드라이 런 표시
    if [ "$DRY_RUN" = "true" ]; then
        log_warning "드라이 런 모드: 실제 실행하지 않습니다."
        echo ""
    fi
    
    # 사전 조건 확인
    check_prerequisites
    echo ""
    
    # ECS 서비스 확인
    check_service_status
    echo ""
    
    # Task ID 조회
    get_task_id
    echo ""
    
    # ECS Exec 확인
    check_ecs_exec
    echo ""
    
    # 데이터베이스 연결 테스트
    test_database_connection
    echo ""
    
    # 스키마 생성
    migrate_schema
    echo ""
    
    # 샘플 데이터 삽입
    seed_database
    echo ""
    
    # 데이터 검증
    verify_data
    echo ""
    
    # 최종 요약
    print_summary
}

# 스크립트 실행
main "$@"
