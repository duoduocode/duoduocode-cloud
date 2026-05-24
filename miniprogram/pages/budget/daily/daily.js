// pages/budget/daily/daily.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    month: '',
    monthlyBudget: 0,
    weeklyBudget: 0,
    weeklyEnabled: false,
    categoryBudgets: [],
    loading: true
  },

  onLoad() {
    const now = new Date();
    this.setData({ month: util.formatDate(now, 'YYYY-MM') });
  },

  onShow() {
    this.loadBudget();
  },

  async loadBudget() {
    this.setData({ loading: true });
    try {
      const res = await api.get('/budgets/daily', { month: this.data.month });
      const data = res || {};
      this.setData({
        monthlyBudget: data.monthlyBudget || 0,
        weeklyBudget: data.weeklyBudget || 0,
        weeklyEnabled: (data.weeklyBudget || 0) > 0,
        categoryBudgets: (data.categoryBudgets || []).map(function(item) {
          return {
            categoryId: item.categoryId,
            categoryName: item.categoryName,
            monthlyBudget: item.monthlyBudget || 0,
            weeklyBudget: item.weeklyBudget || 0,
            alertThreshold: item.alertThreshold || 80
          };
        }),
        loading: false
      });
    } catch (err) {
      console.error('加载预算设置失败:', err);
      this.setData({ loading: false });
    }
  },

  // 月度预算输入
  onMonthlyInput(e) {
    this.setData({ monthlyBudget: Number(e.detail.value) || 0 });
  },

  // 周度预算开关
  onWeeklyToggle(e) {
    this.setData({ weeklyEnabled: e.detail.value });
  },

  // 周度预算输入
  onWeeklyInput(e) {
    this.setData({ weeklyBudget: Number(e.detail.value) || 0 });
  },

  // 分类预算月度输入
  onCatMonthlyInput(e) {
    var idx = e.currentTarget.dataset.index;
    var val = Number(e.detail.value) || 0;
    var key = 'categoryBudgets[' + idx + '].monthlyBudget';
    this.setData({ [key]: val });
  },

  // 分类预算预警阈值输入
  onCatThresholdInput(e) {
    var idx = e.currentTarget.dataset.index;
    var val = Number(e.detail.value) || 80;
    var key = 'categoryBudgets[' + idx + '].alertThreshold';
    this.setData({ [key]: val });
  },

  // 保存
  async saveBudget() {
    var that = this;
    var data = {
      month: that.data.month,
      monthlyBudget: that.data.monthlyBudget,
      weeklyBudget: that.data.weeklyEnabled ? that.data.weeklyBudget : 0,
      categoryBudgets: that.data.categoryBudgets.map(function(item) {
        return {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          monthlyBudget: item.monthlyBudget,
          weeklyBudget: item.weeklyBudget || 0,
          alertThreshold: item.alertThreshold
        };
      })
    };

    wx.showLoading({ title: '保存中...', mask: true });
    try {
      await api.put('/budgets/daily', data);
      wx.showToast({ title: '保存成功', icon: 'success' });
    } catch (err) {
      console.error('保存预算失败:', err);
    } finally {
      wx.hideLoading();
    }
  }
});
