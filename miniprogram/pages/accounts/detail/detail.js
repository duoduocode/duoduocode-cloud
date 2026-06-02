// pages/accounts/detail.js - 账户详情页
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    accountId: '',
    account: {
      id: '',
      name: '',
      type: '',
      icon: '💰',
      color: '#07C160',
      balance: 0,
      balanceText: '0.00',
      initialBalance: 0,
      initialBalanceText: '0.00'
    },
    accountTypeText: '',

    keyword: '',
    activeType: '',
    typeTabs: [
      { label: '全部', value: '' },
      { label: '支出', value: 'expense' },
      { label: '收入', value: 'income' },
      { label: '转账', value: 'transfer' },
      { label: '还款', value: 'repayment' }
    ],

    quickTime: '',
    dateStart: '',
    dateEnd: '',

    quickAmount: '',
    minAmount: '',
    maxAmount: '',

    showAdvanced: false,
    categoryId: '',
    selectedCategoryName: '全部',
    categoryIndex: 0,
    categories: [{ id: '', name: '全部' }],
    tagId: '',
    selectedTagName: '全部',
    tagIndex: 0,
    tags: [{ id: '', name: '全部' }],

    sortBy: 'date',
    sortOrder: 'desc',

    transactions: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true,
    totalTransactions: 0
  },

  _toDateStr: function (d) {
    var y = d.getFullYear();
    var m = (d.getMonth() + 1).toString();
    var day = d.getDate().toString();
    return y + '-' + (m.length === 1 ? '0' + m : m) + '-' + (day.length === 1 ? '0' + day : day);
  },

  onLoad: function (options) {
    var id = options.id || '';
    this.setData({ accountId: id });
  },

  onShow: function () {
    this.loadAccount();
  },

  loadAccount: function () {
    var that = this;
    var id = this.data.accountId;
    if (!id) return;

    api.get('/accounts/' + id, {}, { silent: true }).then(function (data) {
      var account = data;
      account.initialBalanceText = util.formatMoney(account.initialBalance);
      var displayBalance;
      if (account.type === 'liability') {
        var bal = Number(account.currentBalance || 0);
        var debt = Math.max(0, -bal);
        account.debtText = util.formatMoney(debt);
        account.debtAmount = debt;
        account.creditLimitText = util.formatMoney(account.effectiveCreditLimit || account.creditLimit || 0);
        displayBalance = Math.abs(bal);
      } else {
        displayBalance = account.currentBalance || 0;
      }
      account.balanceText = util.formatMoney(displayBalance);

      var typeMap = { asset: '资产', liability: '负债', investment: '投资' };
      var accountTypeText = typeMap[account.type] || account.type;

      that.setData({
        account: account,
        accountTypeText: accountTypeText
      });

      wx.setNavigationBarTitle({ title: account.name });

      that.loadFilterOptions();
      that.loadTransactions(true);
    });
  },

  loadFilterOptions: function () {
    var that = this;
    Promise.all([
      api.get('/categories').catch(function () { return []; })
      // api.get('/tags').catch(function () { return []; })
    ]).then(function (results) {
      var catList = results[0] || [];
      that.setData({
        categories: [{ id: '', name: '全部' }].concat(
          catList.map(function (c) { return { id: c.id, name: c.name }; })
        )
      });
    });
  },

  loadTransactions: function (reset) {
    var that = this;
    if (this.data.loading) return;

    var id = this.data.accountId;
    var pageNo = reset ? 1 : this.data.page + 1;

    that.setData({ loading: true });

    var params = {
      page: pageNo,
      pageSize: this.data.pageSize,
      sortBy: this.data.sortBy,
      sortOrder: this.data.sortOrder,
      accountId: Number(id)
    };
    var kw = this.data.keyword.trim();
    if (kw) params.keyword = kw;
    if (this.data.activeType) params.type = this.data.activeType;
    if (this.data.dateStart) params.startDate = this.data.dateStart;
    if (this.data.dateEnd) params.endDate = this.data.dateEnd;
    if (this.data.minAmount) params.minAmount = this.data.minAmount;
    if (this.data.maxAmount) params.maxAmount = this.data.maxAmount;
    if (this.data.categoryId) params.categoryId = this.data.categoryId;

    api.get('/transactions/search', params, { silent: true }).then(function (data) {
      var TYPE_MAP = {
        expense: { label: '支出', icon: '📤', color: '#FDEDED' },
        income: { label: '收入', icon: '📥', color: '#E8F8EF' },
        transfer: { label: '转账', icon: '💱', color: '#EDF0FF' },
        repayment: { label: '还款', icon: '💳', color: '#FFF3E0' }
      };
      var list = (data.list || []).map(function (item) {
        item.dateText = util.formatDate(item.date);

        var currentAccountId = that.data.accountId;
        var counterpartyName = '';
        var counterpartyIcon = '';
        var isOut = false;

        if (item.transactionType === 'transfer' || item.transactionType === 'repayment') {
          (item.entries || []).forEach(function(e) {
            if (e.accountType === 'account') {
              if (String(e.accountId) === String(currentAccountId)) {
                isOut = Number(e.credit || 0) > 0;
              } else {
                counterpartyName = counterpartyName || e.accountName;
                counterpartyIcon = counterpartyIcon || e.accountIcon;
              }
            }
          });
        }

        var displayAmount;
        if (item.transactionType === 'expense') {
          displayAmount = -Math.abs(item.amount);
        } else if (item.transactionType === 'transfer' || item.transactionType === 'repayment') {
          displayAmount = isOut ? -Math.abs(item.amount) : Math.abs(item.amount);
        } else {
          displayAmount = Math.abs(item.amount);
        }
        item.amountText = util.formatMoney(displayAmount, true);
        item.isOut = isOut;

        var typeInfo = TYPE_MAP[item.transactionType] || { label: '交易', icon: '💰', color: '#F5F5F5' };
        item.displayIcon = item.categoryIcon || counterpartyIcon || item.relatedAccountIcon || typeInfo.icon;
        item.displayColor = (item.categoryIcon || counterpartyIcon || item.relatedAccountIcon)
          ? (item.transactionType === 'expense' ? '#FDEDED' : item.transactionType === 'income' ? '#E8F8EF' : '#EDF0FF')
          : typeInfo.color;

        var catFullName = item.parentCategoryName && item.categoryName
          ? item.parentCategoryName + '-' + item.categoryName
          : (item.categoryName || '');

        if (item.transactionType === 'expense') {
          item.displayPrimary = catFullName || item.parentCategoryName || item.description || '支出';
          item.displaySecondary = catFullName ? item.description : '';
        } else if (item.transactionType === 'income') {
          item.displayPrimary = catFullName || item.parentCategoryName || item.description || '收入';
          item.displaySecondary = catFullName ? item.description : '';
        } else if (item.transactionType === 'transfer') {
          item.displayPrimary = counterpartyName || item.relatedAccountName || item.description || '转账';
          item.displaySecondary = item.description || '';
        } else if (item.transactionType === 'repayment') {
          item.displayPrimary = counterpartyName || item.relatedAccountName || item.description || '还款';
          item.displaySecondary = item.description || '';
        } else {
          item.displayPrimary = item.description || '交易';
          item.displaySecondary = '';
        }

        return item;
      });

      var total = data.total || 0;
      var transactions = reset ? list : that.data.transactions.concat(list);
      var hasMore = transactions.length < total;

      that.setData({
        transactions: transactions,
        page: pageNo,
        hasMore: hasMore,
        totalTransactions: total,
        loading: false
      });
    }).catch(function () {
      that.setData({ loading: false });
    });
  },

  onKeywordInput: function (e) {
    this.setData({ keyword: e.detail.value });
  },

  clearKeyword: function () {
    this.setData({ keyword: '' });
    this.loadTransactions(true);
  },

  doSearch: function () {
    this.loadTransactions(true);
  },

  selectType: function (e) {
    var val = e.currentTarget.dataset.value;
    this.setData({ activeType: val });
    this.loadTransactions(true);
  },

  selectQuickTime: function (e) {
    var type = e.currentTarget.dataset.type;
    var now = new Date();
    var start = '';
    var end = this._toDateStr(now);

    if (type === this.data.quickTime) {
      this.setData({ quickTime: '', dateStart: '', dateEnd: '' });
      this.loadTransactions(true);
      return;
    }

    switch (type) {
      case 'month':
        start = this._toDateStr(new Date(now.getFullYear(), now.getMonth(), 1));
        break;
      case 'week':
        start = this._toDateStr(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
        break;
      case 'month30':
        start = this._toDateStr(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
        break;
    }

    if (type === 'custom') {
      this.setData({ quickTime: 'custom', showDatePicker: true });
      return;
    }

    this.setData({ quickTime: type, dateStart: start, dateEnd: end });
    this.loadTransactions(true);
  },

  onDateStartChange: function (e) {
    this.setData({ dateStart: e.detail.value });
  },

  onDateEndChange: function (e) {
    this.setData({ dateEnd: e.detail.value });
  },

  applyCustomDate: function () {
    this.setData({ showDatePicker: false });
    this.loadTransactions(true);
  },

  cancelCustomDate: function () {
    this.setData({ quickTime: '', dateStart: '', dateEnd: '', showDatePicker: false });
    this.loadTransactions(true);
  },

  selectQuickAmount: function (e) {
    var type = e.currentTarget.dataset.type;

    if (type === this.data.quickAmount) {
      this.setData({ quickAmount: '', minAmount: '', maxAmount: '' });
      this.loadTransactions(true);
      return;
    }

    var min = '', max = '';
    switch (type) {
      case '0-100': min = '0'; max = '100'; break;
      case '100-500': min = '100'; max = '500'; break;
      case '500-2000': min = '500'; max = '2000'; break;
      case '2000+': min = '2000'; max = ''; break;
    }
    this.setData({ quickAmount: type, minAmount: min, maxAmount: max });
    this.loadTransactions(true);
  },

  toggleAdvanced: function () {
    this.setData({ showAdvanced: !this.data.showAdvanced });
  },

  onCategoryChange: function (e) {
    var idx = e.detail.value;
    var item = this.data.categories[idx];
    this.setData({
      categoryIndex: idx,
      categoryId: item ? item.id : '',
      selectedCategoryName: item ? item.name : '全部'
    });
  },

  onTagChange: function (e) {
    var idx = e.detail.value;
    var item = this.data.tags[idx];
    this.setData({
      tagIndex: idx,
      tagId: item ? item.id : '',
      selectedTagName: item ? item.name : '全部'
    });
  },

  applyAdvanced: function () {
    this.setData({ showAdvanced: false });
    this.loadTransactions(true);
  },

  resetFilter: function () {
    this.setData({
      quickTime: '', dateStart: '', dateEnd: '',
      quickAmount: '', minAmount: '', maxAmount: '',
      categoryId: '', selectedCategoryName: '全部', categoryIndex: 0,
      tagId: '', selectedTagName: '全部', tagIndex: 0,
      showAdvanced: false
    });
    this.loadTransactions(true);
  },

  setSort: function (e) {
    var sortBy = e.currentTarget.dataset.sort;
    var sortOrder = 'desc';
    if (this.data.sortBy === sortBy) {
      sortOrder = this.data.sortOrder === 'desc' ? 'asc' : 'desc';
    }
    this.setData({ sortBy: sortBy, sortOrder: sortOrder });
    this.loadTransactions(true);
  },

  loadMore: function () {
    if (!this.data.hasMore || this.data.loading) return;
    this.loadTransactions(false);
  },

  goTransactionDetail: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/transaction/detail/detail?id=' + id });
  },

  goEdit: function () {
    wx.navigateTo({ url: '/pages/accounts/edit/edit?id=' + this.data.accountId });
  },

  showDeleteConfirm: function () {
    var that = this;
    wx.showModal({
      title: '确认删除',
      content: '删除账户将同时删除相关交易记录，此操作不可撤销。确定要删除吗？',
      confirmColor: '#FA5151',
      success: function (res) {
        if (res.confirm) that.deleteAccount();
      }
    });
  },

  deleteAccount: function () {
    var that = this;
    var id = this.data.accountId;
    api.delete('/accounts/' + id, {}, { showLoading: true, loadingText: '删除中...' }).then(function () {
      wx.showToast({ title: '账户已删除', icon: 'success' });
      setTimeout(function () { wx.navigateBack(); }, 1500);
    });
  }
});
