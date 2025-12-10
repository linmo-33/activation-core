# 🔐 激活码验证系统使用指南

## 📋 系统概述

激活码管理系统基于 **ES256 数字签名** 实现防篡改的客户端激活验证，确保 API 响应在传输过程中不被恶意修改。

### 核心技术

- **签名算法**: ES256 (ECDSA + P-256 + SHA-256)
- **数据格式**: JWT (JSON Web Token)
- **防重放**: Nonce + 时间戳机制
- **传输安全**: HTTPS + 数字签名双重保护

## 🔄 工作流程

```
客户端                    服务端
   │                        │
   ├─ 1. 发送激活请求------->│
   │                        ├─ 2. 验证激活码
   │                        ├─ 3. 生成签名响应
   │<-4. 返回签名数据 -------┤
   ├─ 5. 验证响应签名        │
   ├─ 6. 检查时间戳/Nonce    │
   └─ 7. 保存激活状态        │
```

## 🎯 激活码类型

系统支持四种激活码类型，满足不同的业务场景：

### 1. ♾️ 永久激活码
- **有效期**: 永不过期
- **expires_at**: `null`
- **适用场景**: 永久授权、买断制软件
- **示例响应**:
  ```json
  {
    "activated_at": "2024-01-15 10:30:00",
    "expires_at": null  // 永久有效
  }
  ```

### 2. 📅 日卡
- **有效期**: 激活后 24 小时
- **计算方式**: 从激活时刻开始计时
- **适用场景**: 短期试用、临时访问
- **示例响应**:
  ```json
  {
    "activated_at": "2024-01-15 10:30:00",
    "expires_at": "2024-01-16 10:30:00"  // 激活后24小时
  }
  ```

### 3. 📆 月卡
- **有效期**: 激活后 30 天
- **计算方式**: 从激活时刻开始计时
- **适用场景**: 月度订阅、会员服务
- **示例响应**:
  ```json
  {
    "activated_at": "2024-01-15 10:30:00",
    "expires_at": "2024-02-14 10:30:00"  // 激活后30天
  }
  ```

### 4. ⏰ 指定时间
- **有效期**: 在指定时间点过期
- **计算方式**: 绝对时间，无论是否激活
- **适用场景**: 限时活动、促销码
- **示例响应**:
  ```json
  {
    "activated_at": "2024-01-15 10:30:00",
    "expires_at": "2024-12-31 23:59:59"  // 固定过期时间
  }
  ```

## 📡 API 接口

### 激活接口

```
POST /api/client/activate
Headers: X-API-Key: your-api-key
Body: { "code": "U2m9Lw2cjOaV8WQDx3Hy", "device_id": "device-uuid" }
```

### 验证接口

```
POST /api/client/verify
Headers: X-API-Key: your-api-key
Body: { "device_id": "device-uuid" }
```

### 响应格式

#### 成功响应

```json
{
  "success": true,
  "message": "激活成功",
  "data": {
    "code": "U2m9Lw2cjOaV8WQDx3Hy",
    "device_id": "device-uuid",
    "activated_at": "2024-01-15 10:30:00",
    "expires_at": "2024-02-14 10:30:00",  // 月卡示例，永久激活码为 null
    "license_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NiJ9...",
    "nonce": "a1b2c3d4e5f6...",
    "ts": 1704067200000,
    "alg": "ES256"
  }
}
```

#### 错误响应

```json
{
  "success": false,
  "message": "该设备已激活，每个设备只能同时使用一个激活码",
  "error_code": "DEVICE_ALREADY_ACTIVATED"
}
```

**错误码说明：**
- `DEVICE_ALREADY_ACTIVATED` - 设备已激活
- `CODE_ALREADY_USED` - 激活码已被使用
- `CODE_EXPIRED` - 激活码已过期
- `CODE_NOT_FOUND` - 激活码不存在
- `ACTIVATION_FAILED` - 其他激活失败原因

## 💻 JavaScript 客户端示例

### 基础激活流程

```javascript
// 1. 配置客户端
const client = new ActivationClient("https://api.example.com", "your-api-key", {
  enableSignatureVerification: true,
  publicKeyPem: `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...
-----END PUBLIC KEY-----`,
  maxClockSkew: 90000, // 90秒时钟偏差容忍
});

// 2. 执行激活
async function activateDevice() {
  try {
    const deviceId = generateDeviceId();
    const activationCode = "U2m9Lw2cjOaV8WQDx3Hy";

    const result = await client.activate(deviceId, activationCode);

    if (result.success) {
      console.log("✅ 激活成功，响应已验签");
      
      // 判断激活码类型
      const isPermanent = result.data.expires_at === null;
      console.log(`激活码类型: ${isPermanent ? '永久' : '有期限'}`);
      
      if (!isPermanent) {
        console.log(`过期时间: ${result.data.expires_at}`);
      }
      
      localStorage.setItem(
        "activation_status",
        JSON.stringify({
          device_id: deviceId,
          code: result.data.code,
          is_activated: true,
          activated_at: result.data.activated_at,
          expires_at: result.data.expires_at,
          is_permanent: isPermanent,
          signature_verified: true,
        })
      );
    }
  } catch (error) {
    console.error("❌ 激活失败:", error.message);
    
    // 处理不同的错误类型
    if (error.error_code === 'DEVICE_ALREADY_ACTIVATED') {
      console.log('设备已激活，无需重复激活');
    } else if (error.error_code === 'CODE_EXPIRED') {
      console.log('激活码已过期，请联系管理员');
    }
  }
}

// 3. 验证激活状态
async function verifyActivation() {
  try {
    const deviceId = getStoredDeviceId();
    const result = await client.verify(deviceId);

    if (result.success && result.data.is_activated) {
      console.log("✅ 设备已激活且响应已验签");
      
      // 检查是否过期
      if (result.data.expires_at) {
        const expiresAt = new Date(result.data.expires_at);
        const now = new Date();
        
        if (expiresAt > now) {
          const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
          console.log(`剩余有效期: ${daysLeft} 天`);
        } else {
          console.log("⚠️ 激活码已过期");
          return false;
        }
      } else {
        console.log("永久激活码，无过期时间");
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ 验证失败:", error.message);
    return false;
  }
}
```

### 手动签名验证

```javascript
// 手动验证服务端响应签名
async function verifyResponse(responseData) {
  const { license_token, nonce, ts, alg } = responseData.data;

  // 1. 基础检查
  if (!license_token || !nonce || !ts || alg !== "ES256") {
    throw new Error("响应格式错误或算法不支持");
  }

  // 2. 时间验证
  const timeDiff = Math.abs(Date.now() - parseInt(ts));
  if (timeDiff > 90000) {
    throw new Error("服务端时间偏差过大");
  }

  // 3. JWT 解析
  const [header, payload, signature] = license_token.split(".");
  const claims = JSON.parse(atob(payload));

  // 4. 内容验证
  if (claims.nonce !== nonce || claims.ts !== parseInt(ts)) {
    throw new Error("载荷数据不匹配");
  }

  // 5. 密码学验证
  const publicKey = await importPublicKey(PUBLIC_KEY_PEM);
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sig = base64urlToArrayBuffer(signature);

  const isValid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    sig,
    data
  );

  if (!isValid) {
    throw new Error("数字签名验证失败");
  }

  console.log("✅ 响应签名验证通过");
  return true;
}
```

## 🔧 C 语言客户端示例

### 基础结构定义

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <openssl/ec.h>
#include <openssl/evp.h>
#include <openssl/sha.h>
#include <curl/curl.h>
#include <json-c/json.h>

// 激活响应结构
typedef struct {
    int success;
    char device_id[64];
    char activated_at[32];
    char expires_at[32];
    char license_token[1024];
    char nonce[64];
    long timestamp;
    char algorithm[16];
} activation_response_t;

// 配置结构
typedef struct {
    char api_url[256];
    char api_key[256];
    char public_key_pem[2048];
    int enable_verification;
    int max_clock_skew;
} client_config_t;
```

### HTTP 请求实现

```c
// HTTP 响应结构
struct http_response {
    char *data;
    size_t size;
};

// 响应回调函数
static size_t write_callback(void *contents, size_t size, size_t nmemb, struct http_response *response) {
    size_t realsize = size * nmemb;
    response->data = realloc(response->data, response->size + realsize + 1);
    if (response->data) {
        memcpy(&(response->data[response->size]), contents, realsize);
        response->size += realsize;
        response->data[response->size] = 0;
    }
    return realsize;
}

// 发送激活请求
int send_activation_request(const client_config_t *config, const char *device_id,
                           const char *activation_code, activation_response_t *response) {
    CURL *curl;
    CURLcode res;
    struct http_response http_resp = {0};

    curl = curl_easy_init();
    if (!curl) return -1;

    // 构建请求数据
    json_object *json_data = json_object_new_object();
    json_object *json_code = json_object_new_string(activation_code);
    json_object *json_device = json_object_new_string(device_id);
    json_object_object_add(json_data, "code", json_code);
    json_object_object_add(json_data, "device_id", json_device);

    const char *post_data = json_object_to_json_string(json_data);

    // 设置请求头
    struct curl_slist *headers = NULL;
    char auth_header[512];
    snprintf(auth_header, sizeof(auth_header), "X-API-Key: %s", config->api_key);
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, auth_header);

    // 配置 CURL
    char url[512];
    snprintf(url, sizeof(url), "%s/api/client/activate", config->api_url);

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, post_data);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &http_resp);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);

    // 执行请求
    res = curl_easy_perform(curl);

    // 清理资源
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);
    json_object_put(json_data);

    if (res != CURLE_OK) {
        free(http_resp.data);
        return -1;
    }

    // 解析响应
    if (parse_activation_response(http_resp.data, response) != 0) {
        free(http_resp.data);
        return -1;
    }

    free(http_resp.data);
    return 0;
}
```

### 签名验证实现

```c
// 验证响应签名
int verify_response_signature(const client_config_t *config, const activation_response_t *response) {
    if (!config->enable_verification) {
        printf("⚠️ 签名验证已禁用\n");
        return 0;
    }

    // 1. 时间验证
    time_t current_time = time(NULL) * 1000;
    long time_diff = abs(current_time - response->timestamp);
    if (time_diff > config->max_clock_skew) {
        printf("❌ 服务端时间偏差过大: %ld ms\n", time_diff);
        return -1;
    }

    // 2. 算法检查
    if (strcmp(response->algorithm, "ES256") != 0) {
        printf("❌ 不支持的签名算法: %s\n", response->algorithm);
        return -1;
    }

    // 3. JWT 解析和验证
    if (verify_jwt_signature(response->license_token, config->public_key_pem) != 0) {
        printf("❌ JWT 签名验证失败\n");
        return -1;
    }

    printf("✅ 响应签名验证通过\n");
    return 0;
}

// JWT 签名验证
int verify_jwt_signature(const char *jwt_token, const char *public_key_pem) {
    // 分割 JWT
    char *token_copy = strdup(jwt_token);
    char *header = strtok(token_copy, ".");
    char *payload = strtok(NULL, ".");
    char *signature = strtok(NULL, ".");

    if (!header || !payload || !signature) {
        free(token_copy);
        return -1;
    }

    // 构建签名数据
    char sign_data[2048];
    snprintf(sign_data, sizeof(sign_data), "%s.%s", header, payload);

    // 加载公钥
    BIO *bio = BIO_new_mem_buf(public_key_pem, -1);
    EVP_PKEY *pkey = PEM_read_bio_PUBKEY(bio, NULL, NULL, NULL);
    BIO_free(bio);

    if (!pkey) {
        free(token_copy);
        return -1;
    }

    // 解码签名
    unsigned char sig_bytes[128];
    int sig_len = base64url_decode(signature, sig_bytes, sizeof(sig_bytes));

    // 验证签名
    EVP_MD_CTX *ctx = EVP_MD_CTX_new();
    int result = -1;

    if (EVP_DigestVerifyInit(ctx, NULL, EVP_sha256(), NULL, pkey) == 1 &&
        EVP_DigestVerify(ctx, sig_bytes, sig_len,
                        (unsigned char*)sign_data, strlen(sign_data)) == 1) {
        result = 0;
    }

    // 清理资源
    EVP_MD_CTX_free(ctx);
    EVP_PKEY_free(pkey);
    free(token_copy);

    return result;
}
```

### 完整使用示例

```c
int main() {
    // 1. 配置客户端
    client_config_t config = {
        .api_url = "https://api.example.com",
        .api_key = "your-api-key",
        .public_key_pem = "-----BEGIN PUBLIC KEY-----\n"
                         "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...\n"
                         "-----END PUBLIC KEY-----\n",
        .enable_verification = 1,
        .max_clock_skew = 90000
    };

    // 2. 执行激活
    activation_response_t response = {0};
    const char *device_id = "device-12345";
    const char *activation_code = "ABC123DEF456";

    printf("🔄 正在发送激活请求...\n");
    if (send_activation_request(&config, device_id, activation_code, &response) == 0) {
        printf("📡 收到服务端响应\n");

        // 3. 验证响应签名
        if (verify_response_signature(&config, &response) == 0) {
            printf("✅ 激活成功，响应已验签\n");
            printf("   设备ID: %s\n", response.device_id);
            printf("   激活时间: %s\n", response.activated_at);
            printf("   过期时间: %s\n", response.expires_at);

            // 4. 保存激活状态
            save_activation_status(&response);
        } else {
            printf("❌ 响应签名验证失败，拒绝激活\n");
        }
    } else {
        printf("❌ 激活请求失败\n");
    }

    return 0;
}
```

## 🔑 密钥管理

### 生成密钥对

```bash
# 方法1: 使用项目脚本
pnpm run generate-keys

# 方法2: 使用 OpenSSL
openssl ecparam -genkey -name prime256v1 -noout -out private.pem
openssl ec -in private.pem -pubout -out public.pem
```

### 环境变量配置

```bash
# 服务端环境变量
RESPONSE_SIGN_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\n..."
CLIENT_API_KEY="your-secure-api-key"
RESPONSE_SIGN_KEY_ID="key-v1"
RESPONSE_SIGN_TOKEN_TTL_SEC=120
```

## 🚨 安全注意事项

### 重要安全原则

1. **私钥保护**: 服务端私钥绝对不能泄露
2. **公钥验证**: 客户端必须使用正确的公钥验证签名
3. **时间同步**: 客户端和服务端时间差不应超过设定阈值
4. **HTTPS 必需**: 签名验证不能替代传输层加密
5. **错误处理**: 签名验证失败必须拒绝使用响应数据

### 常见风险

- ❌ 禁用签名验证
- ❌ 使用错误的公钥
- ❌ 忽略时间戳检查
- ❌ 接受未验签的响应
- ❌ 在不安全网络下传输

### 最佳实践

- ✅ 生产环境强制启用签名验证
- ✅ 定期轮换密钥对
- ✅ 监控验证失败事件
- ✅ 实施完整的错误处理
- ✅ 使用安全的密钥存储方案

## 💡 客户端最佳实践

### 1. 过期时间处理

```javascript
// 检查激活码是否过期
function isActivationExpired(expiresAt) {
  if (expiresAt === null) {
    return false; // 永久激活码永不过期
  }
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  
  return expiryDate <= now;
}

// 计算剩余天数
function getDaysRemaining(expiresAt) {
  if (expiresAt === null) {
    return Infinity; // 永久激活码
  }
  
  const expiryDate = new Date(expiresAt);
  const now = new Date();
  const diffMs = expiryDate - now;
  
  if (diffMs <= 0) {
    return 0; // 已过期
  }
  
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
```

### 2. 错误处理

```javascript
async function handleActivation(code, deviceId) {
  try {
    const result = await client.activate(deviceId, code);
    return { success: true, data: result.data };
  } catch (error) {
    // 根据错误码提供友好提示
    const errorMessages = {
      'DEVICE_ALREADY_ACTIVATED': '该设备已激活，无需重复激活',
      'CODE_ALREADY_USED': '激活码已被其他设备使用',
      'CODE_EXPIRED': '激活码已过期，请联系管理员',
      'CODE_NOT_FOUND': '激活码不存在，请检查输入',
      'ACTIVATION_FAILED': '激活失败，请稍后重试'
    };
    
    const message = errorMessages[error.error_code] || error.message;
    return { success: false, message };
  }
}
```

### 3. 本地状态管理

```javascript
// 保存激活状态
function saveActivationStatus(data) {
  const status = {
    device_id: data.device_id,
    code: data.code,
    is_activated: true,
    activated_at: data.activated_at,
    expires_at: data.expires_at,
    is_permanent: data.expires_at === null,
    last_verified: new Date().toISOString(),
    signature_verified: true
  };
  
  localStorage.setItem('activation_status', JSON.stringify(status));
}

// 读取激活状态
function getActivationStatus() {
  const stored = localStorage.getItem('activation_status');
  if (!stored) return null;
  
  const status = JSON.parse(stored);
  
  // 检查是否过期
  if (isActivationExpired(status.expires_at)) {
    console.log('本地激活状态已过期');
    return null;
  }
  
  return status;
}
```

---

📝 **文档版本**: v2.0  
🔄 **最后更新**: 2025 年 12 月  
📧 **技术支持**: 请查看项目 README 或提交 Issue
