// 예제 데이터: 키워드별 연도별 빈도
const keywordData = {
  "Protection": { "2022": 30, "2023": 0, "2024": 45, "2025": 60, "2026": 85 },
  "Digital Tech": { "2022": 0, "2023": 0, "2024": 0, "2025": 0, "2026": 40 },
  "AI": { "2022": 20, "2023": 35, "2024": 50, "2025": 65, "2026": 70 }
};

// 키워드 유형 & 배지
const keywordType = {
  "Protection": "comeback",
  "Digital Tech": "emerging",
  "AI": "core"
};

const keywordBadge = {
  "Protection": "hot",
  "Digital Tech": "new",
  "AI": ""
};

// 색상 레벨 계산
function getLevel(value){
    if(value===0) return "level-0";
    if(value<20) return "level-1";
    if(value<40) return "level-2";
    if(value<60) return "level-3";
    if(value<80) return "level-4";
    return "level-5";
}

// 히트맵 렌더링
function renderHeatmap(){
    const tbody = document.getElementById("heatmap-body");
    tbody.innerHTML = "";

    Object.keys(keywordData).forEach(keyword=>{
        const tr = document.createElement("tr");
        tr.classList.add("kw-row");
        tr.dataset.keyword = keyword;

        const tdName = document.createElement("td");
        tdName.className = "kw-name";
        tdName.textContent = keyword;
        tr.appendChild(tdName);

        ["2022","2023","2024","2025","2026"].forEach(year=>{
            const td = document.createElement("td");
            const val = keywordData[keyword][year];
            if(val>0){
                td.textContent = val;
                td.className = getLevel(val);
                if(keywordBadge[keyword] && year=="2026"){
                    const span = document.createElement("span");
                    span.className = `badge ${keywordBadge[keyword]}`;
                    span.textContent = keywordBadge[keyword].toUpperCase();
                    td.appendChild(document.createTextNode(" "));
                    td.appendChild(span);
                }
            } else {
                td.className = getLevel(0); // level-0 = 없음
            }
            tr.appendChild(td);
        });

        const tdType = document.createElement("td");
        tdType.innerHTML = `<span class="type ${keywordType[keyword]}">${keywordType[keyword]}</span>`;
        tr.appendChild(tdType);

        tbody.appendChild(tr);
    });
}

// 라인차트 그리기
function bindHeatmapClick(){
    document.querySelectorAll(".kw-row").forEach(row=>{
        row.addEventListener("click", ()=>{
            const key = row.dataset.keyword;
            const years = ["2022","2023","2024","2025","2026"];
            const values = years.map(y=>{
                const v = keywordData[key][y];
                return v>0 ? v : 0;
            });

            const hoverText = years.map(y=>{
                const v = keywordData[key][y];
                return v>0 ? `${y}: ${v}` : `${y}: TOP10 없음`;
            });

            Plotly.newPlot("linechart", [{
                x: years,
                y: values,
                text: hoverText,
                mode: "lines+markers",
                line: {shape: "linear", color:"royalblue"},
                marker: {size:8, color:"royalblue"}
            }], {
                title: `${key} 연도별 변화`,
                yaxis: {title: "빈도수"},
                xaxis: {title: "연도"},
                margin: { t:50, l:50, r:30, b:50 }
            }, {responsive:true});
        });
    });
}


document.addEventListener("DOMContentLoaded", () => {
    renderHeatmap();
    bindHeatmapClick();
});

document.querySelectorAll(".rel-card").forEach(card => {
    const key = card.dataset.keyword; // 카드에 데이터 속성으로 키워드 넣어두기

    // 툴팁 div 생성
    const tooltip = document.createElement("div");
    tooltip.className = "linechart-tooltip";
    card.appendChild(tooltip);

    const years = ["2022","2023","2024","2025","2026"];
    const values = years.map(y => keywordData[key][y] || 0);

    Plotly.newPlot(tooltip, [{
        x: years,
        y: values,
        mode: "lines+markers",
        line: {shape:"linear", color:"#007aff"},
        marker: {size:6, color:"#007aff"}
    }], {
        margin: {t:20,l:30,r:20,b:30},
        xaxis: {showgrid:false, zeroline:false, showticklabels:true, tickfont:{size:10}},
        yaxis: {showgrid:false, zeroline:false, showticklabels:false}
    }, {responsive:true});
});
