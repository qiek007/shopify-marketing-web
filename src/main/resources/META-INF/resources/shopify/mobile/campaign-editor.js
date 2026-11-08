(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root && root.document) api.init(root.document, root);
}(typeof window === 'undefined' ? null : window, function () {
    'use strict';

    function audienceAllowed(segment, confirmed) {
        return Boolean(String(segment || '').trim()) || confirmed === true;
    }

    function creationStepError(step, values) {
        if (step === 0) {
            if (!String(values.name || '').trim()) return '请填写活动名称。';
            if (!values.templateReady) return '请选择可用模板，并等待模板检查完成。';
        }
        if (step === 1 && !audienceAllowed(values.segment, values.allCustomers)) {
            return '请选择客户分群，或明确确认全部符合发送资格的客户。';
        }
        if (step === 2 && !values.channelCount) return '请至少选择一个发送通道。';
        return '';
    }

    function equalChannelWeights(providers) {
        var values = Object.create(null);
        providers.forEach(function (provider) { values[provider] = 1; });
        return JSON.stringify(values);
    }

    function updateChannelWeights(hidden, checks) {
        var selected = Array.prototype.filter.call(checks, function (check) { return check.checked; })
            .map(function (check) { return check.value; });
        hidden.value = equalChannelWeights(selected);
        hidden.disabled = false;
    }

    function templateAllowed(options) {
        if (!options || !options.customVariables || typeof options.customVariables !== 'object'
                || Array.isArray(options.customVariables) || !Array.isArray(options.referencedVariables)
                || typeof options.productSlotCount !== 'number') return false;
        if (options.productSourceId) return false;
        var builtIn = ['firstName', 'lastName', 'email', 'shopDomain', 'unsubscribeUrl', 'unsubscribeOneClickUrl'];
        return !options.referencedVariables.some(function (name) {
            return typeof name !== 'string' || /^(product|coupon)/i.test(name)
                || /^(title|imageUrl|price|url)$/.test(name)
                || (builtIn.indexOf(name) === -1 && !Object.prototype.hasOwnProperty.call(options.customVariables, name));
        });
    }

    function referencedCustomVariables(options) {
        var values = Object.create(null);
        options.referencedVariables.forEach(function (key) {
            if (Object.prototype.hasOwnProperty.call(options.customVariables, key)) {
                values[key] = options.customVariables[key];
            }
        });
        return values;
    }

    function createTemplateLoader(fetchOptions, onState) {
        var generation = 0;
        return {
            load: function (id) {
                var current = ++generation;
                onState({status: 'loading'});
                if (!id) {
                    onState({status: 'idle'});
                    return Promise.resolve();
                }
                return Promise.resolve().then(function () { return fetchOptions(id); })
                    .then(function (options) {
                        if (current !== generation) return;
                        onState({status: options && options.templateId === id && templateAllowed(options) ? 'ready' : 'unsupported', options: options});
                    }, function () {
                        if (current === generation) onState({status: 'error'});
                    });
            }
        };
    }

    function installTestSendGuard(form, message) {
        var button = form.querySelector('button[type="submit"]');
        var pending = false;
        button.disabled = false;
        form.addEventListener('submit', function (event) {
            if (pending) { event.preventDefault(); return; }
            pending = true;
            button.disabled = true;
            button.textContent = '正在提交…';
            message.textContent = '正在提交测试邮件，请勿重复操作。';
        });
        return {restore: function () {
            if (pending) {
                button.disabled = true;
                message.textContent = '页面已返回，提交结果可能尚未确认。请刷新页面查看记录，再决定是否重新发送。';
            }
        }};
    }

    function init(document, window) {
        var testForm = document.getElementById('mobile-campaign-test-form');
        if (testForm) {
            var testGuard = installTestSendGuard(testForm, document.getElementById('mobile-test-send-status'));
            window.addEventListener('pageshow', function (event) {
                if (event.persisted) testGuard.restore();
            });
        }
        var form = document.getElementById('mobile-campaign-form');
        if (!form) return;
        var template = form.querySelector('[name="templateId"]');
        var segment = form.querySelector('[name="segmentId"]');
        var confirmation = form.querySelector('[name="allCustomersConfirmed"]');
        var variables = form.querySelector('[name="campaignVariables"]');
        var channelWeights = form.querySelector('[name="channelWeightsJson"]');
        var channelChecks = form.querySelectorAll('[name="providers"]');
        var variableHost = document.getElementById('mobile-campaign-variables');
        var status = document.getElementById('mobile-template-status');
        var save = document.getElementById('mobile-save-campaign');
        var preview = document.getElementById('mobile-preview-template');
        var previewArea = document.getElementById('mobile-template-preview');
        var previewText = document.getElementById('mobile-preview-status');
        var previewFrame = document.getElementById('mobile-preview-frame');
        var shop = form.querySelector('[name="shop"]').value;
        var context = form.getAttribute('data-context') || '';
        var ready = false;
        var previewGeneration = 0;
        var submitting = false;
        var steps = Array.prototype.slice.call(form.querySelectorAll('[data-editor-step]'));
        var progress = document.getElementById('mobile-editor-progress');
        var stepStatus = document.getElementById('mobile-editor-step-status');
        var stepError = document.getElementById('mobile-editor-step-error');
        var previous = document.getElementById('mobile-editor-previous');
        var next = document.getElementById('mobile-editor-next');
        var review = document.getElementById('mobile-editor-review');
        var currentStep = 0;
        var keyboardTimer;

        function revealFocusedInput() {
            window.clearTimeout(keyboardTimer);
            keyboardTimer = window.setTimeout(function () {
                var input = document.activeElement;
                if (input && form.contains(input) && input.matches('input:not([type=hidden]), textarea, select')) {
                    input.scrollIntoView({block: 'center', behavior: 'smooth'});
                }
            }, 200);
        }

        form.addEventListener('focusin', revealFocusedInput);
        if (window.visualViewport) window.visualViewport.addEventListener('resize', revealFocusedInput);

        function validateStep(step) {
            var message = creationStepError(step, {
                name: form.querySelector('[name="name"]').value,
                templateReady: ready,
                segment: segment.value,
                allCustomers: confirmation.checked,
                channelCount: form.querySelectorAll('[name="providers"]:checked').length
            });
            stepError.textContent = message;
            stepError.hidden = !message;
            if (message) stepError.scrollIntoView({block: 'center'});
            return !message;
        }

        function renderReview() {
            review.replaceChildren();
            var rows = [
                ['活动名称', form.querySelector('[name="name"]').value],
                ['邮件模板', template.options[template.selectedIndex].text],
                ['目标受众', segment.value ? segment.options[segment.selectedIndex].text : '全部符合发送资格的客户'],
                ['发送通道', Array.prototype.filter.call(channelChecks, function (input) { return input.checked; })
                    .map(function (input) {
                        var label = input.closest('label');
                        var alias = label.querySelector('strong').textContent;
                        var sender = label.querySelector('span').textContent.replace(alias, '').trim();
                        return alias + ' · ' + sender;
                    }).join('\n')],
                ['发送规则', '选中通道等权分配 · 重复间隔 24 小时 · 数据保留 14 天']
            ];
            variableHost.querySelectorAll('[data-variable]').forEach(function (input) {
                rows.push([input.closest('label').querySelector('span').textContent, input.value || '未填写']);
            });
            rows.forEach(function (row) {
                var item = document.createElement('div');
                var label = document.createElement('dt');
                var value = document.createElement('dd');
                label.textContent = row[0];
                value.textContent = row[1];
                item.appendChild(label);
                item.appendChild(value);
                review.appendChild(item);
            });
        }

        function showStep(index, focus) {
            currentStep = index;
            steps.forEach(function (step, position) { step.hidden = position !== index; });
            Array.prototype.forEach.call(progress.querySelectorAll('li'), function (item, position) {
                if (position === index) item.setAttribute('aria-current', 'step');
                else item.removeAttribute('aria-current');
            });
            stepStatus.textContent = '第 ' + (index + 1) + ' 步，共 ' + steps.length + ' 步 · 可返回修改已填内容';
            previous.hidden = index === 0;
            next.hidden = index === steps.length - 1;
            save.hidden = index !== steps.length - 1;
            stepError.hidden = true;
            if (index === steps.length - 1) renderReview();
            if (focus) {
                var heading = steps[index].querySelector('h2');
                heading.tabIndex = -1;
                heading.focus({preventScroll: true});
                progress.scrollIntoView({block: 'start'});
            }
        }

        function advanceStep() {
            if (!validateStep(currentStep)) return;
            showStep(Math.min(currentStep + 1, steps.length - 1), true);
        }

        form.noValidate = true;
        progress.hidden = false;
        previous.addEventListener('click', function () { showStep(currentStep - 1, true); });
        next.addEventListener('click', advanceStep);
        showStep(0, false);

        function fetchJson(path, params) {
            var query = new URLSearchParams(params);
            return window.fetch(context + path + '?' + query.toString(), {
                credentials: 'same-origin', cache: 'no-store', redirect: 'manual',
                headers: {'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest'}
            }).then(function (response) {
                if (!response.ok || response.type === 'opaqueredirect'
                        || (response.headers.get('content-type') || '').indexOf('application/json') === -1) {
                    throw new Error('请求失败或登录已过期');
                }
                return response.json();
            });
        }

        function writeVariables() {
            var values = Object.create(null);
            variableHost.querySelectorAll('[data-variable]').forEach(function (input) {
                values[input.getAttribute('data-variable')] = input.value;
            });
            variables.value = JSON.stringify(values);
        }

        function showVariables(defaults) {
            variableHost.replaceChildren();
            Object.keys(defaults).forEach(function (key) {
                var label = document.createElement('label');
                var caption = document.createElement('span');
                var input = document.createElement('input');
                caption.textContent = key === 'campaignMessage' ? '活动文案' : key;
                input.type = 'text';
                input.maxLength = 500;
                input.value = defaults[key] == null ? '' : String(defaults[key]);
                input.setAttribute('data-variable', key);
                input.addEventListener('input', writeVariables);
                label.appendChild(caption);
                label.appendChild(input);
                variableHost.appendChild(label);
            });
            writeVariables();
        }

        var loader = createTemplateLoader(function (id) {
            return fetchJson('/campaigns/template-options', {shop: shop, templateId: id});
        }, function (state) {
            ready = state.status === 'ready';
            save.disabled = !ready || submitting;
            preview.disabled = !ready;
            if (state.status === 'ready') {
                var editableVariables = referencedCustomVariables(state.options);
                showVariables(editableVariables);
                status.textContent = Object.keys(editableVariables).length
                    ? '模板已就绪，请检查文案及默认变量。'
                    : '模板已就绪，当前模板没有需要填写的活动变量。';
            } else {
                variableHost.replaceChildren();
                variables.value = '{}';
                status.textContent = state.status === 'loading' ? '正在检查模板…'
                    : state.status === 'unsupported' ? '此模板包含商品、优惠券或不支持的内容，请在电脑端创建活动。'
                    : state.status === 'error' ? '无法读取模板或登录已失效，请重新选择模板重试。'
                    : '请选择已发布模板。';
            }
        });

        template.addEventListener('change', function () {
            previewGeneration++;
            previewArea.hidden = true;
            previewFrame.removeAttribute('srcdoc');
            loader.load(template.value);
        });
        segment.addEventListener('change', function () { confirmation.checked = false; });
        channelChecks.forEach(function (check) {
            check.addEventListener('change', function () { updateChannelWeights(channelWeights, channelChecks); });
        });
        updateChannelWeights(channelWeights, channelChecks);
        preview.addEventListener('click', function () {
            if (!ready) return;
            var current = ++previewGeneration;
            previewArea.hidden = false;
            previewText.textContent = '正在加载已发布模板…';
            previewFrame.removeAttribute('srcdoc');
            fetchJson('/templates/preview', {shop: shop, templateId: template.value, version: 'PUBLISHED'})
                .then(function (data) {
                    if (current !== previewGeneration) return;
                    if (data.hasDraft !== false || data.status !== 'PUBLISHED') throw new Error('未返回已发布模板');
                    previewText.textContent = '已发布模板预览；变量将在发送时填充。';
                    previewFrame.srcdoc = data.htmlTemplate || data.html || '<p>暂无 HTML 内容</p>';
                }).catch(function () {
                    if (current === previewGeneration) previewText.textContent = '预览加载失败，请重试。';
                });
        });
        form.addEventListener('submit', function (event) {
            if (currentStep !== steps.length - 1) {
                event.preventDefault();
                advanceStep();
                return;
            }
            for (var step = 0; step < steps.length - 1; step++) {
                if (!validateStep(step)) {
                    event.preventDefault();
                    showStep(step, true);
                    validateStep(step);
                    return;
                }
            }
            if (!form.reportValidity()) {
                event.preventDefault();
                showStep(0, true);
                return;
            }
            var checked = form.querySelectorAll('[name="providers"]:checked').length;
            if (!ready || submitting || !audienceAllowed(segment.value, confirmation.checked) || !checked) {
                event.preventDefault();
                status.textContent = !ready ? '请先选择可用模板。'
                    : !audienceAllowed(segment.value, confirmation.checked) ? '请选择客户分群，或明确确认全部符合发送资格的客户。'
                    : !checked ? '请至少选择一个发送通道。' : '正在保存，请稍候。';
                status.scrollIntoView({block: 'center'});
                return;
            }
            writeVariables();
            updateChannelWeights(channelWeights, channelChecks);
            submitting = true;
            save.disabled = true;
            save.textContent = '正在保存…';
        });
        loader.load(template.value);
    }

    return {audienceAllowed: audienceAllowed, templateAllowed: templateAllowed,
        creationStepError: creationStepError,
        referencedCustomVariables: referencedCustomVariables,
        equalChannelWeights: equalChannelWeights, updateChannelWeights: updateChannelWeights,
        createTemplateLoader: createTemplateLoader, installTestSendGuard: installTestSendGuard, init: init};
}));
