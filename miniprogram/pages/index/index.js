const { api } = require('../../utils/request');
const app = getApp();

Page({
  data: {
    loading: true,
    totalAssets: 0,
    totalLiabilities: 0,
    totalInvestments: 0,
    netWorth: 0,
    netWorthChange: 0,
    netWorthChangePercent: 0,
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    todayExpense: 0,
    weekExpense: 0,
    accountCount: 0,
    monthTransactionCount: 0,
    topExpenseCategories: [],
    incomeCount: 0,
    expenseCount: 0
  },

  onLoad() {
    this.checkLoginAndLoad();
  },

  onShow() {
    this.checkLoginAndLoad();
  },

  checkLoginAndLoad() {
    if (!app.globalData.isLogin) {
      wx.reLaunch({ url: '/pages/onboarding/welcome/welcome' });
      return;
    }
    this.loadDashboard();
  },

  onPullDownRefresh() {
    this.loadDashboard().then(function() {
      wx.stopPullDownRefresh();
    });
  },

  async loadDashboard() {
    try {
      this.setData({ loading: true });
      var data = await api.get('/dashboard');

      var netWorth = data.netWorth || 0;
      var netWorthChange = data.netWorthChange || 0;
      var netWorthChangePercent = data.netWorthChangePercent || 0;
      var totalIncome = data.totalIncome || 0;
      var totalExpense = data.totalExpense || 0;
      var netAmount = data.netAmount || 0;

      this.setData({
        loading: false,
        totalAssets: data.totalAssets || 0,
        totalLiabilities: data.totalLiabilities || 0,
        totalInvestments: data.totalInvestments || 0,
        netWorth: netWorth,
        netWorthChange: netWorthChange,
        netWorthChangePercent: netWorthChangePercent,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        netAmount: netAmount,
        todayExpense: data.todayExpense || 0,
        weekExpense: data.weekExpense || 0,
        accountCount: data.accountCount || 0,
        monthTransactionCount: data.monthTransactionCount || 0,
        topExpenseCategories: data.topExpenseCategories || [],
        incomeCount: data.incomeCount || 0,
        expenseCount: data.expenseCount || 0
      });
    } catch (err) {
      this.setData({ loading: false });
      console.error('加载仪表盘失败:', err);
    }
  },

  // 跳转资产负债表
  goToBalanceSheet() {
    wx.navigateTo({ url: '/pages/reports/balance-sheet/balance-sheet' });
  },

  // 跳转记账页
  goToRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },
});
