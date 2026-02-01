
// // ================================
// // 연관어 히트맵 시각화
// // ================================

// let heatmapData = [];

// // 주요 타겟 키워드 (하드코딩)
// const mainKeywords = [
//     "rights","covid-19","artificial intelligence","korea","protection",
//     "tax","public","esg","legal","china","information","international",
//     "job satisfaction","trust","labor","policy","regulation",
//     "management","contract","digital"
// ];

// // CSV 로드 및 히트맵 생성
// Papa.parse("all_keywords_co_keywords_by_year_long_top10.csv", {
//     download: true,
//     header: true,
//     dynamicTyping: true,
//     complete: function(results) {
//         heatmapData = results.data;
        
//         // 각 주요 키워드별로 히트맵 렌더링
//         mainKeywords.forEach(targetKeyword => {
//             renderCoKeywordHeatmap(targetKeyword);
//         });
//     }
// });

// // ================================
// // 연관어 히트맵 렌더링 함수
// // ================================
// function renderCoKeywordHeatmap(targetKeyword) {
//     const filtered = heatmapData.filter(d => 
//         d.Target_Keyword === targetKeyword
//     );
    
//     if (filtered.length === 0) return;
    
//     // 연도별 CoKeyword 데이터 구조화
//     const yearData = {};
//     filtered.forEach(row => {
//         const year = row.YEAR;
//         const coKeyword = row.CoKeyword;
//         const count = row.Count;
        
//         if (!yearData[year]) yearData[year] = {};
//         yearData[year][coKeyword] = count;
//     });
    
//     // 전체 CoKeyword 수집 (모든 연도 통합)
//     const allCoKeywords = new Set();
//     Object.values(yearData).forEach(yearObj => {
//         Object.keys(yearObj).forEach(cok => allCoKeywords.add(cok));
//     });
    
//     // CoKeyword를 2026년 기준 빈도순으로 정렬
//     const coKeywordList = Array.from(allCoKeywords).sort((a, b) => {
//         const countA = yearData[2026]?.[a] || 0;
//         const countB = yearData[2026]?.[b] || 0;
//         return countB - countA;
//     }).slice(0, 15); // 상위 15개만
    
//     // 키워드별 데이터 객체 생성
//     const keywordDataForHeatmap = {};
//     coKeywordList.forEach(cok => {
//         keywordDataForHeatmap[cok] = {
//             "2022": yearData[2022]?.[cok] || 0,
//             "2023": yearData[2023]?.[cok] || 0,
//             "2024": yearData[2024]?.[cok] || 0,
//             "2025": yearData[2025]?.[cok] || 0,
//             "2026": yearData[2026]?.[cok] || 0
//         };
//     });
    
//     // 키워드 유형 판별
//     const keywordTypeMap = {};
//     const keywordBadgeMap = {};
    
//     coKeywordList.forEach(cok => {
//         const data = keywordDataForHeatmap[cok];
//         const hasEarly = data["2022"] > 0 || data["2023"] > 0;
//         const hasMid = data["2024"] > 0;
//         const hasLate = data["2025"] > 0 || data["2026"] > 0;
//         const only2026 = data["2026"] > 0 && data["2022"] === 0 && data["2023"] === 0 && data["2024"] === 0 && data["2025"] === 0;
        
//         // 유형 판별
//         if (only2026) {
//             keywordTypeMap[cok] = "emerging";
//             keywordBadgeMap[cok] = "new";
//         } else if (!hasEarly && !hasMid && hasLate) {
//             keywordTypeMap[cok] = "emerging";
//             keywordBadgeMap[cok] = "new";
//         } else if (hasEarly && !hasMid && hasLate) {
//             keywordTypeMap[cok] = "comeback";
//             keywordBadgeMap[cok] = "hot";
//         } else if (hasEarly && hasMid && hasLate) {
//             keywordTypeMap[cok] = "core";
//             keywordBadgeMap[cok] = "";
//         } else {
//             keywordTypeMap[cok] = "core";
//             keywordBadgeMap[cok] = "";
//         }
//     });
    
//     // 히트맵 렌더링
//     renderHeatmapTable(keywordDataForHeatmap, keywordTypeMap, keywordBadgeMap);
// }

// // ================================
// // 히트맵 테이블 렌더링
// // ================================
// function renderHeatmapTable(keywordData, keywordType, keywordBadge) {
//     const tbody = document.getElementById("heatmap-body");
//     tbody.innerHTML = "";

//     Object.keys(keywordData).forEach(keyword => {
//         const tr = document.createElement("tr");
//         tr.classList.add("kw-row");
//         tr.dataset.keyword = keyword;

//         // 키워드 이름
//         const tdName = document.createElement("td");
//         tdName.className = "kw-name";
//         tdName.textContent = keyword;
//         tr.appendChild(tdName);

//         // 연도별 셀
//         ["2022","2023","2024","2025","2026"].forEach(year => {
//             const td = document.createElement("td");
//             const val = keywordData[keyword][year];
            
//             if (val > 0) {
//                 td.textContent = val;
//                 td.className = getLevel(val);
                
//                 // 2026년에 배지 추가
//                 if (keywordBadge[keyword] && year === "2026") {
//                     const span = document.createElement("span");
//                     span.className = `badge ${keywordBadge[keyword]}`;
//                     span.textContent = keywordBadge[keyword].toUpperCase();
//                     td.appendChild(document.createTextNode(" "));
//                     td.appendChild(span);
//                 }
//             } else {
//                 td.className = "level-0"; // 빈 셀
//             }
//             tr.appendChild(td);
//         });

//         // 유형 셀
//         const tdType = document.createElement("td");
//         tdType.innerHTML = `<span class="type ${keywordType[keyword]}">${keywordType[keyword]}</span>`;
//         tr.appendChild(tdType);

//         tbody.appendChild(tr);
//     });
    
//     // 클릭 이벤트 바인딩
//     bindHeatmapClickEvents(keywordData);
// }

// // ================================
// // 색상 레벨 계산
// // ================================
// function getLevel(value) {
//     if (value === 0) return "level-0";
//     if (value < 10) return "level-1";
//     if (value < 20) return "level-2";
//     if (value < 30) return "level-3";
//     if (value < 40) return "level-4";
//     return "level-5";
// }

// // ================================
// // 히트맵 클릭 이벤트 (라인차트)
// // ================================
// function bindHeatmapClickEvents(keywordData) {
//     document.querySelectorAll(".kw-row").forEach(row => {
//         row.addEventListener("click", () => {
//             const key = row.dataset.keyword;
//             const years = ["2022","2023","2024","2025","2026"];
//             const values = years.map(y => {
//                 const v = keywordData[key][y];
//                 return v > 0 ? v : 0;
//             });

//             const hoverText = years.map(y => {
//                 const v = keywordData[key][y];
//                 return v > 0 ? `${y}: ${v}건` : `${y}: TOP10 없음`;
//             });

//             Plotly.newPlot("linechart", [{
//                 x: years,
//                 y: values,
//                 text: hoverText,
//                 hoverinfo: 'text',
//                 mode: "lines+markers",
//                 line: {shape: "linear", color:"royalblue", width: 3},
//                 marker: {size: 10, color:"royalblue"}
//             }], {
//                 title: `"${key}" 연관어 연도별 빈도 변화`,
//                 yaxis: {title: "빈도수 (건)"},
//                 xaxis: {title: "연도"},
//                 margin: { t:60, l:60, r:30, b:50 },
//                 font: {family: 'Pretendard, sans-serif'}
//             }, {responsive: true});
//         });
//     });
// }