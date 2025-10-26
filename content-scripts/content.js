// content.js - 只负责显示
(function() {
    'use strict';

	
    if (window.bossExtensionLoaded) return;
    window.bossExtensionLoaded = true;
    
    console.log('🚀 Boss扩展正在加载');
	
    let config = { rpcUrl: null, targetUrl: 'https://www.zhipin.com/' };
    
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
				//console.log('hook到需要的链接-->',url);
				setupResponseInterceptor(element, url);
				return url; // 可以返回修改后的URL
			}
			return url;
		}
		function setupResponseInterceptor(element, url) {
			Element.prototype.setAttribute=originalSetAttribute;
			// 注意：对于JSONP类型的响应，数据已经执行了，需要其他方式捕获
			let zp_script=document.createElement("script");
			zp_script.setAttribute("type", "text/javascript")
			zp_script.setAttribute("charset", "UTF-8")
			zp_script.setAttribute("src", url)
			document.body.appendChild(zp_script);
			console.log('✅ 脚本加载完成:', url);
		};
		var demo = new RPCclient(rpc_url);
		demo.regAction("data_encode", function (resolve,param) {
			//这样添加了一个param参数，http接口带上它，这里就能获得

			const __zp_sseed__=param.seed;
			const __zp_sts__=param.ts;
			const result=new window.ABC().z(__zp_sseed__, __zp_sts__);
			console.log(param,'===>',result)

			resolve({"zp_token":result,"user-agent":navigator.userAgent});
		})
	}
})();