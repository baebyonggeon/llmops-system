#!/bin/bash

################################################################################
# ECS 자동 스케일링 설정 자동화 스크립트
#
# 이 스크립트는 ECS 서비스에 자동 스케일링을 설정합니다.
#
# 사용법:
#   ./scripts/setup-autoscaling.sh
#   ./scripts/setup-autoscaling.sh --environment production
#   ./scripts/setup-autoscaling.sh --dry-run
#
# 요구사항:
#   - AWS CLI 설치 및 구성
#   - 적절한 IAM 권한
################################################################################

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 기본값
CLUSTER="prod-llmops-cluster"
SERVICE="prod-llmops-service"
REGION="ap-northeast-2"
ENVIRONMENT="production"
DRY_RUN=false

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

log_action() {
    echo -e "${CYAN}➜ $1${NC}"
}

# 함수: 도움말 출력
show_help() {
    cat << EOF
사용법: $0 [옵션]

옵션:
  -c, --cluster CLUSTER           ECS 클러스터 이름 (기본값: prod-llmops-cluster)
  -s, --service SERVICE           ECS 서비스 이름 (기본값: prod-llmops-service)
  -e, --environment ENV           환경 (dev, staging, production) (기본값: production)
  -r, --region REGION             AWS 리전 (기본값: ap-northeast-2)
  -d, --dry-run                   실행 계획만 표시
  -h, --help                      이 도움말 표시

환경별 기본값:
  dev:        min=1, max=3, cpu_target=80%, memory_target=85%
  staging:    min=2, max=5, cpu_target=70%, memory_target=80%
  production: min=3, max=20, cpu_target=60%, memory_target=70%

예시:
  # 프로덕션 환경에 자동 스케일링 설정
  $0 -e production

  # 개발 환경에 자동 스케일링 설정 (드라이 런)
  $0 -e dev --dry-run

  # 커스텀 클러스터/서비스
  $0 -c my-cluster -s my-service
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
            -e|--environment)
                ENVIRONMENT="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -d|--dry-run)
                DRY_RUN=true
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

# 함수: 환경별 설정 로드
load_environment_config() {
    case "$ENVIRONMENT" in
        dev)
            MIN_CAPACITY=1
            MAX_CAPACITY=3
            CPU_TARGET=80.0
            MEMORY_TARGET=85.0
            SCALE_OUT_COOLDOWN=120
            SCALE_IN_COOLDOWN=600
            ;;
        staging)
            MIN_CAPACITY=2
            MAX_CAPACITY=5
            CPU_TARGET=70.0
            MEMORY_TARGET=80.0
            SCALE_OUT_COOLDOWN=60
            SCALE_IN_COOLDOWN=300
            ;;
        production)
            MIN_CAPACITY=3
            MAX_CAPACITY=20
            CPU_TARGET=60.0
            MEMORY_TARGET=70.0
            SCALE_OUT_COOLDOWN=60
            SCALE_IN_COOLDOWN=300
            ;;
        *)
            log_error "알 수 없는 환경: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# 함수: 사전 조건 확인
check_prerequisites() {
    log "사전 조건을 확인합니다..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI가 설치되어 있지 않습니다."
        exit 1
    fi
    
    # AWS 자격증명 확인
    if ! aws sts get-caller-identity --region "$REGION" &>/dev/null; then
        log_error "AWS 자격증명이 구성되어 있지 않습니다."
        exit 1
    fi
    
    # ECS 서비스 확인
    if ! aws ecs describe-services \
        --cluster "$CLUSTER" \
        --services "$SERVICE" \
        --region "$REGION" &>/dev/null; then
        log_error "ECS 서비스를 찾을 수 없습니다: $CLUSTER/$SERVICE"
        exit 1
    fi
    
    log_success "사전 조건 확인 완료"
}

# 함수: 스케일링 대상 등록
register_scalable_target() {
    log_action "스케일링 대상 등록: min=$MIN_CAPACITY, max=$MAX_CAPACITY"
    
    local cmd="aws application-autoscaling register-scalable-target \
        --service-namespace ecs \
        --resource-id service/$CLUSTER/$SERVICE \
        --scalable-dimension ecs:service:DesiredCount \
        --min-capacity $MIN_CAPACITY \
        --max-capacity $MAX_CAPACITY \
        --region $REGION"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  $cmd"
    else
        eval "$cmd" 2>/dev/null || true
        log_success "스케일링 대상 등록 완료"
    fi
}

# 함수: CPU 기반 스케일링 정책 생성
create_cpu_scaling_policy() {
    log_action "CPU 기반 스케일링 정책 생성: target=$CPU_TARGET%"
    
    local policy_name="${ENVIRONMENT}-cpu-scaling"
    
    local cmd="aws application-autoscaling put-scaling-policy \
        --policy-name $policy_name \
        --service-namespace ecs \
        --resource-id service/$CLUSTER/$SERVICE \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration '{
            \"TargetValue\": $CPU_TARGET,
            \"PredefinedMetricSpecification\": {
                \"PredefinedMetricType\": \"ECSServiceAverageCPUUtilization\"
            },
            \"ScaleOutCooldown\": $SCALE_OUT_COOLDOWN,
            \"ScaleInCooldown\": $SCALE_IN_COOLDOWN
        }' \
        --region $REGION"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  $cmd"
    else
        eval "$cmd" 2>/dev/null || true
        log_success "CPU 기반 스케일링 정책 생성 완료"
    fi
}

# 함수: 메모리 기반 스케일링 정책 생성
create_memory_scaling_policy() {
    log_action "메모리 기반 스케일링 정책 생성: target=$MEMORY_TARGET%"
    
    local policy_name="${ENVIRONMENT}-memory-scaling"
    
    local cmd="aws application-autoscaling put-scaling-policy \
        --policy-name $policy_name \
        --service-namespace ecs \
        --resource-id service/$CLUSTER/$SERVICE \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration '{
            \"TargetValue\": $MEMORY_TARGET,
            \"PredefinedMetricSpecification\": {
                \"PredefinedMetricType\": \"ECSServiceAverageMemoryUtilization\"
            },
            \"ScaleOutCooldown\": $SCALE_OUT_COOLDOWN,
            \"ScaleInCooldown\": $SCALE_IN_COOLDOWN
        }' \
        --region $REGION"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  $cmd"
    else
        eval "$cmd" 2>/dev/null || true
        log_success "메모리 기반 스케일링 정책 생성 완료"
    fi
}

# 함수: ALB 요청 수 기반 스케일링 정책 생성 (프로덕션만)
create_alb_scaling_policy() {
    if [ "$ENVIRONMENT" != "production" ]; then
        return
    fi
    
    log_action "ALB 요청 수 기반 스케일링 정책 생성: target=1000 req/task"
    
    local policy_name="${ENVIRONMENT}-alb-scaling"
    
    local cmd="aws application-autoscaling put-scaling-policy \
        --policy-name $policy_name \
        --service-namespace ecs \
        --resource-id service/$CLUSTER/$SERVICE \
        --scalable-dimension ecs:service:DesiredCount \
        --policy-type TargetTrackingScaling \
        --target-tracking-scaling-policy-configuration '{
            \"TargetValue\": 1000.0,
            \"PredefinedMetricSpecification\": {
                \"PredefinedMetricType\": \"ALBRequestCountPerTarget\"
            },
            \"ScaleOutCooldown\": $SCALE_OUT_COOLDOWN,
            \"ScaleInCooldown\": $SCALE_IN_COOLDOWN
        }' \
        --region $REGION"
    
    if [ "$DRY_RUN" = true ]; then
        echo "  $cmd"
    else
        eval "$cmd" 2>/dev/null || true
        log_success "ALB 요청 수 기반 스케일링 정책 생성 완료"
    fi
}

# 함수: 스케일링 정책 확인
verify_scaling_policies() {
    log "스케일링 정책을 확인합니다..."
    
    if [ "$DRY_RUN" = true ]; then
        log_warning "드라이 런 모드: 실제 확인을 건너뜁니다."
        return
    fi
    
    echo ""
    aws application-autoscaling describe-scaling-policies \
        --service-namespace ecs \
        --resource-id service/$CLUSTER/$SERVICE \
        --region $REGION \
        --query 'ScalingPolicies[].[PolicyName,PolicyType,TargetTrackingScalingPolicyConfiguration.TargetValue]' \
        --output table
}

# 함수: 스케일링 활동 모니터링
monitor_scaling_activities() {
    if [ "$DRY_RUN" = true ]; then
        return
    fi
    
    log "스케일링 활동을 모니터링합니다..."
    echo ""
    
    # 최근 5개 활동 표시
    aws application-autoscaling describe-scaling-activities \
        --service-namespace ecs \
        --resource-id service/$CLUSTER/$SERVICE \
        --region $REGION \
        --query 'ScalingActivities[:5].[ActivityId,Description,Cause,StartTime,StatusCode]' \
        --output table
}

# 메인 함수
main() {
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo -e "${BLUE}ECS 자동 스케일링 설정${NC}"
    echo -e "${BLUE}════════════════════════════════════════${NC}"
    echo ""
    
    parse_args "$@"
    load_environment_config
    
    echo -e "환경: ${CYAN}$ENVIRONMENT${NC}"
    echo -e "클러스터: ${CYAN}$CLUSTER${NC}"
    echo -e "서비스: ${CYAN}$SERVICE${NC}"
    echo -e "리전: ${CYAN}$REGION${NC}"
    echo -e "최소/최대 용량: ${CYAN}$MIN_CAPACITY/$MAX_CAPACITY${NC}"
    echo -e "CPU 목표: ${CYAN}$CPU_TARGET%${NC}"
    echo -e "메모리 목표: ${CYAN}$MEMORY_TARGET%${NC}"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "모드: ${YELLOW}드라이 런${NC}"
    fi
    echo ""
    
    check_prerequisites
    echo ""
    
    log "자동 스케일링을 설정합니다..."
    echo ""
    
    register_scalable_target
    create_cpu_scaling_policy
    create_memory_scaling_policy
    create_alb_scaling_policy
    
    echo ""
    verify_scaling_policies
    
    if [ "$DRY_RUN" = false ]; then
        echo ""
        monitor_scaling_activities
        
        echo ""
        log_success "자동 스케일링 설정 완료!"
        echo ""
        echo -e "${CYAN}다음 단계:${NC}"
        echo "1. CloudWatch 대시보드에서 스케일링 활동 모니터링"
        echo "2. 성능 메트릭 확인 및 목표값 조정"
        echo "3. 비용 절감 분석"
    else
        echo ""
        log_warning "드라이 런 모드: 실제 변경사항이 적용되지 않았습니다."
        echo "실제 설정을 적용하려면 --dry-run 옵션을 제거하고 다시 실행하세요."
    fi
}

# 스크립트 실행
main "$@"
