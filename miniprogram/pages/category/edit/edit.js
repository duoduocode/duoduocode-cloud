// pages/category/edit/edit.js
const { api } = require('../../../utils/request');

Page({
  data: {
    isEdit: false,
    categoryId: '',
    name: '',
    icon: '📁',
    type: 'expense',
    parentId: '',
    budgetAmount: '',
    parentCategories: [],
    // 预设图标列表
    iconList: ['🍔','🛒','🚗','🏠','📱','💊','🎓','✈️','👗','🎮','🐱','💻','📚','⚽','🎵','💰','💼','🎁','🏥','🍺'],
    showIconPicker: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, categoryId: options.id });
      this.loadCategoryDetail(options.id);
    }
    this.loadParentCategories();
  },

  async loadCategoryDetail(id) {
    wx.showLoading({ title: '加载中...' });
    try {
      var res = await api.get('/categories');
      var categories = res || [];
      var found = null;
      for (var i = 0; i < categories.length; i++) {
        if (categories[i].id === id) {
          found = categories[i];
          break;
        }
        if (categories[i].children) {
          for (var j = 0; j < categories[i].children.length; j++) {
            if (categories[i].children[j].id === id) {
              found = categories[i].children[j];
              break;
            }
          }
        }
        if (found) break;
      }

      if (found) {
        this.setData({
          name: found.name || '',
          icon: found.icon || '📁',
          type: found.type || 'expense'
        });
      }
    } catch (err) {
      console.error('加载分类详情失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  async loadParentCategories() {
    try {
      var res = await api.get('/categories');
      var list = res || [];
      var parents = list.map(function(item) {
        return {
          id: item.id,
          name: item.name,
          type: item.type
        };
      });
      this.setData({ parentCategories: parents });
    } catch (err) {
      console.error('加载父分类失败:', err);
    }
  },

  // 输入处理
  onNameInput(e) {
    this.setData({ name: e.detail.value });
  },

  // 类型切换
  onTypeChange(e) {
    this.setData({ type: e.detail.value });
  },

  // 父分类选择
  onParentChange(e) {
    var idx = e.detail.value;
    var item = this.data.parentCategories[idx];
    this.setData({ parentId: item ? item.id : '' });
  },

  // 预算金额
  onBudgetInput(e) {
    this.setData({ budgetAmount: e.detail.value });
  },

  // 图标选择
  toggleIconPicker() {
    this.setData({ showIconPicker: !this.data.showIconPicker });
  },

  selectIcon(e) {
    var icon = e.currentTarget.dataset.icon;
    this.setData({ icon: icon, showIconPicker: false });
  },

  // 保存
  async save() {
    var that = this;
    if (!that.data.name.trim()) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' });
      return;
    }

    var payload = {
      name: that.data.name.trim(),
      icon: that.data.icon,
      type: that.data.type,
      parentId: that.data.parentId || null
    };

    wx.showLoading({ title: '保存中...', mask: true });
    try {
      if (that.data.isEdit) {
        await api.put('/categories/' + that.data.categoryId, payload);
      } else {
        await api.post('/categories', payload);
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(function() {
        wx.navigateBack();
      }, 1500);
    } catch (err) {
      console.error('保存分类失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  // 删除
  async deleteCategory() {
    var that = this;
    wx.showModal({
      title: '删除分类',
      content: '删除后，该分类下的交易记录将需要迁移到其他分类，是否继续？',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.delete('/categories/' + that.data.categoryId);
            wx.showToast({ title: '已删除', icon: 'success' });
            setTimeout(function() {
              wx.navigateBack();
            }, 1500);
          } catch (err) {
            console.error('删除分类失败:', err);
          }
        }
      }
    });
  }
});
