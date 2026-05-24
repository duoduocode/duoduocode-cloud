// 通用工具函数

function formatMoney(amount, showSign = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0.00';
  const absVal = Math.abs(Number(amount));
  let sign = showSign ? (amount >= 0 ? '+' : '-') : '';
  return sign + absVal.toFixed(2);
}

function formatDate(date, fmt = 'YYYY-MM-DD') {
  if (!date) return '';
  const d = new Date(date);
  const o = {
    'YYYY': d.getFullYear(),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'DD': String(d.getDate()).padStart(2, '0'),
    'HH': String(d.getHours()).padStart(2, '0'),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'ss': String(d.getSeconds()).padStart(2, '0')
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, k => o[k]);
}

function getToday() {
  return formatDate(new Date());
}

function getMonthStart(date) {
  const d = date ? new Date(date) : new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function getMonthEnd(date) {
  const d = date ? new Date(date) : new Date();
  return formatDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

function formatAmount(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '';
  return Number(amount).toFixed(2);
}

function debounce(fn, delay = 300) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getWeekDayName(dateStr) {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[new Date(dateStr).getDay()];
}

module.exports = {
  formatMoney, formatDate, getToday,
  getMonthStart, getMonthEnd, formatAmount,
  debounce, getWeekDayName
};
