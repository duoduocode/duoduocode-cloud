Page({
  data: {
    types: [
      {
        id: 'expense',
        name: '支出',
        icon: '💸',
        desc: '记录日常消费支出',
        color: '#FA5151',
        bgColor: '#FFF0F0',
        url: '/pages/record/expense'
      },
      {
        id: 'income',
        name: '收入',
        icon: '💰',
        desc: '记录工资、奖金等收入',
        color: '#07C160',
        bgColor: '#F0FFF5',
        url: '/pages/record/income'
      },
      {
        id: 'transfer',
        name: '转账',
        icon: '🔄',
        desc: '账户之间的资金转移',
        color: '#4A90D9',
        bgColor: '#F0F5FF',
        url: '/pages/record/transfer'
      },
      {
        id: 'repayment',
        name: '还款',
        icon: '💳',
        desc: '信用卡、贷款还款',
        color: '#FF9800',
        bgColor: '#FFF8F0',
        url: '/pages/record/repayment'
      }
    ]
  },

  goToRecord(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url: url });
    }
  },

  goToFullMode() {
    wx.navigateTo({ url: '/pages/record/fullmode' });
  }
});
