(function () {
    'use strict';

    document.querySelectorAll('[data-channel-weight-editor]').forEach(function (editor) {
        var form = editor.closest('form');
        var fieldset = editor.closest('fieldset');
        var hidden = form && form.querySelector('[data-channel-weights-json]');
        if (!form || !fieldset || !hidden) return;

        var rows = Array.prototype.slice.call(editor.querySelectorAll('[data-channel-weight-row]'));
        var checks = Array.prototype.slice.call(fieldset.querySelectorAll('input[name="providers"]'));
        var hint = editor.querySelector('[data-channel-weight-hint]');

        function selected(provider) {
            return checks.some(function (check) { return check.value === provider && check.checked; });
        }

        function numberValue(input, legacy) {
            var value = Number(input.value);
            return input.value !== '' && Number.isInteger(value) && value >= 1 && value <= (legacy ? 100 : 10)
                    ? value : null;
        }

        function update() {
            var values = {};
            var total = 0;
            var valid = true;
            var hasLegacy = false;
            rows.forEach(function (row) {
                var active = selected(row.dataset.provider);
                var slider = row.querySelector('[data-channel-weight-range]');
                var number = row.querySelector('[data-channel-weight-number]');
                var legacy = row.dataset.legacyWeight === 'true';
                row.hidden = !active;
                slider.disabled = !active || legacy;
                number.disabled = !active;
                if (!active) return;
                hasLegacy = hasLegacy || legacy;
                var weight = numberValue(number, legacy);
                if (weight === null) {
                    valid = false;
                    return;
                }
                values[row.dataset.provider] = weight;
                total += weight;
            });
            hidden.value = valid ? JSON.stringify(values) : 'invalid';
            rows.forEach(function (row) {
                var output = row.querySelector('[data-channel-weight-percent]');
                var weight = values[row.dataset.provider];
                if (!weight || !valid || !total) {
                    output.textContent = '—';
                    return;
                }
                var percent = Math.round(weight * 1000 / total) / 10;
                output.textContent = percent + '%';
            });
            if (hint) {
                var count = Object.keys(values).length;
                hint.textContent = !valid ? '请输入 1 至 10 的整数权重。'
                        : hasLegacy ? '历史权重保留原值；输入 1 至 10 后可拖动滑块调整。'
                        : count === 1 ? '已选择一个通道，计划发送占比为 100%。'
                        : '拖动滑块或输入权重，按选中通道的相对权重分配批次。';
            }
            hidden.disabled = false;
        }

        rows.forEach(function (row) {
            var slider = row.querySelector('[data-channel-weight-range]');
            var number = row.querySelector('[data-channel-weight-number]');
            var stored = Number(row.dataset.defaultWeight);
            var initial = Number.isInteger(stored) && stored >= 1 && stored <= 100 ? stored : 1;
            var legacy = initial > 10;
            row.dataset.legacyWeight = legacy ? 'true' : 'false';
            slider.min = '1';
            slider.max = '10';
            number.min = '1';
            number.max = legacy ? '100' : '10';
            slider.value = String(Math.min(initial, 10));
            number.value = String(initial);
            slider.addEventListener('input', function () {
                number.value = slider.value;
                update();
            });
            number.addEventListener('input', function () {
                row.dataset.legacyWeight = 'false';
                number.max = '10';
                var value = numberValue(number, false);
                if (value !== null) slider.value = String(value);
                update();
            });
        });
        checks.forEach(function (check) { check.addEventListener('change', update); });
        form.addEventListener('submit', update);
        update();
    });
}());
