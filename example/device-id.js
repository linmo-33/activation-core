/**
 * 浏览器环境下的设备ID生成器
 * 使用最简单的方式生成设备标识
 */
class DeviceIdGenerator {
    /**
     * 生成设备ID
     * @returns {string} 32位十六进制设备ID
     */
    static generate() {
        // 获取时间戳并确保为正数
        const timestamp = Math.abs(Date.now());

        // 获取随机数并确保为正数
        const random1 = Math.abs(Math.floor(Math.random() * 0xFFFFFFFF));
        const random2 = Math.abs(Math.floor(Math.random() * 0xFFFFFFFF));

        // 获取浏览器信息的简单哈希
        const userAgent = navigator.userAgent || 'unknown';
        const screenInfo = `${screen.width}x${screen.height}`;
        let browserHash = 0;
        const combined = userAgent + screenInfo;
        for (let i = 0; i < combined.length; i++) {
            browserHash = Math.abs(((browserHash << 5) - browserHash + combined.charCodeAt(i))) % 0xFFFFFFFF;
        }

        // 确保每个部分都是8位十六进制，用A-F填充而不是数字
        const part1 = (timestamp % 0xFFFFFFFF).toString(16).padStart(8, 'A').substring(0, 8);
        const part2 = (random1 % 0xFFFFFFFF).toString(16).padStart(8, 'B').substring(0, 8);
        const part3 = (random2 % 0xFFFFFFFF).toString(16).padStart(8, 'C').substring(0, 8);
        const part4 = (browserHash % 0xFFFFFFFF).toString(16).padStart(8, 'D').substring(0, 8);

        return (part1 + part2 + part3 + part4).toUpperCase();
    }

    /**
     * 获取设备信息摘要（简化版）
     */
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            screenResolution: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }

    /**
     * 验证设备ID格式
     */
    static isValidFormat(deviceId) {
        if (!deviceId || typeof deviceId !== 'string') {
            return false;
        }
        return deviceId.length === 32 && /^[0-9A-F]{32}$/.test(deviceId);
    }


}

// 导出到全局作用域（用于HTML页面）
if (typeof window !== 'undefined') {
    window.DeviceIdGenerator = DeviceIdGenerator;
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeviceIdGenerator;
}
