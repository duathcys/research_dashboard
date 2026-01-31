// --- Chart.js 데이터 ---
const ctx = document.getElementById('trendChart').getContext('2d');
const trendChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['AI', 'Bioinformatics', 'Quantum Computing', 'Neuroscience', 'Climate Science'],
        datasets: [{
            label: '논문 수',
            data: [120, 80, 50, 70, 60],
            backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: '최근 연구 트렌드' }
        }
    }
});

// --- QR 코드 생성 ---
const qrcode = new QRCode(document.getElementById("qrcode"), {
    text: window.location.href,  // 배포 후 자동으로 현재 URL 사용
    width: 128,
    height: 128,
});
