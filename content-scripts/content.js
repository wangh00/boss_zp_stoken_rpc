// content.js - 只负责显示
(function() {
    'use strict';

	
    if (window.bossExtensionLoaded) return;
    window.bossExtensionLoaded = true;
    window.error_count=0;
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
		
		var demo = new RPCclient(rpc_url);
		
		demo.regAction("data_encode", function (resolve,param) {


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
				if (window.error_count>=20){
					console.log('ABC未正确加载,刷新...')
					window.forceRefresh()
				}
				resolve({})
			}
		})
	}
})();
