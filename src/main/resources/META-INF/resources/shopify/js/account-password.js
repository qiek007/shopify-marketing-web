(function () {
    'use strict';

    var passwordChangePending = false;

    function initialize() {
        var trigger = document.getElementById('merchant-password-trigger');
        var template = document.getElementById('merchant-password-template');
        if (!trigger || !template) {
            return;
        }
        trigger.addEventListener('click', function () {
            if (!window.layer || typeof window.layer.open !== 'function') {
                window.alert('密码修改组件暂时不可用');
                return;
            }
            var layerIndex = window.layer.open({
                type: 1,
                title: '修改密码',
                content: template.innerHTML,
                area: ['500px', '430px'],
                resize: false,
                shadeClose: false,
                cancel: function () {
                    return !passwordChangePending;
                },
                end: function () {
                    passwordChangePending = false;
                    trigger.setAttribute('aria-expanded', 'false');
                    trigger.focus();
                },
                success: function (layerElement) {
                    var root = layerElement[0];
                    var form = root.querySelector('.merchant-password-form');
                    var feedback = root.querySelector('[data-password-feedback]');
                    var cancel = root.querySelector('[data-password-cancel]');
                    var submit = form.querySelector('[type="submit"]');
                    var oldPassword = form.querySelector('[name="oldPassword"]');
                    trigger.setAttribute('aria-expanded', 'true');
                    oldPassword.focus();

                    cancel.addEventListener('click', function () {
                        if (!passwordChangePending) {
                            form.reset();
                            window.layer.close(layerIndex);
                        }
                    });
                    form.addEventListener('submit', function (event) {
                        event.preventDefault();
                        if (passwordChangePending) {
                            return;
                        }
                        feedback.classList.remove('success');
                        feedback.textContent = '';
                        var data = new FormData(form);
                        if (data.get('newPassword') !== data.get('confirmPassword')) {
                            feedback.textContent = '两次输入的新密码不一致';
                            return;
                        }

                        passwordChangePending = true;
                        submit.disabled = true;
                        cancel.disabled = true;
                        var completed = false;
                        fetch(trigger.dataset.passwordUrl, {
                            method: 'POST',
                            credentials: 'same-origin',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                'X-Requested-With': 'XMLHttpRequest'
                            },
                            body: new URLSearchParams(data).toString()
                        }).then(function (response) {
                            if (response.status === 401) {
                                throw new Error('SESSION_EXPIRED');
                            }
                            if (!response.ok) {
                                throw new Error('HTTP ' + response.status);
                            }
                            return response.json();
                        }).then(function (result) {
                            if (result.state === 'success') {
                                completed = true;
                                feedback.classList.add('success');
                                feedback.textContent = result.message || '密码修改成功';
                                form.reset();
                                window.setTimeout(function () {
                                    window.layer.close(layerIndex);
                                }, 700);
                                return;
                            }
                            feedback.textContent = result.message || '密码修改失败';
                            oldPassword.value = '';
                        }).catch(function (error) {
                            feedback.textContent = error.message === 'SESSION_EXPIRED'
                                ? '登录状态已失效，请重新登录'
                                : '密码修改服务暂时不可用';
                            oldPassword.value = '';
                        }).finally(function () {
                            passwordChangePending = false;
                            if (!completed) {
                                submit.disabled = false;
                                cancel.disabled = false;
                            }
                        });
                    });
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
