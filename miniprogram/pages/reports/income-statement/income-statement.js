// pages/reports/income-statement.js - 收支报表
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    selectedMonth: '',
    totalIncome: 0,
    totalIncomeText: '0.00',
    totalExpense: 0,
    totalExpenseText: '0.00',
    incomeList: [],
    expenseList: [],
    canvasReady: false,
    maxBarAmount: 0
  },

  onLoad: function () {
    var now = new Date();
    var month = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    this.setData({ selectedMonth: month });
    this.loadReport();
  },

  onMonthChange: function (e) {
    this.setData({ selectedMonth: e.detail.value });
    this.loadReport();
  },

  loadReport: function () {
    var that = this;
    var month = this.data.selectedMonth;
    api.get('/reports/income-expense', { month: month }, { showLoading: true, loadingText: '加载中...' }).then(function (data) {
      var incomeList = (data.income || []).map(function (item) {
        item.amountText = util.formatMoney(item.amount);
        return item;
      });
      var expenseList = (data.expense || []).map(function (item) {
        item.amountText = util.formatMoney(item.amount);
        return item;
      });

      var maxIncome = incomeList.length > 0 ? Math.max.apply(null, incomeList.map(function (i) { return Number(i.amount); })) : 0;
      var maxExpense = expenseList.length > 0 ? Math.max.apply(null, expenseList.map(function (i) { return Number(i.amount); })) : 0;
      var maxBarAmount = Math.max(maxIncome, maxExpense, 1);
      var totalIncome = data.totalIncome || 0;
      var totalExpense = data.totalExpense || 0;

      incomeList.forEach(function (item) {
        item.barPercent = maxBarAmount > 0 ? ((Number(item.amount) / maxBarAmount) * 100).toFixed(0) : '0';
      });
      expenseList.forEach(function (item) {
        item.barPercent = maxBarAmount > 0 ? ((Number(item.amount) / maxBarAmount) * 100).toFixed(0) : '0';
      });

      that.setData({
        totalIncome: totalIncome,
        totalIncomeText: util.formatMoney(totalIncome),
        totalExpense: totalExpense,
        totalExpenseText: util.formatMoney(totalExpense),
        incomeList: incomeList,
        expenseList: expenseList,
        maxBarAmount: maxBarAmount,
        canvasReady: true
      });

      // 延迟绘制Canvas
      setTimeout(function () {
        that.drawChart(incomeList, expenseList, maxBarAmount);
      }, 500);
    });
  },

  drawChart: function (incomeList, expenseList, maxBarAmount) {
    var ctx = wx.createCanvasContext('barChart', this);
    var canvasWidth = 360;
    var chartWidth = canvasWidth - 40;
    var startX = 40;
    var barMaxWidth = 200;
    var barHeight = 20;
    var gap = 28;

    // 设置文本大小
    ctx.setFontSize(12);
    ctx.setTextBaseline('middle');

    var y = 20;
    // 收入柱状图
    incomeList.forEach(function (item) {
      var barWidth = maxBarAmount > 0 ? (Number(item.amount) / maxBarAmount) * barMaxWidth : 0;
      // 分类名称
      ctx.setFillStyle('#333333');
      ctx.setTextAlign('right');
      ctx.fillText(item.categoryName || '未分类', startX - 8, y + barHeight / 2);
      // 柱子
      ctx.setFillStyle('#07C160');
      ctx.fillRect(startX, y, barWidth, barHeight);
      // 金额
      ctx.setFillStyle('#333333');
      ctx.setTextAlign('left');
      ctx.fillText(util.formatMoney(item.amount), startX + barWidth + 6, y + barHeight / 2);
      y += gap;
    });

    y += 10;
    // 支出柱状图
    expenseList.forEach(function (item) {
      var barWidth = maxBarAmount > 0 ? (Number(item.amount) / maxBarAmount) * barMaxWidth : 0;
      ctx.setFillStyle('#333333');
      ctx.setTextAlign('right');
      ctx.fillText(item.categoryName || '未分类', startX - 8, y + barHeight / 2);
      ctx.setFillStyle('#FA5151');
      ctx.fillRect(startX, y, barWidth, barHeight);
      ctx.setFillStyle('#333333');
      ctx.setTextAlign('left');
      ctx.fillText(util.formatMoney(item.amount), startX + barWidth + 6, y + barHeight / 2);
      y += gap;
    });

    ctx.draw();
  }
});
