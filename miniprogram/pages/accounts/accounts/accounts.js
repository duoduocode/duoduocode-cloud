// pages/accounts/accounts.js - 账户列表页
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    totalAssets: 0,
    totalLiabilities: 0,
    netWorth: 0,
    totalAssetsText: '0.00',
    totalLiabilitiesText: '0.00',
    netWorthText: '0.00',
    assetAccounts: [],
    liabilityAccounts: [],
    investmentAccounts: [],
    assetTotalText: '0.00',
    liabilityTotalText: '0.00',
    investmentTotalText: '0.00'
  },

  onLoad: function () {
    // 首次加载
  },

  onShow: function () {
    this.loadAccounts();
  },

  onPullDownRefresh: function () {
    this.loadAccounts().then(function () {
      wx.stopPullDownRefresh();
    });
  },

  loadAccounts: function () {
    var that = this;
    return api.get('/accounts', {}, { silent: true }).then(function (data) {
      var assetAccounts = (data.assetAccounts || []).map(function (item) {
        item.balanceText = util.formatMoney(item.balance);
        return item;
      });
      var liabilityAccounts = (data.liabilityAccounts || []).map(function (item) {
        item.balanceText = util.formatMoney(item.balance);
        return item;
      });
      var investmentAccounts = (data.investmentAccounts || []).map(function (item) {
        item.balanceText = util.formatMoney(item.balance);
        return item;
      });

      // 计算各组合计
      var assetTotal = assetAccounts.reduce(function (sum, item) { return sum + Number(item.balance); }, 0);
      var liabilityTotal = liabilityAccounts.reduce(function (sum, item) { return sum + Number(item.balance); }, 0);
      var investmentTotal = investmentAccounts.reduce(function (sum, item) { return sum + Number(item.balance); }, 0);

      that.setData({
        totalAssets: data.totalAssets || 0,
        totalLiabilities: data.totalLiabilities || 0,
        netWorth: data.netWorth || 0,
        totalAssetsText: util.formatMoney(data.totalAssets),
        totalLiabilitiesText: util.formatMoney(data.totalLiabilities),
        netWorthText: util.formatMoney(data.netWorth),
        assetAccounts: assetAccounts,
        liabilityAccounts: liabilityAccounts,
        investmentAccounts: investmentAccounts,
        assetTotalText: util.formatMoney(assetTotal),
        liabilityTotalText: util.formatMoney(liabilityTotal),
        investmentTotalText: util.formatMoney(investmentTotal)
      });
    });
  },

  // 跳转普通账户详情
  goDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/accounts/detail/detail?id=' + id });
  },

  // 跳转投资账户详情
  goInvestDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/accounts/investment/detail/detail?id=' + id });
  },

  // 添加账户
  goCreate: function () {
    wx.navigateTo({ url: '/pages/accounts/create/create' });
  }
});
