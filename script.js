// ================================
// 2026 연구 전략 내비게이터 JS
// ================================

// 전역 변수
let coKeywordData = []; // 연관어 데이터
let clusterData = []; // 클러스터 트렌드 데이터
let fieldDiffusionData = []; // 분야 확산 데이터

// 탭 전환
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        btn.classList.add('active');
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
        // 키워드 선택 SelectBox 생성
        populateKeywordSelect();
        // 초기 렌더링 (첫 키워드, 첫 연도)
        const firstKeyword = document.getElementById('key-select').value;
        const firstYear = document.getElementById('relation-year-select').value;
        renderRelationCards(firstKeyword, firstYear);
        
        // 🔥 히트맵 초기화 (coKeywordData 로드 후)
        renderCoKeywordHeatmap(firstKeyword);
    }
});

// ================================
// 2️⃣ 메인 키워드 CSV 로드 (매트릭스 & 리스트)
Papa.parse("2026년_키워드_성장률2(임계값0).csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        const data = results.data;
        const gList = document.getElementById('growth-list');
        const dList = document.getElementById('decline-list');
        const filterBtn = document.getElementById('keyword-filter-btn');
        const limitSlider = document.getElementById('keyword-limit-slider');
        const limitValue = document.getElementById('keyword-limit-value');
        const limitControl = document.getElementById('keyword-limit-control');

        const allowedKeywords = [
            "rights","covid-19","artificial intelligence","korea","protection",
            "tax","public","esg","legal","china","information","international",
            "job satisfaction","trust","labor","policy","regulation",
            "management","contract","digital"
        ];

        const fullData = data.filter(item => item.KYWD && item.Growth_rate !== 0);
        let filterOn = true;
        let keywordLimit = 50;

        // ================================
        // Plotly 산점도 렌더링 함수
        function renderScatterPlot(dataToRender){
            // 데이터 분류
            const filteredData = filterOn 
                ? dataToRender.filter(item => allowedKeywords.includes(item.KYWD))
                : dataToRender.slice(0, keywordLimit);
            
            const highlightData = filteredData.filter(item => allowedKeywords.includes(item.KYWD));
            const normalData = filteredData.filter(item => !allowedKeywords.includes(item.KYWD));
            
            const traces = [];
            
            // 일반 키워드 (회색)
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
                        color: '#999',
                        opacity: 0.6,
                        line: { width: 1, color: 'white' }
                    },
                    textposition: 'top center',
                    textfont: { size: 9, color: '#666' },
                    hovertemplate: '<b>%{text}</b><br>빈도: %{x}<br>성장률: %{y}%<extra></extra>'
                });
            }
            
            // 강조 키워드 (주황색)
            if (highlightData.length > 0) {
                traces.push({
                    x: highlightData.map(item => item.pred_freq_2026),
                    y: highlightData.map(item => item.Growth_rate),
                    text: highlightData.map(item => item.KYWD),
                    mode: 'markers+text',
                    type: 'scatter',
                    name: '주요 키워드',
                    marker: {
                        size: 12,
                        color: '#ff8c00',
                        opacity: 0.8,
                        line: { width: 2, color: 'white' }
                    },
                    textposition: 'top center',
                    textfont: { size: 10, color: '#ff8c00', family: 'Pretendard' },
                    hovertemplate: '<b>%{text}</b><br>빈도: %{x}<br>성장률: %{y}%<extra></extra>',
                    customdata: highlightData.map(item => item.KYWD)
                });
            }
            
            const layout = {
                title: {
                    text: '2026 키워드 포지셔닝 맵',
                    font: { size: 18, family: 'Pretendard' }
                },
                xaxis: {
                    title: '예측 빈도 (Frequency) →',
                    gridcolor: '#e0e0e0',
                    zeroline: true
                },
                yaxis: {
                    title: '↑ 성장률 (Growth Rate %)',
                    gridcolor: '#e0e0e0',
                    zeroline: true,
                    zerolinecolor: '#999',
                    zerolinewidth: 2
                },
                hovermode: 'closest',
                showlegend: true,
                legend: {
                    x: 1,
                    y: 1,
                    xanchor: 'right',
                    yanchor: 'top'
                },
                margin: { t: 60, l: 60, r: 100, b: 60 },
                height: 600,
                plot_bgcolor: '#fafafa',
                shapes: [
                    // 4분면 배경 (반투명)
                    {
                        type: 'rect',
                        xref: 'paper', yref: 'y',
                        x0: 0, y0: 0, x1: 0.5, y1: 100,
                        fillcolor: '#f0f7ff',
                        opacity: 0.3,
                        layer: 'below',
                        line: { width: 0 }
                    },
                    {
                        type: 'rect',
                        xref: 'paper', yref: 'y',
                        x0: 0.5, y0: 0, x1: 1, y1: 100,
                        fillcolor: '#fff5f5',
                        opacity: 0.3,
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
                        font: { size: 11, color: '#666' },
                        opacity: 0.6
                    },
                    {
                        text: '핵심 전략<br>(High Freq / High Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.75, y: 0.95,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#d63031' },
                        opacity: 0.6
                    },
                    {
                        text: '특화/정체<br>(Low Freq / Low Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.25, y: 0.05,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#666' },
                        opacity: 0.6
                    },
                    {
                        text: '성숙/유지<br>(High Freq / Low Growth)',
                        xref: 'paper', yref: 'paper',
                        x: 0.75, y: 0.05,
                        xanchor: 'center',
                        showarrow: false,
                        font: { size: 11, color: '#666' },
                        opacity: 0.6
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
            
            // 클릭 이벤트
            document.getElementById('matrix-scatter').on('plotly_click', function(data) {
                const keyword = data.points[0].text;
                console.log("클릭한 키워드:", keyword);
                
                // 연관어 탭으로 이동
                document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.getElementById('relation-tab').classList.add('active');
                document.querySelector('button[data-tab="relation-tab"]').classList.add('active');

                // SelectBox 선택
                const keySelect = document.getElementById('key-select');
                keySelect.value = keyword;
                const yearSelect = document.getElementById('relation-year-select');
                const selectedYear = yearSelect.value;
                renderRelationCards(keyword, selectedYear);
                renderCoKeywordHeatmap(keyword);
            });
            
            renderLists(filteredData);
        }

        // ================================
        // 리스트 렌더링 함수
        function renderLists(dataToRender){
            gList.innerHTML = '';
            dList.innerHTML = '';

            const growthData = dataToRender.filter(item => item.Growth_rate > 0)
                .sort((a,b) => b.Growth_rate - a.Growth_rate);
            const declineData = dataToRender.filter(item => item.Growth_rate < 0)
                .sort((a,b) => Math.abs(b.Growth_rate) - Math.abs(a.Growth_rate));

            growthData.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.KYWD}</span> <b>${item.Growth_rate}%</b>`;
                gList.appendChild(li);
            });
            declineData.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${item.KYWD}</span> <b>${item.Growth_rate}%</b>`;
                dList.appendChild(li);
            });
        }

        // ================================
        // 초기 렌더링
        renderScatterPlot(fullData);

        // 필터 토글
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

        // 슬라이더 이벤트
        limitSlider.addEventListener('input', (e) => {
            keywordLimit = parseInt(e.target.value);
            limitValue.textContent = keywordLimit;
            if (!filterOn) {
                renderScatterPlot(fullData);
            }
        });

        // 리스트 정렬 (토글 기능 추가)
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

                // 토글
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

                // 버튼 텍스트 업데이트
                const arrow = isDesc ? '↓' : '↑';
                if (type === 'value') btn.textContent = `성장률 ${arrow}`;
                else if (type === 'abs') btn.textContent = `쇠퇴율 ${arrow}`;
                else if (type === 'name') btn.textContent = `이름 ${arrow}`;
            });
        });

    } // 메인 CSV complete
});

// ================================
// 3️⃣ 연관어 TOP10 카드 렌더링
// ================================
function renderRelationCards(selectedKeyword, year) {
    const cardsContainer = document.getElementById('relation-cards');
    const selectedYear = +year;

    const filtered = coKeywordData.filter(d => d.Target_Keyword && d.Target_Keyword === selectedKeyword && d.YEAR === selectedYear);

    // Count 합계 계산
    const coMap = {};
    filtered.forEach(d => {
        if (!coMap[d.CoKeyword]) coMap[d.CoKeyword] = 0;
        coMap[d.CoKeyword] += d.Count;
    });

    // Top10
    const top10 = Object.entries(coMap)
        .map(([coKeyword, count]) => ({ coKeyword, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0,10);

    // 카드 생성
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

    // SelectBox 이벤트
    keySelect.addEventListener('change', () => {
        const selectedKeyword = keySelect.value;
        const year = document.getElementById('relation-year-select').value;
        renderRelationCards(selectedKeyword, year);
        
        // 🔥 히트맵도 업데이트
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

// 연관어 히트맵 렌더링 함수
function renderCoKeywordHeatmap(targetKeyword) {
    // coKeywordData에서 해당 Target_Keyword 필터링
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
    
    // 연도별 CoKeyword 데이터 구조화 (2021-2025)
    const yearData = {};
    filtered.forEach(row => {
        const year = row.YEAR;
        const coKeyword = row.CoKeyword;
        const count = row.Count;
        
        if (!yearData[year]) yearData[year] = {};
        if (!yearData[year][coKeyword]) yearData[year][coKeyword] = 0;
        yearData[year][coKeyword] += count;
    });
    
    // 전체 CoKeyword 수집 (모든 연도 통합)
    const allCoKeywords = new Set();
    Object.values(yearData).forEach(yearObj => {
        Object.keys(yearObj).forEach(cok => allCoKeywords.add(cok));
    });
    
    // CoKeyword를 2025년 기준 빈도순으로 정렬
    const coKeywordList = Array.from(allCoKeywords).sort((a, b) => {
        const countA = yearData[2025]?.[a] || 0;
        const countB = yearData[2025]?.[b] || 0;
        return countB - countA;
    }).slice(0, 15); // 상위 15개만
    
    // 키워드별 데이터 객체 생성
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
    
    // 키워드 유형 판별
    const keywordTypeMap = {};
    const keywordBadgeMap = {};
    
    coKeywordList.forEach(cok => {
        const data = keywordDataForHeatmap[cok];
        const hasEarly = data["2021"] > 0 || data["2022"] > 0;
        const hasMid = data["2023"] > 0;
        const hasLate = data["2024"] > 0 || data["2025"] > 0;
        const only2025 = data["2025"] > 0 && data["2021"] === 0 && data["2022"] === 0 && data["2023"] === 0 && data["2024"] === 0;
        
        // 유형 판별
        if (only2025) {
            keywordTypeMap[cok] = "emerging";
            keywordBadgeMap[cok] = "new";
        } else if (!hasEarly && !hasMid && hasLate) {
            keywordTypeMap[cok] = "emerging";
            keywordBadgeMap[cok] = "new";
        } else if (hasEarly && !hasMid && hasLate) {
            keywordTypeMap[cok] = "comeback";
            keywordBadgeMap[cok] = "hot";
        } else if (hasEarly && hasMid && hasLate) {
            keywordTypeMap[cok] = "core";
            keywordBadgeMap[cok] = "";
        } else {
            keywordTypeMap[cok] = "core";
            keywordBadgeMap[cok] = "";
        }
    });
    
    // 히트맵 테이블 렌더링
    renderHeatmapTable(keywordDataForHeatmap, keywordTypeMap, keywordBadgeMap);
}

// 히트맵 테이블 렌더링
function renderHeatmapTable(keywordData, keywordType, keywordBadge) {
    const tbody = document.getElementById("heatmap-body");
    if (!tbody) return;
    
    tbody.innerHTML = "";

    Object.keys(keywordData).forEach(keyword => {
        const tr = document.createElement("tr");
        tr.classList.add("kw-row");
        tr.dataset.keyword = keyword;

        // 키워드 이름
        const tdName = document.createElement("td");
        tdName.className = "kw-name";
        tdName.textContent = keyword;
        tr.appendChild(tdName);

        // 연도별 셀 (2021-2025)
        ["2021","2022","2023","2024","2025"].forEach(year => {
            const td = document.createElement("td");
            const val = keywordData[keyword][year];
            
            if (val > 0) {
                td.textContent = val;
                td.className = getLevel(val);
                
                // 2025년에 배지 추가
                if (keywordBadge[keyword] && year === "2025") {
                    const span = document.createElement("span");
                    span.className = `badge ${keywordBadge[keyword]}`;
                    span.textContent = keywordBadge[keyword].toUpperCase();
                    td.appendChild(document.createTextNode(" "));
                    td.appendChild(span);
                }
            } else {
                td.className = "level-0"; // 빈 셀
            }
            tr.appendChild(td);
        });

        // 유형 셀
        const tdType = document.createElement("td");
        tdType.innerHTML = `<span class="type ${keywordType[keyword]}">${keywordType[keyword]}</span>`;
        tr.appendChild(tdType);

        tbody.appendChild(tr);
    });
    
    // 클릭 이벤트 바인딩
    bindHeatmapClickEvents(keywordData);
}

// 색상 레벨 계산
function getLevel(value) {
    if (value === 0) return "level-0";
    if (value < 10) return "level-1";
    if (value < 20) return "level-2";
    if (value < 30) return "level-3";
    if (value < 40) return "level-4";
    return "level-5";
}

// 히트맵 클릭 이벤트 (라인차트)
function bindHeatmapClickEvents(keywordData) {
    document.querySelectorAll(".kw-row").forEach(row => {
        row.addEventListener("click", () => {
            const key = row.dataset.keyword;
            const years = ["2021","2022","2023","2024","2025"];
            const values = years.map(y => {
                const v = keywordData[key][y];
                return v > 0 ? v : 0;
            });

            const hoverText = years.map(y => {
                const v = keywordData[key][y];
                return v > 0 ? `${y}: ${v}건` : `${y}: TOP10 없음`;
            });

            Plotly.newPlot("linechart", [{
                x: years,
                y: values,
                text: hoverText,
                hoverinfo: 'text',
                mode: "lines+markers",
                line: {shape: "linear", color:"#007aff", width: 3},
                marker: {size: 10, color:"#007aff"}
            }], {
                title: {
                    text: `"${key}" 연관어 연도별 빈도 변화`,
                    font: { family: 'Pretendard, sans-serif', size: 16, color: '#333' }
                },
                yaxis: {
                    title: { text: "빈도수 (건)", font: { size: 14 } },
                    gridcolor: '#e0e0e0'
                },
                xaxis: {
                    title: { text: "연도", font: { size: 14 } },
                    gridcolor: '#e0e0e0'
                },
                margin: { t:80, l:60, r:30, b:60 },
                font: {family: 'Pretendard, sans-serif'},
                plot_bgcolor: '#fafafa',
                paper_bgcolor: 'white'
            }, {responsive: true});
        });
    });
}

// ================================
// 6️⃣ 클러스터 맵 기능
// ================================

// 클러스터 데이터 로드
fetch('cluster_trends.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        clusterData = data.clusters;
        console.log('✅ 클러스터 데이터 로드:', clusterData.length, '개');
        
        // 초기 버블 차트 렌더링
        renderClusterBubbleChart();
        
        // 메인 키워드 연결도 초기화
        renderLinkedClusters('artificial intelligence');
    })
    .catch(error => {
        console.error('❌ cluster_trends.json 로드 실패:', error);
        // 에러 메시지를 화면에 표시
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

// 카테고리별 색상 매핑
const categoryColors = {
    'tech': '#4285F4',       // 파란색
    'policy': '#34A853',     // 초록색
    'society': '#9C27B0',    // 보라색
    'environment': '#FF9800', // 주황색
    'economy': '#FBC02D'     // 노란색
};

// 버블 차트 렌더링 (수정 버전)
function renderClusterBubbleChart(filterCategory = 'all') {
    if (!clusterData || clusterData.length === 0) {
        console.error('❌ 클러스터 데이터가 없습니다');
        return;
    }
    
    const filteredData = filterCategory === 'all' 
        ? clusterData 
        : clusterData.filter(c => c.category === filterCategory);
    
    console.log('📊 필터링된 데이터 개수:', filteredData.length);
    
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
                    // 버블 크기 계산: 2025년 빈도에 비례, 최소 10 ~ 최대 80
                    const baseSize = Math.sqrt(c.total2025 || 1);
                    return Math.min(Math.max(baseSize * 2, 10), 80);
                }),
                color: categoryColors[cat],
                opacity: 0.6,
                line: {
                    color: categoryColors[cat],
                    width: 3
                },
                sizemode: 'diameter' // 지름 기준으로 크기 설정
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
            font: { size: 18, family: 'Pretendard', color: '#333' }
        },
        xaxis: {
            title: {
                text: '평균 연구 빈도 (2023-2025) →',
                font: { size: 14 }
            },
            gridcolor: '#e0e0e0',
            zeroline: true,
            zerolinecolor: '#ccc'
        },
        yaxis: {
            title: {
                text: '↑ 성장률 (%)',
                font: { size: 14 }
            },
            gridcolor: '#e0e0e0',
            zeroline: true,
            zerolinecolor: '#999',
            zerolinewidth: 2
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.15,
            x: 0.5,
            xanchor: 'center',
            font: { size: 13 }
        },
        margin: { t: 100, l: 80, r: 50, b: 100 },
        height: 650,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
        annotations: [
            {
                text: '💡 버블이 클수록 2025년 연구 빈도가 높습니다',
                xref: 'paper',
                yref: 'paper',
                x: 0.5,
                y: 1.08,
                xanchor: 'center',
                yanchor: 'bottom',
                showarrow: false,
                font: { size: 12, color: '#666' }
            }
        ]
    };
    
    Plotly.newPlot('cluster-bubble-chart', traces, layout, { responsive: true })
        .then(() => {
            console.log('✅ 클러스터 버블 차트 렌더링 완료');
        })
        .catch(err => {
            console.error('❌ Plotly 렌더링 에러:', err);
        });
    
    // 클릭 이벤트
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

// 클러스터 팝업 표시
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

// 팝업 닫기
document.getElementById('popup-close').addEventListener('click', () => {
    document.getElementById('keyword-popup').style.display = 'none';
});

// 카테고리 필터 이벤트
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

// 메인 키워드별 연결된 클러스터 렌더링
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
    
    // 자동으로 추이 차트 렌더링
    renderClusterTrendChart(linkedClusters);
}

// 클러스터별 성장 추이 차트
function renderClusterTrendChart(clusters) {
    const years = ['2021', '2022', '2023', '2024', '2025'];
    
    const traces = clusters.map(cluster => ({
        x: years,
        y: years.map(y => cluster.yearlyFreq ? (cluster.yearlyFreq[y] || 0) : 0),
        name: cluster.label,
        mode: 'lines+markers',
        line: {
            width: 3,
            color: categoryColors[cluster.category] || '#999'
        },
        marker: { size: 8 }
    }));
    
    const layout = {
        title: {
            text: '연결된 클러스터 연도별 추이',
            font: { size: 16, family: 'Pretendard' }
        },
        xaxis: {
            title: '연도',
            gridcolor: '#e0e0e0'
        },
        yaxis: {
            title: '연구 빈도',
            gridcolor: '#e0e0e0'
        },
        hovermode: 'x unified',
        margin: { t: 60, l: 60, r: 30, b: 60 },
        height: 400,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white',
        legend: {
            orientation: 'h',
            y: -0.3
        }
    };
    
    Plotly.newPlot('cluster-trend-chart', traces, layout, { responsive: true });
}

// 메인 키워드 선택 이벤트
document.getElementById('main-keyword-select')?.addEventListener('change', (e) => {
    renderLinkedClusters(e.target.value);
});

// ================================
// 8️⃣ 분야 확산 기능
// ================================

// 분야 확산 데이터 로드
fetch('field_diffusion.json')
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        fieldDiffusionData = data.clusters;
        console.log('✅ 분야 확산 데이터 로드:', fieldDiffusionData.length, '개 클러스터');
        
        // 클러스터 선택 드롭다운 초기화
        populateDiffusionClusterSelect();
        
        // 초기 렌더링
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

// 클러스터 선택 드롭다운 채우기
function populateDiffusionClusterSelect() {
    const select = document.getElementById('diffusion-cluster-select');
    if (!select) return;
    
    select.innerHTML = '';
    
    // cluster_trends.json과 매칭해서 라벨 표시
    fieldDiffusionData.forEach(cluster => {
        const clusterInfo = clusterData.find(c => c.clusterId === cluster.clusterId);
        const label = clusterInfo ? clusterInfo.label : `Cluster ${cluster.clusterId}`;
        
        const option = document.createElement('option');
        option.value = cluster.clusterId;
        option.textContent = `${label} (ID: ${cluster.clusterId})`;
        select.appendChild(option);
    });
    
    // 선택 이벤트
    select.addEventListener('change', (e) => {
        renderDiffusionVisualizations(parseInt(e.target.value));
    });
}

// 분야 확산 시각화 렌더링
function renderDiffusionVisualizations(clusterId) {
    const cluster = fieldDiffusionData.find(c => c.clusterId === clusterId);
    if (!cluster) {
        console.error('클러스터를 찾을 수 없습니다:', clusterId);
        return;
    }
    
    console.log('📊 분야 확산 렌더링:', clusterId, cluster);
    
    // 1. Sankey Diagram 렌더링
    renderFieldSankeyDiagram(cluster);
    
    // 2. 분야 분포 차트 렌더링
    renderFieldDistributionChart(cluster);
    
    // 3. 다양성 지수 차트 렌더링
    renderDiversityChart(cluster);
}

// Sankey Diagram 렌더링 (연도별 분야 이동)
function renderFieldSankeyDiagram(cluster) {
    const years = ['2021', '2022', '2023', '2024', '2025'];
    
    // 노드 생성 (연도별 분야)
    const nodes = [];
    const nodeMap = new Map(); // "연도-분야" → 노드 인덱스
    
    years.forEach(year => {
        const yearData = cluster.years[year];
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
    
    // 링크 생성 (연도 간 분야 이동)
    const links = [];
    
    for (let i = 0; i < years.length - 1; i++) {
        const currentYear = years[i];
        const nextYear = years[i + 1];
        
        const currentData = cluster.years[currentYear];
        const nextData = cluster.years[nextYear];
        
        if (!currentData || !nextData) continue;
        
        // transitions 데이터 사용
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
    
    // Plotly Sankey
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
            font: { size: 16, family: 'Pretendard' }
        },
        font: {
            family: 'Pretendard',
            size: 12
        },
        margin: { t: 60, l: 20, r: 20, b: 20 },
        height: 600
    };
    
    Plotly.newPlot('diffusion-sankey', data, layout, { responsive: true });
}

// 분야 분포 차트 (연도별 stacked bar)
function renderFieldDistributionChart(cluster) {
    const years = ['2021', '2022', '2023', '2024', '2025'];
    
    // 모든 분야 수집
    const allFields = new Set();
    years.forEach(year => {
        const yearData = cluster.years[year];
        if (yearData) {
            Object.keys(yearData.fields).forEach(field => allFields.add(field));
        }
    });
    
    // 트레이스 생성 (각 분야별)
    const traces = Array.from(allFields).map(field => {
        return {
            x: years,
            y: years.map(year => {
                const yearData = cluster.years[year];
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
            font: { size: 16, family: 'Pretendard' }
        },
        xaxis: {
            title: '연도',
            gridcolor: '#e0e0e0'
        },
        yaxis: {
            title: '연구 빈도',
            gridcolor: '#e0e0e0'
        },
        font: { family: 'Pretendard' },
        margin: { t: 60, l: 60, r: 30, b: 60 },
        height: 400,
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        }
    };
    
    Plotly.newPlot('field-distribution-chart', traces, layout, { responsive: true });
}

// 다양성 지수 차트
function renderDiversityChart(cluster) {
    const years = ['2021', '2022', '2023', '2024', '2025'];
    
    const diversityData = years.map(year => {
        const yearData = cluster.years[year];
        return yearData ? yearData.diversity : 0;
    });
    
    const trace = {
        x: years,
        y: diversityData,
        mode: 'lines+markers',
        line: {
            color: '#007aff',
            width: 3
        },
        marker: {
            size: 10,
            color: '#007aff'
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(0, 122, 255, 0.1)'
    };
    
    const layout = {
        title: {
            text: '분야 다양성 지수 (Entropy)',
            font: { size: 16, family: 'Pretendard' }
        },
        xaxis: {
            title: '연도',
            gridcolor: '#e0e0e0'
        },
        yaxis: {
            title: 'Diversity (Entropy)',
            gridcolor: '#e0e0e0'
        },
        font: { family: 'Pretendard' },
        margin: { t: 60, l: 60, r: 30, b: 60 },
        height: 300
    };
    
    Plotly.newPlot('diversity-chart', [trace], layout, { responsive: true });
}

// 분야별 색상 매핑
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