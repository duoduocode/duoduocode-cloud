// pages/reports/balance-sheet.js - 资产负债表
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    totalAssets: 0,
    totalAssetsText: '0.00',
    totalLiabilities: 0,
    totalLiabilitiesText: '0.00',
    netWorth: 0,
    netWorthText: '0.00',
    assetAccounts: [],
    liabilityAccounts: [],
    investmentAccounts: [],
    healthScore: '0分',
    healthPercent: 0
  },

  onLoad: function () {
    this.loadData();
  },

  loadData: function () {
    var that = this;
    api.get('/accounts', {}, { showLoading: true, loadingText: '加载中...' }).then(function (data) {
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

      var totalAssets = (data.totalAssets || 0) + (data.investmentAccounts || []).reduce(function (s, i) { return s + Number(i.balance); }, 0);
      var totalLiabilities = data.totalLiabilities || 0;
      var netWorth = totalAssets - totalLiabilities;

      // 计算百分比
      var allAssets = assetAccounts.concat(investmentAccounts);
      allAssets.forEach(function (item) {
        item.percentText = totalAssets > 0 ? ((Number(item.balance) / totalAssets) * 100).toFixed(1) + '%' : '0%';
      });
      liabilityAccounts.forEach(function (item) {
        item.percentText = totalLiabilities > 0 ? ((Number(item.balance) / totalLiabilities) * 100).toFixed(1) + '%' : '0%';
      });

      // 健康度: 净资产/总资产 * 100
      var healthPercent = totalAssets > 0 ? Math.min((netWorth / totalAssets) * 100, 100) : 0;
      var healthScore = Math.round(healthPercent);

      that.setData({
        totalAssets: totalAssets,
        totalAssetsText: util.formatMoney(totalAssets),
        totalLiabilities: totalLiabilities,
        totalLiabilitiesText: util.formatMoney(totalLiabilities),
        netWorth: netWorth,
        netWorthText: util.formatMoney(netWorth),
        assetAccounts: assetAccounts,
        liabilityAccounts: liabilityAccounts,
        investmentAccounts: investmentAccounts,
        healthScore: healthScore + '分',
        healthPercent: healthPercent
      });
    });
  }
});
