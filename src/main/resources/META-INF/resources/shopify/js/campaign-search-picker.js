(function () {
    'use strict';
    function create(root, select, config) {
        var trigger = root.querySelector('[data-picker-trigger]');
        var panel = root.querySelector('[data-picker-panel]');
        var input = root.querySelector('[data-picker-search]');
        var list = root.querySelector('[data-picker-options]');
        var status = root.querySelector('[data-picker-status]');
        var label = root.querySelector('[data-picker-label]');
        var timer = null, generation = 0, needsReset = false;
        select.hidden = true;
        trigger.hidden = false;

        function refresh() {
            list.replaceChildren();
            var options = Array.prototype.slice.call(select.options).filter(function (option) {
                return !option.disabled && (config.includeEmpty || option.value !== '');
            });
            var selected = Array.prototype.find.call(select.options, function (option) {
                return option.value === select.value;
            });
            label.textContent = config.includeEmpty && selected ? selected.textContent : config.placeholder;
            options.forEach(function (option) {
                var button = document.createElement('button');
                button.type = 'button'; button.className = 'campaign-picker-option';
                button.textContent = option.textContent;
                button.setAttribute('role', 'option');
                button.setAttribute('aria-selected', option.value === select.value ? 'true' : 'false');
                button.setAttribute('data-picker-match', option.value !== ''
                    && !(option.getAttribute && option.getAttribute('data-picker-retained') === 'true') ? 'true' : 'false');
                button.addEventListener('click', function () {
                    generation++; clearTimeout(timer);
                    if (config.invalidate) config.invalidate();
                    select.value = option.value;
                    select.dispatchEvent(new Event('change', {bubbles: true}));
                    needsReset = !!input.value.trim();
                    input.value = '';
                    close(); refresh(); trigger.focus();
                });
                list.appendChild(button);
            });
            var hasMatch = options.some(function (option) {
                return option.value !== '' && !(option.getAttribute && option.getAttribute('data-picker-retained') === 'true');
            });
            var noMatch = !options.length || (config.includeEmpty && input.value.trim() && !hasMatch);
            status.textContent = noMatch ? '没有匹配结果' : '';
            status.hidden = !noMatch;
        }
        function close() { panel.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
        trigger.addEventListener('click', function () {
            if (!panel.hidden) { close(); return; }
            panel.hidden = false; trigger.setAttribute('aria-expanded', 'true');
            refresh(); input.focus();
            if (needsReset) { needsReset = false; input.dispatchEvent(new Event('input', {bubbles: true})); }
        });
        input.addEventListener('input', function () {
            var current = ++generation;
            if (config.invalidate) config.invalidate();
            clearTimeout(timer); list.replaceChildren(); status.hidden = false; status.textContent = '正在查询…';
            timer = setTimeout(function () {
                Promise.resolve().then(function () { return config.load(input.value.trim()); }).then(function () {
                    if (current === generation) refresh();
                }).catch(function () {
                    if (current === generation) { list.replaceChildren(); status.hidden = false; status.textContent = '查询失败，请重试'; }
                });
            }, config.delay == null ? 250 : config.delay);
        });
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') { event.preventDefault(); close(); trigger.focus(); }
            else if (event.key === 'ArrowDown' && list.children.length) { event.preventDefault(); list.children[0].focus(); }
            else if (event.key === 'Enter') {
                event.preventDefault();
                var options = Array.prototype.slice.call(list.children);
                var match = input.value.trim() ? options.find(function (option) {
                    return option.getAttribute('data-picker-match') === 'true';
                }) : options[0];
                if (match) match.click();
            }
        });
        list.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') { event.preventDefault(); close(); trigger.focus(); }
            else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                var options = Array.prototype.slice.call(list.children);
                var index = options.indexOf(event.target);
                var next = index + (event.key === 'ArrowDown' ? 1 : -1);
                event.preventDefault();
                if (next < 0) input.focus(); else if (next < options.length) options[next].focus();
            }
        });
        document.addEventListener('click', function (event) { if (!root.contains(event.target)) close(); });
        refresh();
        return {refresh: refresh};
    }
    window.CampaignSearchPicker = {create: create};
}());
