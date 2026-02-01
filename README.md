# 2026 Research Strategy Navigator
### 연구의 과거와 현재, 그리고 미래를 잇다

**2026 Research Intelligence Project**는  
2021–2026년(예측 데이터 포함) 학술 키워드 트렌드와  
학문 분야 간 확산 과정을 시각화하여  
차세대 연구 전략 수립을 지원하는 데이터 기반 전략 내비게이터입니다.

단순한 지표 나열을 넘어,  
키워드·클러스터·학문 분야 간의 **연결(Connect)**을 통해  
데이터의 맥락과 흐름에서 인사이트를 도출합니다.

---

## 핵심 컨셉 : 잇다 (Connect)

- 과거–현재–미래 연구 트렌드 연결
- 키워드–연관어–클러스터 연결
- 단일 학문–다학제 확산 흐름 연결
- 데이터–전략적 의사결정 연결

---

## 주요 분석 모듈

### 1. 위치 잇다 (Keyword Positioning Map)
- 2026년 **예측 빈도 × 성장률** 기반 산점도
- 키워드 4분면 분류
  - 신규 유망 (Emerging)
  - 핵심 전략 (Core)
  - 특화/정체 (Niche)
  - 성숙/유지 (Mature)
- 인터랙션
  - 키워드 클릭 시 **[맥락 잇다] 탭**으로 이동
  - 선택 키워드의 연관어·트렌드 상세 분석

---

### 2. 흐름 잇다 (Keyword Growth Analysis)
- 2025년 대비 2026년 예측 빈도 성장률 분석
- 미래 고성장 연구 주제 식별
- 주요 성장 키워드 예시
  - Tax (+45.5%)
  - Legal (+43.29%)
  - Rights (+34.31%)

---

### 3. 무리지어 잇다 (Cluster Trend Analysis)
- 핵심 전략 키워드 20개 기반 클러스터링
- 총 21개 연구 클러스터 도출
- 기술(Tech), 정책(Policy) 등 학문 범주별 분류
- 클러스터 포지셔닝 맵
  - 성장: Artificial Intelligence & Machine Learning
  - 감소: COVID-19 Pandemic

---

### 4. 맥락 잇다 (Co-keyword Trend Heatmap)
- 전략 키워드 20개 × 연관어 Top 10
- 5개년 빈도 변화 히트맵 시각화
- 자동 트렌드 배지
  - NEW / HOT / OLD
- Hover 인터랙션
  - 연관어 행에 마우스 오버 시 연도별 미니 선형 그래프 표시

---

### 5. 세상을 잇다 (Field Diffusion & Diversity)
- Sankey 다이어그램
  - 학문 분야 간 지식 확산 경로 시각화
- Entropy Index
  - 연구 주제의 다학제 융합 정도 정량화

---

### 6. 실시간 트렌드 전광판 (Keyword Ticker)
- NEW / HOT 키워드 실시간 스트림
- 키워드 클릭 시 연관어 맥락 화면으로 즉시 이동
- 2026년 예측 성장률 동시 표시

---

## 프로젝트 구조
├── index.html
├── script.js
├── heatmap.js
├── style.css
├── .gitignore
└── data/
    ├── 2026년_키워드_성장률2(임계값0).csv
    ├── all_keywords_co_keywords_by_year_long_top10.csv
    ├── cluster_trends.json
    ├── field_diffusion.json
    └── network.json

  
---

## 기술 스택

- **Visualization**: Plotly.js, D3.js
- **Data Handling**: PapaParse
- **UI / UX**: HTML5, CSS3, Pretendard Font
- **Analysis**: Python 기반 예측 모델링 (JSON / CSV 변환)

---

## 실행 방법

1. 프로젝트 루트 폴더에서 `index.html` 실행
2. 브라우저 로컬 보안 정책으로 CSV 로딩이 제한될 수 있음
3. **VS Code Live Server 확장 사용 권장**

---

## 프로젝트 요약

> 데이터의 흐름과 연결을 통해  
> 미래 연구 전략을 탐색하는  
> 2026 Research Intelligence Dashboard



