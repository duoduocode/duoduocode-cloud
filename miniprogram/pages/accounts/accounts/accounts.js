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
    investmentTotalText: '0.00',
    showWelcomeModal: false,
    showHintModal: false,
    _hasShownWelcome: false
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
      var summary = data.summary || {};
      var grouped = data.accounts || {};
      var assetArr = grouped.asset || [];
      var liabilityArr = grouped.liability || [];
      var investmentArr = grouped.investment || [];

      var assetAccounts = assetArr.map(function (item) {
        item.balanceText = util.formatMoney(item.currentBalance);
        item.initialBalanceText = util.formatMoney(item.initialBalance != null ? item.initialBalance : 0);
        return item;
      });
      var liabilityAccounts = liabilityArr.map(function (item) {
        var bal = Number(item.currentBalance || 0);
        var debt = Math.max(0, -bal);
        item.debtAmount = debt;
        item.debtText = util.formatMoney(debt);
        item.creditLimitText = util.formatMoney(item.effectiveCreditLimit || item.creditLimit || 0);
        item.balanceText = util.formatMoney(Math.abs(bal));
        return item;
      });
      var investmentAccounts = investmentArr.map(function (item) {
        item.balanceText = util.formatMoney(item.currentBalance);
        item.initialBalanceText = util.formatMoney(item.initialBalance != null ? item.initialBalance : 0);
        return item;
      });

      var assetTotal = assetAccounts.reduce(function (sum, item) { return sum + Number(item.currentBalance || 0); }, 0);
      var liabilityTotal = liabilityAccounts.reduce(function (sum, item) { return sum + (item.debtAmount || 0); }, 0);
      var investmentTotal = investmentAccounts.reduce(function (sum, item) { return sum + Number(item.currentBalance || 0); }, 0);

      var totalSum = summary.netWorth || 0;

      that.setData({
        totalAssets: summary.totalAssets || 0,
        totalLiabilities: summary.totalLiabilities || 0,
        totalInvestments: summary.totalInvestments || 0,
        netWorth: summary.netWorth || 0,
        totalAssetsText: util.formatMoney(summary.totalAssets),
        totalLiabilitiesText: util.formatMoney(summary.totalLiabilities),
        totalInvestmentsText: util.formatMoney(summary.totalInvestments),
        netWorthText: util.formatMoney(totalSum),
        assetAccounts: assetAccounts,
        liabilityAccounts: liabilityAccounts,
        investmentAccounts: investmentAccounts,
        assetTotalText: util.formatMoney(assetTotal),
        liabilityTotalText: util.formatMoney(liabilityTotal),
        investmentTotalText: util.formatMoney(investmentTotal)
      });

      var isEmpty = assetAccounts.length === 0 && liabilityAccounts.length === 0 && investmentAccounts.length === 0;
      if (isEmpty) {
        that.setData({ showWelcomeModal: true });
      }
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

  // 编辑账户
  onEdit: function (e) {
    var id = e.currentTarget.dataset.id;
    var type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: '/pages/accounts/create/create?id=' + id + '&type=' + type });
  },

  // 删除账户
  onDelete: function (e) {
    var id = e.currentTarget.dataset.id;
    var name = e.currentTarget.dataset.name;
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除「' + name + '」吗？删除后无法恢复。',
      confirmColor: '#FA5151',
      success: function (res) {
        if (res.confirm) {
          api.delete('/accounts/' + id, {}, { showLoading: true, loadingText: '删除中...' }).then(function () {
            wx.showToast({ title: '已删除', icon: 'success' });
            that.loadAccounts();
          });
        }
      }
    });
  },

  // 添加账户
  goCreate: function () {
    wx.navigateTo({ url: '/pages/accounts/create/create' });
  },

  // 跳转记账页
  goRecord: function () {
    wx.switchTab({ url: '/pages/record/record' });
  },

  // 一键快捷创建预设账户
  quickCreate: function (e) {
    var dataset = e.currentTarget.dataset;
    var payload = {
      name: dataset.name,
      type: dataset.type,
      icon: dataset.icon,
      color: dataset.color,
      initialBalance: 0,
      includeInNetWorth: true,
      allowTransfer: true
    };

    var that = this;
    api.post('/accounts', payload, { showLoading: true, loadingText: '创建中...' }).then(function () {
      wx.showToast({ title: '「' + dataset.name + '」已添加', icon: 'success' });
      that.loadAccounts();
    });
  },

  openHint: function () {
    this.setData({ showHintModal: true });
  },

  closeHint: function () {
    this.setData({ showHintModal: false });
  },

  // 欢迎弹窗「我知道了」→ 关闭欢迎弹窗，打开「什么是账户」弹窗
  onWelcomeConfirm: function () {
    this.setData({ showWelcomeModal: false, showHintModal: true });
  }
});
