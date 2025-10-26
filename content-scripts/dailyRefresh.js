
(function() {
    'use strict';

    // 防止重复执行
    if (window.dailyRefreshInitialized) return;
    window.dailyRefreshInitialized = true;

    // 1. 记录初始注入时间
    const INITIAL_INJECTION_TIME = new Date();
    console.log('🚀 扩展注入时间:', INITIAL_INJECTION_TIME.toLocaleString());

    // 保存到本地存储，以便跨页面使用
    if (!localStorage.getItem('extensionInjectionTime')) {
        localStorage.setItem('extensionInjectionTime', INITIAL_INJECTION_TIME.toISOString());
    }

    // 2. 启动每日检查线程
    startDailyCheck();

    function startDailyCheck() {
        //console.log('⏰ 启动每日检查线程...');

        // 使用 setInterval 模拟线程，每10分钟检查一次
        const CHECK_INTERVAL = 10 * 60 * 1000; // 10分钟

        const checkTimer = setInterval(() => {
            if (isNextDay()) {
                console.log('🔄 检测到新的一天，刷新页面...');
                clearInterval(checkTimer); // 停止检查
                refreshPage();
            }
        }, CHECK_INTERVAL);

        // 立即执行一次检查
        setTimeout(() => {
            if (isNextDay()) {
                console.log('🔄 立即检查：检测到新的一天，刷新页面...');
                clearInterval(checkTimer);
                refreshPage();
            }
        }, 1000);

        // 保存timer引用，以便后续管理
        window.dailyCheckTimer = checkTimer;
    }

    function isNextDay() {
        try {
            // 获取存储的注入时间
            const injectionTime = INITIAL_INJECTION_TIME;
            const currentTime = new Date();

            console.log('📅 时间检查:', {
                注入日期: INITIAL_INJECTION_TIME.toLocaleDateString(),
                当前日期: currentTime.toLocaleDateString(),
                注入时间: INITIAL_INJECTION_TIME.toLocaleTimeString(),
                当前时间: currentTime.toLocaleTimeString()
            });

            // 判断是否是第二天（日期不同）
            const isDifferentDay = injectionTime.toDateString() !== currentTime.toDateString();

            if (isDifferentDay) {
                console.log('🎯 检测到日期变化，需要刷新');
                // 更新存储时间为当前时间，避免重复刷新
                localStorage.setItem('extensionInjectionTime', currentTime.toISOString());
                return true;
            }

            return false;

        } catch (error) {
            console.error('❌ 日期检查错误:', error);
            return false;
        }
    }

    function refreshPage() {
        console.log('🔄 开始刷新页面...');

        // 添加一些延迟，让日志能够显示
        setTimeout(() => {
            // 显示刷新提示
            showRefreshNotification();

            // 延迟2秒后刷新，让用户看到提示
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        }, 1000);
    }

    function showRefreshNotification() {
        // 创建刷新提示
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff6b6b;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;

        notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">🔄 每日自动刷新</div>
            <div>检测到新的一天，页面将在2秒后刷新...</div>
        `;

        // 添加动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // 3秒后自动移除提示
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // 暴露控制函数到全局，方便调试
    window.dailyRefresh = {
        getInjectionTime: () => new Date(INITIAL_INJECTION_TIME),
        forceCheck: () => {
            console.log('🔍 手动触发每日检查...');
            if (isNextDay()) {
                refreshPage();
            } else {
                console.log('❌ 还不是第二天，不需要刷新');
            }
        },
        forceRefresh: () => {
            console.log('🔄 手动强制刷新');
            refreshPage();
        },
        stopChecking: () => {
            if (window.dailyCheckTimer) {
                clearInterval(window.dailyCheckTimer);
                console.log('⏹️ 已停止每日检查');
            }
        }
    };

    console.log('✅ 每日自动刷新功能已启动');
})();