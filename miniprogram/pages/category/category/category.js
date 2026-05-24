// pages/category/category/category.js
const { api } = require('../../../utils/request');

Page({
  data: {
    currentTab: 'expense',
    categories: [],
    flatCategories: [],
    searchKeyword: '',
    showSearch: false
  },

  onShow() {
    this.loadCategories();
  },

  async loadCategories() {
    wx.showLoading({ title: '加载中...', mask: true });
    try {
      var res = await api.get('/categories');
      var list = res || [];
      
      // 构建树形结构并扁平化用于搜索
      var flatList = [];
      list.forEach(function(parent) {
        var parentEntry = {
          id: parent.id,
          name: parent.name,
          type: parent.type,
          icon: parent.icon || '📁',
          usageCount: parent.usageCount || 0,
          isParent: true,
          expanded: false,
          children: (parent.children || []).map(function(child) {
            var childEntry = {
              id: child.id,
              name: child.name,
              type: child.type || parent.type,
              icon: child.icon || '📁',
              usageCount: child.usageCount || 0,
              isParent: false
            };
            flatList.push(childEntry);
            return childEntry;
          })
        };
        flatList.push(parentEntry);
      });

      this.setData({
        categories: list,
        flatCategories: flatList
      });
    } catch (err) {
      console.error('加载分类失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  switchTab(e) {
    var tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  // 展开/折叠
  toggleExpand(e) {
    var id = e.currentTarget.dataset.id;
    var categories = this.data.categories;
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === id) {
        var key = 'categories[' + i + '].expanded';
        this.setData({ [key]: !categories[i].expanded });
        break;
      }
    }
  },

  // 跳转编辑
  goEdit(e) {
    var id = e.currentTarget.dataset.id;
    var isParent = e.currentTarget.dataset.isparent;
    var url = '/pages/category/edit/edit';
    if (id) {
      url += '?id=' + id;
    }
    if (isParent) {
      url += (id ? '&' : '?') + 'isParent=true';
    }
    wx.navigateTo({ url: url });
  },

  // 新建
  goCreate() {
    wx.navigateTo({ url: '/pages/category/edit/edit' });
  },

  // 搜索
  toggleSearch() {
    var show = !this.data.showSearch;
    this.setData({ showSearch: show, searchKeyword: show ? this.data.searchKeyword : '' });
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value });
  },

  // 获取过滤后的分类列表
  getFilteredCategories() {
    var that = this;
    var tab = that.data.currentTab;
    var keyword = that.data.searchKeyword.trim().toLowerCase();
    var categories = that.data.categories;

    var result = [];
    categories.forEach(function(parent) {
      if (parent.type !== tab && tab) {
        // 跳过不匹配的类型
        if (!parent.children || parent.children.length === 0) return;
      }

      var filteredChildren = [];
      if (parent.children) {
        filteredChildren = parent.children.filter(function(child) {
          var typeMatch = !tab || child.type === tab || parent.type === tab;
          var nameMatch = !keyword || child.name.toLowerCase().indexOf(keyword) > -1;
          return typeMatch && nameMatch;
        });
      }

      var parentTypeMatch = !tab || parent.type === tab;
      var parentNameMatch = !keyword || parent.name.toLowerCase().indexOf(keyword) > -1;

      if (parentTypeMatch && (parentNameMatch || filteredChildren.length > 0)) {
        result.push({
          id: parent.id,
          name: parent.name,
          type: parent.type,
          icon: parent.icon || '📁',
          usageCount: parent.usageCount || 0,
          isParent: true,
          expanded: !!keyword || parent.expanded,
          children: filteredChildren
        });
      }
    });

    return result;
  }
});
