// pages/accounts/investment/detail.js - 投资账户详情页
const { api } = require('../../../../utils/request');
const util = require('../../../../utils/util');

Page({
  data: {
    accountId: '',
    account: {
      id: '',
      name: '',
      icon: '📈',
      color: '#FF9800',
      balance: 0,
      balanceText: '0.00'
    },
    marketValue: 0,
    marketValueText: '0.00',
    costBasis: 0,
    costBasisText: '0.00',
    floatProfit: 0,
    floatProfitText: '0.00',
    profitRate: 0,
    profitRateText: '0.00%',
    totalIncome: 0,
    totalIncomeText: '0.00'
  },

  onLoad: function (options) {
    var id = options.id || '';
    this.setData({ accountId: id });
  },

  onShow: function () {
    this.loadAll();
  },

  loadAll: function () {
    this.loadAccount();
    this.loadMarketValue();
    this.loadTotalIncome();
  },

  loadAccount: function () {
    var that = this;
    var id = this.data.accountId;
    api.get('/accounts/' + id, {}, { silent: true }).then(function (data) {
      data.balanceText = util.formatMoney(data.balance);
      that.setData({ account: data });
    });
  },

  loadMarketValue: function () {
    var that = this;
    var id = this.data.accountId;
    api.get('/accounts/' + id + '/market-value/latest', {}, { silent: true }).then(function (data) {
      var profitRate = data.profitRate || 0;
      that.setData({
        marketValue: data.marketValue || 0,
        marketValueText: util.formatMoney(data.marketValue),
        costBasis: data.costBasis || 0,
        costBasisText: util.formatMoney(data.costBasis),
        floatProfit: data.floatProfit || 0,
        floatProfitText: util.formatMoney(data.floatProfit, true),
        profitRate: profitRate,
        profitRateText: (profitRate >= 0 ? '+' : '') + (profitRate * 100).toFixed(2) + '%'
      });
    });
  },

  loadTotalIncome: function () {
    var that = this;
    var id = this.data.accountId;
    api.get('/accounts/' + id + '/income/total', {}, { silent: true }).then(function (data) {
      that.setData({
        totalIncome: data.totalIncome || 0,
        totalIncomeText: util.formatMoney(data.totalIncome)
      });
    });
  },

  goUpdateValue: function () {
    wx.navigateTo({ url: '/pages/accounts/investment/value/value?accountId=' + this.data.accountId });
  },

  goRecordIncome: function () {
    wx.navigateTo({ url: '/pages/accounts/investment/income/income?accountId=' + this.data.accountId });
  }
});
