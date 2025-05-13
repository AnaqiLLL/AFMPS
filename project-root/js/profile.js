document.addEventListener('DOMContentLoaded', function() {
    // 初始化数据
    const userData = {
        username: '体育迷小王',
        bio: '热爱足球和篮球，喜欢观看各种体育赛事，特别是欧洲五大联赛。',
        avatar: 'https://via.placeholder.com/150',
        stats: {
            following: 42,
            followers: 128,
            posts: 65
        }
    };

    // 模拟数据 - 喜欢的球队
    const favoriteTeams = [
        {
            id: 1,
            name: '巴塞罗那',
            league: '西甲',
            founded: '1899年',
            logo: 'https://via.placeholder.com/80'
        },
        {
            id: 2,
            name: '曼城',
            league: '英超',
            founded: '1880年',
            logo: 'https://via.placeholder.com/80'
        },
        {
            id: 3,
            name: '拜仁慕尼黑',
            league: '德甲',
            founded: '1900年',
            logo: 'https://via.placeholder.com/80'
        }
    ];

    // 模拟数据 - 喜欢的比赛
    const favoriteMatches = [
        {
            id: 1,
            date: '2023年12月10日 20:00',
            homeTeam: {
                name: '巴塞罗那',
                logo: 'https://via.placeholder.com/40'
            },
            awayTeam: {
                name: '皇家马德里',
                logo: 'https://via.placeholder.com/40'
            },
            score: '3 - 1',
            competition: '西甲',
            round: '第16轮'
        },
        {
            id: 2,
            date: '2023年12月5日 19:45',
            homeTeam: {
                name: '曼城',
                logo: 'https://via.placeholder.com/40'
            },
            awayTeam: {
                name: '利物浦',
                logo: 'https://via.placeholder.com/40'
            },
            score: '2 - 0',
            competition: '英超',
            round: '第15轮'
        }
    ];

    // 更新用户信息
    function updateUserInfo() {
        document.querySelector('.profile-info h1').textContent = userData.username;
        document.querySelector('.bio').textContent = userData.bio;
        document.querySelector('.profile-avatar img').src = userData.avatar;
        
        const statElements = document.querySelectorAll('.stat-value');
        statElements[0].textContent = userData.stats.following;
        statElements[1].textContent = userData.stats.followers;
        statElements[2].textContent = userData.stats.posts;
    }

    // 渲染喜欢的球队
    function renderTeams() {
        const teamsContainer = document.getElementById('teamsContainer');
        teamsContainer.innerHTML = '';

        favoriteTeams.forEach(team => {
            const teamElement = document.createElement('div');
            teamElement.className = 'team-item';
            teamElement.innerHTML = `
                <img src="${team.logo}" alt="${team.name} logo">
                <h3>${team.name}</h3>
                <p>${team.league} | 成立于${team.founded}</p>
                <div class="team-actions">
                    <button class="btn-action"><i class="fas fa-heart"></i></button>
                    <button class="btn-action"><i class="fas fa-bell"></i></button>
                </div>
            `;
            teamsContainer.appendChild(teamElement);
        });
    }

    // 渲染喜欢的比赛
    function renderMatches() {
        const matchesContainer = document.getElementById('matchesContainer');
        matchesContainer.innerHTML = '';

        favoriteMatches.forEach(match => {
            const matchElement = document.createElement('div');
            matchElement.className = 'match-item';
            matchElement.innerHTML = `
                <div class="match-date">${match.date}</div>
                <div class="match-teams">
                    <div class="team home-team">
                        <img src="${match.homeTeam.logo}" alt="${match.homeTeam.name}">
                        <span>${match.homeTeam.name}</span>
                    </div>
                    <div class="match-score">
                        <span>${match.score}</span>
                    </div>
                    <div class="team away-team">
                        <img src="${match.awayTeam.logo}" alt="${match.awayTeam.name}">
                        <span>${match.awayTeam.name}</span>
                    </div>
                </div>
                <div class="match-info">${match.competition} | ${match.round}</div>
                <div class="match-actions">
                    <button class="btn-action"><i class="fas fa-heart"></i></button>
                    <button class="btn-action"><i class="fas fa-share-alt"></i></button>
                </div>
            `;
            matchesContainer.appendChild(matchElement);
        });
    }

    // 添加新球队
    function addNewTeam() {
        // 这里可以实现添加新球队的逻辑，例如弹出模态框让用户输入
        const newTeam = {
            id: favoriteTeams.length + 1,
            name: '尤文图斯',
            league: '意甲',
            founded: '1897年',
            logo: 'https://via.placeholder.com/80'
        };
        
        favoriteTeams.push(newTeam);
        renderTeams();
    }

    // 添加新比赛
    function addNewMatch() {
        // 这里可以实现添加新比赛的逻辑，例如弹出模态框让用户输入
        const newMatch = {
            id: favoriteMatches.length + 1,
            date: '2023年12月15日 21:00',
            homeTeam: {
                name: '拜仁慕尼黑',
                logo: 'https://via.placeholder.com/40'
            },
            awayTeam: {
                name: '多特蒙德',
                logo: 'https://via.placeholder.com/40'
            },
            score: '2 - 2',
            competition: '德甲',
            round: '第17轮'
        };
        
        favoriteMatches.push(newMatch);
        renderMatches();
    }

    // 编辑个人资料
    function editProfile() {
        // 这里可以实现编辑个人资料的逻辑，例如弹出模态框让用户修改信息
        alert('编辑个人资料功能正在开发中...');
    }

    // 绑定事件
    document.getElementById('addTeamBtn').addEventListener('click', addNewTeam);
    document.getElementById('addMatchBtn').addEventListener('click', addNewMatch);
    document.querySelector('.edit-profile').addEventListener('click', editProfile);

    // 初始化页面
    updateUserInfo();
    renderTeams();
    renderMatches();

    // 添加一些交互效果
    const actionButtons = document.querySelectorAll('.btn-action');
    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const icon = this.querySelector('i');
            
            if (icon.classList.contains('fa-heart')) {
                icon.classList.toggle('fas');
                icon.classList.toggle('far');
                
                if (icon.classList.contains('fas')) {
                    this.style.color = '#e74c3c';
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.color = '';
                    this.style.borderColor = '';
                }
            }
        });
    });
});