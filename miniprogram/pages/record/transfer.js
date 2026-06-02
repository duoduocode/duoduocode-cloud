const { api } = require('../../utils/request');

Page({
  data: {
    amount: '',
    fromAccount: null,
    toAccount: null,
    date: '',
    time: '',
    dateTimeRange: [],
    dateTimeValue: [0, 0, 0, 0, 0],
    description: '',
    balanceWarning: '',

    accounts: [],

    showAccountPicker: false,
    pickerMode: 'none',
    pickerTitle: '',
    pickerAccounts: [],
    pickerSelectedId: '',
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
      const all = (grouped.asset || []);
      this.setData({ accounts: all });
    } catch (err) {
      console.error('加载账户失败:', err);
    }
  },

  onAmountInput(e) {
    let val = e.detail.value;
    val = val.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].substring(0, 2);
    }
    this.setData({ amount: val });
    this.checkBalanceWarning();
  },

  onDescInput(e) { this.setData({ description: e.detail.value }); },

  // === 账户选择器 ===
  openFromAccountPicker() {
    const toAccount = this.data.toAccount;
    const fromAccount = this.data.fromAccount;
    const accounts = this.data.accounts;
    // 过滤掉已选的转入账户
    const filtered = toAccount
      ? accounts.filter(function(a) { return a.id != toAccount.id; })
      : accounts;

    this.setData({
      pickerMode: 'from',
      pickerTitle: '选择转出账户',
      pickerAccounts: filtered,
      pickerSelectedId: fromAccount ? fromAccount.id : '',
      showAccountPicker: true
    });
  },

  openToAccountPicker() {
    const fromAccount = this.data.fromAccount;
    const toAccount = this.data.toAccount;
    const accounts = this.data.accounts;
    const filtered = fromAccount
      ? accounts.filter(function(a) { return a.id != fromAccount.id; })
      : accounts;

    this.setData({
      pickerMode: 'to',
      pickerTitle: '选择转入账户',
      pickerAccounts: filtered,
      pickerSelectedId: toAccount ? toAccount.id : '',
      showAccountPicker: true
    });
  },

  closeAccountPicker() {
    this.setData({ showAccountPicker: false, pickerMode: 'none' });
  },

  onSelectAccount(e) {
    const id = e.currentTarget.dataset.id;
    const account = this.data.accounts.find(function(a) { return a.id == id; });
    if (!account) return;

    if (this.data.pickerMode === 'from') {
      this.setData({ fromAccount: account, showAccountPicker: false });
      this.checkBalanceWarning();
    } else {
      this.setData({ toAccount: account, showAccountPicker: false });
    }
  },

  checkBalanceWarning() {
    var amount = parseFloat(this.data.amount);
    var fromAccount = this.data.fromAccount;
    if (!fromAccount || amount <= 0) {
      this.setData({ balanceWarning: '' });
      return;
    }
    var available = this._getAvailable(fromAccount);
    if (amount > available) {
      this.setData({
        balanceWarning: '转出账户可用不足！可用 ¥' + available.toFixed(2)
      });
    } else {
      this.setData({ balanceWarning: '' });
    }
  },

  _getAvailable: function (account) {
    var bal = Number(account.currentBalance || 0);
    var limit = Number(account.creditLimit || 0);
    if (account.type === 'liability' && limit > 0) {
      return Math.max(0, limit + bal);
    }
    return Math.max(0, bal);
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
      confirmText: '仍然转账',
      cancelText: '返回修改',
      success: function (res) {
        if (res.confirm) {
          self.saveTransaction();
        }
      }
    });
    return true;
  },

  // === 保存 ===
  onSave() {
    const form = this.data;
    const amount = parseFloat(form.amount);

    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }
    if (!form.fromAccount) {
      wx.showToast({ title: '请选择转出账户', icon: 'none' });
      return;
    }
    if (!form.toAccount) {
      wx.showToast({ title: '请选择转入账户', icon: 'none' });
      return;
    }
    if (form.fromAccount.id === form.toAccount.id) {
      wx.showToast({ title: '不能转账到同一个账户', icon: 'none' });
      return;
    }

    if (this._checkOutflowAvailable(form.fromAccount, amount)) return;

    this.saveTransaction();
  },

  async saveTransaction() {
    const form = this.data;
    this.setData({ saving: true });

    try {
      await api.post('/transactions', {
        transactionType: 'transfer',
        amount: parseFloat(form.amount),
        fromAccountId: form.fromAccount.id,
        toAccountId: form.toAccount.id,
        date: form.date,
        time: form.time,
        description: form.description
      });

      wx.showToast({ title: '转账成功', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      this.setData({ saving: false });
      console.error('转账失败:', err);
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
