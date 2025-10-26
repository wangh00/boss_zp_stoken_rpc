// popup.js - 包含所有RPC逻辑
let currentConfig = {
    rpcUrl: null,
    targetUrl: 'https://www.zhipin.com/'
};

let rpcConnection = null;

document.addEventListener('DOMContentLoaded', function() {
    loadConfig();
    
    document.getElementById('saveBtn').addEventListener('click', saveConfig);
    document.getElementById('testRpcBtn').addEventListener('click', testRpcConnection);
});

// 加载配置
function loadConfig() {
    try {
        const saved = localStorage.getItem('bossConfig');
        if (saved) {
            currentConfig = JSON.parse(saved);
            updateDisplay();
        }
    } catch (error) {
        showStatus('加载配置失败', 'error');
    }
}

// 更新显示
function updateDisplay() {
    document.getElementById('rpcUrl').value = currentConfig.rpcUrl || '';
    document.getElementById('targetUrl').value = 
        currentConfig.targetUrl === 'https://www.zhipin.com/' ? '' : currentConfig.targetUrl;
    document.getElementById('currentRpc').textContent = currentConfig.rpcUrl || '未设置';
    document.getElementById('currentTarget').textContent = currentConfig.targetUrl;
}


function validateWebSocketUrl(url) {
    try {
        const urlObj = new URL(url);
        
        // 1. 必须以 ws:// 或 wss:// 开头
        if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
            return false;
        }
        
        // 2. 路径必须是 /ws
        if (urlObj.pathname !== '/ws') {
            return false;
        }
        
        // 3. 必须包含 group=boss 参数
        const groupParam = urlObj.searchParams.get('group');
        if (groupParam !== 'boss') {
            return false;
        }
        
        // 4. 验证IP和端口格式（可选，更严格的验证）
        const hostname = urlObj.hostname;
        const port = urlObj.port;
        
        // IP地址验证（IPv4）
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(hostname) && hostname !== 'localhost') {
            // 如果不是IP地址也不是localhost，检查是否是有效的域名
            const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!domainRegex.test(hostname)) {
                return false;
            }
        }
        
        // 端口验证（1-65535）
        if (port && (port < 1 || port > 65535)) {
            return false;
        }
        
        return true;
        
    } catch (error) {
        return false;
    }
}


// 保存配置
async function saveConfig() {
    const rpcUrl = document.getElementById('rpcUrl').value.trim();
    let targetUrl = document.getElementById('targetUrl').value.trim();
    
    if (!targetUrl) {
        targetUrl = 'https://www.zhipin.com/';
    }
    
    // 验证URL
    const isValidWsUrl = validateWebSocketUrl(rpcUrl);
	if (!isValidWsUrl) {
		showStatus('RPC地址必须是WebSocket格式 (ws://IP:端口/ws?group=boss)', 'error');
		return;
	}
    
    if (targetUrl && !targetUrl.includes('zhipin.com')) {
        showStatus('目标页面必须是Boss直聘网址', 'error');
        return;
    }
    
    currentConfig = { rpcUrl, targetUrl };
    
    try {
        // 保存到localStorage
        localStorage.setItem('bossConfig', JSON.stringify(currentConfig));
        
        // 注入配置到所有Boss页面
        await injectConfigToPages();
        
        showStatus('配置保存成功!', 'success');
        updateDisplay();
        
    } catch (error) {
        showStatus('保存失败: ' + error.message, 'error');
    }
}

// 注入配置到所有Boss页面
async function injectConfigToPages() {
    const tabs = await chrome.tabs.query({ url: 'https://*.zhipin.com/*' });
 
	
	
    for (const tab of tabs) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (config) => {
                    // 保存配置到页面
                    localStorage.setItem('bossConfig', JSON.stringify(config));
                    
                    // 触发配置更新事件
                    window.dispatchEvent(new CustomEvent('bossConfigUpdate', { 
                        detail: config 
                    }));
                    
                    console.log('配置已更新:', config);
                },
                args: [currentConfig]
            });
        } catch (error) {
            console.log(`注入配置到 ${tab.url} 失败:`, error);
        }
    }
}




async function testRpcConnection() {
    const rpcUrl = document.getElementById('rpcUrl').value.trim();

    if (!rpcUrl) {
        showStatus('请先输入RPC地址', 'error');
        return;
    }

    
	const host=new URL(rpcUrl).host
	const test_url=`http://${host}/list`
	showStatus(`复制链接:${test_url} 到浏览器查看`, 'info');
	return 
	try {
        const response = await fetch(test_url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
				'Accept': 'application/json',
				'user-agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
            },
			mode: 'cors', // 明确指定 CORS 模式
        });
        let res = await response.json();
		if (res.data["boss"] && response.ok){
			return ['接口测试可用','info']
		}else if (!res.data["boss"] && response.ok){
			return ['未找到boss接口','error']
		}else {
			return [response.ok,'error'];
		}

    } catch (error) {
        return [error,'error'];
    }
}

async function testRpc(){
	const r=await testRpcConnection();
	showStatus(r[0],r[1])
}


function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    
    if (type !== 'info') {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = 'status';
        }, 5000);
    }
}