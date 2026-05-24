// API 请求工具 - REST API + JWT 认证

const BASE_URL = 'http://localhost:8080/v1';

let _token = '';
let _tokenExpireTime = 0;

// 获取Token
function getToken() {
  if (_token && Date.now() < _tokenExpireTime) return _token;
  try {
    const stored = wx.getStorageSync('access_token');
    const expireAt = wx.getStorageSync('token_expire_at');
    if (stored && expireAt && Date.now() < expireAt) {
      _token = stored;
      _tokenExpireTime = expireAt;
      return _token;
    }
  } catch (e) {}
  return '';
}

function setToken(token, expireIn) {
  _token = token;
  _tokenExpireTime = Date.now() + (expireIn || 7200) * 1000;
  wx.setStorageSync('access_token', token);
  wx.setStorageSync('token_expire_at', _tokenExpireTime);
}

function clearToken() {
  _token = '';
  _tokenExpireTime = 0;
  wx.removeStorageSync('access_token');
  wx.removeStorageSync('token_expire_at');
}

// 开发环境登录
async function devLogin(nickname) {
  return request('POST', '/auth/dev-login', {
    openid: 'dev-' + Date.now(),
    nickname: nickname || '测试用户',
    avatarUrl: ''
  });
}

// 通用请求方法
function request(method, url, data = {}, options = {}) {
  const { showLoading = false, loadingText = '加载中...', noAuth = false } = options;
  const token = getToken();

  if (showLoading) wx.showLoading({ title: loadingText, mask: true });

  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method,
      header: {
        'Content-Type': 'application/json',
        ...(token && !noAuth ? { 'Authorization': 'Bearer ' + token } : {})
      },
      data: method === 'GET' ? undefined : data,
      timeout: 30000,
      success: (res) => {
        if (showLoading) wx.hideLoading();
        const { statusCode, data: body } = res;

        if (statusCode === 200 && body.code === 0) {
          resolve(body.data);
        } else if (statusCode === 401 || body.code === 401) {
          clearToken();
          wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
          reject(new Error('未授权'));
        } else {
          const msg = body.message || body.msg || '请求失败';
          if (!options.silent) wx.showToast({ title: msg, icon: 'none', duration: 2000 });
          reject(new Error(msg));
        }
      },
      fail: (err) => {
        if (showLoading) wx.hideLoading();
        const msg = err.errMsg || '网络错误';
        if (!options.silent) wx.showToast({ title: msg, icon: 'none', duration: 2000 });
        reject(err);
      }
    });
  });
}

const api = {
  get: (url, data, opts) => request('GET', url, data, opts),
  post: (url, data, opts) => request('POST', url, data, opts),
  put: (url, data, opts) => request('PUT', url, data, opts),
  delete: (url, data, opts) => request('DELETE', url, data, opts)
};

module.exports = { api, getToken, setToken, clearToken, devLogin, BASE_URL };
