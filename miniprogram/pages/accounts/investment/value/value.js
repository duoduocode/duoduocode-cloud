// pages/accounts/investment/value.js - 更新市值页
const { api } = require('../../../../utils/request');
const util = require('../../../../utils/util');

Page({
  data: {
    accountId: '',
    marketValue: '',
    date: '',
    note: ''
  },

  onLoad: function (options) {
    var accountId = options.accountId || '';
    this.setData({
      accountId: accountId,
      date: util.getToday()
    });
  },

  onValueInput: function (e) {
    this.setData({ marketValue: e.detail.value });
  },

  onDateChange: function (e) {
    this.setData({ date: e.detail.value });
  },

  onNoteInput: function (e) {
    this.setData({ note: e.detail.value });
  },

  submit: function () {
    var val = parseFloat(this.data.marketValue);
    if (!this.data.marketValue || isNaN(val)) {
      wx.showToast({ title: '请输入有效市值', icon: 'none' });
      return;
    }
    if (!this.data.date) {
      wx.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }

    var that = this;
    var payload = {
      marketValue: val,
      date: this.data.date,
      note: this.data.note
    };

    api.post('/accounts/' + this.data.accountId + '/market-value', payload, {
      showLoading: true,
      loadingText: '保存中...'
    }).then(function () {
      wx.showToast({ title: '市值已更新', icon: 'success' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    });
  }
});
