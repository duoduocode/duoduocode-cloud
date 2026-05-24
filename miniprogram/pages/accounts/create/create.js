// pages/accounts/create.js - 创建账户页
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    formData: {
      type: 'asset',
      name: '',
      icon: '💰',
      color: '#07C160',
      initialBalance: '',
      creditLimit: '',
      includeInNetWorth: true,
      allowTransfer: true
    },
    emojiList: ['💰','💳','🏦','💵','💎','📈','🏠','🚗','✈️','🎓','💊','🎵','🍔','👕','💻','📱','🎁','🐷','✨','⭐'],
    colorList: ['#07C160','#FA5151','#FF9800','#2196F3','#9C27B0','#00BCD4','#FF5722','#795548','#607D8B','#4CAF50','#FFEB3B','#E91E63']
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

  selectType: function (e) {
    var type = e.currentTarget.dataset.type;
    var iconMap = { asset: '💰', liability: '💳', investment: '📈' };
    var colorMap = { asset: '#07C160', liability: '#FA5151', investment: '#FF9800' };
    this.setData({
      'formData.type': type,
      'formData.icon': iconMap[type],
      'formData.color': colorMap[type]
    });
  },

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

  submit: function () {
    var formData = this.data.formData;
    if (!formData.name.trim()) {
      wx.showToast({ title: '请输入账户名称', icon: 'none' });
      return;
    }

    var payload = {
      name: formData.name.trim(),
      type: formData.type,
      icon: formData.icon,
      color: formData.color,
      initialBalance: parseFloat(formData.initialBalance) || 0,
      includeInNetWorth: formData.includeInNetWorth,
      allowTransfer: formData.allowTransfer
    };

    if (formData.type === 'liability') {
      payload.creditLimit = parseFloat(formData.creditLimit) || 0;
    }

    var that = this;
    api.post('/accounts', payload, { showLoading: true, loadingText: '创建中...' }).then(function () {
      wx.showToast({ title: '账户创建成功', icon: 'success' });
      setTimeout(function () {
        wx.navigateBack();
      }, 1500);
    });
  }
});
