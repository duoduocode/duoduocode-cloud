// pages/search/search/search.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    keyword: '',
    showFilter: false,

    // 筛选条件
    dateStart: '',
    dateEnd: '',
    minAmount: '',
    maxAmount: '',
    categoryId: '',
    selectedCategoryName: '',
    categories: [{ id: '', name: '全部' }],
    accountId: '',
    selectedAccountName: '',
    accounts: [{ id: '', name: '全部' }],
    tagId: '',
    selectedTagName: '',
    tags: [{ id: '', name: '全部' }],

    // 排序
    sortBy: 'date',
    sortOrder: 'desc',

    // 结果
    transactions: [],
    page: 1,
    pageSize: 20,
    loading: false,
    hasMore: true
  },

  onLoad() {
    this.loadFilterOptions();
  },

  async loadFilterOptions() {
    try {
      var [catRes, accRes, tagRes] = await Promise.all([
        api.get('/categories').catch(function() { return []; }),
        api.get('/accounts').catch(function() { return []; }),
        api.get('/tags').catch(function() { return []; })
      ]);

      this.setData({
        categories: [{ id: '', name: '全部' }].concat(
          (catRes || []).map(function(c) { return { id: c.id, name: c.name }; })
        ),
        accounts: [{ id: '', name: '全部' }].concat(
          (accRes || []).map(function(a) { return { id: a.id, name: a.name }; })
        ),
        tags: [{ id: '', name: '全部' }].concat(
          (tagRes || []).map(function(t) { return { id: t.id, name: t.name }; })
        )
      });
    } catch (err) {
      console.error('加载筛选选项失败:', err);
    }

    this.doSearch();
  },

  // 搜索
  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  doSearch() {
    this.setData({ page: 1, transactions: [], hasMore: true });
    this.loadTransactions();
  },

  async loadTransactions() {
    if (this.data.loading || !this.data.hasMore) return;
    this.setData({ loading: true });

    try {
      var params = {
        page: this.data.page,
        size: this.data.pageSize,
        sortBy: this.data.sortBy,
        sortOrder: this.data.sortOrder
      };
      if (this.data.keyword) params.keyword = this.data.keyword;
      if (this.data.dateStart) params.dateStart = this.data.dateStart;
      if (this.data.dateEnd) params.dateEnd = this.data.dateEnd;
      if (this.data.minAmount) params.minAmount = this.data.minAmount;
      if (this.data.maxAmount) params.maxAmount = this.data.maxAmount;
      if (this.data.categoryId) params.categoryId = this.data.categoryId;
      if (this.data.accountId) params.accountId = this.data.accountId;
      if (this.data.tagId) params.tagId = this.data.tagId;

      var res = await api.get('/transactions/search', params);
      var list = res || [];

      var formattedList = list.map(function(item) {
        return {
          id: item.id,
          date: util.formatDate(item.date),
          amount: util.formatAmount(item.amount),
          description: item.description || '',
          categoryName: item.categoryName || '',
          accountName: item.accountName || '',
          transactionType: item.transactionType || 'expense'
        };
      });

      this.setData({
        transactions: this.data.page === 1 ? formattedList : this.data.transactions.concat(formattedList),
        loading: false,
        hasMore: formattedList.length >= this.data.pageSize
      });
    } catch (err) {
      console.error('搜索失败:', err);
      this.setData({ loading: false });
    }
  },

  // 加载更多
  loadMore() {
    if (!this.data.hasMore || this.data.loading) return;
    this.setData({ page: this.data.page + 1 });
    this.loadTransactions();
  },

  // 排序
  setSort(e) {
    var sortBy = e.currentTarget.dataset.sort;
    var sortOrder = 'desc';
    if (this.data.sortBy === sortBy) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }
    this.setData({ sortBy: sortBy, sortOrder: sortOrder });
    this.doSearch();
  },

  // 筛选面板
  toggleFilter() {
    this.setData({ showFilter: !this.data.showFilter });
  },

  onDateStartChange(e) {
    this.setData({ dateStart: e.detail.value });
  },

  onDateEndChange(e) {
    this.setData({ dateEnd: e.detail.value });
  },

  onMinAmountInput(e) {
    this.setData({ minAmount: e.detail.value });
  },

  onMaxAmountInput(e) {
    this.setData({ maxAmount: e.detail.value });
  },

  onCategoryChange(e) {
    var idx = e.detail.value;
    var item = this.data.categories[idx];
    this.setData({
      categoryId: item.id,
      selectedCategoryName: item.name
    });
  },

  onAccountChange(e) {
    var idx = e.detail.value;
    var item = this.data.accounts[idx];
    this.setData({
      accountId: item.id,
      selectedAccountName: item.name
    });
  },

  onTagChange(e) {
    var idx = e.detail.value;
    var item = this.data.tags[idx];
    this.setData({
      tagId: item.id,
      selectedTagName: item.name
    });
  },

  // 重置筛选
  resetFilter() {
    this.setData({
      dateStart: '', dateEnd: '',
      minAmount: '', maxAmount: '',
      categoryId: '', selectedCategoryName: '',
      accountId: '', selectedAccountName: '',
      tagId: '', selectedTagName: '',
      showFilter: false
    });
    this.doSearch();
  },

  // 跳转详情
  goDetail(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/transaction/detail/detail?id=' + id });
  }
});
