const { api } = require('../../utils/request');

Page({
  data: {
    amount: '',
    fromAccount: null,
    toLiability: null,
    toLiabilityDebt: '0.00',
    date: '',
    time: '',
    dateTimeRange: [],
    dateTimeValue: [0, 0, 0, 0, 0],
    description: '',

    accounts: [],
    liabilityAccounts: [],

    showAccountPicker: false,
    pickerMode: 'none',
    pickerTitle: '',
    pickerAccounts: [],
    pickerSelectedId: '',
    pickerLabelPrefix: '余额',
    saving: false
  },

  onLoad() {
    var now = new Date();
    this.setData({
      date: this.formatDateStr(now),
      time: this.formatTimeStr(now)
    });
    this.buildDateTimeRange(now);
    this.loadAccounts();
  },

  buildDateTimeRange: function (now) {
    var y = now.getFullYear();
    var years = [];
    for (var i = y - 2; i <= y + 2; i++) years.push('' + i);
    var months = [];
    for (var i = 1; i <= 12; i++) months.push(('0' + i).slice(-2));
    var days = [];
    for (var i = 1; i <= 31; i++) days.push(('0' + i).slice(-2));
    var hours = [];
    for (var i = 0; i <= 23; i++) hours.push(('0' + i).slice(-2));
    var mins = [];
    for (var i = 0; i <= 59; i++) mins.push(('0' + i).slice(-2));
    this.setData({
      dateTimeRange: [years, months, days, hours, mins],
      dateTimeValue: [2, now.getMonth(), now.getDate() - 1, now.getHours(), now.getMinutes()]
    });
  },

  onDateTimeColumnChange: function (e) {
    var col = e.detail.column;
    var val = e.detail.value;
    var v = this.data.dateTimeValue;
    v[col] = val;
    this.setData({ dateTimeValue: v });
  },

  onDateTimeChange: function (e) {
    var vals = e.detail.value;
    var range = this.data.dateTimeRange;
    var date = range[0][vals[0]] + '-' + range[1][vals[1]] + '-' + range[2][vals[2]];
    var time = range[3][vals[3]] + ':' + range[4][vals[4]];
    this.setData({ date: date, time: time });
  },

  formatDateStr: function (date) {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return y + '-' + m + '-' + d;
  },

  formatTimeStr(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return h + ':' + min;
  },

  async loadAccounts() {
    try {
      const data = await api.get('/accounts');
      const grouped = (data && data.accounts) || {};
      var assetArr = grouped.asset || [];
      var liabilityArr = grouped.liability || [];

      this.setData({
        accounts: assetArr,
        liabilityAccounts: liabilityArr
      });
    } catch (err) {
      console.error('加载账户失败:', err);
    }
  },

  onAmountInput(e) {
    var val = e.detail.value;
    val = val.replace(/[^\d.]/g, '');
    var parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].substring(0, 2);
    }
    this.setData({ amount: val });
  },

  onDescInput(e) { this.setData({ description: e.detail.value }); },

  openFromAccountPicker() {
    var accounts = this.data.accounts;
    this.setData({
      pickerMode: 'from',
      pickerTitle: '选择还款来源',
      pickerAccounts: accounts,
      pickerSelectedId: this.data.fromAccount ? this.data.fromAccount.id : '',
      pickerLabelPrefix: '余额',
      showAccountPicker: true
    });
  },

  openToAccountPicker() {
    var liabilities = this.data.liabilityAccounts;
    this.setData({
      pickerMode: 'to',
      pickerTitle: '选择还款目标',
      pickerAccounts: liabilities,
      pickerSelectedId: this.data.toLiability ? this.data.toLiability.id : '',
      pickerLabelPrefix: '欠款',
      showAccountPicker: true
    });
  },

  closeAccountPicker() {
    this.setData({ showAccountPicker: false, pickerMode: 'none' });
  },

  onSelectAccount(e) {
    var id = e.currentTarget.dataset.id;

    if (this.data.pickerMode === 'from') {
      var account = this.data.accounts.find(function(a) { return a.id == id; });
      if (account) {
        this.setData({ fromAccount: account, showAccountPicker: false });
      }
    } else {
      var liability = this.data.liabilityAccounts.find(function(a) { return a.id == id; });
      if (liability) {
        var debt = liability.debtAmount || Math.abs(liability.currentBalance || 0);
        this.setData({
          toLiability: liability,
          toLiabilityDebt: Number(debt).toFixed(2),
          showAccountPicker: false
        });
      }
    }
  },

  // === 保存 ===
  onSave() {
    var form = this.data;
    var amount = parseFloat(form.amount);

    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入还款金额', icon: 'none' });
      return;
    }
    if (!form.fromAccount) {
      wx.showToast({ title: '请选择还款来源账户', icon: 'none' });
      return;
    }
    if (!form.toLiability) {
      wx.showToast({ title: '请选择还款负债账户', icon: 'none' });
      return;
    }

    if (this._checkOutflowAvailable(form.fromAccount, amount)) return;

    this.saveTransaction();
  },

  _checkOutflowAvailable: function (account, amount) {
    var available = this._getAvailable(account);
    if (amount <= available) return false;

    var isCredit = account.type === 'liability' && Number(account.creditLimit || 0) > 0;
    var title = isCredit ? '额度不足' : '余额不足';

    var content = '账户：' + (account.icon || '') + ' ' + account.name + '\n';
    if (isCredit) {
      var limit = Number(account.creditLimit || 0);
      content += '总额度：¥' + limit.toFixed(2) + '\n';
      content += '可用额度：¥' + available.toFixed(2) + '\n';
    } else {
      content += '当前余额：¥' + available.toFixed(2) + '\n';
    }
    content += '本次金额：¥' + amount.toFixed(2);

    var self = this;
    wx.showModal({
      title: title,
      content: content,
      confirmText: '仍然还款',
      cancelText: '返回修改',
      success: function (res) {
        if (res.confirm) {
          self.saveTransaction();
        }
      }
    });
    return true;
  },

  _getAvailable: function (account) {
    var bal = Number(account.currentBalance || 0);
    var limit = Number(account.creditLimit || 0);
    if (account.type === 'liability' && limit > 0) {
      return Math.max(0, limit + bal);
    }
    return Math.max(0, bal);
  },

  async saveTransaction() {
    const form = this.data;
    this.setData({ saving: true });

    try {
      await api.post('/transactions', {
        transactionType: 'repayment',
        amount: parseFloat(form.amount),
        fromAccountId: form.fromAccount.id,
        toAccountId: form.toLiability.id,
        date: form.date,
        time: form.time,
        description: form.description
      });

      wx.showToast({ title: '还款成功', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      this.setData({ saving: false });
      console.error('还款失败:', err);
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
