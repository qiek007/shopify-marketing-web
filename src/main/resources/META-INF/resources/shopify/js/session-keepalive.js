(function () {
    'use strict';

    var script = document.currentScript || document.getElementById('session-keepalive');
    if (!script || !window.fetch) return;

    var contextPath = script.getAttribute('data-context-path') || '';
    var endpoint = contextPath + '/session/keepalive';
    var maximumIntervalMs = 600000;
    var retryIntervalMs = 60000;
    var intervalMs = maximumIntervalMs;
    var lastSuccessAt = Date.now();
    var timerId = null;
    var inFlight = false;
    var stopped = false;

    function schedule(delayMs) {
        if (stopped) return;
        window.clearTimeout(timerId);
        timerId = window.setTimeout(ping, delayMs);
    }

    function stop() {
        stopped = true;
        inFlight = false;
        window.clearTimeout(timerId);
    }

    function finish(delayMs) {
        inFlight = false;
        schedule(delayMs);
    }

    function updateInterval(response) {
        var timeoutSeconds = parseInt(
                response.headers.get('X-Session-Timeout-Seconds'), 10);
        if (!isFinite(timeoutSeconds) || timeoutSeconds <= 0) return;
        intervalMs = Math.max(retryIntervalMs, Math.min(
                maximumIntervalMs, Math.floor(timeoutSeconds * 1000 / 3)));
    }

    function ping() {
        if (stopped || inFlight) return;
        inFlight = true;
        window.fetch(endpoint, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        }).then(function (response) {
            if (response.status === 401 || response.status === 403 || response.redirected) {
                stop();
                return;
            }
            if (response.status !== 204) {
                finish(retryIntervalMs);
                return;
            }
            updateInterval(response);
            lastSuccessAt = Date.now();
            finish(intervalMs);
        }, function () {
            finish(retryIntervalMs);
        });
    }

    function catchUp() {
        if (document.hidden || stopped || inFlight) return;
        if (Date.now() - lastSuccessAt >= intervalMs) ping();
    }

    document.addEventListener('visibilitychange', catchUp);
    window.addEventListener('focus', catchUp);
    window.addEventListener('pageshow', catchUp);
    schedule(1000);
}());
