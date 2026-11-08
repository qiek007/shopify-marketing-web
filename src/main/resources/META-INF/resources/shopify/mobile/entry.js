(function (root, factory) {
    var mobileDestination = factory();
    if (typeof module === 'object' && module.exports) module.exports = mobileDestination;
    if (!root || !root.document) return;
    var script = root.document.currentScript;
    var destination = mobileDestination(root.location.href, root.navigator.userAgent,
        script ? script.getAttribute('data-context-path') : '');
    if (destination) root.location.replace(destination);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';
    return function mobileDestination(href, userAgent, contextPath) {
        if (!/Android|iPhone|iPad|iPod|IEMobile/i.test(userAgent || '')) return null;
        var url = new URL(href);
        var context = (contextPath || '').replace(/\/$/, '');
        var routes = {
            '/': '/mobile/dashboard',
            '/dashboard': '/mobile/dashboard',
            '/campaigns': '/mobile/campaigns',
            '/campaigns/editor': '/mobile/campaigns/editor',
            '/campaigns/detail': '/mobile/campaigns/detail',
            '/customers': '/mobile/customers',
            '/customers/detail': '/mobile/customers/detail',
            '/segments': '/mobile/segments',
            '/segments/editor': '/mobile/segments/editor',
            '/automations': '/mobile/automations'
        };
        var route = routes[url.pathname.slice(context.length)];
        if (!route) return null;
        var destination = new URL(context + route, url.origin);
        var parameters = {
            campaigns: ['campaignId', 'q', 'status', 'page', 'size', 'fromDate', 'toDate'],
            customers: ['customerId', 'q', 'activity', 'tag', 'page', 'fromDate', 'toDate', 'minSpent', 'maxSpent',
                'minBehaviorCount', 'maxBehaviorCount', 'minUniqueBehaviorCount', 'maxUniqueBehaviorCount', 'timelineFromDate', 'timelineToDate'],
            segments: ['segmentId', 'q', 'page'],
            automations: ['name', 'status', 'triggerEvent', 'page', 'size']
        };
        ['shop'].concat(parameters[route.split('/')[2]] || []).forEach(function (key) {
            url.searchParams.getAll(key).forEach(function (value) { destination.searchParams.append(key, value); });
        });
        return destination.href;
    };
}));
