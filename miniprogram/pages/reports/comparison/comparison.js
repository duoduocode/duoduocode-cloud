// pages/reports/comparison.js - 对比分析
const { api } = require('../../../utils/request');
const util = require('../../../utils/util');

Page({
  data: {
    month1: '',
    month2: '',
    hasData: false,
    month1Income: 0,
    month1IncomeText: '0.00',
    month1Expense: 0,
    month1ExpenseText: '0.00',
    month1Balance: 0,
    month1BalanceText: '0.00',
    month2Income: 0,
    month2IncomeText: '0.00',
    month2Expense: 0,
    month2ExpenseText: '0.00',
    month2Balance: 0,
    month2BalanceText: '0.00',
    incomeChange: 0,
    incomeChangeText: '0.00',
    expenseChange: 0,
    expenseChangeText: '0.00',
    balanceChange: 0,
    balanceChangeText: '0.00',
    income1Percent: 0,
    income2Percent: 0,
    expense1Percent: 0,
    expense2Percent: 0
  },

  onLoad: function () {
    var now = new Date();
    var m2 = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    // 默认month1为上月
    var prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    var prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    var m1 = prevYear + '-' + String(prevMonth + 1).padStart(2, '0');
    this.setData({ month1: m1, month2: m2 });
  },

  onMonth1Change: function (e) {
    this.setData({ month1: e.detail.value });
  },

  onMonth2Change: function (e) {
    this.setData({ month2: e.detail.value });
    // 当第二个月选定后自动查询
    this.loadComparison();
  },

  loadComparison: function () {
    var that = this;
    var month1 = this.data.month1;
    var month2 = this.data.month2;
    if (!month1 || !month2) return;

    api.get('/reports/monthly-comparison', {
      month1: month1,
      month2: month2
    }, { showLoading: true, loadingText: '加载中...' }).then(function (data) {
      var m1Income = data.month1 ? (data.month1.income || 0) : 0;
      var m1Expense = data.month1 ? (data.month1.expense || 0) : 0;
      var m2Income = data.month2 ? (data.month2.income || 0) : 0;
      var m2Expense = data.month2 ? (data.month2.expense || 0) : 0;

      var m1Balance = m1Income - m1Expense;
      var m2Balance = m2Income - m2Expense;

      var incomeChange = data.changes ? (data.changes.income || 0) : 0;
      var expenseChange = data.changes ? (data.changes.expense || 0) : 0;
      var balanceChange = m2Balance - m1Balance;

      var incomeChangeText = util.formatMoney(incomeChange, true);
      var expenseChangeText = util.formatMoney(expenseChange, true);
      var balanceChangeText = util.formatMoney(balanceChange, true);

      // 计算百分比条
      var maxIncome = Math.max(m1Income, m2Income, 1);
      var maxExpense = Math.max(m1Expense, m2Expense, 1);

      that.setData({
        hasData: true,
        month1Income: m1Income,
        month1IncomeText: util.formatMoney(m1Income),
        month1Expense: m1Expense,
        month1ExpenseText: util.formatMoney(m1Expense),
        month1Balance: m1Balance,
        month1BalanceText: util.formatMoney(m1Balance),
        month2Income: m2Income,
        month2IncomeText: util.formatMoney(m2Income),
        month2Expense: m2Expense,
        month2ExpenseText: util.formatMoney(m2Expense),
        month2Balance: m2Balance,
        month2BalanceText: util.formatMoney(m2Balance),
        incomeChange: incomeChange,
        incomeChangeText: incomeChangeText,
        expenseChange: expenseChange,
        expenseChangeText: expenseChangeText,
        balanceChange: balanceChange,
        balanceChangeText: balanceChangeText,
        income1Percent: Math.round((m1Income / maxIncome) * 100),
        income2Percent: Math.round((m2Income / maxIncome) * 100),
        expense1Percent: Math.round((m1Expense / maxExpense) * 100),
        expense2Percent: Math.round((m2Expense / maxExpense) * 100)
      });
    });
  }
});
