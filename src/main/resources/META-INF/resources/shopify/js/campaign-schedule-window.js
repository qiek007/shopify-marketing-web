(function (root, factory) {
    var policy = factory();
    if (typeof module === 'object' && module.exports) module.exports = policy;
    if (root) root.CampaignScheduleWindow = policy;
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    var minute = 60000;
    var leadTime = 60 * minute;
    var horizon = 30 * 24 * 60 * minute;

    function localValue(time) {
        var date = new Date(time);
        return new Date(time - date.getTimezoneOffset() * minute).toISOString().slice(0, 16);
    }

    function earliestMinute(now) {
        return Math.ceil((now + leadTime) / minute) * minute;
    }

    function setBounds(input, now) {
        input.min = localValue(earliestMinute(now));
        input.max = localValue(Math.floor((now + horizon) / minute) * minute);
    }

    function contains(date, now) {
        var time = date.getTime();
        return time >= earliestMinute(now) && time <= now + horizon;
    }

    function initialize(input, current, now) {
        setBounds(input, now);
        var existingMinute = current && new Date(Math.floor(current.getTime() / minute) * minute);
        input.value = existingMinute && contains(existingMinute, now) ? localValue(existingMinute.getTime()) : input.min;
    }

    return {
        setBounds: setBounds,
        contains: contains,
        initialize: initialize,
        message: '发送时间须在当前时间的 60 分钟后至 30 天内'
    };
}));
