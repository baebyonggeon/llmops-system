#!/usr/bin/env python3

"""
AWS 비용 예측 스크립트 (Prophet 모델 사용)

이 스크립트는 Prophet 시계열 예측 모델을 사용하여 향후 6개월간의 AWS 비용을 예측합니다.
실제 AWS Cost Explorer 데이터를 사용하거나, 샘플 데이터로 테스트할 수 있습니다.

사용법:
    python3 scripts/forecast-aws-costs.py
    python3 scripts/forecast-aws-costs.py --days 180
    python3 scripts/forecast-aws-costs.py --use-sample
    python3 scripts/forecast-aws-costs.py --export csv
"""

import os
import sys
import json
import argparse
import warnings
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib import rcParams

# Prophet 설치 확인
try:
    from prophet import Prophet
except ImportError:
    print("❌ Prophet이 설치되어 있지 않습니다.")
    print("설치 명령어: pip3 install prophet pystan==2.14.10.2")
    sys.exit(1)

# 경고 무시
warnings.filterwarnings('ignore')

# 한글 폰트 설정
rcParams['font.family'] = 'DejaVu Sans'
rcParams['axes.unicode_minus'] = False

class AWSCostForecaster:
    """AWS 비용 예측 클래스"""
    
    def __init__(self, days_ahead=180, use_sample=False):
        """
        초기화
        
        Args:
            days_ahead: 예측 기간 (일)
            use_sample: 샘플 데이터 사용 여부
        """
        self.days_ahead = days_ahead
        self.use_sample = use_sample
        self.df = None
        self.model = None
        self.forecast = None
        
    def generate_sample_data(self):
        """샘플 AWS 비용 데이터 생성"""
        print("📊 샘플 데이터를 생성합니다...")
        
        # 지난 12개월 데이터 생성
        dates = pd.date_range(end=datetime.now(), periods=365, freq='D')
        
        # 기본 비용 (트렌드 + 계절성 + 노이즈)
        np.random.seed(42)
        
        # 트렌드: 월간 $700에서 시작하여 점진적 증가
        trend = np.linspace(700, 750, len(dates))
        
        # 계절성: 주간 변동 (주말에 낮음)
        seasonality = 30 * np.sin(np.arange(len(dates)) * 2 * np.pi / 7)
        
        # 노이즈
        noise = np.random.normal(0, 20, len(dates))
        
        # 총 비용
        costs = trend + seasonality + noise
        costs = np.maximum(costs, 500)  # 최소값 설정
        
        self.df = pd.DataFrame({
            'ds': dates,
            'y': costs
        })
        
        print(f"✅ {len(self.df)}개의 샘플 데이터 포인트 생성")
        print(f"   기간: {self.df['ds'].min().date()} ~ {self.df['ds'].max().date()}")
        print(f"   평균 비용: ${self.df['y'].mean():.2f}")
        
    def load_aws_data(self):
        """AWS Cost Explorer에서 데이터 로드 (실제 구현)"""
        print("📊 AWS 비용 데이터를 로드합니다...")
        
        try:
            import boto3
            
            # AWS Cost Explorer 클라이언트
            ce = boto3.client('ce', region_name='us-east-1')
            
            # 지난 12개월 데이터 조회
            end_date = datetime.now().date()
            start_date = end_date - timedelta(days=365)
            
            response = ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.isoformat(),
                    'End': end_date.isoformat()
                },
                Granularity='DAILY',
                Metrics=['UnblendedCost']
            )
            
            # 데이터 처리
            data = []
            for result in response['ResultsByTime']:
                date = result['TimePeriod']['Start']
                cost = float(result['Total']['UnblendedCost']['Amount'])
                data.append({'ds': pd.to_datetime(date), 'y': cost})
            
            self.df = pd.DataFrame(data)
            print(f"✅ {len(self.df)}개의 AWS 비용 데이터 로드")
            
        except Exception as e:
            print(f"⚠️  AWS 데이터 로드 실패: {e}")
            print("   샘플 데이터로 진행합니다...")
            self.generate_sample_data()
    
    def prepare_data(self):
        """데이터 전처리"""
        print("\n🔧 데이터를 전처리합니다...")
        
        if self.df is None:
            if self.use_sample:
                self.generate_sample_data()
            else:
                self.load_aws_data()
        
        # 데이터 정렬
        self.df = self.df.sort_values('ds').reset_index(drop=True)
        
        # 결측치 처리
        self.df['y'] = self.df['y'].fillna(self.df['y'].mean())
        
        print(f"✅ 데이터 전처리 완료")
        print(f"   데이터 포인트: {len(self.df)}")
        print(f"   기간: {self.df['ds'].min().date()} ~ {self.df['ds'].max().date()}")
        print(f"   평균 비용: ${self.df['y'].mean():.2f}")
        print(f"   최소/최대: ${self.df['y'].min():.2f} / ${self.df['y'].max():.2f}")
    
    def train_model(self):
        """Prophet 모델 학습"""
        print("\n🤖 Prophet 모델을 학습합니다...")
        
        # Prophet 모델 생성
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=0.95,  # 95% 신뢰도
            changepoint_prior_scale=0.05
        )
        
        # 모델 학습
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.model.fit(self.df)
        
        print("✅ 모델 학습 완료")
    
    def forecast_costs(self):
        """비용 예측"""
        print(f"\n📈 향후 {self.days_ahead}일간의 비용을 예측합니다...")
        
        # 미래 데이터 프레임 생성
        future = self.model.make_future_dataframe(periods=self.days_ahead)
        
        # 예측
        self.forecast = self.model.predict(future)
        
        # 예측 결과 추출
        forecast_future = self.forecast[self.forecast['ds'] > self.df['ds'].max()].copy()
        
        print(f"✅ 예측 완료")
        print(f"   예측 기간: {forecast_future['ds'].min().date()} ~ {forecast_future['ds'].max().date()}")
        print(f"   평균 예측 비용: ${forecast_future['yhat'].mean():.2f}")
        print(f"   최소/최대: ${forecast_future['yhat'].min():.2f} / ${forecast_future['yhat'].max():.2f}")
    
    def analyze_forecast(self):
        """예측 결과 분석"""
        print("\n📊 예측 결과를 분석합니다...")
        
        # 현재 데이터의 평균 비용
        current_avg = self.df['y'].mean()
        
        # 예측 데이터의 평균 비용
        forecast_future = self.forecast[self.forecast['ds'] > self.df['ds'].max()].copy()
        forecast_avg = forecast_future['yhat'].mean()
        
        # 변화율
        change_rate = ((forecast_avg - current_avg) / current_avg) * 100
        
        print(f"\n📈 비용 추이 분석:")
        print(f"   현재 평균 비용: ${current_avg:.2f}/일")
        print(f"   예측 평균 비용: ${forecast_avg:.2f}/일")
        print(f"   변화율: {change_rate:+.2f}%")
        
        # 월간 비용 계산
        current_monthly = current_avg * 30
        forecast_monthly = forecast_avg * 30
        
        print(f"\n💰 월간 비용 추정:")
        print(f"   현재: ${current_monthly:.2f}/월")
        print(f"   예측: ${forecast_monthly:.2f}/월")
        print(f"   변화: ${forecast_monthly - current_monthly:+.2f}/월")
        
        # 신뢰도 분석
        forecast_future['upper_margin'] = forecast_future['yhat_upper'] - forecast_future['yhat']
        forecast_future['lower_margin'] = forecast_future['yhat'] - forecast_future['yhat_lower']
        
        print(f"\n🎯 신뢰도 분석 (95% 신뢰도):")
        print(f"   평균 상한선: ${forecast_future['yhat_upper'].mean():.2f}")
        print(f"   평균 하한선: ${forecast_future['yhat_lower'].mean():.2f}")
        print(f"   평균 오차 범위: ±${forecast_future['upper_margin'].mean():.2f}")
    
    def visualize_forecast(self, output_path='forecast_plot.png'):
        """예측 결과 시각화"""
        print(f"\n📊 예측 결과를 시각화합니다...")
        
        fig, axes = plt.subplots(2, 1, figsize=(14, 10))
        
        # 1. 전체 예측 그래프
        ax1 = axes[0]
        
        # 실제 데이터
        ax1.plot(self.df['ds'], self.df['y'], 'b-', linewidth=2, label='Actual Cost')
        
        # 예측 데이터
        forecast_future = self.forecast[self.forecast['ds'] > self.df['ds'].max()].copy()
        ax1.plot(forecast_future['ds'], forecast_future['yhat'], 'r--', linewidth=2, label='Forecast')
        
        # 신뢰도 구간
        ax1.fill_between(
            forecast_future['ds'],
            forecast_future['yhat_lower'],
            forecast_future['yhat_upper'],
            alpha=0.2,
            color='red',
            label='95% Confidence Interval'
        )
        
        # 분리선
        ax1.axvline(x=self.df['ds'].max(), color='gray', linestyle='--', alpha=0.5)
        
        ax1.set_xlabel('Date', fontsize=12)
        ax1.set_ylabel('Daily Cost ($)', fontsize=12)
        ax1.set_title('AWS Cost Forecast (6 Months)', fontsize=14, fontweight='bold')
        ax1.legend(loc='best', fontsize=10)
        ax1.grid(True, alpha=0.3)
        ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m'))
        ax1.xaxis.set_major_locator(mdates.MonthLocator(interval=1))
        plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
        
        # 2. 월간 비용 예측
        ax2 = axes[1]
        
        # 월간 데이터 집계
        self.df['month'] = self.df['ds'].dt.to_period('M')
        monthly_actual = self.df.groupby('month')['y'].sum()
        
        forecast_future['month'] = forecast_future['ds'].dt.to_period('M')
        monthly_forecast = forecast_future.groupby('month')['yhat'].sum()
        
        # 그래프
        x_pos = np.arange(len(monthly_actual) + len(monthly_forecast))
        
        # 실제 데이터
        ax2.bar(x_pos[:len(monthly_actual)], monthly_actual.values, 
                width=0.8, label='Actual', color='steelblue', alpha=0.8)
        
        # 예측 데이터
        ax2.bar(x_pos[len(monthly_actual):], monthly_forecast.values,
                width=0.8, label='Forecast', color='coral', alpha=0.8)
        
        # 분리선
        ax2.axvline(x=len(monthly_actual) - 0.5, color='gray', linestyle='--', alpha=0.5)
        
        # X축 레이블
        all_months = list(monthly_actual.index) + list(monthly_forecast.index)
        ax2.set_xticks(x_pos)
        ax2.set_xticklabels([str(m) for m in all_months], rotation=45)
        
        ax2.set_xlabel('Month', fontsize=12)
        ax2.set_ylabel('Monthly Cost ($)', fontsize=12)
        ax2.set_title('Monthly AWS Cost Comparison', fontsize=14, fontweight='bold')
        ax2.legend(loc='best', fontsize=10)
        ax2.grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(output_path, dpi=300, bbox_inches='tight')
        print(f"✅ 그래프 저장: {output_path}")
        
        return fig
    
    def export_forecast(self, format='csv'):
        """예측 결과 내보내기"""
        print(f"\n💾 예측 결과를 {format.upper()} 형식으로 내보냅니다...")
        
        forecast_future = self.forecast[self.forecast['ds'] > self.df['ds'].max()].copy()
        
        if format == 'csv':
            output_file = 'aws_cost_forecast.csv'
            forecast_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_csv(
                output_file, index=False
            )
            print(f"✅ CSV 파일 저장: {output_file}")
            
        elif format == 'json':
            output_file = 'aws_cost_forecast.json'
            data = {
                'forecast': forecast_future[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict('records'),
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'forecast_days': self.days_ahead,
                    'confidence_level': 0.95
                }
            }
            
            # datetime 객체를 문자열로 변환
            for record in data['forecast']:
                record['ds'] = record['ds'].isoformat()
            
            with open(output_file, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"✅ JSON 파일 저장: {output_file}")
    
    def generate_report(self):
        """예측 보고서 생성"""
        print(f"\n📄 예측 보고서를 생성합니다...")
        
        forecast_future = self.forecast[self.forecast['ds'] > self.df['ds'].max()].copy()
        
        # 현재 데이터의 평균 비용
        current_avg = self.df['y'].mean()
        forecast_avg = forecast_future['yhat'].mean()
        
        report = f"""# AWS 비용 예측 보고서

## 생성 정보
- **생성 날짜**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **분석 기간**: {self.df['ds'].min().date()} ~ {self.df['ds'].max().date()}
- **예측 기간**: {forecast_future['ds'].min().date()} ~ {forecast_future['ds'].max().date()}
- **예측 모델**: Prophet (Facebook)
- **신뢰도**: 95%

## 주요 지표

### 일일 비용
- **현재 평균**: ${current_avg:.2f}/일
- **예측 평균**: ${forecast_avg:.2f}/일
- **변화율**: {((forecast_avg - current_avg) / current_avg) * 100:+.2f}%

### 월간 비용
- **현재 추정**: ${current_avg * 30:.2f}/월
- **예측 추정**: ${forecast_avg * 30:.2f}/월
- **월간 변화**: ${(forecast_avg - current_avg) * 30:+.2f}/월
- **연간 변화**: ${(forecast_avg - current_avg) * 30 * 12:+.2f}/년

### 신뢰도 분석 (95%)
- **평균 상한선**: ${forecast_future['yhat_upper'].mean():.2f}/일
- **평균 하한선**: ${forecast_future['yhat_lower'].mean():.2f}/일
- **평균 오차 범위**: ±${(forecast_future['yhat_upper'].mean() - forecast_future['yhat'].mean()):.2f}/일

## 월별 예측

"""
        
        # 월별 예측 데이터
        forecast_future['month'] = forecast_future['ds'].dt.to_period('M')
        monthly_forecast = forecast_future.groupby('month').agg({
            'yhat': 'sum',
            'yhat_lower': 'sum',
            'yhat_upper': 'sum'
        }).reset_index()
        
        report += "| 월 | 예측 비용 | 하한선 | 상한선 |\n"
        report += "|-----|---------|--------|--------|\n"
        
        for _, row in monthly_forecast.iterrows():
            report += f"| {row['month']} | ${row['yhat']:.2f} | ${row['yhat_lower']:.2f} | ${row['yhat_upper']:.2f} |\n"
        
        report += "\n## 권장사항\n\n"
        
        if forecast_avg > current_avg * 1.1:
            report += "### ⚠️ 비용 증가 추세\n"
            report += f"예측 비용이 현재 대비 {((forecast_avg - current_avg) / current_avg) * 100:.1f}% 증가할 것으로 예상됩니다.\n\n"
            report += "**권장 조치:**\n"
            report += "1. 자동 스케일링 정책 검토\n"
            report += "2. 예약 인스턴스 구매 검토\n"
            report += "3. 불필요한 리소스 정리\n"
            report += "4. 비용 최적화 전략 재검토\n"
        elif forecast_avg < current_avg * 0.9:
            report += "### ✅ 비용 감소 추세\n"
            report += f"예측 비용이 현재 대비 {((current_avg - forecast_avg) / current_avg) * 100:.1f}% 감소할 것으로 예상됩니다.\n\n"
            report += "**권장 조치:**\n"
            report += "1. 비용 절감 효과 모니터링\n"
            report += "2. 절감 원인 분석\n"
            report += "3. 성공 사례 문서화\n"
        else:
            report += "### ➡️ 비용 안정화 추세\n"
            report += "예측 비용이 현재 수준에서 안정적일 것으로 예상됩니다.\n\n"
            report += "**권장 조치:**\n"
            report += "1. 현재 비용 수준 유지\n"
            report += "2. 정기적인 비용 모니터링\n"
            report += "3. 새로운 서비스 추가 시 영향 분석\n"
        
        # 파일 저장
        output_file = 'aws_cost_forecast_report.md'
        with open(output_file, 'w') as f:
            f.write(report)
        
        print(f"✅ 보고서 저장: {output_file}")
        
        return report


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(
        description='AWS 비용 예측 (Prophet 모델 사용)'
    )
    parser.add_argument('--days', type=int, default=180,
                        help='예측 기간 (기본값: 180일)')
    parser.add_argument('--use-sample', action='store_true',
                        help='샘플 데이터 사용')
    parser.add_argument('--export', choices=['csv', 'json', 'both'],
                        help='내보내기 형식')
    parser.add_argument('--output', default='forecast_plot.png',
                        help='그래프 출력 파일 (기본값: forecast_plot.png)')
    
    args = parser.parse_args()
    
    print("=" * 50)
    print("AWS 비용 예측 (Prophet 모델)")
    print("=" * 50)
    
    # 포레캐스터 생성
    forecaster = AWSCostForecaster(
        days_ahead=args.days,
        use_sample=args.use_sample
    )
    
    # 파이프라인 실행
    forecaster.prepare_data()
    forecaster.train_model()
    forecaster.forecast_costs()
    forecaster.analyze_forecast()
    forecaster.visualize_forecast(args.output)
    
    # 내보내기
    if args.export:
        if args.export == 'both':
            forecaster.export_forecast('csv')
            forecaster.export_forecast('json')
        else:
            forecaster.export_forecast(args.export)
    
    # 보고서 생성
    forecaster.generate_report()
    
    print("\n" + "=" * 50)
    print("✅ AWS 비용 예측 완료!")
    print("=" * 50)


if __name__ == '__main__':
    main()
