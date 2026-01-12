# 📈 Prophet을 활용한 AWS 비용 예측 완전 가이드

## 개요

이 가이드는 Facebook의 Prophet 시계열 예측 모델을 사용하여 AWS 비용을 예측하는 방법을 설명합니다. Prophet은 계절성, 트렌드, 휴일 효과를 자동으로 감지하여 정확한 예측을 제공합니다.

## 📊 Prophet 모델의 장점

| 특징 | 설명 |
|------|------|
| **자동 계절성 감지** | 주간, 월간, 연간 패턴 자동 인식 |
| **트렌드 변화 감지** | 급격한 변화점(changepoint) 자동 감지 |
| **휴일 효과** | 공휴일, 특수 이벤트 영향 반영 |
| **신뢰도 구간** | 예측 범위(confidence interval) 제공 |
| **빠른 학습** | 적은 데이터로도 빠르게 학습 |
| **해석 가능성** | 예측 결과 분해 및 분석 용이 |

## 🚀 빠른 시작

### 1단계: 필수 패키지 설치

```bash
# Prophet 설치
sudo pip3 install cmdstanpy prophet

# 추가 패키지
sudo pip3 install pandas numpy matplotlib seaborn
```

### 2단계: 기본 사용법

```bash
# 샘플 데이터로 테스트
python3 scripts/forecast-aws-costs.py --use-sample

# 180일 예측 (기본값)
python3 scripts/forecast-aws-costs.py --use-sample --days 180

# 결과 내보내기
python3 scripts/forecast-aws-costs.py --use-sample --export csv

# 모든 형식 내보내기
python3 scripts/forecast-aws-costs.py --use-sample --export both
```

### 3단계: 실제 AWS 데이터 사용

```bash
# AWS 자격증명 설정
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="us-east-1"

# 실제 AWS 데이터로 예측
python3 scripts/forecast-aws-costs.py --days 180 --export both
```

## 📋 스크립트 사용 옵션

### 명령어 형식

```bash
python3 scripts/forecast-aws-costs.py [옵션]
```

### 옵션 목록

| 옵션 | 기본값 | 설명 |
|------|--------|------|
| `--days` | 180 | 예측 기간 (일) |
| `--use-sample` | - | 샘플 데이터 사용 |
| `--export` | - | 내보내기 형식 (csv, json, both) |
| `--output` | forecast_plot.png | 그래프 출력 파일 |

### 사용 예시

```bash
# 90일 예측 및 CSV 내보내기
python3 scripts/forecast-aws-costs.py --days 90 --use-sample --export csv

# 365일 예측 및 모든 형식 내보내기
python3 scripts/forecast-aws-costs.py --days 365 --use-sample --export both

# 커스텀 출력 파일
python3 scripts/forecast-aws-costs.py --use-sample --output my_forecast.png
```

## 📊 생성되는 출력 파일

### 1. forecast_plot.png (그래프)

**구성:**
- **상단 그래프**: 일일 비용 예측
  - 파란색 선: 실제 비용 데이터
  - 빨간색 점선: 예측 비용
  - 분홍색 음영: 95% 신뢰도 구간

- **하단 그래프**: 월간 비용 비교
  - 파란색 막대: 실제 월간 비용
  - 주황색 막대: 예측 월간 비용

### 2. aws_cost_forecast.csv (데이터)

```csv
ds,yhat,yhat_lower,yhat_upper
2026-01-13,750.45,715.32,785.58
2026-01-14,752.18,717.05,787.31
...
```

**컬럼 설명:**
- `ds`: 날짜
- `yhat`: 예측 비용
- `yhat_lower`: 하한선 (95% 신뢰도)
- `yhat_upper`: 상한선 (95% 신뢰도)

### 3. aws_cost_forecast.json (메타데이터)

```json
{
  "forecast": [
    {
      "ds": "2026-01-13T00:00:00",
      "yhat": 750.45,
      "yhat_lower": 715.32,
      "yhat_upper": 785.58
    }
  ],
  "metadata": {
    "generated_at": "2026-01-12T00:35:23",
    "forecast_days": 180,
    "confidence_level": 0.95
  }
}
```

### 4. aws_cost_forecast_report.md (보고서)

마크다운 형식의 상세 분석 보고서

## 🔍 예측 결과 해석

### 주요 지표 설명

#### 일일 비용
```
현재 평균: $725.20/일
예측 평균: $753.42/일
변화율: +3.89%
```

**해석:**
- 향후 6개월 동안 일일 비용이 현재 대비 약 3.89% 증가할 것으로 예상
- 월간 기준으로 약 $846/월 증가

#### 월간 비용
```
현재 추정: $21,755.97/월
예측 추정: $22,602.51/월
월간 변화: +$846.54/월
연간 변화: +$10,158.50/년
```

**해석:**
- 연간 약 $10,000 추가 비용 발생 예상
- 비용 증가 원인 분석 필요

#### 신뢰도 분석 (95%)
```
평균 상한선: $789.06/일
평균 하한선: $717.81/일
평균 오차 범위: ±$35.64/일
```

**해석:**
- 95% 확률로 실제 비용이 $717.81~$789.06 범위 내에 있을 것
- 오차 범위가 작을수록 예측의 신뢰도가 높음

## 📈 비용 추이 분석

### 비용 증가 추세 (변화율 > +10%)

```
⚠️ 비용 증가 추세 감지

권장 조치:
1. 자동 스케일링 정책 검토
2. 예약 인스턴스 구매 검토
3. 불필요한 리소스 정리
4. 비용 최적화 전략 재검토
```

**대응 방안:**
- ECS 자동 스케일링 설정 검토
- RDS 인스턴스 크기 최적화
- 미사용 리소스 삭제
- CloudWatch 로그 보관 기간 조정

### 비용 감소 추세 (변화율 < -10%)

```
✅ 비용 감소 추세 감지

권장 조치:
1. 비용 절감 효과 모니터링
2. 절감 원인 분석
3. 성공 사례 문서화
```

**대응 방안:**
- 절감 원인 분석 (자동 스케일링, 예약 인스턴스 등)
- 절감 효과 지속 여부 확인
- 성공 사례 팀과 공유

### 비용 안정화 추세 (변화율 -10% ~ +10%)

```
➡️ 비용 안정화 추세

권장 조치:
1. 현재 비용 수준 유지
2. 정기적인 비용 모니터링
3. 새로운 서비스 추가 시 영향 분석
```

**대응 방안:**
- 월간 비용 리뷰 계속 진행
- 새로운 서비스 추가 시 비용 영향 분석
- 정기적인 최적화 검토

## 🔧 고급 사용법

### 커스텀 데이터 로드

```python
import pandas as pd
from prophet import Prophet

# CSV 파일에서 데이터 로드
df = pd.read_csv('aws_costs.csv', parse_dates=['date'])
df.rename(columns={'date': 'ds', 'cost': 'y'}, inplace=True)

# 모델 생성 및 학습
model = Prophet()
model.fit(df)

# 예측
future = model.make_future_dataframe(periods=180)
forecast = model.predict(future)
```

### 계절성 커스터마이징

```python
from prophet import Prophet

model = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode='additive',  # 또는 'multiplicative'
    seasonality_prior_scale=10.0
)

model.fit(df)
```

### 휴일 효과 추가

```python
from prophet import Prophet
import pandas as pd

# 휴일 정의
holidays = pd.DataFrame({
    'holiday': ['New Year', 'Christmas'],
    'ds': pd.to_datetime(['2026-01-01', '2026-12-25']),
    'lower_window': -1,
    'upper_window': 1
})

model = Prophet(holidays=holidays)
model.fit(df)
```

### 변화점(Changepoint) 감지

```python
from prophet import Prophet

model = Prophet(
    changepoint_prior_scale=0.05,  # 변화점 민감도
    changepoint_range=0.8  # 학습 데이터의 80%까지 변화점 감지
)

model.fit(df)

# 변화점 확인
print(model.changepoints)
```

## 📊 성능 평가

### 교차 검증 (Cross Validation)

```python
from prophet.diagnostics import cross_validation, performance_metrics

# 교차 검증
cv_results = cross_validation(
    model,
    initial='365 days',
    period='30 days',
    horizon='7 days'
)

# 성능 메트릭
metrics = performance_metrics(cv_results)
print(metrics[['horizon', 'mape', 'rmse']].head())
```

**메트릭 설명:**
- **MAPE** (Mean Absolute Percentage Error): 평균 절대 백분율 오차
- **RMSE** (Root Mean Square Error): 제곱 평균 제곱근 오차
- **MAE** (Mean Absolute Error): 평균 절대 오차

### 예측 정확도 기준

| MAPE 범위 | 정확도 | 평가 |
|----------|--------|------|
| < 10% | 매우 높음 | 우수 |
| 10-20% | 높음 | 양호 |
| 20-50% | 중간 | 보통 |
| > 50% | 낮음 | 부족 |

## 🎯 모범 사례

### 1. 정기적인 모델 재학습

```bash
# 월간 재학습
0 0 1 * * python3 scripts/forecast-aws-costs.py --export both
```

### 2. 데이터 품질 관리

- 이상치(outlier) 제거
- 결측치 처리
- 데이터 정규화

### 3. 예측 결과 검증

```python
# 실제 데이터와 예측 비교
actual = df['y'].tail(30)
forecast_tail = forecast['yhat'].tail(30)

mape = (abs(actual - forecast_tail) / actual).mean() * 100
print(f"MAPE: {mape:.2f}%")
```

### 4. 비용 알람 설정

```bash
# 예측 비용이 임계값을 초과하면 알람
if forecast_avg > threshold:
    send_alert(f"예측 비용이 ${forecast_avg:.2f}로 증가할 것으로 예상됩니다")
```

## 📋 체크리스트

### 초기 설정
- [ ] Prophet 및 필수 패키지 설치
- [ ] AWS 자격증명 설정
- [ ] 샘플 데이터로 스크립트 테스트
- [ ] 실제 AWS 데이터 연결

### 정기적 실행
- [ ] 월간 비용 예측 실행
- [ ] 예측 결과 검증
- [ ] 비용 증감 추이 분석
- [ ] 최적화 조치 실행

### 모니터링
- [ ] 예측 정확도 추적
- [ ] 실제 vs 예측 비용 비교
- [ ] 비용 알람 설정
- [ ] 월간 보고서 생성

## 🔗 유용한 링크

- [Prophet 공식 문서](https://facebook.github.io/prophet/)
- [Prophet GitHub](https://github.com/facebook/prophet)
- [AWS Cost Explorer](https://console.aws.amazon.com/cost-management/home)
- [AWS CLI Cost Management](https://docs.aws.amazon.com/cli/latest/reference/ce/)

## 📞 문제 해결

### Prophet 설치 오류

```bash
# cmdstanpy 먼저 설치
sudo pip3 install cmdstanpy

# 그 후 Prophet 설치
sudo pip3 install prophet
```

### AWS 데이터 로드 실패

```bash
# AWS 자격증명 확인
aws sts get-caller-identity

# 권한 확인
aws ce get-cost-and-usage --time-period Start=2025-01-01,End=2025-01-02 --granularity DAILY --metrics UnblendedCost
```

### 메모리 부족 오류

```python
# 모델 설정 최적화
model = Prophet(
    yearly_seasonality=False,  # 계절성 비활성화
    weekly_seasonality=True,
    daily_seasonality=False
)
```

## 📈 다음 단계

1. **자동화**: Cron 작업으로 월간 자동 예측 설정
2. **통합**: 대시보드에 예측 결과 표시
3. **알람**: 비용 증가 시 자동 알람 설정
4. **분석**: 예측 결과와 실제 비용 비교 분석

---

**문서 버전**: 1.0
**마지막 업데이트**: 2026-01-12
**다음 업데이트**: 월간 예측 실행 후
