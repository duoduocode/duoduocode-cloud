// pages/templates/templates/templates.js
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    templates: [],
    loading: false
  },

  onShow() {
    this.loadTemplates();
  },

  async loadTemplates() {
    this.setData({ loading: true });
    try {
      var res = await api.get('/recurring-templates');
      var list = res || [];

      var formattedList = list.map(function(item) {
        var frequencyText = '';
        if (item.frequency === 'daily') {
          frequencyText = '每天';
        } else if (item.frequency === 'weekly') {
          frequencyText = '每周';
        } else if (item.frequency === 'monthly') {
          frequencyText = '每月';
        } else if (item.frequency === 'yearly') {
          frequencyText = '每年';
        } else {
          frequencyText = item.frequency || '';
        }

        return {
          id: item.id,
          name: item.name,
          amount: util.formatAmount(item.amount),
          categoryName: item.categoryName || '',
          accountName: item.accountName || '',
          frequency: item.frequency,
          frequencyText: frequencyText,
          nextDate: util.formatDate(item.nextDate),
          active: item.active !== false,
          transactionType: item.transactionType || 'expense'
        };
      });

      this.setData({ templates: formattedList, loading: false });
    } catch (err) {
      console.error('加载周期模板失败:', err);
      this.setData({ loading: false });
    }
  },

  // 跳转创建
  goCreate() {
    wx.navigateTo({ url: '/pages/templates/create/create' });
  },

  // 跳转编辑
  goEdit(e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/templates/create/create?id=' + id });
  },

  // 切换启用状态
  async toggleActive(e) {
    var id = e.currentTarget.dataset.id;
    var active = e.currentTarget.dataset.active;
    try {
      await api.put('/recurring-templates/' + id, { active: !active });
      wx.showToast({ title: !active ? '已启用' : '已停用', icon: 'success' });
      this.loadTemplates();
    } catch (err) {
      console.error('切换状态失败:', err);
    }
  },

  // 删除
  async deleteTemplate(e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: async function(res) {
        if (res.confirm) {
          try {
            await api.delete('/recurring-templates/' + id);
            wx.showToast({ title: '已删除', icon: 'success' });
            that.loadTemplates();
          } catch (err) {
            console.error('删除模板失败:', err);
          }
        }
      }
    });
  }
});
