(function () {
    'use strict';

    var grantForm = document.querySelector('[data-store-member-grant]');
    var pickerButton = document.querySelector('[data-center-user-picker]');
    var pickerConfig = document.querySelector('[data-center-user-picker-config]');
    var selectedMember = document.querySelector('[data-center-user-selection]');
    var roleDialog = document.getElementById('store-member-role-dialog');

    function notify(message) {
        if (window.layer && typeof window.layer.msg === 'function') {
            window.layer.msg(message);
            return;
        }
        window.alert(message);
    }

    function openDialog(dialog) {
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', 'open');
        }
    }

    function closeDialog(dialog) {
        if (typeof dialog.close === 'function') {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    if (grantForm && pickerButton && pickerConfig) {
        window.openwindow = window;
        window.openvalue = [];
        window.seltype = '[PERSON]';
        window.org_selected = function (items) {
            if (!Array.isArray(items) || items.length !== 1 || items[0].type !== '[PERSON]') {
                notify('请选择一位中心组织成员');
                return;
            }
            var userId = items[0].id || '';
            var userName = (items[0].name || '').replace(/^\[人员\]/, '');
            grantForm.querySelector('[data-center-user-id]').value = userId;
            grantForm.querySelector('[data-center-user-name]').value = userName;
            selectedMember.textContent = userName ? userName + ' · ' + userId : userId;
            selectedMember.classList.add('is-selected');
        };
        pickerButton.addEventListener('click', function () {
            window.openvalue = [];
            if (!window.layer || typeof window.layer.open !== 'function') {
                notify('组织机构选择窗口加载失败，请刷新后重试');
                return;
            }
            window.layer.open({
                type: 2,
                title: '选择中心组织成员',
                content: pickerConfig.dataset.url,
                area: [Math.min(900, window.innerWidth - 24) + 'px',
                    Math.min(700, window.innerHeight - 24) + 'px'],
                maxmin: true
            });
        });
        grantForm.addEventListener('submit', function (event) {
            if (!grantForm.querySelector('[data-center-user-id]').value.trim()) {
                event.preventDefault();
                notify('请先从组织机构选择成员');
            }
        });
    }

    if (!roleDialog) return;
    var roleForm = roleDialog.querySelector('[data-member-role-form]');
    var roleSelect = roleDialog.querySelector('[data-member-role-select]');
    var roleUserId = roleDialog.querySelector('[data-member-role-user-id]');
    var roleUserNameInput = roleDialog.querySelector('[data-member-role-user-name-input]');
    var roleUserName = roleDialog.querySelector('[data-member-role-user-name]');

    document.querySelectorAll('[data-member-role-open]').forEach(function (button) {
        button.addEventListener('click', function () {
            roleUserId.value = button.dataset.userId || '';
            roleUserNameInput.value = button.dataset.userName || '';
            roleUserName.textContent = button.dataset.userName || button.dataset.userId || '该成员';
            roleSelect.value = button.dataset.role || 'ANALYST';
            openDialog(roleDialog);
            roleSelect.focus();
        });
    });
    roleDialog.querySelectorAll('[data-member-role-close]').forEach(function (button) {
        button.addEventListener('click', function () {
            closeDialog(roleDialog);
        });
    });
    roleDialog.addEventListener('click', function (event) {
        if (event.target === roleDialog) closeDialog(roleDialog);
    });
    roleForm.addEventListener('submit', function (event) {
        if (!roleUserId.value.trim()) {
            event.preventDefault();
            closeDialog(roleDialog);
            notify('未找到要修改的成员');
        }
    });
}());
