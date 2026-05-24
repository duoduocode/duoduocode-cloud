const { api } = require('../../utils/request');

Page({
  data: {
    loading: true,
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    monthIncome: 0,
    monthExpense: 0,
    monthBalance: 0,
    budgetUsage: 0,
    budgetPercent: 0,
    budgetWarning: false,
    budgetDanger: false,
    recentTransactions: [],
    hasTransactions: false
  },

  onLoad() {
    this.loadDashboard();
  },

  onShow() {
    this.loadDashboard();
  },

  onPullDownRefresh() {
    this.loadDashboard().then(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadDashboard() {
    try {
      this.setData({ loading: true });
      const data = await api.get('/dashboard');

      const netWorth = (data.totalAssets || 0) - (data.totalLiabilities || 0);
      const monthBalance = (data.monthIncome || 0) - (data.monthExpense || 0);
      const budgetPercent = data.budgetUsage ? Math.round(data.budgetUsage * 100) : 0;
      const transactions = data.recentTransactions || [];

      this.setData({
        loading: false,
        totalAssets: data.totalAssets || 0,
        totalLiabilities: data.totalLiabilities || 0,
        netWorth: netWorth,
        monthIncome: data.monthIncome || 0,
        monthExpense: data.monthExpense || 0,
        monthBalance: monthBalance,
        budgetUsage: budgetPercent,
        budgetPercent: Math.min(budgetPercent, 100),
        budgetWarning: budgetPercent >= 80,
        budgetDanger: budgetPercent >= 100,
        recentTransactions: transactions.slice(0, 10),
        hasTransactions: transactions.length > 0
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

  // 跳转交易详情
  goToTransaction(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/transaction/detail/detail?id=' + id });
  },

  // 跳转记账页
  goToRecord() {
    wx.switchTab({ url: '/pages/record/record' });
  },

  // 跳转预算页
  goToBudget() {
    wx.navigateTo({ url: '/pages/budget/budget/budget' });
  },

  // 格式化金额
  formatAmount(amount) {
    const abs = Math.abs(amount);
    if (abs >= 10000) {
      return (abs / 10000).toFixed(2) + '万';
    }
    return abs.toFixed(2);
  },

  formatSignAmount(amount, type) {
    const abs = Math.abs(amount).toFixed(2);
    if (type === 'income') return '+' + abs;
    return '-' + abs;
  }
});
