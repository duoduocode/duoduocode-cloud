const { api } = require('../../utils/request');

Page({
  data: {
    // 交易类型: expense / income / transfer / repayment
    transactionType: 'expense',
    amount: '',
    date: '',
    time: '',
    dateTimeRange: [],
    dateTimeValue: [0, 0, 0, 0, 0],
    description: '',

    // 分录行: [{id, type:debit/credit, targetId, targetName, targetIcon, debitAmount, creditAmount}]
    entries: [],

    // 借贷合计
    totalDebit: '0.00',
    totalCredit: '0.00',
    isBalanced: false,
    diffAmount: '0.00',

    // 选择器
    showPicker: false,
    pickerItems: [],
    pickerEntryId: '',

    // 数据
    accounts: [],
    expenseCategories: [],
    incomeCategories: [],
    allCategories: [],

    saving: false
  },

  onLoad() {
    var now = new Date();
    this.setData({
      date: this.formatDateStr(now),
      time: this.formatTimeStr(now)
    });
    this.buildDateTimeRange(now);
    this.loadData();
    this.addEntry();
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
    var y = date.getFullYear();
    var m = (date.getMonth() + 1).toString().padStart(2, '0');
    var d = date.getDate().toString().padStart(2, '0');
    return y + '-' + m + '-' + d;
  },

  formatTimeStr: function (date) {
    var h = date.getHours().toString().padStart(2, '0');
    var m = date.getMinutes().toString().padStart(2, '0');
    return h + ':' + m;
  },

  async loadData() {
    try {
      const [accounts, expCat, incCat] = await Promise.all([
        api.get('/accounts'),
        api.get('/categories', { type: 'expense' }),
        api.get('/categories', { type: 'income' })
      ]);

      this.setData({
        accounts: accounts || [],
        expenseCategories: expCat || [],
        incomeCategories: incCat || [],
        allCategories: (expCat || []).concat(incCat || [])
      });
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  },

  // 切换交易类型
  onTypeChange(e) {
    this.setData({ transactionType: e.currentTarget.dataset.type, entries: [] });
    this.addEntry();
  },

  // 金额输入
  onAmountInput(e) {
    this.setData({ amount: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // === 分录管理 ===
  addEntry() {
    const entries = this.data.entries;
    const newEntry = {
      id: 'entry_' + Date.now(),
      type: entries.length === 0 ? 'debit' : 'credit',
      targetId: '',
      targetName: '',
      targetIcon: '',
      debitAmount: '',
      creditAmount: ''
    };
    entries.push(newEntry);
    this.setData({ entries: entries });
    this.recalcBalance();
  },

  removeEntry(e) {
    const id = e.currentTarget.dataset.id;
    const entries = this.data.entries.filter(function(item) {
      return item.id !== id;
    });
    this.setData({ entries: entries });
    this.recalcBalance();
  },

  // 切换借贷方向
  toggleEntryType(e) {
    const id = e.currentTarget.dataset.id;
    const newType = e.currentTarget.dataset.newtype;
    const entries = this.data.entries.map(function(item) {
      if (item.id === id) {
        item.type = newType;
      }
      return item;
    });
    this.setData({ entries: entries });
    this.recalcBalance();
  },

  // 打开科目选择器
  openTargetPicker(e) {
    const id = e.currentTarget.dataset.id;
    const transactionType = this.data.transactionType;
    let pickerItems = [];

    // 根据交易类型筛选可选科目
    if (transactionType === 'expense') {
      // 支出: 可选资产账户和支出分类
      pickerItems = this.getTargetItems(['account', 'expense_category']);
    } else if (transactionType === 'income') {
      pickerItems = this.getTargetItems(['account', 'income_category']);
    } else if (transactionType === 'transfer') {
      pickerItems = this.getTargetItems(['account']);
    } else {
      pickerItems = this.getTargetItems(['account', 'liability']);
    }

    this.setData({
      showPicker: true,
      pickerEntryId: id,
      pickerItems: pickerItems
    });
  },

  // 获取可选科目
  getTargetItems(types) {
    let items = [];
    const accounts = this.data.accounts;

    types.forEach(function(t) {
      if (t === 'account') {
        accounts.forEach(function(a) {
          items.push({ id: a.id, name: a.name, icon: a.icon, type: 'account', data: a });
        });
      } else if (t === 'expense_category') {
        const cats = this.data.expenseCategories;
        cats.forEach(function(cat) {
          items.push({ id: cat.id, name: cat.name, icon: cat.icon, type: 'category' });
          (cat.children || []).forEach(function(child) {
            items.push({ id: child.id, name: child.name, icon: child.icon, type: 'category', parentId: cat.id });
          });
        });
      } else if (t === 'income_category') {
        const cats = this.data.incomeCategories;
        cats.forEach(function(cat) {
          items.push({ id: cat.id, name: cat.name, icon: cat.icon, type: 'category' });
          (cat.children || []).forEach(function(child) {
            items.push({ id: child.id, name: child.name, icon: child.icon, type: 'category', parentId: cat.id });
          });
        });
      } else if (t === 'liability') {
        accounts.forEach(function(a) {
          if (a.type === 'liability' || a.type === 'credit_card' || a.type === 'loan') {
            items.push({ id: a.id, name: a.name, icon: a.icon, type: 'account', data: a });
          }
        });
      }
    }.bind(this));

    return items;
  },

  onSelectTarget(e) {
    const itemId = e.currentTarget.dataset.id;
    const picked = this.data.pickerItems.find(function(p) {
      return p.id == itemId;
    });
    if (!picked) return;

    const entries = this.data.entries.map(function(entry) {
      if (entry.id === this.data.pickerEntryId) {
        entry.targetId = picked.id;
        entry.targetName = picked.name;
        entry.targetIcon = picked.icon || '';
      }
      return entry;
    }.bind(this));

    this.setData({ entries: entries, showPicker: false });
  },

  closePicker() {
    this.setData({ showPicker: false });
  },

  // 借贷金额输入
  onDebitInput(e) {
    const id = e.currentTarget.dataset.id;
    const val = this.sanitizeAmount(e.detail.value);
    const entries = this.data.entries.map(function(entry) {
      if (entry.id === id) {
        entry.debitAmount = val;
      }
      return entry;
    });
    this.setData({ entries: entries });
    this.recalcBalance();
  },

  onCreditInput(e) {
    const id = e.currentTarget.dataset.id;
    const val = this.sanitizeAmount(e.detail.value);
    const entries = this.data.entries.map(function(entry) {
      if (entry.id === id) {
        entry.creditAmount = val;
      }
      return entry;
    });
    this.setData({ entries: entries });
    this.recalcBalance();
  },

  sanitizeAmount(val) {
    val = (val || '').replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].substring(0, 2);
    }
    return val;
  },

  // 借贷平衡校验
  recalcBalance() {
    const entries = this.data.entries;
    let totalDebit = 0;
    let totalCredit = 0;

    entries.forEach(function(entry) {
      totalDebit += parseFloat(entry.debitAmount || 0);
      totalCredit += parseFloat(entry.creditAmount || 0);
    });

    const diff = Math.abs(totalDebit - totalCredit);
    const isBalanced = entries.length >= 2 && totalDebit > 0 && totalCredit > 0 && diff < 0.01;

    this.setData({
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      diffAmount: diff.toFixed(2),
      isBalanced: isBalanced
    });
  },

  // 一键补齐
  onAutoBalance() {
    const entries = this.data.entries;
    let totalDebit = 0;
    let totalCredit = 0;
    let lastDebitEntry = null;
    let lastCreditEntry = null;

    entries.forEach(function(entry) {
      totalDebit += parseFloat(entry.debitAmount || 0);
      totalCredit += parseFloat(entry.creditAmount || 0);
      if (entry.type === 'debit') lastDebitEntry = entry;
      if (entry.type === 'credit') lastCreditEntry = entry;
    });

    const diff = Math.abs(totalDebit - totalCredit);
    if (diff < 0.01) {
      wx.showToast({ title: '借贷已平衡', icon: 'none' });
      return;
    }

    const newEntries = entries.map(function(entry) {
      if (totalDebit > totalCredit && entry === lastCreditEntry) {
        entry.creditAmount = (parseFloat(entry.creditAmount || 0) + diff).toFixed(2);
      } else if (totalCredit > totalDebit && entry === lastDebitEntry) {
        entry.debitAmount = (parseFloat(entry.debitAmount || 0) + diff).toFixed(2);
      }
      return entry;
    });

    this.setData({ entries: newEntries });
    this.recalcBalance();

    if (totalDebit > totalCredit) {
      wx.showToast({ title: '已补齐贷方金额', icon: 'success' });
    } else {
      wx.showToast({ title: '已补齐借方金额', icon: 'success' });
    }
  },

  // === 保存 ===
  onSave() {
    if (!this.data.isBalanced) {
      wx.showToast({ title: '借贷不平衡，无法保存', icon: 'none' });
      return;
    }

    const entries = this.data.entries;
    const hasTarget = entries.every(function(e) { return e.targetId; });
    if (!hasTarget) {
      wx.showToast({ title: '请为所有分录选择科目', icon: 'none' });
      return;
    }

    const amount = parseFloat(this.data.amount);
    if (!amount || amount <= 0) {
      wx.showToast({ title: '请输入金额', icon: 'none' });
      return;
    }

    this.saveTransaction();
  },

  async saveTransaction() {
    this.setData({ saving: true });

    // 构建分录数据
    const entries = this.data.entries.map(function(e) {
      return {
        type: e.type,
        targetId: e.targetId,
        debitAmount: parseFloat(e.debitAmount || 0),
        creditAmount: parseFloat(e.creditAmount || 0)
      };
    });

    try {
      await api.post('/transactions', {
        transactionType: this.data.transactionType,
        amount: parseFloat(this.data.amount),
        date: this.data.date,
        time: this.data.time,
        description: this.data.description,
        mode: 'full',
        entries: entries
      });

      wx.showToast({ title: '记账成功', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      this.setData({ saving: false });
      console.error('保存失败:', err);
    }
  },

  onCancel() {
    wx.navigateBack();
  }
});
