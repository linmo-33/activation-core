/**
 * 浏览器环境下的激活客户端
 * 负责与服务端API通信，处理激活码验证和状态检查
 */
class ActivationClient {
    constructor(apiBaseUrl, apiKey) {
        this.apiBaseUrl = apiBaseUrl.replace(/\/$/, ''); // 移除末尾斜杠
        this.apiKey = apiKey;
        this.timeout = 30000; // 30秒超时
    }

    /**
     * 激活设备
     * @param {string} deviceId 设备ID
     * @param {string} activationCode 激活码
     * @returns {Promise<Object>} 激活结果
     */
    async activate(deviceId, activationCode) {
        try {
            console.log(`开始激活设备: ${deviceId}`);

            const requestData = {
                device_id: deviceId,
                code: activationCode
            };

            const response = await this.makeRequest('/api/client/activate', 'POST', requestData);
            const result = await response.json();

            console.log(`激活API响应:`, result);

            if (result.success && result.data) {
                // 激活成功，保存到本地存储
                this.saveActivationStatus(deviceId, result.data);
                console.log('激活状态已保存到本地');
            }

            return result;
        } catch (error) {
            console.error('激活请求失败:', error);
            return {
                success: false,
                message: this.getErrorMessage(error)
            };
        }
    }

    /**
     * 验证设备激活状态
     * @param {string} deviceId 设备ID
     * @returns {Promise<Object>} 验证结果
     */
    async verify(deviceId) {
        try {
            console.log(`开始验证设备激活状态: ${deviceId}`);

            const requestData = {
                device_id: deviceId
            };

            const response = await this.makeRequest('/api/client/verify', 'POST', requestData);
            const result = await response.json();

            console.log(`验证API响应:`, result);

            if (result.success && result.data) {
                // 更新本地激活状态
                if (result.data.is_activated && result.data.activation_info) {
                    this.updateActivationStatus(deviceId, result.data);
                } else {
                    this.clearActivationStatus(deviceId);
                }
            }

            return result;
        } catch (error) {
            console.error('验证请求失败:', error);
            
            // 网络异常时，尝试使用本地缓存状态
            const localStatus = this.getLocalActivationStatus(deviceId);
            return {
                success: false,
                message: this.getErrorMessage(error),
                data: {
                    device_id: deviceId,
                    is_activated: localStatus ? this.isLocalStatusValid(localStatus) : false,
                    verified_at: new Date().toISOString(),
                    local_cache: true
                }
            };
        }
    }

    /**
     * 发送HTTP请求
     * @param {string} endpoint API端点
     * @param {string} method HTTP方法
     * @param {Object} data 请求数据
     * @returns {Promise<Response>} 响应对象
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey,
                'User-Agent': 'ActivationClient-Web/1.0'
            }
        };

        // 设置超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        options.signal = controller.signal;

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 保存激活状态到本地存储
     * @param {string} deviceId 设备ID
     * @param {Object} data 激活数据
     */
    saveActivationStatus(deviceId, data) {
        try {
            const status = {
                deviceId: deviceId,
                activatedAt: data.activated_at,
                expiresAt: data.expires_at,
                savedAt: new Date().toISOString()
            };

            const key = `activation_${deviceId}`;
            localStorage.setItem(key, JSON.stringify(status));
            console.log('激活状态已保存到localStorage');
        } catch (error) {
            console.warn('保存激活状态失败:', error);
        }
    }

    /**
     * 更新本地激活状态
     * @param {string} deviceId 设备ID
     * @param {Object} data 验证数据
     */
    updateActivationStatus(deviceId, data) {
        if (data.activation_info) {
            const activationData = {
                device_id: deviceId,
                activated_at: data.activation_info.activated_at,
                expires_at: data.activation_info.expires_at
            };
            this.saveActivationStatus(deviceId, activationData);
        }
    }

    /**
     * 获取本地激活状态
     * @param {string} deviceId 设备ID
     * @returns {Object|null} 本地激活状态
     */
    getLocalActivationStatus(deviceId) {
        try {
            const key = `activation_${deviceId}`;
            const stored = localStorage.getItem(key);
            
            if (!stored) return null;
            
            return JSON.parse(stored);
        } catch (error) {
            console.warn('读取本地激活状态失败:', error);
            return null;
        }
    }

    /**
     * 检查本地状态是否有效
     * @param {Object} status 本地状态
     * @returns {boolean} 是否有效
     */
    isLocalStatusValid(status) {
        if (!status) return false;

        // 检查是否过期
        if (status.expiresAt) {
            const expiresAt = new Date(status.expiresAt);
            if (expiresAt <= new Date()) {
                return false;
            }
        }

        // 检查保存时间是否过于久远（超过7天认为需要重新验证）
        const savedAt = new Date(status.savedAt);
        const daysSinceSaved = (new Date() - savedAt) / (1000 * 60 * 60 * 24);
        if (daysSinceSaved > 7) {
            return false;
        }

        return true;
    }

    /**
     * 清除本地激活状态
     * @param {string} deviceId 设备ID
     */
    clearActivationStatus(deviceId) {
        try {
            const key = `activation_${deviceId}`;
            localStorage.removeItem(key);
            console.log('本地激活状态已清除');
        } catch (error) {
            console.warn('清除本地激活状态失败:', error);
        }
    }

    /**
     * 检查设备是否已激活（仅检查本地状态）
     * @param {string} deviceId 设备ID
     * @returns {boolean} 是否已激活
     */
    static isActivatedLocally(deviceId) {
        try {
            const key = `activation_${deviceId}`;
            const stored = localStorage.getItem(key);
            
            if (!stored) return false;
            
            const status = JSON.parse(stored);
            
            // 检查是否过期
            if (status.expiresAt) {
                const expiresAt = new Date(status.expiresAt);
                if (expiresAt <= new Date()) {
                    return false;
                }
            }

            return true;
        } catch (error) {
            console.warn('检查本地激活状态失败:', error);
            return false;
        }
    }

    /**
     * 获取本地激活状态（静态方法）
     * @param {string} deviceId 设备ID
     * @returns {Object|null} 本地激活状态
     */
    static getLocalActivationStatus(deviceId) {
        try {
            const key = `activation_${deviceId}`;
            const stored = localStorage.getItem(key);
            
            if (!stored) return null;
            
            return JSON.parse(stored);
        } catch (error) {
            console.warn('读取本地激活状态失败:', error);
            return null;
        }
    }

    /**
     * 获取错误消息
     * @param {Error} error 错误对象
     * @returns {string} 用户友好的错误消息
     */
    getErrorMessage(error) {
        if (error.name === 'AbortError') {
            return '请求超时，请检查网络连接';
        }
        
        if (error.message.includes('Failed to fetch')) {
            return '网络连接失败，请检查网络设置';
        }
        
        if (error.message.includes('HTTP 401')) {
            return 'API密钥无效，请检查配置';
        }
        
        if (error.message.includes('HTTP 429')) {
            return '请求过于频繁，请稍后重试';
        }
        
        if (error.message.includes('HTTP 500')) {
            return '服务器内部错误，请稍后重试';
        }
        
        return error.message || '未知错误';
    }

    /**
     * 设置请求超时时间
     * @param {number} timeout 超时时间（毫秒）
     */
    setTimeout(timeout) {
        this.timeout = timeout;
    }

    /**
     * 获取激活状态摘要
     * @param {string} deviceId 设备ID
     * @returns {Object} 状态摘要
     */
    getActivationSummary(deviceId) {
        const localStatus = this.getLocalActivationStatus(deviceId);
        
        if (!localStatus) {
            return {
                isActivated: false,
                status: 'not_activated',
                message: '设备未激活'
            };
        }

        if (!this.isLocalStatusValid(localStatus)) {
            return {
                isActivated: false,
                status: 'expired',
                message: '激活已过期或需要重新验证'
            };
        }

        const remainingTime = localStatus.expiresAt ? 
            new Date(localStatus.expiresAt) - new Date() : null;

        return {
            isActivated: true,
            status: 'activated',
            message: '设备已激活',
            activatedAt: localStatus.activatedAt,
            expiresAt: localStatus.expiresAt,
            isPermanent: !localStatus.expiresAt,
            remainingDays: remainingTime ? Math.ceil(remainingTime / (1000 * 60 * 60 * 24)) : null
        };
    }
}

// 导出到全局作用域（用于HTML页面）
if (typeof window !== 'undefined') {
    window.ActivationClient = ActivationClient;
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivationClient;
}
