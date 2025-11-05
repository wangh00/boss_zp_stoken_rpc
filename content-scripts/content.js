(function() {
    'use strict';

	
    if (window.bossExtensionLoaded) return;
    window.bossExtensionLoaded = true;
    window.error_count=0;
    console.log('🚀 Boss扩展正在加载');
	
    let config = { rpcUrl: null, targetUrl: 'https://www.zhipin.com/web/geek/jobs?ka=header-jobs' };
    
    init();
    
    function init() {
        loadConfig();
        setupListeners();
    }
    
    function loadConfig() {
        try {
            const saved = localStorage.getItem('bossConfig');
            if (saved) {
                config = JSON.parse(saved);
                console.log('📦 加载配置:', saved);
				if (window.location.href===config.targetUrl){
					start_rpc(config.rpcUrl);
				}else{
					console.log('📦 当前链接未匹配:', config.targetUrl);
					window.dailyRefresh.stopChecking();
				}
				
            }
        } catch (error) {
            console.log('加载配置失败:', error);
        }
    }
    
    function setupListeners() {
        // 监听配置更新
        window.addEventListener('bossConfigUpdate', (event) => {
            console.log('🔄 配置已更新:', event.detail);
            config = event.detail;
            localStorage.setItem('bossConfig', JSON.stringify(config));
			if (event.detail.targetUrl!==window.location.href){
				console.log('正在跳转新匹配链接:',event.detail.targetUrl)
				window.location.href=event.detail.targetUrl
			}
        });
    }
	function start_rpc(rpc_url) {
		const originalSetAttribute = Element.prototype.setAttribute;
		// 重写 setAttribute
		Element.prototype.setAttribute = function(name, value) {
			if (name === 'src' && (this.tagName === 'SCRIPT' || this.tagName === 'IFRAME')) {
				//console.log('🎯 拦截到动态资源加载:');
				//console.log('   元素类型:', this.tagName);
				//console.log('   URL:', value);
				//console.log('   调用栈:', new Error().stack);
				const modifiedValue = processSrcBeforeLoad(value, this);
				return originalSetAttribute.call(this, name, modifiedValue || value);
			}
			return originalSetAttribute.call(this, name, value);
		};
		function processSrcBeforeLoad(url, element) {
		  
			if (url.includes('/web/common/security-js')) {
				console.log('✅ 脚本加载:',url);
				Element.prototype.setAttribute=originalSetAttribute;
				window.security_js=url;
				// setupResponseInterceptor(element, url);
				return url; // 可以返回修改后的URL
			}
			return url;
		}
		function setupResponseInterceptor(element, url) {
			let zp_script=document.createElement("script");
			zp_script.setAttribute("type", "text/javascript")
			zp_script.setAttribute("charset", "UTF-8")
			zp_script.setAttribute("src", url)
			document.body.appendChild(zp_script);
			console.log('✅ 脚本加载完成:', url);
		};
		function showErrorNotification() {
        // 创建刷新提示
			const notification = document.createElement('div');
			notification.id='notification'
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
				<div style="font-weight: bold; margin-bottom: 5px;">🔄 ABC未正确加载</div>
				<div>ABC未正确加载,可能当前页不存在加密参数,换一个列表页试试...</div>
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
		}
		
		
		var demo = new RPCclient(rpc_url);
		
		demo.regAction("data_encode", function (resolve,param) {
			//这样添加了一个param参数，http接口带上它，这里就能获得

			const __zp_sseed__=param.seed;
			const __zp_sts__=param.ts;
			try{
				let iframe_abc=document.getElementsByTagName('iframe')[0].contentWindow.ABC;
				let encrypt=(new iframe_abc).z
				const res=encrypt(__zp_sseed__, __zp_sts__);
				console.log(param,'===>',res)
				resolve({"zp_token":res,"user-agent":navigator.userAgent});
			}catch(e){
				console.log(e)
				window.error_count++
				if (window.error_count>=10 && !window.security_js){
					console.log('ABC未正确加载,可能当前页不存在...')
					if (!document.getElementById('notification')){
						showErrorNotification()
					}
				}
				resolve({})
			}
		})
	}
})();
