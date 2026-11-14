(function () {
    'use strict';
    var root = document.getElementById('campaign-segment-picker');
    var select = document.getElementById('campaign-segment');
    if (root && select && window.CampaignSearchPicker) {
        window.CampaignSearchPicker.create(root, select, {
            includeEmpty: true, delay: 80,
            load: function () {},
            match: function (option, query) {
                return !query || !option.value || option.textContent.toLocaleLowerCase().includes(query.toLocaleLowerCase());
            }
        });
    }
    var templateRoot = document.getElementById('campaign-template-picker');
    var templateSelect = document.getElementById('campaign-template');
    if (templateRoot && templateSelect && templateSelect.options.length && window.CampaignSearchPicker) {
        window.CampaignSearchPicker.create(templateRoot, templateSelect, {
            includeEmpty: true, delay: 80,
            load: function () {},
            match: function (option, query) {
                return !query || option.textContent.toLocaleLowerCase().includes(query.toLocaleLowerCase());
            }
        });
    }
    document.querySelectorAll('.campaign-audience-tags .customer-tag-select:not(#campaign-segment-multi)').forEach(function (picker) {
        var input = picker.querySelector('[data-tag-search]');
        var empty = picker.querySelector('[data-tag-search-empty]');
        var labels = Array.prototype.slice.call(picker.querySelectorAll('.customer-tag-options > label'));
        if (!input || !empty) return;
        input.addEventListener('input', function () {
            var query = input.value.trim().toLocaleLowerCase();
            var count = 0;
            labels.forEach(function (label) {
                var match = !query || label.textContent.toLocaleLowerCase().includes(query);
                label.hidden = !match;
                if (match) count++;
            });
            empty.hidden = count !== 0;
        });
        input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') event.preventDefault();
        });
    });
}());