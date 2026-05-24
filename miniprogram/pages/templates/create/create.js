// pages/templates/create/create.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    isEdit: false,
    templateId: '',
    name: '',
    amount: '',
    transactionType: 'expense',
    categoryId: '',
    selectedCategoryName: '',
    categories: [],
    accountId: '',
    selectedAccountName: '',
    accounts: [],
    frequencyIndex: 2,
    frequencyOptions: ['每天', '每周', '每月', '每年'],
    frequencyValues: ['daily', 'weekly', 'monthly', 'yearly'],
    startDate: '',
    terminationType: '',
    terminationCount: '',
    terminationDate: ''
  },

  onLoad(options) {
    var today = util.getToday();
    this.setData({ startDate: today });

    if (options.id) {
      this.setData({ isEdit: true, templateId: options.id });
    }

    this.loadOptions();
    if (options.id) {
      this.loadDetail(options.id);
    }
  },

  async loadOptions() {
    try {
      var [catRes, accRes] = await Promise.all([
        api.get('/categories').catch(function() { return []; }),
        api.get('/accounts').catch(function() { return []; })
      ]);

      // 提取扁平分类
      var cats = [];
      (catRes || []).forEach(function(parent) {
        if (parent.children && parent.children.length > 0) {
          parent.children.forEach(function(child) {
            cats.push({ id: child.id, name: child.name, type: child.type || parent.type });
          });
        }
      });

      var accounts = (accRes || []).map(function(a) {
        return { id: a.id, name: a.name };
      });

      this.setData({
        categories: cats,
        accounts: accounts
      });
    } catch (err) {
      console.error('加载选项失败:', err);
    }
  },

  async loadDetail(id) {
    try {
      var res = await api.get('/recurring-templates/' + id);
      var data = res || {};

      var freqIdx = 2;
      var freqValues = this.data.frequencyValues;
      for (var i = 0; i < freqValues.length; i++) {
        if (freqValues[i] === data.frequency) {
          freqIdx = i;
          break;
        }
      }

      this.setData({
        name: data.name || '',
        amount: util.formatAmount(data.amount),
        transactionType: data.transactionType || 'expense',
        categoryId: data.categoryId || '',
        selectedCategoryName: data.categoryName || '',
        accountId: data.accountId || '',
        selectedAccountName: data.accountName || '',
        frequencyIndex: freqIdx,
        startDate: data.startDate || util.getToday(),
        terminationType: data.terminationType || '',
        terminationCount: data.terminationCount || '',
        terminationDate: data.terminationDate || ''
      });
    } catch (err) {
      console.error('加载模板详情失败:', err);
    }
  },

  // 输入处理
  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onAmountInput(e) { this.setData({ amount: e.detail.value }); },

  switchType(e) {
    this.setData({ transactionType: e.currentTarget.dataset.type });
  },

  onCategoryChange(e) {
    var idx = e.detail.value;
    var item = this.data.categories[idx];
    this.setData({
      categoryId: item ? item.id : '',
      selectedCategoryName: item ? item.name : ''
    });
  },

  onAccountChange(e) {
    var idx = e.detail.value;
    var item = this.data.accounts[idx];
    this.setData({
      accountId: item ? item.id : '',
      selectedAccountName: item ? item.name : ''
    });
  },

  onFrequencyChange(e) {
    this.setData({ frequencyIndex: Number(e.detail.value) });
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value });
  },

  setTermination(e) {
    var type = e.currentTarget.dataset.type;
    this.setData({ terminationType: type });
  },

  onTerminationCountInput(e) {
    this.setData({ terminationCount: e.detail.value });
  },

  onTerminationDateChange(e) {
    this.setData({ terminationDate: e.detail.value });
  },

  // 提交
  async submit() {
    var that = this;
    if (!that.data.name.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    if (!that.data.amount || Number(that.data.amount) <= 0) {
      wx.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    if (!that.data.categoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    var payload = {
      name: that.data.name.trim(),
      amount: Number(that.data.amount),
      transactionType: that.data.transactionType,
      categoryId: that.data.categoryId,
      categoryName: that.data.selectedCategoryName,
      accountId: that.data.accountId || null,
      accountName: that.data.selectedAccountName || '',
      frequency: that.data.frequencyValues[that.data.frequencyIndex],
      startDate: that.data.startDate,
      terminationType: that.data.terminationType || null,
      terminationCount: that.data.terminationCount ? Number(that.data.terminationCount) : null,
      terminationDate: that.data.terminationDate || null
    };

    wx.showLoading({ title: '保存中...', mask: true });
    try {
      if (that.data.isEdit) {
        await api.put('/recurring-templates/' + that.data.templateId, payload);
      } else {
        await api.post('/recurring-templates', payload);
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存模板失败:', err);
    } finally {
      wx.hideLoading();
    }
  }
});
