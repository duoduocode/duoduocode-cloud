// pages/reports/reports.js - 报表首页
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    monthIncomeText: '0.00',
    monthExpenseText: '0.00',
    balanceText: '0.00'
  },

  onShow: function () {
    this.loadDashboard();
  },

  loadDashboard: function () {
    var that = this;
    api.get('/dashboard/monthly', {}, { silent: true }).then(function (data) {
      var income = data.monthIncome || 0;
      var expense = data.monthExpense || 0;
      var balance = income - expense;
      that.setData({
        monthIncomeText: util.formatMoney(income),
        monthExpenseText: util.formatMoney(expense),
        balanceText: util.formatMoney(balance, true)
      });
    });
  },

  goBalanceSheet: function () {
    wx.navigateTo({ url: '/pages/reports/balance-sheet/balance-sheet' });
  },

  goIncomeStatement: function () {
    wx.navigateTo({ url: '/pages/reports/income-statement/income-statement' });
  },

  goTrend: function () {
    wx.navigateTo({ url: '/pages/reports/trend/trend' });
  },

  goComparison: function () {
    wx.navigateTo({ url: '/pages/reports/comparison/comparison' });
  }
});
