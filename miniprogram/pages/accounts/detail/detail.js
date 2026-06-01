// pages/accounts/detail.js - 账户详情页
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    accountId: '',
    account: {
      id: '',
      name: '',
      type: '',
      icon: '💰',
      color: '#07C160',
      balance: 0,
      balanceText: '0.00',
      initialBalance: 0,
      initialBalanceText: '0.00'
    },
    accountTypeText: '',
    monthIncomeText: '0.00',
    monthExpenseText: '0.00',
    transactions: [],
    page: 1,
    pageSize: 20,
    hasMore: true,
    totalTransactions: 0
  },

  onLoad: function (options) {
    var id = options.id || '';
    this.setData({ accountId: id });
  },

  onShow: function () {
    this.loadAccount();
  },

  loadAccount: function () {
    var that = this;
    var id = this.data.accountId;
    if (!id) return;

    api.get('/accounts/' + id, {}, { silent: true }).then(function (data) {
      var account = data;
      account.balanceText = util.formatMoney(account.currentBalance);
      account.initialBalanceText = util.formatMoney(account.initialBalance);

      var typeMap = { asset: '资产', liability: '负债', investment: '投资' };
      var accountTypeText = typeMap[account.type] || account.type;

      that.setData({
        account: account,
        accountTypeText: accountTypeText
      });

      // 加载交易记录
      that.loadTransactions(true);
    });
  },

  loadTransactions: function (reset) {
    var that = this;
    var id = this.data.accountId;
    var page = reset ? 1 : this.data.page + 1;

    var params = { page: page, pageSize: this.data.pageSize };
    api.get('/accounts/' + id + '/transactions', params, { silent: true }).then(function (data) {
      var list = (data.list || []).map(function (item) {
        item.dateText = util.formatDate(item.date);
        item.amountText = util.formatMoney(item.amount, true);
        return item;
      });

      var transactions = reset ? list : that.data.transactions.concat(list);
      var hasMore = transactions.length < (data.total || 0);

      that.setData({
        transactions: transactions,
        page: page,
        hasMore: hasMore,
        totalTransactions: data.total || 0
      });
    });
  },

  loadMoreTransactions: function () {
    this.loadTransactions(false);
  },

  // 计算本月收支 (从交易记录中)
  computeMonthStats: function () {
    var transactions = this.data.transactions;
    var now = new Date();
    var monthStart = util.getMonthStart();

    var income = 0;
    var expense = 0;
    transactions.forEach(function (t) {
      if (t.date >= monthStart) {
        if (t.amount > 0) {
          income += Number(t.amount);
        } else {
          expense += Math.abs(Number(t.amount));
        }
      }
    });

    this.setData({
      monthIncomeText: util.formatMoney(income),
      monthExpenseText: util.formatMoney(expense)
    });
  },

  // 跳转编辑页
  goEdit: function () {
    wx.navigateTo({ url: '/pages/accounts/edit/edit?id=' + this.data.accountId });
  },

  // 调整余额弹窗
  showAdjustModal: function () {
    var that = this;
    wx.showModal({
      title: '调整余额',
      editable: true,
      placeholderText: '请输入调整后的余额',
      success: function (res) {
        if (res.confirm && res.content) {
          var newBalance = parseFloat(res.content);
          if (!isNaN(newBalance)) {
            that.adjustBalance(newBalance);
          } else {
            wx.showToast({ title: '请输入有效的金额', icon: 'none' });
          }
        }
      }
    });
  },

  adjustBalance: function (newBalance) {
    var that = this;
    var id = this.data.accountId;
    api.post('/accounts/' + id + '/adjust-balance', {
      newBalance: newBalance,
      reason: '手动调整'
    }, { showLoading: true, loadingText: '调整中...' }).then(function () {
      wx.showToast({ title: '余额已调整', icon: 'success' });
      that.loadAccount();
    });
  },

  // 删除账户确认
  showDeleteConfirm: function () {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除账户将同时删除相关交易记录，此操作不可撤销。确定要删除吗？',
      confirmColor: '#FA5151',
      success: function (res) {
        if (res.confirm) {
          that.deleteAccount();
        }
      }
    });
  },

  deleteAccount: function () {
    var that = this;
    var id = this.data.accountId;
    api.delete('/accounts/' + id, {}, { showLoading: true, loadingText: '删除中...' }).then(function () {
      wx.showToast({ title: '账户已删除', icon: 'success' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    });
  }
});
