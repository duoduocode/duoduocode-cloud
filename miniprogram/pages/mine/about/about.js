// pages/mine/about/about.js
Page({
  data: {
    type: '',
    version: '1.0.0'
  },

  onLoad(options) {
    if (options.type) {
      this.setData({ type: options.type });
      if (options.type === 'privacy') {
        wx.setNavigationBarTitle({ title: '隐私政策' });
      } else if (options.type === 'agreement') {
        wx.setNavigationBarTitle({ title: '用户协议' });
      }
    }
  }
});
