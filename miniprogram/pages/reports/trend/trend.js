// pages/reports/trend.js - 趋势图表
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    selectedYear: '',
    dataList: [],
    maxValue: 0
  },

  onLoad: function () {
    var year = new Date().getFullYear();
    this.setData({ selectedYear: String(year) });
    this.loadTrend();
  },

  onYearChange: function (e) {
    this.setData({ selectedYear: e.detail.value });
    this.loadTrend();
  },

  loadTrend: function () {
    var that = this;
    var year = this.data.selectedYear;
    api.get('/reports/account-trend', { year: year }, { showLoading: true, loadingText: '加载中...' }).then(function (data) {
      var list = (data.data || []).map(function (item) {
        item.monthText = item.month + '月';
        item.assetsText = util.formatMoney(item.assets);
        item.liabilitiesText = util.formatMoney(item.liabilities);
        item.netWorthText = util.formatMoney(item.netWorth);
        return item;
      });

      var maxValue = 0;
      list.forEach(function (item) {
        var val = Math.max(Number(item.assets) || 0, Number(item.liabilities) || 0, Number(item.netWorth) || 0);
        if (val > maxValue) maxValue = val;
      });
      maxValue = maxValue > 0 ? maxValue : 1;

      that.setData({ dataList: list, maxValue: maxValue });

      setTimeout(function () {
        that.drawLineChart(list, maxValue);
      }, 500);
    });
  },

  drawLineChart: function (list, maxValue) {
    if (list.length === 0) return;
    var ctx = wx.createCanvasContext('lineChart', this);
    var w = 360;
    var h = 300;
    var padL = 50;
    var padR = 20;
    var padT = 20;
    var padB = 30;
    var chartW = w - padL - padR;
    var chartH = h - padT - padB;

    // 画背景网格
    ctx.setStrokeStyle('#F0F0F0');
    ctx.setLineWidth(1);
    for (var i = 0; i <= 4; i++) {
      var gy = padT + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padL, gy);
      ctx.lineTo(w - padR, gy);
      ctx.stroke();
    }

    // 画Y轴刻度
    ctx.setFontSize(10);
    ctx.setFillStyle('#999999');
    ctx.setTextAlign('right');
    for (var i = 0; i <= 4; i++) {
      var val = maxValue - (maxValue / 4) * i;
      var gy = padT + (chartH / 4) * i;
      ctx.fillText(util.formatMoney(val).substring(0, 7), padL - 6, gy + 3);
    }

    // X轴刻度
    ctx.setTextAlign('center');
    var xStep = list.length > 1 ? chartW / (list.length - 1) : chartW;
    for (var i = 0; i < list.length; i++) {
      var gx = padL + xStep * i;
      ctx.setFillStyle('#999999');
      ctx.fillText((i + 1) + '月', gx, h - padB + 16);
    }

    // 画线函数
    function drawLine(dataList, valueKey, color) {
      if (dataList.length === 0) return;
      ctx.setStrokeStyle(color);
      ctx.setLineWidth(2);
      ctx.beginPath();
      for (var i = 0; i < dataList.length; i++) {
        var x = padL + xStep * i;
        var y = padT + chartH - (Number(dataList[i][valueKey]) / maxValue) * chartH;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // 画数据点
      for (var i = 0; i < dataList.length; i++) {
        var x = padL + xStep * i;
        var y = padT + chartH - (Number(dataList[i][valueKey]) / maxValue) * chartH;
        ctx.setFillStyle(color);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    drawLine(list, 'assets', '#07C160');
    drawLine(list, 'liabilities', '#FA5151');
    drawLine(list, 'netWorth', '#2196F3');

    ctx.draw();
  }
});
