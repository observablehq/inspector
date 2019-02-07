function pad(value, width) {
  var s = value + "", length = s.length;
  return length < width ? new Array(width - length + 1).join(0) + s : s;
}

function isUTCMidnight(date) {
  return date.getUTCMilliseconds() === 0
      && date.getUTCSeconds() === 0
      && date.getUTCMinutes() === 0
      && date.getUTCHours() === 0;
}

export default function formatDate(date) {
  return isNaN(date)
    ? "Invalid Date"
    : isUTCMidnight(date)
      ? pad(date.getUTCFullYear(), 4) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
      : pad(date.getFullYear(), 4) + "-" + pad(date.getMonth() + 1, 2) + "-" + pad(date.getDate(), 2)
        + "T" + pad(date.getHours(), 2) + ":" + pad(date.getMinutes(), 2)
        + (date.getMilliseconds() ? ":" + pad(date.getSeconds(), 2) + "." + pad(date.getMilliseconds(), 3)
          : date.getSeconds() ? ":" + pad(date.getSeconds(), 2)
          : "");
}
