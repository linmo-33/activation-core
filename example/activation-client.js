/**
 * 浏览器环境下的激活客户端
 * 负责与服务端API通信，处理激活码验证和状态检查
 * 支持服务端响应签名验证，防止抓包篡改
 */
class ActivationClient {
    constructor(apiBaseUrl, apiKey, options = {}) {
        this.apiBaseUrl = apiBaseUrl.replace(/\/$/, ''); // 移除末尾斜杠
        this.apiKey = apiKey;
        this.timeout = options.timeout || 30000; // 30秒超时
        this.enableSignatureVerification = options.enableSignatureVerification !== false; // 默认启用
        this.publicKeyPem = options.publicKeyPem || null; // ES256 公钥
        this.maxClockSkew = options.maxClockSkew || 90000; // 90秒时钟偏差容忍
        this.nonceCache = new Set(); // 用于防重放的 nonce 缓存

        // 如果启用签名验证但没有提供公钥，给出警告
        if (this.enableSignatureVerification && !this.publicKeyPem) {
            console.warn('⚠️ 签名验证已启用但未提供公钥，将跳过验签检查');
            this.enableSignatureVerification = false;
        }
    }

    /**
     * 导入 ES256 公钥用于验签
     * @param {string} publicKeyPem PEM 格式的公钥
     * @returns {Promise<CryptoKey>} WebCrypto 公钥对象
     */
    async importPublicKey(publicKeyPem) {
        try {
            // 移除 PEM 头尾和换行符
            const keyData = publicKeyPem
                .replace(/-----BEGIN PUBLIC KEY-----/, '')
                .replace(/-----END PUBLIC KEY-----/, '')
                .replace(/\s/g, '');

            // Base64 解码
            const binaryKey = atob(keyData);
            const keyBytes = new Uint8Array(binaryKey.length);
            for (let i = 0; i < binaryKey.length; i++) {
                keyBytes[i] = binaryKey.charCodeAt(i);
            }

            // 导入为 WebCrypto 密钥
            return await crypto.subtle.importKey(
                'spki',
                keyBytes,
                {
                    name: 'ECDSA',
                    namedCurve: 'P-256'
                },
                false,
                ['verify']
            );
        } catch (error) {
            console.error('公钥导入失败:', error);
            throw new Error('公钥格式无效或不支持');
        }
    }

    /**
     * 验证服务端响应签名
     * @param {Object} responseData 服务端响应数据
     * @param {string} route API 路径
     * @returns {Promise<boolean>} 验证结果
     */
    async verifyServerSignature(responseData, route) {
        if (!this.enableSignatureVerification || !this.publicKeyPem) {
            console.warn('跳过签名验证：未启用或未配置公钥');
            return true; // 跳过验证
        }

        try {
            const { license_token, nonce, ts, alg } = responseData.data || {};

            if (!license_token || !nonce || !ts) {
                console.error('响应缺少签名字段:', { license_token: !!license_token, nonce: !!nonce, ts: !!ts });
                return false;
            }

            // 检查算法
            if (alg && alg !== 'ES256') {
                console.error('不支持的签名算法:', alg);
                return false;
            }

            // 检查时钟偏差
            const serverTime = parseInt(ts);
            const localTime = Date.now();
            const timeDiff = Math.abs(localTime - serverTime);

            if (timeDiff > this.maxClockSkew) {
                console.error('服务端时间偏差过大:', {
                    serverTime: new Date(serverTime).toISOString(),
                    localTime: new Date(localTime).toISOString(),
                    diff: timeDiff,
                    maxAllowed: this.maxClockSkew
                });
                return false;
            }

            // 检查 nonce 重复（防重放）
            if (this.nonceCache.has(nonce)) {
                console.error('检测到重复的 nonce:', nonce);
                return false;
            }

            // 解析并验证 JWT
            const parts = license_token.split('.');
            if (parts.length !== 3) {
                console.error('License token 格式错误');
                return false;
            }

            // 解码 header 和 payload
            const header = JSON.parse(atob(parts[0]));
            const payload = JSON.parse(atob(parts[1]));

            // 验证 header
            if (header.alg !== 'ES256') {
                console.error('License token 算法不匹配:', header.alg);
                return false;
            }

            // 验证 payload 基础字段
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp && payload.exp < now) {
                console.error('License token 已过期:', {
                    exp: payload.exp,
                    now: now
                });
                return false;
            }

            // 验证 payload 内容与响应一致性
            if (payload.route !== route) {
                console.error('License token route 不匹配:', {
                    expected: route,
                    actual: payload.route
                });
                return false;
            }

            if (payload.nonce !== nonce || payload.ts !== serverTime) {
                console.error('License token 元数据不匹配:', {
                    nonce: { expected: nonce, actual: payload.nonce },
                    ts: { expected: serverTime, actual: payload.ts }
                });
                return false;
            }

            // 导入公钥并验证签名
            const publicKey = await this.importPublicKey(this.publicKeyPem);

            // 准备验签数据
            const signatureData = parts[0] + '.' + parts[1];
            const signature = this.base64urlToArrayBuffer(parts[2]);
            const data = new TextEncoder().encode(signatureData);

            // 执行 ECDSA 验签
            const isValid = await crypto.subtle.verify(
                {
                    name: 'ECDSA',
                    hash: 'SHA-256'
                },
                publicKey,
                signature,
                data
            );

            if (isValid) {
                // 验签成功，缓存 nonce（限制缓存大小，避免内存泄露）
                this.nonceCache.add(nonce);
                if (this.nonceCache.size > 1000) {
                    const firstNonce = this.nonceCache.values().next().value;
                    this.nonceCache.delete(firstNonce);
                }

                console.log('✅ 服务端响应签名验证通过');
                return true;
            } else {
                console.error('❌ 服务端响应签名验证失败');
                return false;
            }

        } catch (error) {
            console.error('签名验证过程出错:', error);
            return false;
        }
    }

    /**
     * Base64URL 解码为 ArrayBuffer
     * @param {string} base64url Base64URL 编码字符串
     * @returns {ArrayBuffer} 解码后的二进制数据
     */
    base64urlToArrayBuffer(base64url) {
        // 转换为标准 Base64
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);

        // 解码
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
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
                // 验证服务端签名
                const signatureValid = await this.verifyServerSignature(result, '/api/client/activate');

                if (!signatureValid) {
                    console.error('⚠️ 服务端响应签名验证失败，拒绝激活');
                    return {
                        success: false,
                        message: '服务端响应验证失败，请检查网络安全'
                    };
                }

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
                // 如果设备已激活且有签名字段，进行验证
                if (result.data.is_activated && result.data.license_token) {
                    const signatureValid = await this.verifyServerSignature(result, '/api/client/verify');

                    if (!signatureValid) {
                        console.error('⚠️ 服务端响应签名验证失败，清除本地状态');
                        this.clearActivationStatus(deviceId);
                        return {
                            success: false,
                            message: '服务端响应验证失败，请重新激活',
                            data: {
                                device_id: deviceId,
                                is_activated: false,
                                verified_at: new Date().toISOString(),
                                signature_failed: true
                            }
                        };
                    }
                }

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
                'User-Agent': 'ActivationClient-Web/2.0'
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
                savedAt: new Date().toISOString(),
                signatureVerified: this.enableSignatureVerification // 记录是否经过签名验证
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
            remainingDays: remainingTime ? Math.ceil(remainingTime / (1000 * 60 * 60 * 24)) : null,
            signatureVerified: localStatus.signatureVerified || false
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
