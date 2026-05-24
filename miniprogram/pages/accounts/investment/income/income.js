// pages/accounts/investment/income.js - 理财收益记录页
const { api } = require('../../../../utils/request');
const util = require('../../../../utils/util');

Page({
  data: {
    accountId: '',
    amount: '',
    date: '',
    incomeType: 'dividend',
    note: '',
    isReinvested: false,
    totalIncome: 0,
    totalIncomeText: '0.00',
    historyList: []
  },

  onLoad: function (options) {
    var accountId = options.accountId || '';
    this.setData({
      accountId: accountId,
      date: util.getToday()
    });
    this.loadHistory();
  },

  onAmountInput: function (e) {
    this.setData({ amount: e.detail.value });
  },

  onDateChange: function (e) {
    this.setData({ date: e.detail.value });
  },

  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
  },

  selectIncomeType: function (e) {
    this.setData({ incomeType: e.currentTarget.dataset.type });
  },

  onReinvestedToggle: function (e) {
    this.setData({ isReinvested: e.detail.value });
  },

  submitIncome: function () {
    var amount = parseFloat(this.data.amount);
    if (!this.data.amount || isNaN(amount)) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    var that = this;
    var payload = {
      amount: amount,
      date: this.data.date,
      type: this.data.incomeType,
      note: this.data.note,
      isReinvested: this.data.isReinvested
    };

    api.post('/accounts/' + this.data.accountId + '/income', payload, {
      showLoading: true,
      loadingText: '记录中...'
    }).then(function () {
      wx.showToast({ title: '收益已记录', icon: 'success' });
      that.setData({ amount: '', note: '', isReinvested: false });
      that.loadHistory();
    });
  },

  loadHistory: function () {
    var that = this;
    api.get('/accounts/' + this.data.accountId + '/income/history', {}, { silent: true }).then(function (data) {
      var typeMap = { dividend: '分红', interest: '利息', other: '其他' };
      var list = (data.list || []).map(function (item) {
        item.dateText = util.formatDate(item.date);
        item.amountText = util.formatMoney(item.amount, true);
        item.typeName = typeMap[item.type] || item.type;
        return item;
      });
      that.setData({
        totalIncome: data.total || 0,
        totalIncomeText: util.formatMoney(data.total),
        historyList: list
      });
    });
  }
});
