document.addEventListener('DOMContentLoaded', () => {
    // 真实赛季数据（从data.docx整理）
    const realSeasonData = {
        '2023': {
            labels: ['Bills', 'Dolphins', 'Jets', 'Patriots', 'Ravens', 'Steelers', 
                    'Bengals', 'Browns', 'Texans', 'Colts', 'Jaguars', 'Titans'],
            trendData: [76.5, 47.1, 29.4, 23.5, 70.6, 58.8, 52.9, 17.6, 
                      58.8, 47.1, 23.5, 17.6],
            matches: [
                {match: "Bills vs Dolphins", home: "Bills", away: "Dolphins", prediction: 68, result: "胜"},
                {match: "Ravens vs Steelers", home: "Ravens", away: "Steelers", prediction: 72, result: "胜"},
                {match: "Texans vs Colts", home: "Texans", away: "Colts", prediction: 63, result: "平"},
                {match: "Bengals vs Browns", home: "Bengals", away: "Browns", prediction: 81, result: "胜"}
            ]
        },
        '2022': {
            labels: ['Chiefs', 'Chargers', 'Broncos', 'Raiders', 'Eagles', 'Commanders', 
                    'Cowboys', 'Giants', 'Lions', 'Vikings', 'Packers', 'Bears'],
            trendData: [88.2, 64.7, 58.8, 23.5, 82.4, 70.6, 41.2, 17.6, 
                      88.2, 82.4, 64.7, 29.4],
            matches: [
                {match: "Chiefs vs Raiders", home: "Chiefs", away: "Raiders", prediction: 85, result: "胜"},
                {match: "Eagles vs Commanders", home: "Eagles", away: "Commanders", prediction: 78, result: "负"},
                {match: "Lions vs Vikings", home: "Lions", away: "Vikings", prediction: 69, result: "胜"},
                {match: "Packers vs Bears", home: "Packers", away: "Bears", prediction: 73, result: "平"}
            ]
        }
    };

    // 恢复模拟数据生成函数
    const generateTrendData = () => {
        return Array.from({length: 12}, () => Math.floor(Math.random() * 30 + 50));
    };

    const generateTableData = () => {
        const teams = ['曼联', '曼城', '利物浦', '切尔西', '阿森纳'];
        return Array.from({length: 8}, () => ({
            match: `${teams[Math.floor(Math.random()*5)]} vs ${teams[Math.floor(Math.random()*5)]}`,
            home: teams[Math.floor(Math.random()*5)],
            away: teams[Math.floor(Math.random()*5)],
            prediction: Math.floor(Math.random()*30 + 60),
            result: ['胜', '平', '负'][Math.floor(Math.random()*3)]
        }));
    };
    const ctx = document.getElementById('trendChart').getContext('2d');
    const trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月', 
                    '7月', '8月', '9月', '10月', '11月', '12月'],
            datasets: [{
                label: '胜率趋势',
                data: generateTrendData(),
                borderColor: '#00C8B5',
                tension: 0.4,
                fill: false,
                pointRadius: 4,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: '#fff',
                        callback: (value) => value + '%'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#fff'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff',
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    titleColor: '#00C8B5',
                    bodyColor: '#fff'
                }
            }
        }
    });

    // 赛季选择事件
    document.getElementById('seasonSelect').addEventListener('change', (e) => {
        trendChart.data.datasets[0].data = generateTrendData();
        trendChart.update();
        updateTableData();
    });

    // 更新表格数据
    const updateTableData = () => {
        const season = document.getElementById('seasonSelect').value;
        const tbody = document.getElementById('dataBody');
        tbody.innerHTML = generateTableData(season).map(item => `
            <tr>
                <td>${item.match}</td>
                <td>${item.home}</td>
                <td>${item.away}</td>
                <td class="prediction">${item.prediction}%</td>
                <td class="result-${item.result}">${item.result}</td>
            </tr>
        `).join('');
    };

    // 初始化表格数据
    updateTableData();
});

// 预测处理函数
// 页面加载时获取队伍、场地和天气数据
document.addEventListener('DOMContentLoaded', function() {
    // 获取队伍数据
    fetch('http://localhost:5000/api/teams')
        .then(response => response.json())
        .then(teams => {
            const homeSelect = document.getElementById('homeTeam');
            const awaySelect = document.getElementById('awayTeam');
            
            // 清空现有选项
            homeSelect.innerHTML = '';
            awaySelect.innerHTML = '';
            
            // 添加队伍选项
            teams.forEach(team => {
                const homeOption = document.createElement('option');
                homeOption.value = team.id;
                homeOption.textContent = `${team.market} ${team.name}`;
                homeSelect.appendChild(homeOption);
                
            const awayOption = document.createElement('option');
            awayOption.value = team.id;
            awayOption.textContent = `${team.market} ${team.name}`;
            awaySelect.appendChild(awayOption);
        });

        // 添加队伍选择事件监听
        [homeSelect, awaySelect].forEach(select => {
            select.addEventListener('change', () => {
                const card = document.querySelector('.team-logo-card');
                const hasSelection = homeSelect.value && awaySelect.value;
                card.style.display = hasSelection ? 'block' : 'none';
                
                if (hasSelection) {
                    const getLastName = text => text.split(' ').pop();
                    document.getElementById('homeLogo').src = 
                        `../../use/队标/${getLastName(homeSelect.options[homeSelect.selectedIndex].text)}.png`;
                    document.getElementById('awayLogo').src = 
                        `../../use/队标/${getLastName(awaySelect.options[awaySelect.selectedIndex].text)}.png`;
                }
            });
        });
        })
        .catch(error => console.error('获取队伍数据失败:', error));
    
    // 获取场地数据
    fetch('http://localhost:5000/api/venues')
        .then(response => response.json())
        .then(venues => {
            const stadiumSelect = document.getElementById('stadium');
            
            // 清空现有选项
            stadiumSelect.innerHTML = '';
            
            // 添加场地选项
            venues.forEach(venue => {
                const option = document.createElement('option');
                option.value = venue.id;
                option.textContent = `${venue.name} (${venue.city})`;
                stadiumSelect.appendChild(option);
            });
        })
        .catch(error => console.error('获取场地数据失败:', error));
    
    // 获取天气数据
    fetch('http://localhost:5000/api/weather')
        .then(response => response.json())
        .then(weatherConditions => {
            const weatherSelect = document.getElementById('weather');
            
            // 清空现有选项
            weatherSelect.innerHTML = '';
            
            // 添加天气选项
            weatherConditions.forEach(condition => {
                const option = document.createElement('option');
                option.value = condition;
                option.textContent = condition;
                weatherSelect.appendChild(option);
            });
        })
        .catch(error => console.error('获取天气数据失败:', error));
});

// 处理预测请求
function handlePrediction() {
    const params = {
        home: document.getElementById('homeTeam').value,
        away: document.getElementById('awayTeam').value,
        weather: document.getElementById('weather').value,
        stadium: document.getElementById('stadium').value
    };

    // 发送预测请求到API
    fetch('http://localhost:5000/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
        // 更新实时胜率显示
        document.querySelector('.progress-fill').style.width = `${data.win_probability}%`;
        document.querySelector('.win-probability span').textContent = `${data.win_probability}%`;
        
        // 更新关键指标
        const indicators = document.querySelectorAll('.indicator-list li .value');
        indicators[0].textContent = data.indicators.offense;
        indicators[1].textContent = data.indicators.defense;
        indicators[2].textContent = `${data.indicators.stamina}%`;
        
        // 添加到历史记录
        const homeTeamText = document.getElementById('homeTeam').options[document.getElementById('homeTeam').selectedIndex].text;
        const awayTeamText = document.getElementById('awayTeam').options[document.getElementById('awayTeam').selectedIndex].text;
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${homeTeamText} vs ${awayTeamText}</td>
            <td>${homeTeamText}</td>
            <td>${awayTeamText}</td>
            <td class="prediction">${data.win_probability}%</td>
            <td class="result-胜">待定</td>
        `;
        document.getElementById('dataBody').prepend(newRow);
    })
    .catch(error => console.error('预测请求失败:', error));
}

// 动态进度条效果
const progressBars = document.querySelectorAll('.progress-fill');
progressBars.forEach(bar => {
    const targetWidth = parseFloat(bar.style.width);
    bar.style.width = '0%';
    setTimeout(() => {
        bar.style.width = targetWidth + '%';
    }, 500);
});
