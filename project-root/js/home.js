document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    
    // 视频播放控制逻辑
    const playVideo = () => {
        video.play().catch(error => {
            console.log('视频自动播放被阻止，等待用户交互');
        });
    };

    // 初始化视频播放
    playVideo();

    // 用户交互后重试播放
    document.addEventListener('click', () => {
        if (video.paused) {
            video.play().then(() => {
                document.querySelector('.slogan-text').style.animationPlayState = 'running';
            });
        }
    }, { once: true });

    // 导航栏交互效果
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(10px)';
            item.style.background = 'rgba(255,255,255,0.1)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
            item.style.background = 'transparent';
        });
    });

    // 视窗尺寸适配
    const updateLayout = () => {
        const slogan = document.querySelector('.slogan-container');
        if (window.innerWidth < 768) {
            slogan.style.left = '2rem';
            slogan.style.bottom = '3rem';
            slogan.style.fontSize = '2rem';
        } else {
            slogan.style.left = '5rem';
            slogan.style.bottom = '5rem';
        }
    };

    window.addEventListener('resize', updateLayout);
    updateLayout();
});

// 视频加载状态监控
const videoObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === 'src') {
            document.getElementById('bg-video').load();
        }
    });
});

videoObserver.observe(document.getElementById('bg-video'), {
    attributes: true,
    attributeFilter: ['src']
});
