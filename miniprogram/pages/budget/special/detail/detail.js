// pages/budget/special/detail/detail.js
const { api } = require('../../../../utils/request');
const util = require('../../../../utils/util');

Page({
  data: {
    id: '',
    name: '',
    totalAmount: 0,
    spentAmount: 0,
    startDate: '',
    endDate: '',
    status: '',
    percent: 0,
    remainDays: 0,
    categories: [],
    transactions: [],
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ id: options.id });
      this.loadDetail();
    }
  },

  onShow() {
    if (this.data.id && !this.data.loading) {
      this.loadDetail();
    }
  },

  async loadDetail() {
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      var res = await api.get('/budgets/special/' + this.data.id);
      var data = res || {};

      var percent = 0;
      if (data.totalAmount > 0) {
        percent = Math.round((data.spentAmount || 0) / data.totalAmount * 100);
      }

      var endDate = new Date(data.endDate);
      var now = new Date();
      var remainDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      if (remainDays < 0) remainDays = 0;

      var transactions = (data.transactions || []).map(function(t) {
        return {
          id: t.id,
          date: util.formatDate(t.date),
          amount: util.formatAmount(t.amount),
          categoryName: t.categoryName || '',
          description: t.description || '',
          transactionType: t.transactionType || 'expense'
        };
      });

      this.setData({
        name: data.name || '',
        totalAmount: util.formatAmount(data.totalAmount),
        spentAmount: util.formatAmount(data.spentAmount || 0),
        startDate: data.startDate || '',
        endDate: data.endDate || '',
        status: data.status || '',
        percent: percent,
        remainDays: remainDays,
        categories: data.categories || [],
        transactions: transactions,
        loading: false
      });
    } catch (err) {
      console.error('加载专项预算详情失败:', err);
      this.setData({ loading: false });
    } finally {
      wx.hideLoading();
    }
  },

  // 结束预算
  async endBudget() {
    var that = this;
    wx.showModal({
      title: '确认结束',
      content: '确定要结束此专项预算吗？',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.put('/budgets/special/' + that.data.id + '/end');
            wx.showToast({ title: '已结束', icon: 'success' });
            that.loadDetail();
          } catch (err) {
            console.error('结束预算失败:', err);
          }
        }
      }
    });
  }
});
