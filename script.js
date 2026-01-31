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

        data.forEach(item => {
            if(!item.KYWD) return;

            // 매트릭스 점
            const dot = document.createElement('div');
            dot.className = 'point';
            dot.innerText = item.KYWD;

            let xPos = Math.min((item.pred_freq_2026 / 200) * 100, 95);
            let yPos = 50 + item.Growth_rate;
            dot.style.left = xPos + "%";
            dot.style.bottom = Math.max(Math.min(yPos, 95), 5) + "%";
            matrix.appendChild(dot);

            // 리스트 분류
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.KYWD}</span> <b>${item.Growth_rate}%</b>`;
            if(item.Growth_rate > 0) gList.appendChild(li);
            else dList.appendChild(li);
        });
    }
});
