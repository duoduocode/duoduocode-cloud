var requestModule = require('./utils/request');
var api = requestModule.api;

App({
  globalData: {
    userInfo: null,
    token: '',
    userId: null,
    isLogin: false,
    loginFail: false
  },

  async onLaunch() {
    var token = requestModule.getToken();
    if (token) {
      this.globalData.token = token;
      var ok = await this.checkLoginStatus();
      if (ok) return;
      var refreshed = await this.tryRefreshToken();
      if (refreshed) return;
    }
    await this.wxLogin();
  },

  async checkLoginStatus() {
    try {
      var profile = await api.get('/user/profile');
      this.setLoginState({
        id: profile.id,
        token: requestModule.getToken(),
        avatarUrl: profile.avatarUrl || '',
        nickname: profile.nickname || '微信用户'
      });
      return true;
    } catch (err) {
      return false;
    }
  },

  async tryRefreshToken() {
    try {
      var newToken = await requestModule.refreshToken();
      if (newToken) {
        this.globalData.token = newToken;
        var ok = await this.checkLoginStatus();
        if (ok) return true;
      }
    } catch (e) {}
    return false;
  },

  async wxLogin() {
    try {
      var data = await requestModule.silentLogin();
      if (data && data.token) {
        this.setLoginState({
          id: data.userId,
          token: data.token,
          nickname: data.nickname || '微信用户',
          avatarUrl: data.avatarUrl || ''
        });
        return data;
      }
    } catch (err) {
      console.error('登录失败:', err);
      this.globalData.loginFail = true;
      this.globalData.loginFailMsg = err.message || '网络不可用，请检查后重试';
    }
  },

  setLoginState(userInfo) {
    this.globalData.userInfo = userInfo;
    this.globalData.token = userInfo.token;
    this.globalData.userId = userInfo.id;
    this.globalData.isLogin = true;
    this.globalData.loginFail = false;
  },

  getUserInfo() {
    return this.globalData.userInfo;
  },

  isLoggedIn() {
    return this.globalData.isLogin;
  }
});
