(function () {
    'use strict';

    var dialog = document.getElementById('template-action-dialog');
    if (!dialog) return;

    var title = dialog.querySelector('[data-template-action-title]');
    var message = dialog.querySelector('[data-template-action-message]');
    var progress = dialog.querySelector('[data-template-action-progress]');
    var progressLabel = progress.querySelector('span');
    var cancelButton = dialog.querySelector('[data-template-action-cancel]');
    var confirmButton = dialog.querySelector('[data-template-action-confirm]');
    var confirmIcon = confirmButton.querySelector('i');
    var confirmLabel = confirmButton.querySelector('span');
    var pendingForm = null;
    var submitting = false;

    function closeDialog() {
        if (submitting) return;
        pendingForm = null;
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
    }

    document.querySelectorAll('[data-template-action-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (submitting) return;
            pendingForm = form;
            title.textContent = form.dataset.actionTitle || '确认执行';
            message.textContent = form.dataset.actionMessage || '确认继续执行此操作？';
            progress.hidden = true;
            progressLabel.textContent = '';
            cancelButton.disabled = false;
            confirmButton.disabled = false;
            confirmButton.removeAttribute('aria-busy');
            confirmIcon.className = 'fa fa-check';
            confirmLabel.textContent = '确认执行';
            dialog.classList.remove('is-pending');
            dialog.classList.toggle('is-delete',
                    form.querySelector('[name="action"]').value === 'delete');
            if (typeof dialog.showModal === 'function') dialog.showModal();
            else dialog.setAttribute('open', 'open');
        });
    });

    cancelButton.addEventListener('click', closeDialog);
    dialog.addEventListener('cancel', function (event) {
        if (submitting) {
            event.preventDefault();
            return;
        }
        pendingForm = null;
    });

    confirmButton.addEventListener('click', function () {
        if (!pendingForm || submitting) return;
        submitting = true;
        if (pendingForm.querySelector('[name="action"]').value === 'discard-draft') {
            window.dispatchEvent(new Event('template-draft-discard-confirmed'));
        }
        dialog.classList.add('is-pending');
        dialog.setAttribute('aria-busy', 'true');
        cancelButton.disabled = true;
        confirmButton.disabled = true;
        confirmButton.setAttribute('aria-busy', 'true');
        confirmIcon.className = 'fa fa-spinner fa-spin';
        confirmLabel.textContent = pendingForm.dataset.actionProgress || '正在处理';
        progressLabel.textContent = (pendingForm.dataset.actionProgress || '正在处理') + '，请稍候';
        progress.hidden = false;
        window.setTimeout(function () {
            pendingForm.submit();
        }, 80);
    });
}());
