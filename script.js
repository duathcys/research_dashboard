// ================================
// 2026 연구 전략 내비게이터 JS
// ================================

// 전역 변수
let coKeywordData = []; // 연관어 데이터
let clusterData = []; // 클러스터 트렌드 데이터

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
Papa.parse("2026년_키워드_성장률(임계값0).csv", {
    download: true,
    header: true,
    dynamicTyping: true,
    complete: function(results) {
        const data = results.data;
        const matrix = document.getElementById('matrix-points');
        const gList = document.getElementById('growth-list');
        const dList = document.getElementById('decline-list');
        const filterBtn = document.getElementById('keyword-filter-btn');

        const allowedKeywords = [
            "rights","covid-19","artificial intelligence","korea","protection",
            "tax","public","esg","legal","china","information","international",
            "job satisfaction","trust","labor","policy","regulation",
            "management","contract","digital"
        ];

        const fullData = data.filter(item => item.KYWD && item.Growth_rate !== 0);
        let filterOn = true;

        // ================================
        // 화면 렌더링 함수
        function render(dataToRender){
            matrix.innerHTML = '';
            gList.innerHTML = '';
            dList.innerHTML = '';

            dataToRender.forEach(item => {
                const dot = document.createElement('div');
                dot.className = 'point';
                dot.innerText = item.KYWD;

                // 클릭 이벤트
                dot.addEventListener('click', () => {
                    console.log("클릭한 키워드:", item.KYWD);
                    // 연관어 탭으로 이동
                    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    document.getElementById('relation-tab').classList.add('active');
                    document.querySelector('button[data-tab="relation-tab"]').classList.add('active');

                    // SelectBox 선택
                    const keySelect = document.getElementById('key-select');
                    keySelect.value = item.KYWD;
                    const yearSelect = document.getElementById('relation-year-select');
                    const selectedYear = yearSelect.value;
                    renderRelationCards(item.KYWD, selectedYear);
                    
                    // 🔥 히트맵도 업데이트
                    renderCoKeywordHeatmap(item.KYWD);
                });

                // 필터 ON 시 색상
                if(filterOn && allowedKeywords.includes(item.KYWD)){
                    dot.classList.add('filtered');
                }

                // 위치 계산
                let xPos = Math.min((item.pred_freq_2026 / 200) * 100, 95);
                let yPos = 50 + item.Growth_rate;
                dot.style.left = xPos + "%";
                dot.style.bottom = Math.max(Math.min(yPos, 95), 5) + "%";
                matrix.appendChild(dot);
            });

            // 리스트 렌더링
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
        render(fullData.filter(item => allowedKeywords.includes(item.KYWD)));

        // 필터 토글
        filterBtn.addEventListener('click', () => {
            filterOn = !filterOn;
            if(filterOn){
                filterBtn.classList.add('active');
                filterBtn.innerText = '✅ 키워드 필터 ON';
                render(fullData.filter(item => allowedKeywords.includes(item.KYWD)));
            } else {
                filterBtn.classList.remove('active');
                filterBtn.innerText = '⚪ 키워드 필터 OFF';
                render(fullData);
            }
        });

        // 리스트 정렬
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const listId = btn.dataset.list;
                const type = btn.dataset.type;
                const ul = document.getElementById(listId + '-list');
                const items = Array.from(ul.children);

                items.sort((a,b) => {
                    const aVal = parseFloat(a.querySelector('b').innerText);
                    const bVal = parseFloat(b.querySelector('b').innerText);
                    if(type === 'value') return bVal - aVal;
                    if(type === 'abs') return Math.abs(bVal) - Math.abs(aVal);
                    if(type === 'name') return a.querySelector('span').innerText.localeCompare(b.querySelector('span').innerText);
                });

                ul.innerHTML = '';
                items.forEach(li => ul.appendChild(li));
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
    .then(response => response.json())
    .then(data => {
        clusterData = data.clusters;
        console.log('✅ 클러스터 데이터 로드:', clusterData.length);
        
        // 초기 버블 차트 렌더링
        renderClusterBubbleChart();
        
        // 메인 키워드 연결도 초기화
        renderLinkedClusters('artificial intelligence');
    })
    .catch(error => {
        console.error('❌ cluster_trends.json 로드 실패:', error);
    });

// 카테고리별 색상 매핑
const categoryColors = {
    'tech': '#4285F4',       // 파란색
    'policy': '#34A853',     // 초록색
    'society': '#9C27B0',    // 보라색
    'environment': '#FF9800', // 주황색
    'economy': '#FBC02D'     // 노란색
};

// 버블 차트 렌더링
function renderClusterBubbleChart(filterCategory = 'all') {
    const filteredData = filterCategory === 'all' 
        ? clusterData 
        : clusterData.filter(c => c.category === filterCategory);
    
    const traces = Object.keys(categoryColors).map(cat => {
        const catData = filteredData.filter(c => c.category === cat);
        
        return {
            x: catData.map(c => c.avgFreq),
            y: catData.map(c => c.growthRate),
            mode: 'markers',
            name: cat.charAt(0).toUpperCase() + cat.slice(1),
            marker: {
                size: catData.map(c => Math.sqrt(c.total2025) * 3),
                color: categoryColors[cat],
                opacity: 0.7,
                line: {
                    color: 'white',
                    width: 2
                }
            },
            text: catData.map(c => 
                `<b>${c.label}</b><br>` +
                `2025 빈도: ${c.total2025}<br>` +
                `성장률: ${c.growthRate}%<br>` +
                `평균: ${c.avgFreq}<br>` +
                `연결: ${c.linkedMainKeywords.join(', ')}`
            ),
            hoverinfo: 'text',
            customdata: catData.map(c => c.clusterId)
        };
    });
    
    const layout = {
        title: {
            text: '클러스터 포지셔닝 맵 (2023-2025)',
            font: { size: 18, family: 'Pretendard' }
        },
        xaxis: {
            title: '평균 연구 빈도 (2023-2025)',
            gridcolor: '#e0e0e0',
            zeroline: true
        },
        yaxis: {
            title: '성장률 (%)',
            gridcolor: '#e0e0e0',
            zeroline: true,
            zerolinecolor: '#999',
            zerolinewidth: 2
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
            orientation: 'h',
            y: -0.2
        },
        margin: { t: 80, l: 80, r: 50, b: 100 },
        height: 600,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: 'white'
    };
    
    Plotly.newPlot('cluster-bubble-chart', traces, layout, { responsive: true });
    
    // 클릭 이벤트
    document.getElementById('cluster-bubble-chart').on('plotly_click', function(data) {
        const clusterId = data.points[0].customdata;
        const cluster = clusterData.find(c => c.clusterId === clusterId);
        showClusterPopup(cluster);
    });
}

// 클러스터 팝업 표시
function showClusterPopup(cluster) {
    const popup = document.getElementById('keyword-popup');
    const title = document.getElementById('popup-title');
    const details = document.getElementById('popup-details');
    
    title.innerHTML = `🧩 ${cluster.label}`;
    details.innerHTML = `
        <p><strong>카테고리:</strong> ${cluster.category}</p>
        <p><strong>성장률:</strong> ${cluster.growthRate}%</p>
        <p><strong>2025년 빈도:</strong> ${cluster.total2025}</p>
        <p><strong>키워드:</strong> ${cluster.keywords.slice(0, 5).join(', ')}</p>
        <p><strong>연결된 메인 키워드:</strong> ${cluster.linkedMainKeywords.join(', ')}</p>
        <hr>
        <p><strong>연도별 추이:</strong></p>
        <ul style="list-style: none; padding: 0;">
            <li>2021: ${cluster.yearlyFreq['2021']}</li>
            <li>2022: ${cluster.yearlyFreq['2022']}</li>
            <li>2023: ${cluster.yearlyFreq['2023']}</li>
            <li>2024: ${cluster.yearlyFreq['2024']}</li>
            <li>2025: ${cluster.yearlyFreq['2025']}</li>
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
        c.linkedMainKeywords.includes(mainKeyword)
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
        card.style.borderLeft = `4px solid ${categoryColors[cluster.category]}`;
        
        const growthIcon = cluster.growthRate > 0 ? '📈' : '📉';
        const growthClass = cluster.growthRate > 0 ? 'growth-up' : 'growth-down';
        
        card.innerHTML = `
            <div class="cluster-card-header">
                <span class="cluster-id">#${cluster.clusterId}</span>
                <span class="cluster-category">${cluster.category}</span>
            </div>
            <h4>${cluster.label}</h4>
            <div class="cluster-stats">
                <div class="stat-item">
                    <span class="stat-label">2025 빈도</span>
                    <span class="stat-value">${cluster.total2025}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">성장률</span>
                    <span class="stat-value ${growthClass}">${growthIcon} ${cluster.growthRate}%</span>
                </div>
            </div>
            <div class="cluster-keywords">
                ${cluster.keywords.slice(0, 3).map(k => `<span class="kw-tag">${k}</span>`).join('')}
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
        y: years.map(y => cluster.yearlyFreq[y]),
        name: cluster.label,
        mode: 'lines+markers',
        line: {
            width: 3,
            color: categoryColors[cluster.category]
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