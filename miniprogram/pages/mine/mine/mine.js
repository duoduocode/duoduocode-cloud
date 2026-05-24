// pages/mine/mine/mine.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');
const app = getApp();

Page({
  data: {
    avatarUrl: '',
    nickname: '',
    totalDays: 0,
    totalCount: 0,
    netAsset: '0.00'
  },

  onShow() {
    this.loadUserInfo();
    this.loadStats();
  },

  loadUserInfo() {
    var userInfo = app.getUserInfo();
    if (userInfo) {
      this.setData({
        avatarUrl: userInfo.avatarUrl || '',
        nickname: userInfo.nickname || '测试用户'
      });
    } else {
      this.setData({ nickname: '测试用户' });
    }
  },

  async loadStats() {
    try {
      var res = await api.get('/users/stats').catch(function() { return null; });
      if (res) {
        this.setData({
          totalDays: res.totalDays || 0,
          totalCount: res.totalCount || 0,
          netAsset: util.formatAmount(res.netAsset || 0)
        });
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
    }
  },

  // 导航
  goBudget() {
    wx.navigateTo({ url: '/pages/budget/budget/budget' });
  },

  goTemplates() {
    wx.navigateTo({ url: '/pages/templates/templates/templates' });
  },

  goCategories() {
    wx.navigateTo({ url: '/pages/category/category/category' });
  },

  goTags() {
    wx.navigateTo({ url: '/pages/tags/tags/tags' });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/search/search/search' });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/mine/settings/settings' });
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/mine/about/about' });
  }
});
