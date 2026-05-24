// pages/budget/special/list/list.js
const { api } = require('../../../../utils/request');
const util = require('../../../../utils/util');

Page({
  data: {
    currentTab: 'ongoing',
    budgets: [],
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 20
  },

  onLoad() {
    this.loadList();
  },

  onShow() {
    this.loadList();
  },

  switchTab(e) {
    var tab = e.currentTarget.dataset.tab;
    if (tab === this.data.currentTab) return;
    this.setData({ currentTab: tab, page: 1, hasMore: true, budgets: [] });
    this.loadList();
  },

  async loadList() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      var params = {
        status: this.data.currentTab,
        page: this.data.page,
        size: this.data.pageSize
      };
      var res = await api.get('/budgets/special', params);
      var list = res || [];

      var formattedList = list.map(function(item) {
        var percent = item.totalAmount > 0
          ? Math.round((item.spentAmount || 0) / item.totalAmount * 100)
          : 0;
        var endDate = new Date(item.endDate);
        var now = new Date();
        var remainDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
        if (remainDays < 0) remainDays = 0;

        return {
          id: item.id,
          name: item.name,
          totalAmount: util.formatAmount(item.totalAmount),
          spentAmount: util.formatAmount(item.spentAmount || 0),
          startDate: item.startDate,
          endDate: item.endDate,
          status: item.status,
          percent: percent,
          remainDays: remainDays
        };
      });

      this.setData({
        budgets: this.data.page === 1 ? formattedList : this.data.budgets.concat(formattedList),
        loading: false,
        hasMore: formattedList.length >= this.data.pageSize
      });
    } catch (err) {
      console.error('加载专项预算列表失败:', err);
      this.setData({ loading: false });
    }
  },

  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadList();
  },

  goDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/budget/special/detail/detail?id=' + id });
  },

  goCreate() {
    wx.navigateTo({ url: '/pages/budget/special/create/create' });
  }
});
