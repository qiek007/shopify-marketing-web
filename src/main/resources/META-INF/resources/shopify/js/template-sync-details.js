(function () {
    'use strict';
    document.querySelectorAll('[data-sync-dialog-open]').forEach(function (button) {
        button.addEventListener('click', function () {
            var dialog = document.getElementById(button.dataset.syncDialogOpen);
            if (dialog && typeof dialog.showModal === 'function') dialog.showModal();
            var syncDialogLoaded = button.dataset.syncLoaded === 'true';
            if (syncDialogLoaded || button.dataset.syncLoading === 'true' || !dialog) return;
            var body = dialog.querySelector('[data-sync-dialog-body]');
            if (!body) return;
            button.dataset.syncLoading = 'true';
            body.innerHTML = '<div class="async-loading"><i class="fa fa-spinner fa-spin"></i><strong>正在加载同步状态</strong></div>';
            fetch(button.dataset.syncBindingsUrl, {
                credentials: 'same-origin', headers: { Accept: 'text/html' }
            }).then(function (response) {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            }).then(function (html) {
                body.innerHTML = html;
                var metadata = body.querySelector('[data-template-sync-summary]');
                if (metadata) {
                    var summary = button.querySelector('[data-sync-summary]');
                    var count = button.querySelector('[data-sync-count]');
                    if (summary) {
                        summary.className = 'status-pill ' + metadata.dataset.templateSyncClass;
                        summary.textContent = metadata.dataset.templateSyncSummary;
                    }
                    if (count) count.textContent = metadata.dataset.templateSyncCount + ' 个通道';
                }
                button.dataset.syncLoaded = 'true';
            }).catch(function () {
                body.innerHTML = '<div class="empty-state compact"><strong>同步状态加载失败</strong><span>关闭后可重新打开重试。</span></div>';
            }).finally(function () {
                button.dataset.syncLoading = 'false';
            });
        });
    });
    document.querySelectorAll('[data-sync-dialog-close]').forEach(function (button) {
        button.addEventListener('click', function () { button.closest('dialog').close(); });
    });
}());
