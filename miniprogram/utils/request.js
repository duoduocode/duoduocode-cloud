const BASE_URL = 'http://localhost:8080/v1';

let _token = '';
let _tokenExpireTime = 0;
let _refreshPromise = null;
let _loginPromise = null;

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

function _doHttpRequest(method, url, data, extraHeaders) {
  return new Promise(function (resolve, reject) {
    var header = { 'Content-Type': 'application/json' };
    if (extraHeaders) {
      for (var k in extraHeaders) {
        if (extraHeaders.hasOwnProperty(k)) header[k] = extraHeaders[k];
      }
    }
    wx.request({
      url: BASE_URL + url,
      method: method,
      header: header,
      data: data,
      timeout: 30000,
      success: function (res) { resolve(res); },
      fail: function (err) { reject(err); }
    });
  });
}

async function refreshToken() {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async function () {
    try {
      var oldToken = getToken();
      if (!oldToken) throw new Error('无token可刷新');

      var res = await _doHttpRequest('POST', '/auth/refresh-token', { token: oldToken });
      var body = res.data;
      if (res.statusCode === 200 && body && body.code === 0 && body.data && body.data.token) {
        setToken(body.data.token, 86400);
        return body.data.token;
      }
      throw new Error('刷新token失败');
    } catch (e) {
      clearToken();
      throw e;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
}

async function silentLogin() {
  if (_loginPromise) return _loginPromise;

  _loginPromise = (async function () {
    try {
      var loginRes = await new Promise(function (resolve, reject) {
        wx.login({ success: resolve, fail: reject });
      });
      if (!loginRes.code) throw new Error('获取微信code失败');

      var res = await _doHttpRequest('POST', '/auth/login', { code: loginRes.code });
      var body = res.data;
      if (res.statusCode === 200 && body && body.code === 0 && body.data && body.data.token) {
        setToken(body.data.token, 86400);
        return body.data;
      }
      var msg = (body && body.message) || '登录失败';
      throw new Error(msg);
    } catch (e) {
      clearToken();
      throw e;
    } finally {
      _loginPromise = null;
    }
  })();

  return _loginPromise;
}

async function login(code) {
  var res = await _doHttpRequest('POST', '/auth/login', { code: code });
  var body = res.data;
  if (res.statusCode === 200 && body && body.code === 0) return body.data;
  var msg = (body && body.message) || '登录失败';
  throw new Error(msg);
}

async function devLogin(userId) {
  var res = await _doHttpRequest('POST', '/auth/dev-login', { userId: userId || 1 });
  var body = res.data;
  if (res.statusCode === 200 && body && body.code === 0) return body.data;
  var msg = (body && body.message) || '登录失败';
  throw new Error(msg);
}

async function tryRestoreAuth() {
  try {
    var oldToken = getToken();
    if (oldToken) {
      await refreshToken();
      return true;
    }
  } catch (e) {}

  try {
    await silentLogin();
    return true;
  } catch (e) {
    return false;
  }
}

function request(method, url, data, options) {
  options = options || {};
  var showLoading = options.showLoading || false;
  var loadingText = options.loadingText || '加载中...';
  var noAuth = options.noAuth || false;
  var silent = options.silent || false;
  var isRetry = options._isRetry || false;

  var token = noAuth ? '' : getToken();

  if (showLoading) wx.showLoading({ title: loadingText, mask: true });

  return new Promise(function (resolve, reject) {
    var header = { 'Content-Type': 'application/json' };
    if (token && !noAuth) {
      header['Authorization'] = 'Bearer ' + token;
    }

    wx.request({
      url: BASE_URL + url,
      method: method,
      header: header,
      data: data,
      timeout: 30000,
      success: async function (res) {
        if (showLoading) wx.hideLoading();
        var statusCode = res.statusCode;
        var body = res.data;

        if (statusCode === 200 && body && body.code === 0) {
          resolve(body.data);
          return;
        }

        if ((statusCode === 401 || (body && body.code === 401)) && !noAuth && !isRetry) {
          var restored = await tryRestoreAuth();
          if (restored) {
            try {
              var retryResult = await request(method, url, data, Object.assign({}, options, { _isRetry: true }));
              resolve(retryResult);
            } catch (retryErr) {
              reject(retryErr);
            }
          } else {
            clearToken();
            wx.showToast({ title: '登录已过期，请重启小程序', icon: 'none', duration: 2500 });
            reject(new Error('认证恢复失败'));
          }
          return;
        }

        var msg = (body && (body.message || body.msg)) || '请求失败';
        if (!silent) wx.showToast({ title: msg, icon: 'none', duration: 2000 });
        reject(new Error(msg));
      },
      fail: function (err) {
        if (showLoading) wx.hideLoading();
        var msg = err.errMsg || '网络错误';
        if (!silent) wx.showToast({ title: msg, icon: 'none', duration: 2000 });
        reject(err);
      }
    });
  });
}

var api = {
  get: function (url, data, opts) { return request('GET', url, data, opts); },
  post: function (url, data, opts) { return request('POST', url, data, opts); },
  put: function (url, data, opts) { return request('PUT', url, data, opts); },
  delete: function (url, data, opts) { return request('DELETE', url, data, opts); }
};

module.exports = { api: api, getToken: getToken, setToken: setToken, clearToken: clearToken, login: login, devLogin: devLogin, silentLogin: silentLogin, tryRestoreAuth: tryRestoreAuth, BASE_URL: BASE_URL };
