const { api } = require('../../utils/request');

Page({
  data: {
    // 表单字段
    amount: '',
    selectedAccount: null,
    selectedCategory: null,
    selectedParentCategory: null,
    date: '',
    time: '',
    dateTimeRange: [],
    dateTimeValue: [0, 0, 0, 0, 0],
    description: '',
    selectedTags: [],
    selectedSpecialBudgets: [],

    // 选择器数据
    accounts: [],
    categories: [],
    parentCategories: [],
    currentSubCategories: [],
    tags: [],
    specialBudgets: [],

    // 弹窗状态
    showAccountPicker: false,
    showCategoryPicker: false,
    showTagPicker: false,
    showBudgetPicker: false,

    // 当前选中的父分类索引
    activeParentIndex: 0,

    // 保存状态
    saving: false,
    duplicateChecked: false
  },

  onLoad() {
    var now = new Date();
    this.setData({
      date: this.formatDateStr(now),
      time: this.formatTimeStr(now)
    });
    this.buildDateTimeRange(now);

    this.loadAccounts();
    this.loadCategories();
    this.loadSpecialBudgets();
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

  // 格式化时间
  formatTimeStr(date) {
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return h + ':' + min;
  },

  // 加载账户
  async loadAccounts() {
    try {
      const data = await api.get('/accounts');
      const grouped = (data && data.accounts) || {};
      const all = (grouped.asset || []).concat(grouped.liability || []);
      this.setData({ accounts: all });
    } catch (err) {
      console.error('加载账户失败:', err);
    }
  },

  // 加载支出分类
  async loadCategories() {
    try {
      const data = await api.get('/categories', { type: 'expense' });
      const parents = (data || []).map(function(item) {
        return {
          id: item.id,
          name: item.name,
          icon: item.icon,
          children: item.children || []
        };
      });
      this.setData({
        categories: data || [],
        parentCategories: parents,
        currentSubCategories: parents.length > 0 ? (parents[0].children || []) : []
      });
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  // 加载专项预算
  async loadSpecialBudgets() {
    try {
      const data = await api.get('/budgets/special/available');
      this.setData({ specialBudgets: data || [] });
    } catch (err) {
      console.error('加载专项预算失败:', err);
    }
  },

  // 金额输入
  onAmountInput(e) {
    let val = e.detail.value;
    // 限制只能输入数字和小数点，最多两位小数
    val = val.replace(/[^\d.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) {
      val = parts[0] + '.' + parts[1].substring(0, 2);
    }
    this.setData({ amount: val, duplicateChecked: false });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // === 账户选择器 ===
  openAccountPicker() {
    this.setData({ showAccountPicker: true });
  },
  closeAccountPicker() {
    this.setData({ showAccountPicker: false });
  },
  onSelectAccount(e) {
    const id = e.currentTarget.dataset.id;
    const account = this.data.accounts.find(function(a) { return a.id == id; });
    if (account) {
      this.setData({ selectedAccount: account, showAccountPicker: false });
    }
  },

  // === 分类选择器 ===
  openCategoryPicker() {
    const parentCategories = this.data.parentCategories;
    if (parentCategories.length > 0) {
      this.setData({
        showCategoryPicker: true,
        activeParentIndex: 0,
        currentSubCategories: parentCategories[0].children || []
      });
    }
  },
  closeCategoryPicker() {
    this.setData({ showCategoryPicker: false });
  },
  onSelectParentCategory(e) {
    var index = Number(e.currentTarget.dataset.index);
    var parentCategories = this.data.parentCategories;
    this.setData({
      activeParentIndex: index,
      currentSubCategories: parentCategories[index].children || []
    });
  },
  onSelectSubCategory(e) {
    const id = e.currentTarget.dataset.id;
    const name = e.currentTarget.dataset.name;
    const icon = e.currentTarget.dataset.icon;
    this.setData({
      selectedCategory: { id: id, name: name, icon: icon },
      showCategoryPicker: false
    });
  },

  // === 标签选择 ===
  openTagPicker() {
    this.setData({ showTagPicker: true });
  },
  closeTagPicker() {
    this.setData({ showTagPicker: false });
  },
  onToggleTag(e) {
    const id = e.currentTarget.dataset.id;
    let selectedTags = this.data.selectedTags.slice();
    const idx = selectedTags.indexOf(id);
    if (idx > -1) {
      selectedTags.splice(idx, 1);
    } else {
      selectedTags.push(id);
    }
    this.setData({ selectedTags: selectedTags });
  },

  // === 专项预算选择 ===
  openBudgetPicker() {
    this.setData({ showBudgetPicker: true });
  },
  closeBudgetPicker() {
    this.setData({ showBudgetPicker: false });
  },
  onToggleBudget(e) {
    const id = e.currentTarget.dataset.id;
    let selected = this.data.selectedSpecialBudgets.slice();
    const idx = selected.indexOf(id);
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(id);
    }
    this.setData({ selectedSpecialBudgets: selected });
  },

  // === 重复检测 ===
  async checkDuplicate() {
    const form = this;
    const amount = parseFloat(form.data.amount);
    if (!amount || amount <= 0) return;

    try {
      const res = await api.post('/transactions/check-duplicate', {
        amount: amount,
        date: form.data.date,
        transactionType: 'expense',
        categoryId: form.data.selectedCategory ? form.data.selectedCategory.id : null,
        accountId: form.data.selectedAccount ? form.data.selectedAccount.id : null
      });
      if (res && res.isDuplicate) {
        wx.showModal({
          title: '重复记账提醒',
          content: '检测到可能重复的记账记录，是否仍然保存？',
          confirmText: '仍然保存',
          cancelText: '取消',
          success: function(modalRes) {
            if (modalRes.confirm) {
              form.setData({ duplicateChecked: true });
              form.saveTransaction();
            }
          }
        });
      } else {
        form.setData({ duplicateChecked: true });
        form.saveTransaction();
      }
    } catch (err) {
      // 检查失败时直接保存
      form.setData({ duplicateChecked: true });
      form.saveTransaction();
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
    if (!form.selectedAccount) {
      wx.showToast({ title: '请选择支出账户', icon: 'none' });
      return;
    }
    if (!form.selectedCategory) {
      wx.showToast({ title: '请选择消费项目', icon: 'none' });
      return;
    }

    if (this._checkOutflowAvailable(form.selectedAccount, amount)) return;

    if (!form.duplicateChecked) {
      this.checkDuplicate();
      return;
    }

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
      var bal = Number(account.currentBalance || 0);
      var used = Math.max(0, limit + bal);
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
      confirmText: '仍要记账',
      cancelText: '返回修改',
      success: function (res) {
        if (res.confirm) {
          if (!self.data.duplicateChecked) {
            self.checkDuplicate();
            return;
          }
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
        date: form.date,
        time: form.time,
        amount: parseFloat(form.amount),
        description: form.description,
        mode: 'simple',
        transactionType: 'expense',
        categoryId: form.selectedCategory.id,
        accountId: form.selectedAccount.id,
        tagIds: form.selectedTags,
        specialBudgetIds: form.selectedSpecialBudgets
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

  // 取消
  onCancel() {
    wx.navigateBack();
  }
});
