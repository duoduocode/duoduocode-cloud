// pages/accounts/edit.js - 编辑账户页
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    accountId: '',
    formData: {
      type: 'asset',
      name: '',
      icon: '💰',
      color: '#07C160',
      initialBalance: '',
      creditLimit: '',
      effectiveCreditLimitText: '',
      includeInNetWorth: true,
      allowTransfer: true,
      desc: ''
    },
    emojiList: ['💰','💳','🏦','💵','💎','📈','🏠','🚗','✈️','🎓','💊','🎵','🍔','👕','💻','📱','🎁','🐷','✨','⭐'],
    colorList: ['#07C160','#FA5151','#FF9800','#2196F3','#9C27B0','#00BCD4','#FF5722','#795548','#607D8B','#4CAF50','#FFEB3B','#E91E63'],
    initialBalanceEditable: false,
    showAdjustModal: false,
    creditLimitEditable: false,
    showCreditLimitModal: false
  },

  onLoad: function (options) {
    var id = options.id || '';
    if (id) {
      this.setData({ accountId: id });
      this.loadAccountDetail(id);
    }
  },

  loadAccountDetail: function (id) {
    var that = this;
    api.get('/accounts/' + id, {}, { showLoading: true, loadingText: '加载中...' }).then(function (data) {
      var ib = data.initialBalance != null ? data.initialBalance : 0;
      if (data.type === 'liability' && ib < 0) {
        ib = Math.abs(ib);
      }
      var effCredit = data.effectiveCreditLimit || data.creditLimit || 0;
      var accessible = Number(effCredit).toFixed(2);
      that.setData({
        formData: {
          type: data.type || 'asset',
          name: data.name || '',
          icon: data.icon || '💰',
          color: data.color || '#07C160',
          initialBalance: String(ib),
          creditLimit: data.creditLimit != null ? String(data.creditLimit) : '',
          effectiveCreditLimitText: accessible,
          includeInNetWorth: data.includeInNetWorth !== false,
          allowTransfer: data.allowTransfer !== false,
          desc: data.desc || ''
        }
      });
    });
  },

  onNameInput: function (e) {
    this.setData({ 'formData.name': e.detail.value });
  },

  onBalanceInput: function (e) {
    this.setData({ 'formData.initialBalance': e.detail.value });
  },

  onCreditLimitInput: function (e) {
    this.setData({ 'formData.creditLimit': e.detail.value });
  },

  selectType: function () { },

  selectIcon: function (e) {
    this.setData({ 'formData.icon': e.currentTarget.dataset.icon });
  },

  selectColor: function (e) {
    this.setData({ 'formData.color': e.currentTarget.dataset.color });
  },

  onIncludeToggle: function (e) {
    this.setData({ 'formData.includeInNetWorth': e.detail.value });
  },

  onTransferToggle: function (e) {
    this.setData({ 'formData.allowTransfer': e.detail.value });
  },

  onDescInput: function (e) {
    this.setData({ 'formData.desc': e.detail.value });
  },

  showAdjustModal: function () {
    this.setData({ showAdjustModal: true });
  },

  confirmAdjust: function () {
    this.setData({ showAdjustModal: false, initialBalanceEditable: true });
  },

  cancelAdjustModal: function () {
    this.setData({ showAdjustModal: false });
  },

  showCreditLimitModal: function () {
    this.setData({ showCreditLimitModal: true });
  },

  confirmCreditLimit: function () {
    this.setData({ showCreditLimitModal: false, creditLimitEditable: true });
  },

  cancelCreditLimitModal: function () {
    this.setData({ showCreditLimitModal: false });
  },

  // 数字正则：允许负数、小数点
  _isValidNumber: function (val) {
    return val === '' || /^-?\d+(\.\d+)?$/.test(val);
  },

  submit: function () {
    var formData = this.data.formData;
    var name = formData.name.trim();
    if (!name) {
      wx.showToast({ title: '请输入账户名称', icon: 'none' });
      return;
    }
    if (name.length > 50) {
      wx.showToast({ title: '账户名称不能超过50个字符', icon: 'none' });
      return;
    }
    if (formData.desc && formData.desc.trim().length > 200) {
      wx.showToast({ title: '账户备注不能超过200个字符', icon: 'none' });
      return;
    }
    if (!this._isValidNumber(formData.initialBalance)) {
      wx.showToast({ title: '金额请输入有效数字', icon: 'none' });
      return;
    }
    if (formData.type === 'liability' && !this._isValidNumber(formData.creditLimit)) {
      wx.showToast({ title: '信用额度请输入有效数字', icon: 'none' });
      return;
    }

    var payload = {
      name: formData.name.trim(),
      icon: formData.icon,
      color: formData.color,
      initialBalance: parseFloat(formData.initialBalance) || 0,
      includeInNetWorth: formData.includeInNetWorth,
      allowTransfer: formData.allowTransfer,
      desc: formData.desc.trim()
    };

    if (formData.type === 'liability') {
      payload.creditLimit = parseFloat(formData.creditLimit) || 0;
    }

    var that = this;
    api.put('/accounts/' + this.data.accountId, payload, {
      showLoading: true,
      loadingText: '保存中...'
    }).then(function () {
      wx.showToast({ title: '修改成功', icon: 'success' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    });
  }
});
