(function () {
    'use strict';

    function parseDate(value) {
        var parts = String(value || '').split('-').map(Number);
        return parts.length === 3 ? new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])) : null;
    }

    function formatDate(date) {
        return date.getUTCFullYear() + '-' + String(date.getUTCMonth() + 1).padStart(2, '0')
                + '-' + String(date.getUTCDate()).padStart(2, '0');
    }

    function shiftDate(value, days) {
        var date = parseDate(value);
        if (!date) return '';
        date.setUTCDate(date.getUTCDate() + days);
        return formatDate(date);
    }

    function daySpan(from, to) {
        var start = parseDate(from);
        var end = parseDate(to);
        return start && end ? Math.floor((end - start) / 86400000) + 1 : 0;
    }

    function init(root) {
        if (!root || root.dataset.timelineInitialized === 'true') return;
        var list = root.querySelector('[data-timeline-window-list]');
        var status = root.querySelector('[data-timeline-status]');
        var error = root.querySelector('[data-timeline-error]');
        var earlier = root.querySelector('[data-timeline-load-earlier]');
        var historyEnd = root.querySelector('[data-timeline-history-end]');
        var form = root.querySelector('[data-timeline-date-form]');
        if (!list || !status || !earlier || !form) return;
        root.dataset.timelineInitialized = 'true';

        function blocks() {
            return Array.prototype.slice.call(list.querySelectorAll(':scope > .timeline-window-block'));
        }

        function setBusy(busy, message) {
            root.classList.toggle('is-loading', busy);
            earlier.disabled = busy;
            form.querySelectorAll('button,input').forEach(function (control) {
                control.disabled = busy;
            });
            if (busy && message) status.textContent = message;
        }

        function showError(message) {
            error.textContent = message || '时间线加载失败，请重试。';
            error.hidden = false;
        }

        function clearError() {
            error.hidden = true;
            error.textContent = '';
        }

        function refreshStatus() {
            var windows = blocks();
            if (!windows.length) return;
            var oldest = windows[windows.length - 1];
            var newest = windows[0];
            var count = windows.reduce(function (sum, block) {
                return sum + Number(block.dataset.windowCount || 0);
            }, 0);
            status.innerHTML = '已加载 <strong>' + oldest.dataset.windowFrom + ' 至 '
                    + newest.dataset.windowTo + '</strong>，共 <strong>' + count + '</strong> 项行为';
            var earlierKnown = oldest.dataset.windowEarlierKnown === 'true';
            var hasEarlier = oldest.dataset.windowHasEarlier === 'true';
            earlier.hidden = earlierKnown && !hasEarlier;
            historyEnd.hidden = !earlierKnown || hasEarlier;
        }

        function requestWindow(from, to, append) {
            clearError();
            setBusy(true, append ? '正在加载更早的客户行为…' : '正在加载所选时间段…');
            var params = new URLSearchParams({
                shop: root.dataset.shop,
                customerId: root.dataset.customerId,
                timelineFromDate: from,
                timelineToDate: to,
                checkEarlier: append ? 'true' : 'false'
            });
            return fetch(root.dataset.timelineUrl + '?' + params.toString(), {
                credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                var documentFragment = new DOMParser().parseFromString(html, 'text/html');
                var block = documentFragment.querySelector('.timeline-window-block');
                if (!block) throw new Error('时间线响应格式错误');
                if (append) list.appendChild(block);
                else list.replaceChildren(block);
                if (!append) {
                    form.elements.timelineFromDate.value = from;
                    form.elements.timelineToDate.value = to;
                }
                refreshStatus();
            }).catch(function (failure) {
                showError('时间线加载失败，请重试。' + (failure.message ? '（' + failure.message + '）' : ''));
                refreshStatus();
            }).finally(function () {
                setBusy(false);
            });
        }

        function requestGroup(button) {
            var block = button.closest('.timeline-window-block');
            var group = button.closest('.timeline-group');
            var items = group ? group.querySelector('.timeline-group-items') : null;
            if (!block || !items) return;
            button.disabled = true;
            button.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>加载中</span>';
            var params = new URLSearchParams({
                shop: root.dataset.shop,
                customerId: root.dataset.customerId,
                timelineFromDate: block.dataset.windowFrom,
                timelineToDate: block.dataset.windowTo,
                groupIndex: button.dataset.groupIndex,
                offset: button.dataset.nextOffset
            });
            fetch(root.dataset.timelineGroupUrl + '?' + params.toString(), {
                credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                var pageDocument = new DOMParser().parseFromString(html, 'text/html');
                var page = pageDocument.querySelector('.timeline-group-page');
                if (!page) throw new Error('分组响应格式错误');
                while (page.firstChild) items.appendChild(page.firstChild);
                if (page.dataset.hasMore === 'true') {
                    button.dataset.nextOffset = page.dataset.nextOffset;
                    button.disabled = false;
                    button.innerHTML = '<i class="fa fa-angle-down"></i><span>再加载 50 条</span>';
                } else {
                    button.remove();
                }
            }).catch(function () {
                button.disabled = false;
                button.innerHTML = '<i class="fa fa-refresh"></i><span>重试加载</span>';
                showError('组内行为加载失败，请重试。');
            });
        }

        function requestTimelinePage(button) {
            var block = button.closest('.timeline-window-block');
            if (!block) return;
            button.disabled = true;
            button.innerHTML = '<i class="fa fa-spinner fa-spin"></i><span>加载中</span>';
            var params = new URLSearchParams({
                shop: root.dataset.shop,
                customerId: root.dataset.customerId,
                timelineFromDate: block.dataset.windowFrom,
                timelineToDate: block.dataset.windowTo,
                checkEarlier: 'false',
                cursor: button.dataset.nextCursor,
                pageSize: '200'
            });
            fetch(root.dataset.timelineUrl + '?' + params.toString(), {
                credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                var pageDocument = new DOMParser().parseFromString(html, 'text/html');
                var nextBlock = pageDocument.querySelector('.timeline-window-block');
                if (!nextBlock) throw new Error('时间线分页响应格式错误');
                var currentTimeline = block.querySelector('.timeline');
                var nextTimeline = nextBlock.querySelector('.timeline');
                if (nextTimeline) {
                    if (!currentTimeline) {
                        var empty = block.querySelector('.timeline-window-empty');
                        if (empty) empty.replaceWith(nextTimeline);
                        else block.appendChild(nextTimeline);
                    } else {
                        while (nextTimeline.firstChild) currentTimeline.appendChild(nextTimeline.firstChild);
                    }
                }
                var nextCount = Number(nextBlock.dataset.windowCount || 0);
                block.dataset.windowCount = String(
                        Number(block.dataset.windowCount || 0) + nextCount);
                var countLabel = block.querySelector('.timeline-window-heading strong');
                if (countLabel) countLabel.textContent = block.dataset.windowCount + ' 项行为';
                var nextButton = nextBlock.querySelector('[data-timeline-page-more]');
                if (nextButton) {
                    button.dataset.nextCursor = nextButton.dataset.nextCursor;
                    button.disabled = false;
                    button.innerHTML = '<i class="fa fa-angle-down"></i><span>继续加载此时间段</span>';
                } else {
                    button.remove();
                }
                refreshStatus();
            }).catch(function () {
                button.disabled = false;
                button.innerHTML = '<i class="fa fa-refresh"></i><span>重试继续加载</span>';
                showError('时间线分页加载失败，请重试。');
            });
        }

        root.addEventListener('click', function (event) {
            var preset = event.target.closest('[data-timeline-preset]');
            if (preset) {
                var days = Number(preset.dataset.timelinePreset);
                var current = blocks()[0];
                var to = current ? current.dataset.windowTo : form.elements.timelineToDate.value;
                root.querySelectorAll('[data-timeline-preset]').forEach(function (item) {
                    item.classList.toggle('is-active', item === preset);
                });
                requestWindow(shiftDate(to, -(days - 1)), to, false);
                return;
            }
            var more = event.target.closest('[data-timeline-group-more]');
            if (more) {
                requestGroup(more);
                return;
            }
            var pageMore = event.target.closest('[data-timeline-page-more]');
            if (pageMore) {
                requestTimelinePage(pageMore);
                return;
            }
            if (event.target.closest('[data-timeline-load-earlier]')) {
                var windows = blocks();
                var oldest = windows[windows.length - 1];
                if (!oldest) return;
                var toDate = shiftDate(oldest.dataset.windowFrom, -1);
                requestWindow(shiftDate(toDate, -29), toDate, true);
            }
        });

        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var from = form.elements.timelineFromDate.value;
            var to = form.elements.timelineToDate.value;
            if (!from || !to || daySpan(from, to) < 1) {
                showError('请选择有效的开始和结束日期。');
                return;
            }
            if (daySpan(from, to) > 366) {
                showError('单次最多查看 366 天；可先查询一年，再继续加载更早记录。');
                return;
            }
            root.querySelectorAll('[data-timeline-preset]').forEach(function (item) {
                item.classList.remove('is-active');
            });
            requestWindow(from, to, false);
        });

        if (!blocks().length) {
            var initialTo = form.elements.timelineToDate.value || formatDate(new Date());
            var initialFrom = form.elements.timelineFromDate.value || shiftDate(initialTo, -29);
            requestWindow(initialFrom, initialTo, false);
        } else {
            refreshStatus();
        }
    }

    window.ShopifyCustomerTimeline = window.ShopifyCustomerTimeline || {};
    window.ShopifyCustomerTimeline.init = init;
    document.querySelectorAll('[data-customer-timeline]').forEach(init);
}());
