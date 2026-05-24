const { api } = require('../../utils/request');

Page({
  data: {
    amount: '',
    fromAccount: null,
    toAccount: null,
    date: '',
    time: '',
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
    const now = new Date();
    this.setData({
      date: this.formatDateStr(now),
      time: this.formatTimeStr(now)
    });
    this.loadAccounts();
  },

  formatDateStr(date) {
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
      this.setData({ accounts: data || [] });
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

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
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
    const amount = parseFloat(this.data.amount);
    const fromAccount = this.data.fromAccount;
    if (fromAccount && amount > 0 && amount > fromAccount.balance) {
      this.setData({
        balanceWarning: '转出账户余额不足！当前余额 ¥' + (fromAccount.balance || 0).toFixed(2)
      });
    } else {
      this.setData({ balanceWarning: '' });
    }
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
    if (form.balanceWarning) {
      var self = this;
      wx.showModal({
        title: '余额不足',
        content: form.balanceWarning + '，是否仍然转账？',
        confirmText: '仍然转账',
        cancelText: '取消',
        success: function(modalRes) {
          if (modalRes.confirm) {
            self.saveTransaction();
          }
        }
      });
      return;
    }

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
