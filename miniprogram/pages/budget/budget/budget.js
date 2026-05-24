// pages/budget/budget/budget.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    // 月度预算
    monthlyBudget: 0,
    totalSpent: 0,
    spentPercent: 0,
    alertLevel: 'normal',
    monthlyRemaining: 0,

    // 周度预算
    weeklyBudget: 0,
    weeklySpent: 0,
    weeklyPercent: 0,
    showWeekly: false,

    // 结转
    carryoverAmount: 0,
    carryoverCount: 0,

    // 专项预算
    ongoingSpecials: [],
    currentMonth: ''
  },

  onLoad() {
    const now = new Date();
    const month = util.formatDate(now, 'YYYY-MM');
    this.setData({ currentMonth: month });
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    wx.showLoading({ title: '加载中...', mask: true });
    try {
      const month = this.data.currentMonth;
      const [usageRes, carryRes, specialRes] = await Promise.all([
        api.get('/budgets/daily/usage', { month }),
        api.get('/budgets/daily/carryover/statistics'),
        api.get('/budgets/special', { status: 'ongoing' })
      ]);

      const usage = usageRes || {};
      const carryover = carryRes || {};
      const specials = specialRes || [];

      const monthlyRemaining = (usage.monthlyBudget || 0) - (usage.totalSpent || 0);
      const weeklyPercent = usage.weeklyBudget > 0
        ? Math.round((usage.weeklySpent || 0) / usage.weeklyBudget * 100)
        : 0;

      this.setData({
        monthlyBudget: usage.monthlyBudget || 0,
        totalSpent: usage.totalSpent || 0,
        spentPercent: usage.spentPercent || 0,
        alertLevel: usage.alertLevel || 'normal',
        monthlyRemaining: monthlyRemaining,
        weeklyBudget: usage.weeklyBudget || 0,
        weeklySpent: usage.weeklySpent || 0,
        weeklyPercent: weeklyPercent,
        showWeekly: (usage.weeklyBudget || 0) > 0,
        carryoverAmount: carryover.carryoverAmount || 0,
        carryoverCount: carryover.carryoverCount || 0,
        ongoingSpecials: specials
      });
    } catch (err) {
      console.error('加载预算数据失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转日常预算设置
  goDailyBudget() {
    wx.navigateTo({ url: '/pages/budget/daily/daily' });
  },

  // 跳转专项预算列表
  goSpecialList() {
    wx.navigateTo({ url: '/pages/budget/special/list/list' });
  },

  // 创建专项预算
  goCreateSpecial() {
    wx.navigateTo({ url: '/pages/budget/special/create/create' });
  },

  // 专项预算详情
  goSpecialDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/budget/special/detail/detail?id=' + id });
  },

  // 跳转结转
  goCarryover() {
    wx.showToast({ title: '结转功能开发中', icon: 'none' });
  }
});
