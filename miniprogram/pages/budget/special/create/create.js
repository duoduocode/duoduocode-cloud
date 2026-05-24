// pages/budget/special/create/create.js
const { api } = require('../../../../utils/request');
const util = require('../../../../utils/util');

Page({
  data: {
    name: '',
    totalAmount: '',
    startDate: '',
    endDate: '',
    note: '',
    categories: [],
    selectedCategoryIds: [],
    submitting: false
  },

  onLoad() {
    this.initDates();
    this.loadCategories();
  },

  initDates() {
    var now = new Date();
    var startDate = util.formatDate(now);
    var endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    var endDate = util.formatDate(endOfMonth);
    this.setData({ startDate: startDate, endDate: endDate });
  },

  async loadCategories() {
    try {
      var res = await api.get('/categories');
      var list = res || [];
      var expenseCategories = [];
      list.forEach(function(cat) {
        if (cat.type === 'expense') {
          expenseCategories.push({
            id: cat.id,
            name: cat.name,
            icon: cat.icon
          });
        }
        if (cat.children && cat.children.length > 0) {
          cat.children.forEach(function(child) {
            if (child.type === 'expense' || cat.type === 'expense') {
              expenseCategories.push({
                id: child.id,
                name: child.name,
                icon: child.icon
              });
            }
          });
        }
      });
      this.setData({ categories: expenseCategories });
    } catch (err) {
      console.error('加载分类失败:', err);
    }
  },

  // 输入处理
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  onAmountInput(e) {
    this.setData({ totalAmount: e.detail.value });
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ endDate: e.detail.value });
  },

  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 分类多选
  toggleCategory(e) {
    var id = e.currentTarget.dataset.id;
    var selected = this.data.selectedCategoryIds;
    var idx = selected.indexOf(id);
    if (idx > -1) {
      selected.splice(idx, 1);
    } else {
      selected.push(id);
    }
    this.setData({ selectedCategoryIds: selected });
  },

  isSelected(id) {
    return this.data.selectedCategoryIds.indexOf(id) > -1;
  },

  // 提交
  async submit() {
    var that = this;
    if (!that.data.name.trim()) {
      wx.showToast({ title: '请输入预算名称', icon: 'none' });
      return;
    }
    if (!that.data.totalAmount || Number(that.data.totalAmount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    if (!that.data.startDate || !that.data.endDate) {
      wx.showToast({ title: '请选择起止日期', icon: 'none' });
      return;
    }
    if (new Date(that.data.endDate) <= new Date(that.data.startDate)) {
      wx.showToast({ title: '结束日期必须晚于开始日期', icon: 'none' });
      return;
    }

    that.setData({ submitting: true });
    wx.showLoading({ title: '创建中...', mask: true });

    try {
      await api.post('/budgets/special', {
        name: that.data.name.trim(),
        totalAmount: Number(that.data.totalAmount),
        startDate: that.data.startDate,
        endDate: that.data.endDate,
        note: that.data.note,
        categoryIds: that.data.selectedCategoryIds
      });
      wx.showToast({ title: '创建成功', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('创建专项预算失败:', err);
    } finally {
      that.setData({ submitting: false });
      wx.hideLoading();
    }
  }
});
