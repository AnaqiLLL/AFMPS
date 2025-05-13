// 模拟历史战绩数据 - 实际应用中应从数据库获取
const mockHistoryData = [];

// 生成模拟数据
function generateMockData() {
    const teams = [
        { id: "f0e724b0-4cbf-495a-be47-013907608da9", name: "49ers", market: "San Francisco", alias: "SF", logo: "../assets/logos/SF.png" },
        { id: "7b112545-38e6-483c-a55c-96cf6ee49cb8", name: "Bears", market: "Chicago", alias: "CHI", logo: "../assets/logos/CHI.png" },
        { id: "0d855753-ea21-4953-89f9-0e20aff9eb73", name: "Saints", market: "New Orleans", alias: "NO", logo: "../assets/logos/NO.png" },
        { id: "3d08af9e-c767-4f88-a7dc-b920c6d2b4a8", name: "Seahawks", market: "Seattle", alias: "SEA", logo: "../assets/logos/SEA.png" },
        { id: "cb2f9f1f-ac67-424e-9e72-1475cb0ed398", name: "Steelers", market: "Pittsburgh", alias: "PIT", logo: "../assets/logos/PIT.png" }
    ];
    
    const venues = ["主场", "客场", "中立场地"];
    const competitions = ["常规赛", "季后赛", "超级碗", "季前赛"];
    const rounds = ["第1轮", "第2轮", "第3轮", "决赛", "半决赛"];
    
    // 为每年生成比赛记录
    for (let year = 2010; year <= 2024; year++) {
        // 每年生成10-20场比赛
        const gamesCount = Math.floor(Math.random() * 11) + 10;
        
        for (let i = 0; i < gamesCount; i++) {
            // 随机选择两支不同的球队
            const homeTeamIndex = Math.floor(Math.random() * teams.length);
            let awayTeamIndex;
            do {
                awayTeamIndex = Math.floor(Math.random() * teams.length);
            } while (awayTeamIndex === homeTeamIndex);
            
            const homeTeam = teams[homeTeamIndex];
            const awayTeam = teams[awayTeamIndex];
            
            // 生成随机比分
            const homeScore = Math.floor(Math.random() * 35) + 10;
            const awayScore = Math.floor(Math.random() * 35) + 10;
            
            // 确定比赛结果
            let result;
            if (homeScore > awayScore) {
                result = "win";
            } else if (homeScore < awayScore) {
                result = "loss";
            } else {
                result = "tie";
            }
            
            // 生成随机日期
            const month = Math.floor(Math.random() * 12) + 1;
            const day = Math.floor(Math.random() * 28) + 1;
            const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            
            // 随机选择场地、比赛类型和轮次
            const venue = venues[Math.floor(Math.random() * venues.length)];
            const competition = competitions[Math.floor(Math.random() * competitions.length)];
            const round = rounds[Math.floor(Math.random() * rounds.length)];
            
            // 生成观众人数
            const attendance = Math.floor(Math.random() * 50000) + 30000;
            
            // 创建比赛记录对象
            const gameRecord = {
                id: `game-${year}-${i}`,
                date: date,
                season: year,
                homeTeam: homeTeam,
                awayTeam: awayTeam,
                homeScore: homeScore,
                awayScore: awayScore,
                result: result,
                venue: venue,
                competition: competition,
                round: round,
                attendance: attendance,
                highlights: `${year}赛季${homeTeam.market} ${homeTeam.name} vs ${awayTeam.market} ${awayTeam.name}的精彩对决`
            };
            
            mockHistoryData.push(gameRecord);
        }
    }
}

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 生成模拟数据
    generateMockData();
    
    // 删除加载球队选项的函数调用
    
    // 初始加载所有记录
    loadRecords();
    
    // 添加筛选事件监听器
    const yearSelect = document.getElementById('yearSelect');
    
    yearSelect.addEventListener('change', function() {
        console.log('年份选择已更改:', this.value);
        loadRecords(1); // 重置到第一页并加载记录
    });
    
    // 删除球队选择器的事件监听器
});

// 删除loadTeamOptions函数

// 加载记录
function loadRecords(page = 1) {
    console.log('加载记录，页码:', page);
    const recordsContainer = document.getElementById('recordsContainer');
    const yearSelect = document.getElementById('yearSelect');
    // 删除球队选择器引用
    
    // 获取筛选值
    const selectedYear = yearSelect.value;
    // 删除球队选择值
    
    console.log('选择的年份:', selectedYear);
    // 删除球队选择日志
    
    // 显示加载状态
    recordsContainer.innerHTML = `
        <div class="loading">
            <p>加载中，请稍候...</p>
            <div class="spinner"></div>
        </div>
    `;
    
    // 模拟加载延迟
    setTimeout(() => {
        // 筛选记录
        let filteredRecords = mockHistoryData;
        
        if (selectedYear !== 'all') {
            filteredRecords = filteredRecords.filter(record => record.season.toString() === selectedYear);
        }
        
        // 删除球队筛选逻辑
        
        // 按日期降序排序
        filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // 更新统计摘要
        updateStatsSummary(filteredRecords);
        
        // 分页
        const recordsPerPage = 8;  // 从9改为8
        const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
        const startIndex = (page - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        const paginatedRecords = filteredRecords.slice(startIndex, endIndex);
        
        // 清空容器
        recordsContainer.innerHTML = '';
        
        // 如果没有记录
        if (paginatedRecords.length === 0) {
            recordsContainer.innerHTML = `
                <div class="no-records" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
                    <p>没有找到符合条件的记录</p>
                </div>
            `;
            return;
        }
        
        // 渲染记录卡片
        paginatedRecords.forEach(record => {
            const recordCard = document.createElement('div');
            recordCard.className = 'record-card';
            recordCard.style.animationDelay = `${Math.random() * 0.5}s`;
            
            // 获取队标路径
            const homeTeamLogo = `../use/队标/${record.homeTeam.name}.png`;
            const awayTeamLogo = `../use/队标/${record.awayTeam.name}.png`;
            
            recordCard.innerHTML = `
                <div class="record-header">
                    <span class="record-date">${formatDate(record.date)}</span>
                    <span class="record-season">${record.season}赛季</span>
                </div>
                <div class="match-details">
                    <div class="teams-container">
                        <div class="team">
                            <img src="${homeTeamLogo}" alt="${record.homeTeam.name}" class="team-logo">
                            <span class="team-name">${record.homeTeam.market} ${record.homeTeam.name}</span>
                        </div>
                        <div class="score-container">
                            <div class="score">${record.homeScore} - ${record.awayScore}</div>
                            <span class="result ${record.result}">${getResultText(record.result)}</span>
                        </div>
                        <div class="team">
                            <img src="${awayTeamLogo}" alt="${record.awayTeam.name}" class="team-logo">
                            <span class="team-name">${record.awayTeam.market} ${record.awayTeam.name}</span>
                        </div>
                    </div>
                    <div class="match-info">
                        <div class="info-item">
                            <span class="info-label">比赛类型:</span>
                            <span class="info-value">${record.competition}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">轮次:</span>
                            <span class="info-value">${record.round}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">场地:</span>
                            <span class="info-value">${record.venue}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">观众人数:</span>
                            <span class="info-value">${record.attendance.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            `;
            
            recordsContainer.appendChild(recordCard);
        });
        
        // 渲染分页
        renderPagination(page, totalPages);
        
    }, 500); // 模拟加载延迟
}

// 更新统计摘要
function updateStatsSummary(records) {
    document.getElementById('totalGames').textContent = records.length;
    
    if (records.length > 0) {
        // 计算平均得分
        let totalScore = 0;
        records.forEach(record => {
            totalScore += record.homeScore + record.awayScore;
        });
        const avgScore = (totalScore / (records.length * 2)).toFixed(1);
        document.getElementById('avgScore').textContent = avgScore;
        
        // 找出最高得分
        let highestScore = 0;
        records.forEach(record => {
            const gameHighScore = Math.max(record.homeScore, record.awayScore);
            if (gameHighScore > highestScore) {
                highestScore = gameHighScore;
            }
        });
        document.getElementById('highestScore').textContent = highestScore;
    } else {
        document.getElementById('avgScore').textContent = '0';
        document.getElementById('highestScore').textContent = '0';
    }
}

// 渲染分页
function renderPagination(currentPage, totalPages) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '&laquo;';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => loadRecords(currentPage - 1));
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => loadRecords(i));
        pagination.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '&raquo;';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => loadRecords(currentPage + 1));
    pagination.appendChild(nextBtn);
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 获取结果文本
function getResultText(result) {
    switch (result) {
        case 'win': return '胜';
        case 'loss': return '负';
        case 'tie': return '平';
        default: return '';
    }
}