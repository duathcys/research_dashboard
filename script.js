// ================================
// 2026 연구 전략 내비게이터 JS
// ================================

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
let coKeywordData = []; // 전역
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
// 3️⃣ 연관어 TOP5 카드 렌더링
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

    // Top5
    const top5 = Object.entries(coMap)
        .map(([coKeyword, count]) => ({ coKeyword, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0,10);

    // 카드 생성
    cardsContainer.innerHTML = '';
    top5.forEach((item, idx) => {
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
    });

    const yearSelect = document.getElementById('relation-year-select');
    yearSelect.addEventListener('change', () => {
        const selectedKeyword = keySelect.value;
        const year = yearSelect.value;
        renderRelationCards(selectedKeyword, year);
    });
}
