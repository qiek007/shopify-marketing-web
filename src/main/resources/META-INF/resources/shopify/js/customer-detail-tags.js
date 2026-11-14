(function () {
    'use strict';

    function renderTags(root, tags) {
        var list = root.querySelector('[data-customer-tag-list]');
        list.replaceChildren();
        if (!tags.length) {
            var empty = document.createElement('span');
            empty.className = 'muted-text';
            empty.textContent = '暂无标签';
            list.append(empty);
            return;
        }
        tags.forEach(function (tag) {
            var chip = document.createElement('span');
            chip.className = 'status-pill neutral';
            var label = document.createElement('span');
            label.textContent = tag;
            var remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'customer-detail-tag-remove';
            remove.dataset.removeCustomerTag = tag;
            remove.setAttribute('aria-label', '移除标签 ' + tag);
            remove.textContent = '×';
            chip.append(label, remove);
            list.append(chip);
        });
    }

    async function changeTag(root, action, tag) {
        if (!root || root.dataset.editable !== 'true' || root.hasAttribute('aria-busy')) return;
        var status = root.querySelector('[data-customer-tag-status]');
        var input = root.querySelector('input[name="tag"]');
        if (!tag) {
            status.textContent = '请输入标签名称。';
            status.setAttribute('data-error', '');
            input.focus();
            return;
        }
        closeTagOptions(input);
        var controls = root.querySelectorAll('button, input');
        root.setAttribute('aria-busy', 'true');
        controls.forEach(function (control) { control.disabled = true; });
        status.removeAttribute('data-error');
        status.textContent = '正在保存…';
        try {
            var response = await fetch(root.dataset.url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ customerId: root.dataset.customerId, action: action, tag: tag })
            });
            var data = await response.json().catch(function () { return {}; });
            if (!response.ok || !Array.isArray(data.tags)) {
                var message = response.status === 403 ? '你没有管理此客户标签的权限。'
                    : response.status === 404 ? '客户不存在或已合并，请刷新客户列表。'
                    : '标签保存失败，请稍后重试。';
                throw new Error(message);
            }
            renderTags(root, data.tags);
            if (action === 'add') input.value = '';
            status.textContent = action === 'add' ? '已添加标签。' : '已移除标签。';
            root.dispatchEvent(new CustomEvent('customer-tags-changed', { bubbles: true }));
        } catch (error) {
            status.setAttribute('data-error', '');
            status.textContent = error.message === 'Failed to fetch' ? '标签保存失败，请稍后重试。' : error.message;
        } finally {
            root.removeAttribute('aria-busy');
            controls.forEach(function (control) { control.disabled = false; });
        }
    }

    document.addEventListener('submit', function (event) {
        var form = event.target.closest('[data-customer-tag-add]');
        if (!form) return;
        event.preventDefault();
        changeTag(form.closest('[data-customer-detail-tags]'), 'add', form.elements.tag.value.trim());
    });

    document.addEventListener('click', function (event) {
        var button = event.target.closest('[data-remove-customer-tag]');
        if (button) changeTag(button.closest('[data-customer-detail-tags]'), 'remove', button.dataset.removeCustomerTag);
    });

    var pickerCount = 0;
    var searchStates = new WeakMap();

    function tagSearchState(input) {
        if (!searchStates.has(input)) {
            var list = input.parentElement.querySelector('[data-customer-tag-options]');
            list.id = 'customer-tag-options-' + (++pickerCount);
            input.setAttribute('aria-controls', list.id);
            searchStates.set(input, { list: list, active: -1 });
        }
        return searchStates.get(input);
    }

    function closeTagOptions(input) {
        var state = searchStates.get(input);
        if (!state) return;
        clearTimeout(state.timer);
        if (state.request) state.request.abort();
        state.request = null;
        state.list.hidden = true;
        state.list.replaceChildren();
        state.active = -1;
        input.setAttribute('aria-expanded', 'false');
        input.removeAttribute('aria-activedescendant');
    }

    function searchTags(input) {
        var root = input.closest('[data-customer-detail-tags]');
        if (root.hasAttribute('aria-busy')) return;
        var state = tagSearchState(input);
        closeTagOptions(input);
        state.timer = setTimeout(async function () {
            var request = new AbortController();
            state.request = request;
            var url = new URL(root.dataset.optionsUrl, location.href);
            var term = input.value.trim();
            url.searchParams.set('q', term);
            try {
                var response = await fetch(url, { signal: request.signal, headers: { Accept: 'application/json' } });
                if (!response.ok) throw new Error();
                var tags = await response.json();
                if (!Array.isArray(tags)) throw new Error();
                if (state.request !== request || !input.matches(':focus')) return;
                var query = term.toLocaleLowerCase();
                var matches = tags.filter(function (tag) {
                    return typeof tag === 'string' && tag.toLocaleLowerCase().includes(query);
                });
                matches.forEach(function (tag, index) {
                    var item = document.createElement('li');
                    item.id = state.list.id + '-' + index;
                    item.dataset.selectCustomerTag = tag;
                    item.setAttribute('role', 'option');
                    item.setAttribute('aria-selected', 'false');
                    item.textContent = tag;
                    state.list.append(item);
                });
                if (!matches.length) {
                    var empty = document.createElement('li');
                    empty.textContent = '没有匹配的标签，可直接添加新标签。';
                    state.list.append(empty);
                }
                state.list.hidden = false;
                input.setAttribute('aria-expanded', 'true');
            } catch (error) {
                if (state.request === request && input.matches(':focus')) {
                    var status = root.querySelector('[data-customer-tag-status]');
                    status.setAttribute('data-error', '');
                    status.textContent = '无法加载已有标签，请重试。';
                }
            }
        }, 180);
    }

    function selectTag(input, tag) {
        input.value = tag;
        closeTagOptions(input);
    }

    ['focusin', 'input'].forEach(function (name) {
        document.addEventListener(name, function (event) {
            if (event.target.matches('[data-customer-tag-search]')) searchTags(event.target);
        });
    });
    document.addEventListener('focusout', function (event) {
        if (event.target.matches('[data-customer-tag-search]')) closeTagOptions(event.target);
    });
    document.addEventListener('mousedown', function (event) {
        if (event.target.closest('[data-select-customer-tag]')) event.preventDefault();
    });
    document.addEventListener('click', function (event) {
        var option = event.target.closest('[data-select-customer-tag]');
        if (option) selectTag(option.parentElement.parentElement.querySelector('input'), option.dataset.selectCustomerTag);
    });
    document.addEventListener('keydown', function (event) {
        var input = event.target;
        if (!input.matches('[data-customer-tag-search]')) return;
        var state = tagSearchState(input);
        if (event.key === 'Escape' && !state.list.hidden) {
            event.preventDefault();
            event.stopPropagation();
            closeTagOptions(input);
            return;
        }
        var options = state.list.querySelectorAll('[data-select-customer-tag]');
        if (state.list.hidden || !options.length) return;
        if (event.key === 'Enter' && state.active >= 0) {
            event.preventDefault();
            selectTag(input, options[state.active].dataset.selectCustomerTag);
        } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            if (state.active < 0) state.active = event.key === 'ArrowDown' ? 0 : options.length - 1;
            else state.active = (state.active + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
            options.forEach(function (option, index) {
                option.setAttribute('aria-selected', String(index === state.active));
            });
            input.setAttribute('aria-activedescendant', options[state.active].id);
            options[state.active].scrollIntoView({ block: 'nearest' });
        }
    });

    document.addEventListener('change', function (event) {
        var form = event.target.closest('[data-customer-subscription-form]');
        if (!form || event.target.name !== 'state') return;
        var confirmation = form.querySelector('[data-subscription-confirmation]');
        confirmation.hidden = form.elements.state.value !== 'SUBSCRIBED';
        form.elements.confirmed.checked = false;
        form.elements.confirmed.required = !confirmation.hidden;
    });

    document.addEventListener('submit', async function (event) {
        var form = event.target.closest('[data-customer-subscription-form]');
        if (!form) return;
        event.preventDefault();
        if (form.hasAttribute('aria-busy')) return;
        var status = form.querySelector('[data-subscription-status]');
        var selection = form.elements.state;
        var confirmation = form.elements.confirmed;
        var command = { customerId: form.dataset.customerId, state: selection.value, confirmed: confirmation.checked };
        var controls = form.querySelectorAll('input, select, button');
        form.setAttribute('aria-busy', 'true');
        controls.forEach(function (control) { control.disabled = true; });
        status.removeAttribute('data-error');
        status.textContent = '正在保存…';
        try {
            var response = await fetch(form.dataset.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(command)
            });
            var data = await response.json().catch(function () { return {}; });
            if (!response.ok || typeof data.consentState !== 'string') {
                var message = response.status === 403 ? '你没有修改此客户订阅状态的权限。'
                    : response.status === 404 ? '客户不存在或已合并，请刷新客户列表。'
                    : data.message || '订阅状态保存失败，请稍后重试。';
                throw new Error(message);
            }
            var section = form.closest('.campaign-customer-dialog-body, .console-main') || document;
            section.querySelectorAll('[data-customer-subscription-value], [data-customer-subscription-badge]')
                .forEach(function (node) { node.textContent = data.consentState; });
            selection.value = data.consentState;
            status.textContent = '订阅状态已更新。';
            confirmation.required = false;
            confirmation.checked = false;
            form.querySelector('[data-subscription-confirmation]').hidden = true;
            form.dispatchEvent(new CustomEvent('customer-subscription-changed', { bubbles: true }));
        } catch (error) {
            status.setAttribute('data-error', '');
            status.textContent = error.message === 'Failed to fetch' ? '订阅状态保存失败，请稍后重试。' : error.message;
        } finally {
            form.removeAttribute('aria-busy');
            controls.forEach(function (control) { control.disabled = false; });
        }
    });

    document.addEventListener('submit', async function (event) {
        var form = event.target.closest('[data-customer-suppression-form]');
        if (!form) return;
        event.preventDefault();
        var button = form.querySelector('button[type="submit"]');
        if (button.disabled) return;
        var status = form.querySelector('[data-suppression-status]');
        var suppress = form.dataset.suppressed !== 'true';
        var dialog = form.parentElement.querySelector('[data-suppression-confirm-dialog]');
        if (!dialog || dialog.open) return;
        var title = suppress ? '加入抑制名单' : '解除手动抑制';
        dialog.querySelector('[data-suppression-confirm-title]').textContent = title;
        dialog.querySelector('[data-suppression-confirm-description]').textContent = suppress
            ? '加入后，后续冻结受众时会排除此客户。已冻结的受众名单保持原样。'
            : '解除后，其他抑制记录仍然生效。';
        dialog.querySelector('[data-suppression-confirm-action]').textContent =
            suppress ? '确认加入' : '确认解除';
        dialog.returnValue = '';
        dialog.showModal();
        await new Promise(function (resolve) { dialog.addEventListener('close', resolve, { once: true }); });
        if (dialog.returnValue !== 'confirm' || !form.isConnected) return;

        button.disabled = true;
        status.removeAttribute('data-error');
        status.textContent = '正在保存…';
        try {
            var response = await fetch(form.dataset.url, {
                method: 'POST', credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ customerId: form.dataset.customerId, suppressed: suppress })
            });
            var data = await response.json().catch(function () { return {}; });
            if (!response.ok || typeof data.suppressed !== 'boolean') {
                throw new Error(response.status === 403 ? '你没有修改抑制名单的权限。'
                    : data.message || '抑制名单保存失败，请稍后重试。');
            }
            form.dataset.suppressed = String(data.suppressed);
            form.parentElement.querySelector('[data-customer-suppression-value]').textContent = data.suppressed ? '是' : '否';
            button.textContent = data.suppressed ? '解除手动抑制' : '加入抑制名单';
            status.textContent = suppress ? '已加入抑制名单。'
                : data.suppressed ? '仍有其他抑制记录，客户仍在抑制名单中。' : '已移出抑制名单。';
            form.dispatchEvent(new CustomEvent('customer-suppression-changed', { bubbles: true }));
        } catch (error) {
            status.setAttribute('data-error', '');
            status.textContent = error.message || '抑制名单保存失败，请稍后重试。';
        } finally {
            button.disabled = false;
        }
    });
})();
