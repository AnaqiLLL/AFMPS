// 全局变量
let allTeams = [];
let filteredTeams = [];
let currentPage = 1;
const teamsPerPage = 6;

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载球队数据
    fetchTeams();
    
    // 添加事件监听器
    document.getElementById('searchBtn').addEventListener('click', filterTeams);
    document.getElementById('searchInput').addEventListener('keyup', function(event) {
        if (event.key === 'Enter') {
            filterTeams();
        }
    });
    document.getElementById('divisionSelect').addEventListener('change', filterTeams);
});

// 获取球队数据
async function fetchTeams() {
    try {
        // 获取球队基本信息
        const teamsResponse = await fetch('../use/data/Teams.json');
        const teamsData = await teamsResponse.json();
        
        // 获取球队详细信息（包括球员名单）
        const rosterResponse = await fetch('../use/data/Team_Roster.json');
        const rosterData = await rosterResponse.json();
        
        // 处理数据，合并球队信息
        processTeamData(teamsData, rosterData);
        
        // 更新统计信息
        updateStats();
        
        // 显示球队信息
        filteredTeams = [...allTeams];
        renderTeams();
    } catch (error) {
        console.error('获取数据失败:', error);
        document.querySelector('.loading').innerHTML = '<p>数据加载失败，请刷新页面重试</p>';
    }
}

// 处理球队数据
// 处理球队数据
function processTeamData(teamsData, rosterData) {
    // 创建一个映射，用于快速查找球队详细信息
    const rosterMap = {};
    if (rosterData.id) {
        // 如果是单个球队的详细信息
        rosterMap[rosterData.id] = rosterData;
    }
    
    // 处理所有球队信息
    allTeams = teamsData.teams
        .filter(team => team.name !== 'TBD') // 过滤掉 Team TBD
        .map(team => {
            // 查找该球队的详细信息
            const teamRoster = rosterMap[team.id] || {};
            
            // 计算该球队的球员数量
            const playerCount = teamRoster.players ? teamRoster.players.length : 0;
            
            // 返回合并后的球队信息
            return {
                id: team.id,
                name: team.name,
                market: team.market,
                alias: team.alias,
                fullName: `${team.market} ${team.name}`,
                division: teamRoster.division ? teamRoster.division.alias : 'Unknown',
                conference: teamRoster.conference ? teamRoster.conference.alias : 'Unknown',
                founded: teamRoster.founded || 'Unknown',
                venue: teamRoster.venue ? teamRoster.venue.name : 'Unknown',
                championships: teamRoster.championships_won || 0,
                playerCount: playerCount,
                logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${team.alias.toLowerCase()}.png` // 使用ESPN的球队logo
            };
        });
}

// 更新统计信息
function updateStats() {
    const totalTeams = allTeams.length;
    document.getElementById('totalTeams').textContent = totalTeams;
}

// 筛选球队
// 筛选球队
function filterTeams() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredTeams = allTeams.filter(team => {
        const matchesSearch = team.fullName.toLowerCase().includes(searchTerm) || 
                             team.alias.toLowerCase().includes(searchTerm);
        
        return matchesSearch;
    });
    
    // 更新统计信息，显示筛选后的球队数量
    document.getElementById('totalTeams').textContent = filteredTeams.length;
    
    currentPage = 1;
    renderTeams();
}

// 渲染球队卡片
function renderTeams() {
    const teamsContainer = document.getElementById('teamsContainer');
    const startIndex = (currentPage - 1) * teamsPerPage;
    const endIndex = startIndex + teamsPerPage;
    const teamsToShow = filteredTeams.slice(startIndex, endIndex);
    
    // 清空容器
    teamsContainer.innerHTML = '';
    
    if (filteredTeams.length === 0) {
        teamsContainer.innerHTML = '<div class="loading"><p>没有找到匹配的球队</p></div>';
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    // 创建球队卡片
    teamsToShow.forEach(team => {
        const teamCard = document.createElement('div');
        teamCard.className = 'team-card';
        teamCard.innerHTML = `
            <div class="team-header">
                <div class="team-name">${team.market} ${team.name}</div>
            </div>
            <div class="team-content">
                <div class="team-info">
                    <img src="${team.logo}" alt="${team.name} logo" class="team-logo">
                    <div class="team-details">
                        <h3>球队信息</h3>
                        <p>别名: <span>${team.alias}</span></p>
                        <p>市场: <span>${team.market}</span></p>
                    </div>
                </div>
                <div class="team-actions">
                    <button class="team-btn secondary" onclick="viewTeamRoster('${team.id}')">
                        <i class="fas fa-users"></i> 查看球员
                    </button>
                </div>
            </div>
        `;
        teamsContainer.appendChild(teamCard);
    });
    
    // 渲染分页
    renderPagination();
}

// 渲染分页控件
function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);
    
    pagination.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTeams();
        }
    });
    pagination.appendChild(prevBtn);
    
    // 页码按钮
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn' + (i === currentPage ? ' active' : '');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            renderTeams();
        });
        pagination.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderTeams();
        }
    });
    pagination.appendChild(nextBtn);
}

// 查看球队详细信息
function viewTeamDetails(teamId) {
    // 这里可以实现跳转到球队详情页或弹出详情模态框
    alert(`查看球队详情: ${teamId}`);
    // 实际项目中可以使用以下代码跳转到详情页
    // window.location.href = `team-detail.html?id=${teamId}`;
}

// 查看球队球员名单
function viewTeamRoster(teamId) {
    // 查找对应的球队信息
    const team = allTeams.find(t => t.id === teamId);
    if (!team) {
        alert('未找到球队信息');
        return;
    }
    
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'player-modal';
    
    // 获取球员数据
    fetchPlayersByTeam(teamId, team, modal);
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 防止滚动
    document.body.style.overflow = 'hidden';
}

// 获取球队的球员数据
async function fetchPlayersByTeam(teamId, team, modal) {
    try {
        // 获取球员数据 - 从新的文件路径获取
        const response = await fetch(`../use/Team/${team.name}.json`);
        const data = await response.json();
        
        // 获取该球队的球员
        let players = data.players || [];
        
        // 渲染球员信息
        renderPlayerModal(team, players, modal);
    } catch (error) {
        console.error('获取球员数据失败:', error);
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${team.fullName} - 球员名单</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <p>获取球员数据失败，请稍后重试</p>
                </div>
            </div>
        `;
        
        // 添加关闭事件
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        });
    }
}

// 渲染球员模态框
function renderPlayerModal(team, players, modal) {
    // 创建模态框内容
    let modalContent = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${team.fullName} - 球员名单</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
    `;
    
    if (players.length === 0) {
        modalContent += '<p>没有找到该球队的球员信息</p>';
    } else {
        // 创建球员表格
        modalContent += `
            <table class="player-table">
                <thead>
                    <tr>
                        <th>球衣号码</th>
                        <th>姓名</th>
                        <th>位置</th>
                        <th>身高(英寸)</th>
                        <th>体重(磅)</th>
                        <th>大学</th>
                        <th>经验(年)</th>
                        <th>出生日期</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // 添加球员行
        players.forEach(player => {
            modalContent += `
                <tr class="player-row" data-player-id="${player.id}">
                    <td>${player.jersey || '-'}</td>
                    <td>${player.name}</td>
                    <td>${player.position || '-'}</td>
                    <td>${player.height || '-'}</td>
                    <td>${player.weight || '-'}</td>
                    <td>${player.college || '-'}</td>
                    <td>${player.experience || '0'}</td>
                    <td>${player.birth_date || '-'}</td>
                </tr>
            `;
        });
        
        modalContent += `
                </tbody>
            </table>
        `;
    }
    
    modalContent += `
            </div>
        </div>
    `;
    
    // 设置模态框内容
    modal.innerHTML = modalContent;
    
    // 添加关闭事件
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
        document.body.style.overflow = 'auto';
    });
    
    // 点击模态框外部关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
            document.body.style.overflow = 'auto';
        }
    });
    
    // 添加球员行点击事件，显示详细信息
    const playerRows = modal.querySelectorAll('.player-row');
    playerRows.forEach(row => {
        row.addEventListener('click', () => {
            const playerId = row.getAttribute('data-player-id');
            const player = players.find(p => p.id === playerId);
            if (player) {
                showPlayerDetails(player, team);
            }
        });
    });
}

// 显示球员详细信息
function showPlayerDetails(player, team) {
    // 创建球员详情模态框
    const detailModal = document.createElement('div');
    detailModal.className = 'player-detail-modal';
    
    // 构建详情内容
    let detailContent = `
        <div class="detail-content">
            <div class="detail-header">
                <h2>${player.name} - ${team.fullName}</h2>
                <span class="close-detail">&times;</span>
            </div>
            <div class="detail-body">
                <div class="player-info-card">
                    <div class="player-basic-info">
                        <h3>基本信息</h3>
                        <table class="info-table">
                            <tr>
                                <th>球衣号码</th>
                                <td>${player.jersey || '-'}</td>
                                <th>位置</th>
                                <td>${player.position || '-'}</td>
                            </tr>
                            <tr>
                                <th>身高</th>
                                <td>${player.height ? player.height + '英寸' : '-'}</td>
                                <th>体重</th>
                                <td>${player.weight ? player.weight + '磅' : '-'}</td>
                            </tr>
                            <tr>
                                <th>出生日期</th>
                                <td>${player.birth_date || '-'}</td>
                                <th>出生地</th>
                                <td>${player.birth_place || '-'}</td>
                            </tr>
                            <tr>
                                <th>大学</th>
                                <td>${player.college || '-'}</td>
                                <th>联盟</th>
                                <td>${player.college_conf || '-'}</td>
                            </tr>
                            <tr>
                                <th>高中</th>
                                <td>${player.high_school || '-'}</td>
                                <th>经验</th>
                                <td>${player.experience || '0'}年</td>
                            </tr>
                            <tr>
                                <th>选秀年份</th>
                                <td>${player.draft ? player.draft.year : '-'}</td>
                                <th>选秀轮次/顺位</th>
                                <td>${player.draft ? '第' + player.draft.round + '轮 第' + player.draft.number + '顺位' : '-'}</td>
                            </tr>
                            <tr>
                                <th>选秀球队</th>
                                <td colspan="3">${player.draft && player.draft.team ? player.draft.team.market + ' ' + player.draft.team.name : '-'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 设置详情模态框内容
    detailModal.innerHTML = detailContent;
    
    // 添加到页面
    document.body.appendChild(detailModal);
    
    // 添加关闭事件
    detailModal.querySelector('.close-detail').addEventListener('click', () => {
        document.body.removeChild(detailModal);
    });
    
    // 点击模态框外部关闭
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) {
            document.body.removeChild(detailModal);
        }
    });
}