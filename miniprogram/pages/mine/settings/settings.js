// pages/mine/settings/settings.js
Page({
  data: {
    noticeEnabled: true
  },

  onShow() {
    var enabled = wx.getStorageSync('notice_enabled');
    if (enabled !== '' && enabled !== undefined && enabled !== null) {
      this.setData({ noticeEnabled: !!enabled });
    }
  },

  onNoticeToggle(e) {
    var val = e.detail.value;
    this.setData({ noticeEnabled: val });
    wx.setStorageSync('notice_enabled', val);
  },

  goChangePassword() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goSecuritySettings() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  goPrivacy() {
    wx.navigateTo({ url: '/pages/mine/about/about?type=privacy' });
  },

  goAgreement() {
    wx.navigateTo({ url: '/pages/mine/about/about?type=agreement' });
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/mine/about/about' });
  },

  exportData() {
    wx.showToast({ title: '功能开发中', icon: 'none' });
  },

  clearData() {
    var that = this;
    wx.showModal({
      title: '清除数据',
      content: '将清除所有本地缓存数据，是否继续？',
      success: function(res) {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            wx.showToast({ title: '已清除', icon: 'success' });
            that.setData({ noticeEnabled: true });
          } catch (e) {
            wx.showToast({ title: '清除失败', icon: 'none' });
          }
        }
      }
    });
  }
});
