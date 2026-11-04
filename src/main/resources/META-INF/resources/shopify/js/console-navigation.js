(function () {
    'use strict';

    if (!window.fetch || !window.DOMParser || !window.AbortController) return;
    var script = document.currentScript || document.getElementById('console-navigation');
    var contextPath = script ? (script.getAttribute('data-context-path') || '') : '';
    var request = null;

    function setBusy(busy, link) {
        var main = document.querySelector('.console-main');
        if (main) main.setAttribute('aria-busy', busy ? 'true' : 'false');
        document.documentElement.classList.toggle('console-navigating', busy);
        document.querySelectorAll('[data-console-navigation] .nav-item.is-loading')
                .forEach(function (item) { item.classList.remove('is-loading'); });
        if (busy && link) link.classList.add('is-loading');
    }

    function activateScripts(container) {
        var scripts = Array.prototype.slice.call(container.querySelectorAll('script'));
        return scripts.reduce(function (chain, oldScript) {
            return chain.then(function () {
                return new Promise(function (resolve, reject) {
                    var newScript = document.createElement('script');
                    Array.prototype.slice.call(oldScript.attributes).forEach(function (attribute) {
                        newScript.setAttribute(attribute.name, attribute.value);
                    });
                    newScript.textContent = oldScript.textContent;
                    if (newScript.getAttribute('src')) {
                        newScript.addEventListener('load', resolve, {once: true});
                        newScript.addEventListener('error', reject, {once: true});
                        oldScript.replaceWith(newScript);
                        return;
                    }
                    oldScript.replaceWith(newScript);
                    resolve();
                });
            });
        }, Promise.resolve());
    }

    function applyDocument(parsed, url, push) {
        var currentMain = document.querySelector('.console-main');
        var nextMain = parsed.querySelector('.console-main');
        var currentSidebar = document.querySelector('.console-sidebar');
        var nextSidebar = parsed.querySelector('.console-sidebar');
        if (!currentMain || !nextMain || !currentSidebar || !nextSidebar) {
            throw new Error('页面不支持局部导航');
        }
        currentSidebar.replaceWith(nextSidebar);
        currentMain.replaceWith(nextMain);
        document.title = parsed.title || document.title;
        if (push) window.history.pushState({consoleNavigation: true}, '', url);
        return activateScripts(nextMain).then(function () {
            window.scrollTo({top: 0, left: 0, behavior: 'auto'});
        });
    }

    function navigate(url, push, link) {
        if (request) request.abort();
        var controller = new AbortController();
        request = controller;
        setBusy(true, link);
        var navigationFallbackTimer = window.setTimeout(function () {
            if (request !== controller) return;
            controller.abort();
            setBusy(false);
            window.location.assign(url);
        }, 15000);
        return window.fetch(url, {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            redirect: 'follow',
            signal: controller.signal,
            headers: {'X-Requested-With': 'XMLHttpRequest'}
        }).then(function (response) {
            if (!response.ok || response.redirected && response.url.indexOf(contextPath + '/') === -1) {
                throw new Error('页面请求失败');
            }
            return response.text();
        }).then(function (html) {
            var parsed = new DOMParser().parseFromString(html, 'text/html');
            return applyDocument(parsed, url, push).then(function () {
                setBusy(false);
            });
        }).catch(function (error) {
            if (error && error.name === 'AbortError') return;
            setBusy(false);
            window.location.assign(url);
        }).finally(function () {
            window.clearTimeout(navigationFallbackTimer);
            if (request === controller) request = null;
        });
    }

    function storageValue(method, key, value) {
        if (!key) return null;
        try {
            if (method === 'set') {
                window.localStorage.setItem(key, value);
                return value;
            }
            if (method === 'remove') {
                window.localStorage.removeItem(key);
                return null;
            }
            return window.localStorage.getItem(key);
        } catch (ignored) {
            return null;
        }
    }

    function switcherForm(element) {
        return element && element.closest('[data-shop-switcher]');
    }

    function rememberShop(select) {
        var form = switcherForm(select);
        if (!form || !select.value) return;
        storageValue('set', form.getAttribute('data-shop-storage-key'), select.value);
    }

    function matchingShopOptions(input) {
        var form = switcherForm(input);
        var select = form && form.querySelector('[data-shop-switcher-select]');
        if (!select) return [];
        var query = (input.value || '').trim().toLocaleLowerCase();
        var matches = [];
        Array.prototype.forEach.call(select.options, function (option) {
            var name = option.getAttribute('data-shop-name') || '';
            var text = name + ' ' + option.value + ' ' + option.textContent;
            var matchesQuery = !query || text.toLocaleLowerCase().indexOf(query) !== -1;
            option.hidden = !matchesQuery && !option.selected;
            option.disabled = !matchesQuery && !option.selected;
            if (matchesQuery) matches.push(option);
        });
        var empty = form.querySelector('[data-shop-search-empty]');
        if (empty) empty.hidden = !query || matches.length !== 0;
        return matches;
    }

    function navigateToShop(select) {
        rememberShop(select);
        var currentPath = window.location.pathname;
        var relativePath = currentPath.indexOf(contextPath) === 0
                ? currentPath.substring(contextPath.length) : currentPath;
        var listPages = {
            '/customers/detail': '/customers',
            '/products/detail': '/products',
            '/campaigns/detail': '/campaigns',
            '/campaigns/editor': '/campaigns',
            '/segments/editor': '/segments',
            '/templates/editor': '/templates'
        };
        var targetPath = listPages[relativePath] || relativePath || '/';
        var target = new URL(contextPath + targetPath, window.location.origin);
        target.searchParams.set('shop', select.value);
        window.location.assign(target.href);
    }

    function sortShopOptions() {
        var select = document.querySelector('[data-shop-switcher-select]');
        if (!select) return;
        var selected = select.value;
        var collator = new Intl.Collator('zh-CN', {numeric: true, sensitivity: 'base', ignorePunctuation: true});
        function name(option) {
            return (option.getAttribute('data-shop-name') || '').trim()
                    || (option.textContent || '').trim() || option.value;
        }
        Array.prototype.slice.call(select.options).filter(function (option) { return !!option.value; })
                .sort(function (left, right) {
                    return collator.compare(name(left), name(right)) || collator.compare(left.value, right.value);
                }).forEach(function (option) { select.appendChild(option); });
        select.value = selected;
    }

    function restoreRememberedShop() {
        var form = document.querySelector('[data-shop-switcher]');
        var select = form && form.querySelector('[data-shop-switcher-select]');
        if (!select) return;
        var searchParams = new URL(window.location.href).searchParams;
        if (searchParams.has('shop')) {
            rememberShop(select);
            return;
        }
        var key = form.getAttribute('data-shop-storage-key');
        var remembered = storageValue('get', key);
        if (!remembered) return;
        var option = Array.prototype.find.call(select.options, function (candidate) {
            return candidate.value.toLocaleLowerCase() === remembered.toLocaleLowerCase();
        });
        if (!option) {
            storageValue('remove', key);
            return;
        }
        if (select.value === option.value) return;
        select.value = option.value;
        navigateToShop(select);
    }

    function renderShopPicker(form, matches) {
        var list = form.querySelector('[data-shop-picker-options]');
        var select = form.querySelector('[data-shop-switcher-select]');
        if (!list || !select) return;
        list.replaceChildren();
        matches.forEach(function (option) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'shop-picker-option';
            button.setAttribute('role', 'option');
            button.setAttribute('data-shop-picker-option', option.value);
            button.setAttribute('aria-selected', option.value === select.value ? 'true' : 'false');
            var name = document.createElement('span');
            name.textContent = (option.getAttribute('data-shop-name') || option.textContent || option.value).trim();
            var domain = document.createElement('small');
            domain.textContent = option.value;
            button.append(name, domain);
            list.appendChild(button);
        });
    }

    function closeShopPicker(form, focusTrigger) {
        var panel = form.querySelector('[data-shop-picker-panel]');
        var trigger = form.querySelector('[data-shop-picker-trigger]');
        var input = form.querySelector('[data-shop-switcher-search]');
        if (!panel || !trigger || panel.hidden) return;
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        if (input) {
            input.value = '';
            renderShopPicker(form, matchingShopOptions(input));
        }
        if (focusTrigger) trigger.focus();
    }

    function setupShopPicker() {
        var form = document.querySelector('[data-shop-switcher]');
        var picker = form && form.querySelector('[data-shop-picker]');
        if (!picker) return;
        var select = form.querySelector('[data-shop-switcher-select]');
        var trigger = form.querySelector('[data-shop-picker-trigger]');
        var label = form.querySelector('[data-shop-picker-label]');
        var input = form.querySelector('[data-shop-switcher-search]');
        if (!select || !trigger || !label || !input) return;
        var selected = Array.prototype.find.call(select.options, function (option) {
            return option.value === select.value;
        });
        label.textContent = selected ? (selected.textContent || selected.value).trim() : '选择店铺';
        renderShopPicker(form, matchingShopOptions(input));
        trigger.hidden = false;
        picker.classList.add('is-enhanced');
    }

    document.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-shop-picker-trigger]');
        if (trigger) {
            var form = switcherForm(trigger);
            var panel = form.querySelector('[data-shop-picker-panel]');
            if (!panel.hidden) {
                closeShopPicker(form, true);
            } else {
                panel.hidden = false;
                trigger.setAttribute('aria-expanded', 'true');
                form.querySelector('[data-shop-switcher-search]').focus();
            }
            return;
        }
        var option = event.target.closest('[data-shop-picker-option]');
        if (option) {
            var optionForm = switcherForm(option);
            var select = optionForm.querySelector('[data-shop-switcher-select]');
            select.value = option.getAttribute('data-shop-picker-option');
            navigateToShop(select);
            return;
        }
        var openForm = document.querySelector('[data-shop-switcher]');
        if (openForm && openForm.contains && !openForm.contains(event.target)) closeShopPicker(openForm, false);
        var link = event.target.closest('[data-console-navigation] a[href]');
        if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey
                || event.ctrlKey || event.shiftKey || event.altKey || link.target) return;
        var url = new URL(link.href, window.location.href);
        if (url.origin !== window.location.origin || url.pathname.indexOf(contextPath + '/') !== 0) return;
        event.preventDefault();
        navigate(url.href, true, link);
    });

    document.addEventListener('change', function (event) {
        var select = event.target.closest('[data-shop-switcher-select]');
        if (!select) return;
        navigateToShop(select);
    });

    document.addEventListener('input', function (event) {
        var input = event.target.closest('[data-shop-switcher-search]');
        if (input) renderShopPicker(switcherForm(input), matchingShopOptions(input));
    });

    document.addEventListener('keydown', function (event) {
        var input = event.target.closest('[data-shop-switcher-search]');
        if (!input) {
            var option = event.target.closest('[data-shop-picker-option]');
            if (!option) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                closeShopPicker(switcherForm(option), true);
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                var sibling = event.key === 'ArrowDown' ? option.nextElementSibling : option.previousElementSibling;
                if (sibling) sibling.focus();
                else if (event.key === 'ArrowUp') switcherForm(option).querySelector('[data-shop-switcher-search]').focus();
            }
            return;
        }
        if (event.key === 'Escape') {
            input.value = '';
            matchingShopOptions(input);
            closeShopPicker(switcherForm(input), true);
            return;
        }
        if (event.key === 'ArrowDown') {
            var first = switcherForm(input).querySelector('[data-shop-picker-option]');
            if (first) { event.preventDefault(); first.focus(); }
            return;
        }
        if (event.key !== 'Enter') return;
        event.preventDefault();
        var visibleOptions = matchingShopOptions(input);
        if (visibleOptions.length === 1) {
            var select = switcherForm(input).querySelector('[data-shop-switcher-select]');
            select.value = visibleOptions[0].value;
            navigateToShop(select);
        }
    });

    window.addEventListener('popstate', function () {
        navigate(window.location.href, false, null);
    });

    sortShopOptions();
    restoreRememberedShop();
    setupShopPicker();
}());
