// app.js - REST API 模式
const { devLogin, setToken } = require('./utils/request');

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:8080/v1'
  },

  onLaunch() {
    this.initApp();
  },

  async initApp() {
    // 开发环境自动登录
    try {
      const data = await devLogin('测试用户');
      if (data && data.token) {
        setToken(data.token, data.expireIn || 7200);
        this.globalData.userInfo = data.user || {};
        this.globalData.token = data.token;
        console.log('登录成功');
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ title: '登录失败，请检查后端服务', icon: 'none' });
    }
  },

  // 获取用户信息
  getUserInfo() {
    return this.globalData.userInfo;
  }
});
