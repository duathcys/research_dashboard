// ================================
// 2026 연구 전략 내비게이터 JS (최종 개선 버전)
// ================================

// 전역 변수
let coKeywordData = []; // 연관어 데이터
let clusterData = []; // 클러스터 트렌드 데이터
let fieldDiffusionData = []; // 분야 확산 데이터
let currentKeywordData = {}; // 현재 선택된 키워드의 데이터 (히트맵용)
let mainKeywordsData = []; // 메인 키워드 성장률 데이터 (전광판용)

// 🎯 20개 주요 키워드 (고정)
const MAIN_KEYWORDS = [
    "rights", "covid-19", "artificial intelligence", "korea", "protection",
    "tax", "public", "esg", "legal", "china", "information", "international",
    "job satisfaction", "trust", "labor", "policy", "regulation",
    "management", "contract", "digital"
];

// 탭 전환 로직 - 가장 확실한 해결 방법
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // 모든 탭 및 버튼 비활성화
        document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        
        // 선택한 탭 활성화
        const targetTab = document.getElementById(tabName);
        targetTab.classList.add('active');
        btn.classList.add('active');

        // [중요] 탭이 활성화되어 display: block이 된 후 크기를 재계산해야 함
        // 0.1초 정도의 아주 짧은 지연을 주어 렌더링이 완료된 후 실행
        setTimeout(() => {
            // 방법 A: 모든 Plotly 차트 강제 리사이즈
            const plotlyCharts = document.querySelectorAll('.js-plotly-plot');
            plotlyCharts.forEach(chart => {
                Plotly.Plots.resize(chart);
            });
            
            // 방법 B: 브라우저 전체에 리사이즈 이벤트 전달 (레이아웃 재정렬 트리거)
            window.dispatchEvent(new Event('resize'));
        }, 100); 
    });
});

// ================================
// 1️⃣ 메인 키워드 데이터 로드
Papa.parse("all_keywords_co_keywords_by_year_long_top10.csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        coKeywordData = results.data;
        populateKeywordSelect();
        
        const firstKeyword = document.getElementById('key-select').value;
        const firstYear = document.getElementById('relation-year-select').value;
        renderRelationCards(firstKeyword, firstYear);
        renderCoKeywordHeatmap(firstKeyword);
    }
});

// ================================
// 2️⃣ 메인 키워드 CSV 로드 (매트릭스 & 리스트 & 전광판)
Papa.parse("2026년_키워드_성장률2(임계값0).csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        const data = results.data;
        mainKeywordsData = data.filter(item => 
            item.KYWD && 
            MAIN_KEYWORDS.includes(item.KYWD)
        );
        
        const gList = document.getElementById('growth-list');
        const dList = document.getElementById('decline-list');
        const filterBtn = document.getElementById('keyword-filter-btn');
        const limitSlider = document.getElementById('keyword-limit-slider');
        const limitValue = document.getElementById('keyword-limit-value');
        const limitControl = document.getElementById('keyword-limit-control');

        const fullData = data.filter(item => item.KYWD && item.Growth_rate !== 0);
        let filterOn = true;
        let keywordLimit = 50;

        const totalKeywordsSpan = document.getElementById('total-keywords');
        if (totalKeywordsSpan) {
            totalKeywordsSpan.textContent = `전체 ${fullData.length}개`;
        }
        
        if (limitSlider) {
            limitSlider.max = fullData.length;
        }

        // 🎬 전광판 초기화
        initKeywordTicker();

        // ================================
        // Plotly 산점도 렌더링 함수 (개선된 디자인)
        function renderScatterPlot(dataToRender){
            renderScatterPlotWithHighlight(dataToRender, null);
        }
        
        function renderScatterPlotWithHighlight(dataToRender, highlightKeyword){
            const filteredData = filterOn 
                ? dataToRender.filter(item => MAIN_KEYWORDS.includes(item.KYWD))
                : dataToRender.slice(0, keywordLimit);
            
            const highlightData = filteredData.filter(item => MAIN_KEYWORDS.includes(item.KYWD));
            const normalData = filteredData.filter(item => !MAIN_KEYWORDS.includes(item.KYWD));
            
            const traces = [];
            
            if (highlightKeyword) {
                const targetData = dataToRender.filter(item => item.KYWD === highlightKeyword);
                const otherData = filteredData.filter(item => item.KYWD !== highlightKeyword);
                
                if (otherData.length > 0) {
                    traces.push({
                        x: otherData.map(item => item.pred_freq_2026),
                        y: otherData.map(item => item.Growth_rate),
                        text: otherData.map(item => item.KYWD),
                        mode: 'markers',
                        type: 'scatter',
                        name: '기타 키워드',
                        marker: {
                            size: 8,
                            color: '#d1d5db',
                            opacity: 0.4,
                            line: { width: 1, color: 'white' }
                        },
                        hovertemplate: '<b>%{text}</b><br>빈도: %{x}<br>성장률: %{y}%<extra></extra>'
                    });
                }
                
                if (targetData.length > 0) {
                    traces.push({
                        x: targetData.map(item => item.pred_freq_2026),
                        y: targetData.map(item => item.Growth_rate),
                        text: targetData.map(item => item.KYWD),
                        mode: 'markers+text',
                        type: 'scatter',
                        name: '선택된 키워드',
                        marker: {
                            size: 22,
                            color: '#ef4444',
                            opacity: 1,
                            line: { width: 3, color: 'white' },
                            symbol: 'star'
                        },
                        textposition: 'top center',
                        textfont: { 
                            size: 15, 
                            color: '#ef4444', 
                            family: 'Pretendard, sans-serif', 
                            weight: 'bold' 
                        },
                        hovertemplate: '<b>%{text}</b><br>빈도: %{x}<br>성장률: %{y}%<extra></extra>'
                    });
                }
            } else {
                if (normalData.length > 0) {
                    traces.push({
                        x: normalData.map(item => item.pred_freq_2026),
                        y: normalData.map(item => item.Growth_rate),
                        text: normalData.map(item => item.KYWD),
                        mode: 'markers+text',
                        type: 'scatter',
                        name: '일반 키워드',
                        marker: {
                            size: 10,
                            color: '#9ca3af',
                            opacity: 0.5,
                            line: { width: 1, color: 'white' }
                        },
                        textposition: 'top center',
                        textfont: { size: 9, color: '#6b7280', family: 'Pretendard, sans-serif' },
                        hovertemplate: '<b>%{text}</b><br>빈도: %{x}<br>성장률: %{y}%<extra></extra>'
                    });
                }
                
                if (highlightData.length > 0) {
                    traces.push({
                        x: highlightData.map(item => item.pred_freq_2026),
                        y: highlightData.map(item => item.Growth_rate),
                        text: highlightData.map(item => item.KYWD),
                        mode: 'markers+text',
                        type: 'scatter',
                        name: '주요 키워드',
                        marker: {
                            size: 14,
                            color: '#3b82f6',
                            opacity: 0.85,
                            line: { width: 2, color: 'white' }
                        },
                        textposition: 'top center',
                        textfont: { 
                            size: 11, 
                            color: '#1e40af', 
                            family: 'Pretendard, sans-serif',
                            weight: '600'
                        },
                        hovertemplate: '<b>%{text}</b><br>빈도: %{x}<br>성장률: %{y}%<extra></extra>',
                        customdata: highlightData.map(item => item.KYWD)
                    });
                }
            }
            
            const layout = {
                title: {
                    text: '2026 키워드 포지셔닝 맵',
                    font: { size: 20, family: 'Pretendard, sans-serif', weight: 700, color: '#1f2937' }
                },
                xaxis: {
                    title: {
                        text: '예측 빈도 (Frequency) →',
                        font: { size: 14, family: 'Pretendard, sans-serif' }
                    },
                    gridcolor: '#e5e7eb',
                    zeroline: true,
                    tickfont: { family: 'Pretendard, sans-serif' }
                },
                yaxis: {
                    title: {
                        text: '↑ 성장률 (Growth Rate %)',
                        font: { size: 14, family: 'Pretendard, sans-serif' }
                    },
                    gridcolor: '#e5e7eb',
                    zeroline: true,
                    zerolinecolor: '#9ca3af',
                    zerolinewidth: 2,
                    tickfont: { family: 'Pretendard, sans-serif' }
                },
                hovermode: 'closest',
                showlegend: true,
                legend: {
                    x: 1.02,
                    y: 1,
                    xanchor: 'left',
                    yanchor: 'top',
                    font: { family: 'Pretendard, sans-serif', size: 12 }
                },
                margin: { t: 70, l: 70, r: 120, b: 70 },
                height: 600,
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                font: { family: 'Pretendard, sans-serif' },
                shapes: [
                    {
                        type: 'rect',
                        xref: 'paper', yref: 'y',
                        x0: 0, y0: 0, x1: 0.5, y1: 100,
                        fillcolor: '#dbeafe',
                        opacity: 0.2,
                        layer: 'below',
                        line: { width: 0 }
                    },
                    {
                        type: 'rect',
                        xref: 'paper', yref: 'y',
                        x0: 0.5, y0: 0, x1: 1, y1: 100,
                        fillcolor: '#fee2e2',
                        opacity: 0.2,
                        layer: 'below',
                        line: { width: 0 }
                    }
                ],
                annotations: [
                    {
                        text: '신규 유망<br>(Low Freq / High Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.25, y: 0.95,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#6b7280', family: 'Pretendard, sans-serif' },
                        opacity: 0.7
                    },
                    {
                        text: '핵심 전략<br>(High Freq / High Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.75, y: 0.95,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#dc2626', family: 'Pretendard, sans-serif', weight: 600 },
                        opacity: 0.7
                    },
                    {
                        text: '특화/정체<br>(Low Freq / Low Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.25, y: 0.05,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#6b7280', family: 'Pretendard, sans-serif' },
                        opacity: 0.7
                    },
                    {
                        text: '성숙/유지<br>(High Freq / Low Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.75, y: 0.05,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#6b7280', family: 'Pretendard, sans-serif' },
                        opacity: 0.7
                    }
                ]
            };
            
            const config = {
                responsive: true,
                displayModeBar: true,
                modeBarButtonsToRemove: ['lasso2d', 'select2d'],
                displaylogo: false
            };
            
            Plotly.newPlot('matrix-scatter', traces, layout, config);
            
            document.getElementById('matrix-scatter').on('plotly_click', function(data) {
                const keyword = data.points[0].text;
                
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById('relation-tab').classList.add('active');
                document.querySelector('button[data-tab="relation-tab"]').classList.add('active');

                const keySelect = document.getElementById('key-select');
                keySelect.value = keyword;
                const yearSelect = document.getElementById('relation-year-select');
                const selectedYear = yearSelect.value;
                renderRelationCards(keyword, selectedYear);
                renderCoKeywordHeatmap(keyword);
            });
            
            renderLists(filteredData);
        }

        function renderLists(dataToRender){
            gList.innerHTML = '';
            dList.innerHTML = '';

            const growthData = dataToRender.filter(item => item.Growth_rate > 0)
                .sort((a,b) => b.Growth_rate - a.Growth_rate);
            const declineData = dataToRender.filter(item => item.Growth_rate < 0)
                .sort((a,b) => Math.abs(b.Growth_rate) - Math.abs(a.Growth_rate));

            growthData.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="keyword-link">${item.KYWD}</span> <b>${item.Growth_rate}%</b>`;
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => highlightKeywordInMatrix(item.KYWD));
                gList.appendChild(li);
            });
            declineData.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span class="keyword-link">${item.KYWD}</span> <b>${item.Growth_rate}%</b>`;
                li.style.cursor = 'pointer';
                li.addEventListener('click', () => highlightKeywordInMatrix(item.KYWD));
                dList.appendChild(li);
            });
        }
        
        function highlightKeywordInMatrix(keyword) {
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('matrix-tab').classList.add('active');
            document.querySelector('button[data-tab="matrix-tab"]').classList.add('active');
            
            filterOn = false;
            filterBtn.classList.remove('active');
            filterBtn.innerText = '⚪ 키워드 필터 OFF';
            limitControl.style.display = 'flex';
            
            renderScatterPlotWithHighlight(fullData, keyword);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        renderScatterPlot(fullData);

        filterBtn.addEventListener('click', () => {
            filterOn = !filterOn;
            if(filterOn){
                filterBtn.classList.add('active');
                filterBtn.innerText = '✅ 키워드 필터 ON';
                limitControl.style.display = 'none';
            } else {
                filterBtn.classList.remove('active');
                filterBtn.innerText = '⚪ 키워드 필터 OFF';
                limitControl.style.display = 'flex';
            }
            renderScatterPlot(fullData);
        });

        limitSlider.addEventListener('input', (e) => {
            keywordLimit = parseInt(e.target.value);
            limitValue.textContent = keywordLimit;
            if (!filterOn) {
                renderScatterPlot(fullData);
            }
        });

        const sortStates = {
            'growth-value': 'desc',
            'growth-name': 'asc',
            'decline-abs': 'desc',
            'decline-name': 'asc'
        };

        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const listId = btn.dataset.list;
                const type = btn.dataset.type;
                const stateKey = `${listId}-${type}`;
                const ul = document.getElementById(listId + '-list');
                const items = Array.from(ul.children);

                sortStates[stateKey] = sortStates[stateKey] === 'desc' ? 'asc' : 'desc';
                const isDesc = sortStates[stateKey] === 'desc';

                items.sort((a,b) => {
                    const aVal = parseFloat(a.querySelector('b').innerText);
                    const bVal = parseFloat(b.querySelector('b').innerText);
                    
                    if(type === 'value' || type === 'abs') {
                        const compareVal = type === 'abs' ? Math.abs(bVal) - Math.abs(aVal) : bVal - aVal;
                        return isDesc ? compareVal : -compareVal;
                    }
                    if(type === 'name') {
                        const compareVal = a.querySelector('span').innerText.localeCompare(b.querySelector('span').innerText);
                        return isDesc ? -compareVal : compareVal;
                    }
                });

                ul.innerHTML = '';
                items.forEach(li => ul.appendChild(li));

                const arrow = isDesc ? '↓' : '↑';
                if (type === 'value') btn.textContent = `성장률 ${arrow}`;
                else if (type === 'abs') btn.textContent = `쇠퇴율 ${arrow}`;
                else if (type === 'name') btn.textContent = `이름 ${arrow}`;
            });
        });

    }
});

// 🎬 전광판 초기화 (안내 문구 추가 버전)
function initKeywordTicker() {
    const tickerWrapper = document.querySelector('.ticker-wrapper');
    if (!tickerWrapper) return;

    // 전광판 위에 안내 문구 삽입 (처음 한 번만)
    if (!document.querySelector('.ticker-guide')) {
        const guide = document.createElement('div');
        guide.className = 'ticker-guide';
        guide.innerHTML = '<span>💡 키워드를 클릭하면 <b>[맥락 잇다]</b> 탭의 상세 분석으로 이동합니다</span>';
        tickerWrapper.parentNode.insertBefore(guide, tickerWrapper);
    }

    let tickerItems = [];
    const allTargetKeywords = [...new Set(coKeywordData.map(d => d.Target_Keyword))];

    allTargetKeywords.forEach(target => {
        const filtered = coKeywordData.filter(d => d.Target_Keyword === target);
        const yearMap = {};
        filtered.forEach(row => {
            if (!yearMap[row.CoKeyword]) yearMap[row.CoKeyword] = {};
            yearMap[row.CoKeyword][row.YEAR] = row.Count;
        });

        Object.keys(yearMap).forEach(cok => {
            const counts = yearMap[cok];
            const d21=counts[2021]||0, d22=counts[2022]||0, d23=counts[2023]||0, d24=counts[2024]||0, d25=counts[2025]||0;
            
            const isNew = d25 > 0 && !d24 && !d23 && !(d21 || d22);
            const isHot = (d23 > 0 && d24 > 0 && d25 > 0) || ((d21 || d22) && !d23 && d25 > 0);

            if (isNew || isHot) {
                const growthInfo = mainKeywordsData.find(m => m.KYWD === cok);
                const growthRate = growthInfo ? growthInfo.Growth_rate : 0;

                if (growthRate > 0) {
                    tickerItems.push({
                        target: target, word: cok, type: isNew ? 'NEW' : 'HOT',
                        badge: isNew ? 'new' : 'hot', growth: growthRate
                    });
                }
            }
        });
    });

    const tickerHTML = tickerItems.map(item => `
        <div class="ticker-item" onclick="navigateToHeatmap('${item.target}', '${item.word}')">
            <span class="bridge-target">${item.target.toUpperCase()}</span>
            <span class="bridge-arrow">➔</span>
            <span class="ticker-badge ${item.badge}">${item.type}</span>
            <strong class="bridge-word">${item.word}</strong>
            <span class="bridge-growth">+${item.growth.toFixed(1)}%</span>
        </div>
    `).join('');

    tickerWrapper.innerHTML = tickerHTML + tickerHTML;
}

// 🚀 전광판 클릭 시 [탭 이동 + 데이터 변경 + 강조] 통합 함수
function navigateToHeatmap(targetKw, coKw) {
    const relationTabBtn = document.querySelector('.tab-btn[data-tab="relation-tab"]');
    if (relationTabBtn) relationTabBtn.click();

    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));

        const select = document.getElementById('key-select');
        if (select) {
            select.value = targetKw;
            select.dispatchEvent(new Event('change'));
        }

        setTimeout(() => {
            const rows = document.querySelectorAll('.heatmap-table tbody tr');
            rows.forEach(row => {
                if (row.cells[0] && row.cells[0].innerText.trim() === coKw) {
                    // [수정] 빨간색 테두리와 애니메이션 클래스 추가
                    row.classList.add('highlight-red-active');
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // 3초 후 강조 효과 제거
                    setTimeout(() => {
                        row.classList.remove('highlight-red-active');
                    }, 3000);
                }
            });
        }, 400); 
    }, 200);
}

// ================================
// 3️⃣ 연관어 TOP10 카드 렌더링
// ================================
function renderRelationCards(selectedKeyword, year) {
    const cardsContainer = document.getElementById('relation-cards');
    const selectedYear = +year;

    const filtered = coKeywordData.filter(d => d.Target_Keyword && d.Target_Keyword === selectedKeyword && d.YEAR === selectedYear);

    const coMap = {};
    filtered.forEach(d => {
        if (!coMap[d.CoKeyword]) coMap[d.CoKeyword] = 0;
        coMap[d.CoKeyword] += d.Count;
    });

    const top10 = Object.entries(coMap)
        .map(([coKeyword, count]) => ({ coKeyword, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0,10);

    cardsContainer.innerHTML = '';
    top10.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'rel-card';
        div.innerHTML = `
            <div class="card-header">
                <span class="rank">#${idx+1}</span>
                <span class="word">${item.coKeyword}</span>
            </div>
            <div class="card-body">
                <div class="count-val">${item.count.toLocaleString()}건</div>
            </div>
        `;
        cardsContainer.appendChild(div);
    });
}

// ================================
// 4️⃣ 키워드 SelectBox 생성
// ================================
function populateKeywordSelect() {
    const keySelect = document.getElementById('key-select');
    const keywords = Array.from(new Set(coKeywordData.map(d => d.Target_Keyword).filter(Boolean)));
    keySelect.innerHTML = '';
    keywords.forEach(k => {
        const option = document.createElement('option');
        option.value = k;
        option.innerText = k;
        keySelect.appendChild(option);
    });

    keySelect.addEventListener('change', () => {
        const selectedKeyword = keySelect.value;
        const year = document.getElementById('relation-year-select').value;
        renderRelationCards(selectedKeyword, year);
        renderCoKeywordHeatmap(selectedKeyword);
    });

    const yearSelect = document.getElementById('relation-year-select');
    yearSelect.addEventListener('change', () => {
        const selectedKeyword = keySelect.value;
        const year = yearSelect.value;
        renderRelationCards(selectedKeyword, year);
    });
}

// ================================
// 5️⃣ 히트맵 관련 함수들
// ================================
function renderCoKeywordHeatmap(targetKeyword) {
    const filtered = coKeywordData.filter(d => 
        d.Target_Keyword === targetKeyword
    );
    
    if (filtered.length === 0) {
        const tbody = document.getElementById("heatmap-body");
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">선택한 키워드의 데이터가 없습니다.</td></tr>';
        }
        return;
    }
    
    const yearData = {};
    filtered.forEach(row => {
        const year = row.YEAR;
        const coKeyword = row.CoKeyword;
        const count = row.Count;
        
        if (!yearData[year]) yearData[year] = {};
        if (!yearData[year][coKeyword]) yearData[year][coKeyword] = 0;
        yearData[year][coKeyword] += count;
    });
    
    const allCoKeywords = new Set();
    Object.values(yearData).forEach(yearObj => {
        Object.keys(yearObj).forEach(cok => allCoKeywords.add(cok));
    });
    
    const coKeywordList = Array.from(allCoKeywords).sort((a, b) => {
        const countA = yearData[2025]?.[a] || 0;
        const countB = yearData[2025]?.[b] || 0;
        return countB - countA;
    }).slice(0, 15);
    
    const keywordDataForHeatmap = {};
    coKeywordList.forEach(cok => {
        keywordDataForHeatmap[cok] = {
            "2021": yearData[2021]?.[cok] || 0,
            "2022": yearData[2022]?.[cok] || 0,
            "2023": yearData[2023]?.[cok] || 0,
            "2024": yearData[2024]?.[cok] || 0,
            "2025": yearData[2025]?.[cok] || 0
        };
    });
    
    currentKeywordData = keywordDataForHeatmap;
    
    const keywordTypeMap = {};
    const keywordBadgeMap = {};
    
    coKeywordList.forEach(cok => {
        const data = keywordDataForHeatmap[cok];
        const hasEarly = data["2021"] > 0 || data["2022"] > 0;
        const hasMid   = data["2023"] > 0;
        const has2024  = data["2024"] > 0;
        const has2025  = data["2025"] > 0;
        const hasLate  = has2024 || has2025;
        const noLate   = !has2024 && !has2025;
        const only2025 =
            has2025 &&
            !has2024 &&
            data["2021"] === 0 &&
            data["2022"] === 0 &&
            data["2023"] === 0;
        const activeYears = ["2021","2022","2023","2024","2025"]
            .filter(y => data[y] > 0).length;
        const hotStreak = data["2023"] > 0 && has2024 && has2025;
        
        if (hotStreak) {
            keywordTypeMap[cok] = "hot";
            keywordBadgeMap[cok] = "hot";
        }
        else if (activeYears >= 4) {
            keywordTypeMap[cok] = "core";
            keywordBadgeMap[cok] = "";
        }
        else if (hasEarly && noLate) {
            keywordTypeMap[cok] = "fading";
            keywordBadgeMap[cok] = "old";
        }
        else if (!hasEarly && !hasMid && hasLate) {
            keywordTypeMap[cok] = "emerging";
            keywordBadgeMap[cok] = only2025 ? "new" : "";
        }
        else if (hasEarly && !hasMid && hasLate) {
            keywordTypeMap[cok] = "comeback";
            keywordBadgeMap[cok] = "hot";
        }
        else if (activeYears >= 3) {
            keywordTypeMap[cok] = "core";
            keywordBadgeMap[cok] = "";
        }
        else {
            keywordTypeMap[cok] = "";
            keywordBadgeMap[cok] = "";
        }
    });
    
    renderHeatmapTable(keywordDataForHeatmap, keywordTypeMap, keywordBadgeMap);
}

function renderHeatmapTable(keywordData, keywordType, keywordBadge) {
    const tbody = document.getElementById("heatmap-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    Object.keys(keywordData).forEach(keyword => {
        const tr = document.createElement("tr");
        tr.classList.add("kw-row");
        tr.dataset.keyword = keyword;

        const tdName = document.createElement("td");
        tdName.className = "kw-name";
        tdName.textContent = keyword;
        tr.appendChild(tdName);

        ["2021","2022","2023","2024","2025"].forEach(year => {
            const td = document.createElement("td");
            const val = keywordData[keyword][year];
            
            if (val > 0) {
                td.textContent = val;
                td.className = getLevel(val);
                
                if (keywordBadge[keyword] && year === "2025") {
                    const span = document.createElement("span");
                    span.className = `badge ${keywordBadge[keyword]}`;
                    span.textContent = keywordBadge[keyword].toUpperCase();
                    td.appendChild(document.createTextNode(" "));
                    td.appendChild(span);
                }
            } else {
                td.className = "level-0";
            }
            tr.appendChild(td);
        });

        const tdType = document.createElement("td");
        tdType.innerHTML = `<span class="type ${keywordType[keyword]}">${keywordType[keyword]}</span>`;
        tr.appendChild(tdType);

        tbody.appendChild(tr);
    });
    
    bindHeatmapHoverEvents();
}

function getLevel(value) {
    if (value === 0) return "level-0";
    if (value < 10) return "level-1";
    if (value < 20) return "level-2";
    if (value < 30) return "level-3";
    if (value < 40) return "level-4";
    return "level-5";
}

function bindHeatmapHoverEvents() {
    const hoverChart = document.getElementById('hover-linechart');
    const chartTitle = document.getElementById('hover-chart-title');
    const chartContent = document.getElementById('hover-chart-content');
    
    document.querySelectorAll(".kw-row").forEach(row => {
        row.addEventListener("mouseenter", () => {
            const key = row.dataset.keyword;
            const years = ["2021","2022","2023","2024","2025"];
            const values = years.map(y => {
                const v = currentKeywordData[key][y];
                return v > 0 ? v : 0;
            });

            const hoverText = years.map(y => {
                const v = currentKeywordData[key][y];
                return v > 0 ? `${y}: ${v}건` : `${y}: TOP10 없음`;
            });

            chartTitle.textContent = `"${key}" 연도별 변화`;
            
            Plotly.newPlot(chartContent, [{
                x: years,
                y: values,
                text: hoverText,
                hoverinfo: 'text',
                mode: "lines+markers",
                line: {shape: "linear", color:"#007aff", width: 3},
                marker: {size: 10, color:"#007aff"},
                fill: 'tozeroy',
                fillcolor: 'rgba(0, 122, 255, 0.1)'
            }], {
                yaxis: {
                    title: { text: "빈도 (건)", font: { size: 12, family: 'Pretendard, sans-serif' } },
                    gridcolor: '#e0e0e0'
                },
                xaxis: {
                    title: { text: "연도", font: { size: 12, family: 'Pretendard, sans-serif' } },
                    gridcolor: '#e0e0e0'
                },
                margin: { t:20, l:50, r:20, b:40 },
                font: {family: 'Pretendard, sans-serif', size: 11},
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white',
                showlegend: false
            }, {
                responsive: true, 
                displayModeBar: false
            });
            
            hoverChart.classList.add('active');
        });
        
        row.addEventListener("mouseleave", () => {
            hoverChart.classList.remove('active');
        });
    });
    
    if (hoverChart) {
        hoverChart.addEventListener("mouseleave", () => {
            hoverChart.classList.remove('active');
        });
        
        hoverChart.addEventListener("mouseenter", () => {
            hoverChart.classList.add('active');
        });
    }
}

// ================================
// 6️⃣ 클러스터 맵 기능
// ================================
const categoryColors = {
    'tech': '#4285F4',
    'policy': '#34A853',
    'society': '#9C27B0',
    'environment': '#FF9800',
    'economy': '#FBC02D'
};

// 색상 팔레트 (연도별 추이 차트용)
const trendColors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
];

fetch('data/cluster_trends.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        clusterData = data.clusters;
        console.log('✅ 클러스터 데이터 로드:', clusterData.length, '개');
        
        renderClusterBubbleChart();
        renderLinkedClusters('artificial intelligence');
    })
    .catch(error => {
        console.error('❌ cluster_trends.json 로드 실패:', error);
        const chartDiv = document.getElementById('cluster-bubble-chart');
        if (chartDiv) {
            chartDiv.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #999;">
                    <h3>⚠️ 클러스터 데이터 로드 실패</h3>
                    <p>cluster_trends.json 파일을 확인해주세요.</p>
                    <p style="font-size: 12px; color: #ccc;">Error: ${error.message}</p>
                </div>
            `;
        }
    });

function renderClusterBubbleChart(filterCategory = 'all') {
    if (!clusterData || clusterData.length === 0) {
        console.error('❌ 클러스터 데이터가 없습니다');
        return;
    }
    
    const filteredData = filterCategory === 'all' 
        ? clusterData 
        : clusterData.filter(c => c.category === filterCategory);
    
    const traces = Object.keys(categoryColors).map(cat => {
        const catData = filteredData.filter(c => c.category === cat);
        
        if (catData.length === 0) return null;
        
        return {
            x: catData.map(c => c.avgFreq || 0),
            y: catData.map(c => c.growthRate || 0),
            mode: 'markers',
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            marker: {
                size: catData.map(c => {
                    const baseSize = Math.sqrt(c.total2025 || 1);
                    return Math.min(Math.max(baseSize * 2, 10), 80);
                }),
                color: categoryColors[cat],
                opacity: 0.7,
                line: {
                    color: categoryColors[cat],
                    width: 2
                },
                sizemode: 'diameter'
            },
            text: catData.map(c => 
                `<b>${c.label}</b><br>` +
                `📊 2025 빈도: ${c.total2025 || 0}건<br>` +
                `📈 성장률: ${(c.growthRate || 0).toFixed(2)}%<br>` +
                `📉 평균 빈도: ${(c.avgFreq || 0).toFixed(1)}건<br>` +
                `🔗 연결 키워드: ${c.linkedMainKeywords ? c.linkedMainKeywords.join(', ') : '없음'}`
            ),
            hoverinfo: 'text',
            customdata: catData.map(c => c.clusterId)
        };
    }).filter(trace => trace !== null);
    
    if (traces.length === 0) {
        console.error('❌ 렌더링할 데이터가 없습니다');
        return;
    }
    
    const layout = {
        title: {
            text: '🧩 클러스터 포지셔닝 맵 (버블 크기 = 2025년 연구 빈도)',
            font: { size: 18, family: 'Pretendard, sans-serif', color: '#333' }
        },
        xaxis: {
            title: {
                text: '평균 연구 빈도 (2023-2025) →',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            zeroline: true,
            zerolinecolor: '#d1d5db',
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        yaxis: {
            title: {
                text: '↑ 성장률 (%)',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            zeroline: true,
            zerolinecolor: '#9ca3af',
            zerolinewidth: 2,
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.15,
            x: 0.5,
            xanchor: 'center',
            font: { size: 13, family: 'Pretendard, sans-serif' }
        },
        margin: { t: 80, l: 70, r: 50, b: 100 },
        height: 700,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
        font: { family: 'Pretendard, sans-serif' }
    };
    
    Plotly.newPlot('cluster-bubble-chart', traces, layout, { responsive: true });
    
    const chartDiv = document.getElementById('cluster-bubble-chart');
    if (chartDiv) {
        chartDiv.on('plotly_click', function(data) {
            const clusterId = data.points[0].customdata;
            const cluster = clusterData.find(c => c.clusterId === clusterId);
            if (cluster) {
                showClusterPopup(cluster);
            }
        });
    }
}

function showClusterPopup(cluster) {
    const popup = document.getElementById('keyword-popup');
    const title = document.getElementById('popup-title');
    const details = document.getElementById('popup-details');
    
    title.innerHTML = `🧩 ${cluster.label}`;
    details.innerHTML = `
        <p><strong>카테고리:</strong> ${cluster.category}</p>
        <p><strong>성장률:</strong> ${cluster.growthRate ? cluster.growthRate.toFixed(2) : 0}%</p>
        <p><strong>2025년 빈도:</strong> ${cluster.total2025 || 0}</p>
        <p><strong>키워드:</strong> ${cluster.keywords ? cluster.keywords.slice(0, 5).join(', ') : '없음'}</p>
        <p><strong>연결된 메인 키워드:</strong> ${cluster.linkedMainKeywords ? cluster.linkedMainKeywords.join(', ') : '없음'}</p>
        <hr>
        <p><strong>연도별 추이:</strong></p>
        <ul style="list-style: none; padding: 0;">
            <li>2021: ${cluster.yearlyFreq ? cluster.yearlyFreq['2021'] || 0 : 0}</li>
            <li>2022: ${cluster.yearlyFreq ? cluster.yearlyFreq['2022'] || 0 : 0}</li>
            <li>2023: ${cluster.yearlyFreq ? cluster.yearlyFreq['2023'] || 0 : 0}</li>
            <li>2024: ${cluster.yearlyFreq ? cluster.yearlyFreq['2024'] || 0 : 0}</li>
            <li>2025: ${cluster.yearlyFreq ? cluster.yearlyFreq['2025'] || 0 : 0}</li>
        </ul>
    `;
    
    popup.style.display = 'flex';
}

document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('keyword-popup').style.display = 'none';
});

document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const category = btn.dataset.category;
        renderClusterBubbleChart(category);
    });
});

// ================================
// 7️⃣ 메인 키워드 × 클러스터 연결도
// ================================
function renderLinkedClusters(mainKeyword) {
    const linkedClusters = clusterData.filter(c => 
        c.linkedMainKeywords && c.linkedMainKeywords.includes(mainKeyword)
    );
    
    const grid = document.getElementById('linked-clusters-grid');
    grid.innerHTML = '';
    
    if (linkedClusters.length === 0) {
        grid.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">연결된 클러스터가 없습니다.</p>';
        return;
    }
    
    linkedClusters.forEach(cluster => {
        const card = document.createElement('div');
        card.className = 'cluster-card';
        card.style.borderLeft = `4px solid ${categoryColors[cluster.category] || '#999'}`;
        
        const growthIcon = (cluster.growthRate || 0) > 0 ? '📈' : '📉';
        const growthClass = (cluster.growthRate || 0) > 0 ? 'growth-up' : 'growth-down';
        
        card.innerHTML = `
            <div class="cluster-card-header">
                <span class="cluster-id">#${cluster.clusterId}</span>
                <span class="cluster-category">${cluster.category}</span>
            </div>
            <h4>${cluster.label}</h4>
            <div class="cluster-stats">
                <div class="stat-item">
                    <span class="stat-label">2025 빈도</span>
                    <span class="stat-value">${cluster.total2025 || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">성장률</span>
                    <span class="stat-value ${growthClass}">${growthIcon} ${cluster.growthRate ? cluster.growthRate.toFixed(2) : 0}%</span>
                </div>
            </div>
            <div class="cluster-keywords">
                ${cluster.keywords ? cluster.keywords.slice(0, 3).map(k => `<span class="kw-tag">${k}</span>`).join('') : ''}
            </div>
        `;
        
        card.addEventListener('click', () => {
            renderClusterTrendChart(linkedClusters);
        });
        
        grid.appendChild(card);
    });
    
    renderClusterTrendChart(linkedClusters);
}

// ✨ 개선된 클러스터 추이 차트 (색상 구분 + 연도 정수 표시)
function renderClusterTrendChart(clusters) {
    const years = [2021, 2022, 2023, 2024, 2025]; // 정수로 변경
    
    const traces = clusters.map((cluster, index) => ({
        x: years,
        y: years.map(y => cluster.yearlyFreq ? (cluster.yearlyFreq[y.toString()] || 0) : 0),
        name: cluster.label,
        mode: 'lines+markers',
        line: {
            width: 3,
            color: trendColors[index % trendColors.length] // 색상 순환
        },
        marker: { 
            size: 8,
            color: trendColors[index % trendColors.length]
        }
    }));
    
    const layout = {
        title: {
            text: '연결된 클러스터 연도별 추이',
            font: { size: 18, family: 'Pretendard, sans-serif', weight: 600, color: '#333' }
        },
        xaxis: {
            title: {
                text: '연도',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            tickmode: 'linear',
            tick0: 2021,
            dtick: 1,
            tickformat: 'd', // 정수로 표시
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        yaxis: {
            title: {
                text: '연구 빈도',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        hovermode: 'x unified',
        margin: { t: 70, l: 70, r: 30, b: 80 },
        height: 500,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
        font: { family: 'Pretendard, sans-serif' },
        legend: {
            orientation: 'h',
            y: -0.25,
            x: 0.5,
            xanchor: 'center',
            font: { size: 12, family: 'Pretendard, sans-serif' }
        }
    };
    
    Plotly.newPlot('cluster-trend-chart', traces, layout, { responsive: true });
}

document.getElementById('main-keyword-select')?.addEventListener('change', (e) => {
    renderLinkedClusters(e.target.value);
});

// ================================
// 8️⃣ 분야 확산 기능
// ================================
fetch('data/field_diffusion.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        fieldDiffusionData = data.clusters;
        console.log('✅ 분야 확산 데이터 로드:', fieldDiffusionData.length, '개 클러스터');
        
        populateDiffusionClusterSelect();
        
        if (fieldDiffusionData.length > 0) {
            const firstClusterId = fieldDiffusionData[0].clusterId;
            renderDiffusionVisualizations(firstClusterId);
        }
    })
    .catch(error => {
        console.error('❌ field_diffusion.json 로드 실패:', error);
        const sankeyDiv = document.getElementById('diffusion-sankey');
        if (sankeyDiv) {
            sankeyDiv.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #999;">
                    <h3>⚠️ 분야 확산 데이터 로드 실패</h3>
                    <p>field_diffusion.json 파일을 확인해주세요.</p>
                </div>
            `;
        }
    });

function populateDiffusionClusterSelect() {
    const select = document.getElementById('diffusion-cluster-select');
    if (!select) return;
    
    select.innerHTML = '';
    
    fieldDiffusionData.forEach(cluster => {
        const clusterInfo = clusterData.find(c => c.clusterId === cluster.clusterId);
        const label = clusterInfo ? clusterInfo.label : `Cluster ${cluster.clusterId}`;
        
        const option = document.createElement('option');
        option.value = cluster.clusterId;
        option.textContent = `${label} (ID: ${cluster.clusterId})`;
        select.appendChild(option);
    });
    
    select.addEventListener('change', (e) => {
        renderDiffusionVisualizations(parseInt(e.target.value));
    });
}

function renderDiffusionVisualizations(clusterId) {
    const cluster = fieldDiffusionData.find(c => c.clusterId === clusterId);
    if (!cluster) {
        console.error('클러스터를 찾을 수 없습니다:', clusterId);
        return;
    }
    
    renderFieldSankeyDiagram(cluster);
    renderFieldDistributionChart(cluster);
    renderDiversityChart(cluster);
}

// ✨ 개선된 Sankey Diagram
function renderFieldSankeyDiagram(cluster) {
    const years = [2021, 2022, 2023, 2024, 2025]; // 정수로 변경
    
    const nodes = [];
    const nodeMap = new Map();
    
    years.forEach(year => {
        const yearData = cluster.years[year.toString()];
        if (!yearData) return;
        
        Object.keys(yearData.fields).forEach(field => {
            const key = `${year}-${field}`;
            if (!nodeMap.has(key)) {
                const index = nodes.length;
                nodeMap.set(key, index);
                nodes.push({
                    label: `${field}\n(${year})`,
                    color: getFieldColor(field)
                });
            }
        });
    });
    
    const links = [];
    
    for (let i = 0; i < years.length - 1; i++) {
        const currentYear = years[i].toString();
        const nextYear = years[i + 1].toString();
        
        const currentData = cluster.years[currentYear];
        const nextData = cluster.years[nextYear];
        
        if (!currentData || !nextData) continue;
        
        currentData.transitions.forEach(trans => {
            const sourceKey = `${currentYear}-${trans.from}`;
            const targetKey = `${nextYear}-${trans.to}`;
            
            if (nodeMap.has(sourceKey) && nodeMap.has(targetKey)) {
                links.push({
                    source: nodeMap.get(sourceKey),
                    target: nodeMap.get(targetKey),
                    value: trans.count,
                    color: 'rgba(0, 122, 255, 0.3)'
                });
            }
        });
    }
    
    const data = [{
        type: 'sankey',
        orientation: 'h',
        node: {
            pad: 15,
            thickness: 20,
            line: {
                color: 'white',
                width: 2
            },
            label: nodes.map(n => n.label),
            color: nodes.map(n => n.color)
        },
        link: {
            source: links.map(l => l.source),
            target: links.map(l => l.target),
            value: links.map(l => l.value),
            color: links.map(l => l.color)
        }
    }];
    
    const layout = {
        title: {
            text: `분야 확산 흐름 (2021→2025)`,
            font: { size: 18, family: 'Pretendard, sans-serif', weight: 600, color: '#333' }
        },
        font: {
            family: 'Pretendard, sans-serif',
            size: 12
        },
        margin: { t: 70, l: 20, r: 20, b: 20 },
        height: 650,
        paper_bgcolor: '#fafafa'
    };
    
    Plotly.newPlot('diffusion-sankey', data, layout, { responsive: true });
}

// ✨ 개선된 분야 분포 차트
function renderFieldDistributionChart(cluster) {
    const years = [2021, 2022, 2023, 2024, 2025]; // 정수로 변경
    
    const allFields = new Set();
    years.forEach(year => {
        const yearData = cluster.years[year.toString()];
        if (yearData) {
            Object.keys(yearData.fields).forEach(field => allFields.add(field));
        }
    });
    
    const traces = Array.from(allFields).map(field => {
        return {
            x: years,
            y: years.map(year => {
                const yearData = cluster.years[year.toString()];
                return yearData ? (yearData.fields[field] || 0) : 0;
            }),
            name: field,
            type: 'bar',
            marker: {
                color: getFieldColor(field)
            }
        };
    });
    
    const layout = {
        barmode: 'stack',
        title: {
            text: '연도별 분야 분포',
            font: { size: 18, family: 'Pretendard, sans-serif', weight: 600, color: '#333' }
        },
        xaxis: {
            title: {
                text: '연도',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            tickmode: 'linear',
            tick0: 2021,
            dtick: 1,
            tickformat: 'd', // 정수로 표시
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        yaxis: {
            title: {
                text: '연구 빈도',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        font: { family: 'Pretendard, sans-serif' },
        margin: { t: 70, l: 70, r: 30, b: 80 },
        height: 450,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.25,
            x: 0.5,
            xanchor: 'center',
            font: { size: 12, family: 'Pretendard, sans-serif' }
        }
    };
    
    Plotly.newPlot('field-distribution-chart', traces, layout, { responsive: true });
}

// ✨ 개선된 다양성 차트
function renderDiversityChart(cluster) {
    const years = [2021, 2022, 2023, 2024, 2025]; // 정수로 변경
    
    const diversityData = years.map(year => {
        const yearData = cluster.years[year.toString()];
        return yearData ? yearData.diversity : 0;
    });
    
    const trace = {
        x: years,
        y: diversityData,
        mode: 'lines+markers',
        line: {
            color: '#3b82f6',
            width: 3
        },
        marker: {
            size: 12,
            color: '#3b82f6'
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(59, 130, 246, 0.15)'
    };
    
    const layout = {
        title: {
            text: '분야 다양성 지수 (Entropy)',
            font: { size: 18, family: 'Pretendard, sans-serif', weight: 600, color: '#333' }
        },
        xaxis: {
            title: {
                text: '연도',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            tickmode: 'linear',
            tick0: 2021,
            dtick: 1,
            tickformat: 'd', // 정수로 표시
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        yaxis: {
            title: {
                text: 'Diversity (Entropy)',
                font: { size: 14, family: 'Pretendard, sans-serif' }
            },
            gridcolor: '#e5e7eb',
            tickfont: { family: 'Pretendard, sans-serif' }
        },
        font: { family: 'Pretendard, sans-serif' },
        margin: { t: 70, l: 70, r: 30, b: 70 },
        height: 350,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white'
    };
    
    Plotly.newPlot('diversity-chart', [trace], layout, { responsive: true });
}

function getFieldColor(field) {
    const colors = {
        '교육학': '#4285F4',
        '사회학': '#34A853',
        '경영학': '#FBBC04',
        '행정학': '#EA4335',
        '법학': '#9C27B0',
        '경제학': '#FF9800',
        '정치외교학': '#00BCD4',
        '신문방송학': '#E91E63',
        '심리학': '#3F51B5',
        '관광학': '#009688',
        '문헌정보학': '#795548',
        '군사학': '#607D8B',
        '지역개발': '#CDDC39',
        '복지학': '#FFC107'
    };
    
    return colors[field] || '#999999';
}