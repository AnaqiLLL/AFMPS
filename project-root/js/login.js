document.addEventListener('DOMContentLoaded', () => {
    // 初始化粒子背景
    particlesJS('particles-bg', {
        particles: {
            number: { value: 80, density: { enable: true, value_area: 800 } },
            color: { value: "#4a90e2" },
            shape: { type: "circle" },
            opacity: { value: 0.5, random: false },
            size: { value: 3, random: true },
            line_linked: {
                enable: true,
                distance: 150,
                color: "#4a90e2",
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 6,
                direction: "none",
                random: false,
                straight: false,
                out_mode: "out",
                bounce: false
            }
        },
        interactivity: {
            detect_on: "canvas",
            events: {
                onhover: { enable: true, mode: "repulse" },
                onclick: { enable: true, mode: "push" },
                resize: true
            }
        },
        retina_detect: true
    });

    // 表单验证逻辑
    const form = document.getElementById('loginForm');
    const username = document.getElementById('username');
    const password = document.getElementById('password');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 清除旧错误提示
        document.querySelectorAll('.error-tip').forEach(el => el.remove());

        // 用户名验证
        if (username.value.trim().length < 4) {
            showError(username, '用户名至少需要4个字符');
            return;
        }

        // 密码验证
        if (password.value.length < 6) {
            showError(password, '密码至少需要6个字符');
            return;
        }

        // 模拟登录成功
        handleLoginSuccess();
    });

    // 输入框动态效果
    [username, password].forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.querySelector('label').style.color = '#4a90e2';
        });
        
        input.addEventListener('blur', () => {
            input.parentElement.querySelector('label').style.color = '#95a5a6';
        });
    });
});

function showError(input, message) {
    const error = document.createElement('div');
    error.className = 'error-tip';
    error.textContent = message;
    error.style.cssText = `
        color: #e74c3c;
        font-size: 0.8rem;
        position: absolute;
        bottom: -1.5rem;
        left: 0;
    `;
    input.parentElement.appendChild(error);
    input.parentElement.querySelector('.underline').style.background = '#e74c3c';
    setTimeout(() => error.remove(), 3000);
}

function handleLoginSuccess() {
    const form = document.getElementById('loginForm');
    form.classList.add('submitting');
    
    // 模拟API请求
    setTimeout(() => {
        form.reset();
        window.location.href = 'index.html';
    }, 1500);
}
