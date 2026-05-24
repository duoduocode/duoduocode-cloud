// pages/tags/tags/tags.js
const { api } = require('../../../utils/request');

Page({
  data: {
    tags: [],
    showModal: false,
    newName: '',
    selectedColor: '#07C160',
    editingTag: null,
    // 12色预设
    colorList: [
      '#07C160', '#FA5151', '#FF9800', '#2196F3',
      '#9C27B0', '#00BCD4', '#FF5722', '#795548',
      '#607D8B', '#E91E63', '#3F51B5', '#4CAF50'
    ]
  },

  onShow() {
    this.loadTags();
  },

  async loadTags() {
    wx.showLoading({ title: '加载中...', mask: true });
    try {
      var res = await api.get('/tags');
      var list = res || [];
      this.setData({ tags: list });
    } catch (err) {
      console.error('加载标签失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  // 新建
  openCreate() {
    this.setData({
      showModal: true,
      newName: '',
      selectedColor: '#07C160',
      editingTag: null
    });
  },

  // 编辑
  openEdit(e) {
    var tag = e.currentTarget.dataset.tag;
    this.setData({
      showModal: true,
      newName: tag.name,
      selectedColor: tag.color,
      editingTag: tag
    });
  },

  closeModal() {
    this.setData({ showModal: false });
  },

  onNameInput(e) {
    this.setData({ newName: e.detail.value });
  },

  selectColor(e) {
    var color = e.currentTarget.dataset.color;
    this.setData({ selectedColor: color });
  },

  // 保存 (创建 或 更新)
  async saveTag() {
    var that = this;
    var name = that.data.newName.trim();
    if (!name) {
      wx.showToast({ title: '请输入标签名称', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...', mask: true });
    try {
      if (that.data.editingTag && that.data.editingTag.id) {
        await api.put('/tags/' + that.data.editingTag.id, {
          name: name,
          color: that.data.selectedColor
        });
      } else {
        await api.post('/tags', {
          name: name,
          color: that.data.selectedColor
        });
      }
      wx.showToast({ title: '保存成功', icon: 'success' });
      that.setData({ showModal: false });
      that.loadTags();
    } catch (err) {
      console.error('保存标签失败:', err);
    } finally {
      wx.hideLoading();
    }
  },

  // 删除
  async deleteTag(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后相关交易将失去此标签',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.delete('/tags/' + id);
            wx.showToast({ title: '已删除', icon: 'success' });
            that.loadTags();
          } catch (err) {
            console.error('删除标签失败:', err);
          }
        }
      }
    });
  }
});
