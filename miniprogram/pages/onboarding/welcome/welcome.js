const app = getApp();

Page({
  data: {
    status: 'loading',
    failMsg: ''
  },

  _timer: null,
  _count: 0,

  onLoad() {
    this.setData({ status: 'loading' });
    this.startPolling();
  },

  onUnload() {
    this.stopPolling();
  },

  startPolling() {
    this.stopPolling();
    var that = this;
    this._count = 0;
    this._timer = setInterval(function () {
      that._count++;
      if (app.globalData.isLogin) {
        that.stopPolling();
        wx.switchTab({ url: '/pages/index/index' });
        return;
      }
      if (app.globalData.loginFail) {
        that.stopPolling();
        that.setData({
          status: 'fail',
          failMsg: app.globalData.loginFailMsg || '网络不可用，请检查后重试'
        });
        return;
      }
      if (that._count > 60) {
        that.stopPolling();
        that.setData({ status: 'fail', failMsg: '登录超时，请检查网络后重试' });
      }
    }, 500);
  },

  stopPolling() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  },

  retryLogin() {
    this.setData({ status: 'loading', failMsg: '' });
    app.globalData.loginFail = false;
    var that = this;
    app.wxLogin().then(function () {
      wx.switchTab({ url: '/pages/index/index' });
    }).catch(function (err) {
      app.globalData.loginFail = true;
      app.globalData.loginFailMsg = err.message || '登录失败，请重试';
      that.setData({
        status: 'fail',
        failMsg: app.globalData.loginFailMsg
      });
    });
  }
});
