const { api } = require('../../utils/request');

Page({
  data: {
    amount: '',
    fromAccount: null,
    toLiability: null,
    toLiabilityDebt: '0.00',
    date: '',
    time: '',
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
      const grouped = (data && data.accounts) || {};
      const all = (grouped.asset || []).concat(grouped.liability || []).concat(grouped.investment || []);
      const assetAccounts = all.filter(function(a) {
        return a.type === 'asset' || a.type === 'checking' ||
          a.type === 'savings' || a.type === 'cash' || a.type === 'investment';
      });
      const liabilities = all.filter(function(a) {
        return a.type === 'liability' || a.type === 'credit_card' || a.type === 'loan';
      });
      this.setData({
        accounts: assetAccounts,
        liabilityAccounts: liabilities
      });
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
  },

  onPayAll() {
    const liability = this.data.toLiability;
    if (!liability) {
      wx.showToast({ title: '请先选择负债账户', icon: 'none' });
      return;
    }
    const debtAmount = Math.abs(liability.balance || 0);
    this.setData({ amount: debtAmount.toFixed(2) });
  },

  onDateChange(e) { this.setData({ date: e.detail.value }); },
  onTimeChange(e) { this.setData({ time: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },

  // === 账户选择器 ===
  openFromAccountPicker() {
    const accounts = this.data.accounts;
    const list = accounts.map(function(a) {
      return {
        id: a.id,
        name: a.name,
        icon: a.icon,
        balance: a.balance || 0,
        balanceAbs: Math.abs(a.balance || 0).toFixed(2)
      };
    });
    this.setData({
      pickerMode: 'from',
      pickerTitle: '选择还款来源',
      pickerAccounts: list,
      pickerSelectedId: this.data.fromAccount ? this.data.fromAccount.id : '',
      pickerLabelPrefix: '余额',
      showAccountPicker: true
    });
  },

  openToAccountPicker() {
    const liabilities = this.data.liabilityAccounts;
    const list = liabilities.map(function(a) {
      return {
        id: a.id,
        name: a.name,
        icon: a.icon,
        balance: a.balance || 0,
        balanceAbs: Math.abs(a.balance || 0).toFixed(2)
      };
    });
    this.setData({
      pickerMode: 'to',
      pickerTitle: '选择还款目标',
      pickerAccounts: list,
      pickerSelectedId: this.data.toLiability ? this.data.toLiability.id : '',
      pickerLabelPrefix: '欠款',
      showAccountPicker: true
    });
  },

  closeAccountPicker() {
    this.setData({ showAccountPicker: false, pickerMode: 'none' });
  },

  onSelectAccount(e) {
    const id = e.currentTarget.dataset.id;

    if (this.data.pickerMode === 'from') {
      const account = this.data.accounts.find(function(a) { return a.id == id; });
      if (account) {
        this.setData({ fromAccount: account, showAccountPicker: false });
      }
    } else {
      const liability = this.data.liabilityAccounts.find(function(a) { return a.id == id; });
      if (liability) {
        const debt = Math.abs(liability.balance || 0);
        this.setData({
          toLiability: liability,
          toLiabilityDebt: debt.toFixed(2),
          showAccountPicker: false
        });
      }
    }
  },

  // === 保存 ===
  onSave() {
    const form = this.data;
    const amount = parseFloat(form.amount);

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

    this.saveTransaction();
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
