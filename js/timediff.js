getTimeDiff = (currentDate = null, nextDate = null) => {
  if (!currentDate) {
    currentDate = new Date();
  }

  if (!nextDate) {
    nextDate = new Date();
  }

  let time1, time2;
  const dateDiff = {
    inSeconds: function(date1, date2) {
      time2 = date2.getTime();
      time1 = date1.getTime();
      return Math.trunc(Math.abs(time2 - time1) / 1000);
    },
    inMinutes: function(date1, date2) {
      time2 = date2.getTime();
      time1 = date1.getTime();
      return Math.trunc(Math.abs((time2 - time1) / (60 * 1000)));
    },
    inHours: function(date1, date2) {
      time2 = date2.getTime();
      time1 = date1.getTime();
      return Math.trunc(Math.abs((time2 - time1) / (60 * 60 * 1000)));
    },
    inDays: function(date1, date2) {
      time2 = date2.getTime();
      time1 = date1.getTime();
      return Math.trunc(Math.abs((time2 - time1) / (24 * 60 * 60 * 1000)));
    },
    inWeeks: function(date1, date2) {
      time2 = date2.getTime();
      time1 = date1.getTime();
      return Math.trunc(Math.abs((time2 - time1) / (24 * 60 * 60 * 1000 * 7)));
    },
    inMonths: function(date1, date2) {
      let date1Y = date1.getFullYear();
      let date2Y = date2.getFullYear();
      let date1M = date1.getMonth();
      let date2M = date2.getMonth();
      return Math.trunc(
        Math.abs(date2M + 12 * date2Y - (date1M + 12 * date1Y)),
      );
    },
    inYears: function(date1, date2) {
      return Math.trunc(Math.abs(date2.getFullYear() - date1.getFullYear()));
    },
  };

  const differenceInSeconds = dateDiff.inSeconds(nextDate, currentDate);
  const differenceInMinutes = dateDiff.inMinutes(nextDate, currentDate);
  const differenceInHours = dateDiff.inHours(nextDate, currentDate);
  const differenceInDays = dateDiff.inDays(nextDate, currentDate);
  const differenceInWeeks = dateDiff.inWeeks(nextDate, currentDate);
  const differenceInMonths = dateDiff.inMonths(nextDate, currentDate);
  const differenceInYears = dateDiff.inYears(nextDate, currentDate);

  if (differenceInSeconds && differenceInSeconds < 60) {
    return {
      value: differenceInSeconds,
      suffix: getTimeDifferenceSuffix(differenceInSeconds, "sek"),
    };
  } else if (differenceInMinutes && differenceInMinutes < 60) {
    return {
      value: differenceInMinutes,
      suffix: getTimeDifferenceSuffix(differenceInMinutes, "mín"),
    };
  } else if (differenceInHours && differenceInHours < 24) {
    return {
      value: differenceInHours,
      suffix: getTimeDifferenceSuffix(differenceInHours, "klst"),
    };
  } else if (differenceInDays && differenceInDays < 7) {
    return {
      value: differenceInDays,
      suffix: getTimeDifferenceSuffix(differenceInDays, "dag"),
    };
  } else if (differenceInWeeks && differenceInDays <= 28) {
    return {
      value: differenceInWeeks,
      suffix: getTimeDifferenceSuffix(differenceInWeeks, "vik"),
    };
  } else if (differenceInMonths && differenceInMonths < 12) {
    return {
      value: differenceInMonths,
      suffix: getTimeDifferenceSuffix(differenceInMonths, "mán"),
    };
  } else if (differenceInYears) {
    return {
      value: differenceInYears,
      suffix: getTimeDifferenceSuffix(differenceInYears, "ár"),
    };
  }

  return {
    value: 1,
    suffix: "mæling",
  };
};

getTimeDifferenceSuffix = (value, suffix) => {
  if (value > 1) {
    //suffix += "s";
  }
  return suffix;
};
