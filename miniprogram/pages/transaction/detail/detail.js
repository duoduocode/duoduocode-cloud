// pages/transaction/detail/detail.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    id: '',
    date: '',
    time: '',
    amount: '',
    description: '',
    mode: '',
    transactionType: '',
    categoryName: '',
    accountName: '',
    entries: [],
    tagNames: [],
    refundStatus: '',
    refundedAmount: '',
    loading: true,
    showRefundPanel: false,
    refundAmount: '',
    refundDate: '',
    refundReason: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
    }
  },

  onShow() {
    if (this.data.id) {
      this.loadDetail();
    }
  },

  async loadDetail() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      var res = await api.get('/transactions/' + this.data.id);
      var data = res || {};

      var entries = (data.entries || []).map(function(e) {
        return {
          accountName: e.accountName || '',
          amount: util.formatAmount(e.amount),
          type: e.type || ''
        };
      });

      this.setData({
        date: util.formatDate(data.date),
        time: data.time || '',
        amount: util.formatAmount(data.amount),
        description: data.description || '',
        mode: data.mode || '',
        transactionType: data.transactionType || 'expense',
        categoryName: data.categoryName || '',
        accountName: data.accountName || '',
        entries: entries,
        tagNames: data.tagNames || [],
        refundStatus: data.refundStatus || 'none',
        refundedAmount: util.formatAmount(data.refundedAmount || 0),
        refundDate: util.getToday(),
        loading: false
      });
    } catch (err) {
      console.error('加载交易详情失败:', err);
      this.setData({ loading: false });
    } finally {
      wx.hideLoading();
    }
  },

  // 跳转编辑
  goEdit() {
    wx.navigateTo({ url: '/pages/record/fullmode?id=' + this.data.id });
  },

  // 删除
  deleteTransaction() {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复，是否继续？',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.delete('/transactions/' + that.data.id);
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(function() {
              wx.navigateBack();
            }, 1500);
          } catch (err) {
            console.error('删除失败:', err);
          }
        }
      }
    });
  },

  // 退款
  showRefund() {
    if (!this.data.refundAmount) {
      this.setData({ refundAmount: this.data.amount });
    }
    this.setData({ showRefundPanel: true });
  },

  hideRefund() {
    this.setData({ showRefundPanel: false });
  },

  onRefundAmountInput(e) {
    this.setData({ refundAmount: e.detail.value });
  },

  onRefundDateChange(e) {
    this.setData({ refundDate: e.detail.value });
  },

  onRefundReasonInput(e) {
    this.setData({ refundReason: e.detail.value });
  },

  async submitRefund() {
    var that = this;
    if (!that.data.refundAmount || Number(that.data.refundAmount) <= 0) {
      wx.showToast({ title: '请输入有效退款金额', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '处理中...', mask: true });
    try {
      await api.post('/transactions/' + that.data.id + '/refund', {
        amount: Number(that.data.refundAmount),
        date: that.data.refundDate,
        reason: that.data.refundReason
      });
      wx.showToast({ title: '退款成功', icon: 'success' });
      that.setData({ showRefundPanel: false });
      that.loadDetail();
    } catch (err) {
      console.error('退款失败:', err);
    } finally {
      wx.hideLoading();
    }
  }
});
