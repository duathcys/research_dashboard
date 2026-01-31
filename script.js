// 탭 전환
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = btn.dataset.tab;
        document.querySelectorAll('.tab-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        btn.classList.add('active');
    });
});

// CSV 로드
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

        // 허용 키워드
        const allowedKeywords = [
            "rights", "covid-19", "artificial intelligence", "korea", "protection",
            "tax", "public", "esg", "legal", "china", "information", "international",
            "job satisfaction", "trust", "labor", "policy", "regulation",
            "management", "contract", "digital"
        ];

        // 전체 데이터 (성장률 0 제외)
        const fullData = data.filter(item => item.KYWD && item.Growth_rate !== 0);

        // 현재 필터 상태
        let filterOn = true;

        // 화면 렌더링 함수
        function render(dataToRender) {
            // 매트릭스 초기화
            matrix.innerHTML = '';
            // 리스트 초기화
            gList.innerHTML = '';
            dList.innerHTML = '';

            // 매트릭스 점
            dataToRender.forEach(item => {
                const dot = document.createElement('div');
                dot.className = 'point';
                dot.innerText = item.KYWD;

                // 필터 적용 시 색상
                if(filterOn && allowedKeywords.includes(item.KYWD.toLowerCase())){
                    dot.classList.add('filtered');
                }

                let xPos = Math.min((item.pred_freq_2026 / 200) * 100, 95);
                let yPos = 50 + item.Growth_rate;
                dot.style.left = xPos + "%";
                dot.style.bottom = Math.max(Math.min(yPos, 95), 5) + "%";
                matrix.appendChild(dot);
            });

            // 성장/쇠퇴 리스트
            let growthData = dataToRender.filter(item => item.Growth_rate > 0)
                                         .sort((a,b) => b.Growth_rate - a.Growth_rate);
            let declineData = dataToRender.filter(item => item.Growth_rate < 0)
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

        // 최초 렌더링 (필터 ON)
        render(fullData.filter(item => allowedKeywords.includes(item.KYWD.toLowerCase())));

        // 필터 토글 버튼 클릭
        filterBtn.addEventListener('click', () => {
            filterOn = !filterOn; // 토글
            if(filterOn){
                filterBtn.classList.add('active');
                filterBtn.innerText = '✅ 키워드 필터 ON';
                render(fullData.filter(item => allowedKeywords.includes(item.KYWD.toLowerCase())));
            } else {
                filterBtn.classList.remove('active');
                filterBtn.innerText = '⚪ 키워드 필터 OFF';
                render(fullData);
            }
        });

        // 정렬 버튼 클릭 이벤트
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
    }
});
