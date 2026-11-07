(function () {
    'use strict';

    var form = document.getElementById('userPanel');
    var faceButton = document.getElementById('faceLoginButton');
    var qrButton = document.getElementById('qrLoginButton');
    if (!form || !faceButton || !qrButton) return;

    var domain = document.getElementById('domain');
    var authcode = document.getElementById('authcode');
    var agreement = document.getElementById('agreement');
    var agreementError = document.getElementById('agreementError');
    var authcodeError = document.getElementById('authcodeError');
    var alternativeMessage = document.getElementById('alternativeLoginMessage');
    var loginType = document.getElementById('logintype');
    var facePic = document.getElementById('FacePic');
    var faceDialog = document.getElementById('faceLoginDialog');
    var faceStatus = document.getElementById('faceLoginStatus');
    var qrDialog = document.getElementById('qrLoginDialog');
    var qrStatus = document.getElementById('qrLoginStatus');
    var qrHost = document.getElementById('qrLoginCode');
    var appId = form.dataset.appId || '';
    var clientType = form.dataset.clientType || 'scantologin';
    var scanConfigUrl = form.dataset.scanConfigUrl || '';
    var scanCompleteUrl = form.dataset.scanCompleteUrl || '';
    var scanSocket = null;
    var scanCompleting = false;
    var faceSubmitting = false;

    function setAlternativeMessage(message, danger) {
        alternativeMessage.textContent = message || '';
        alternativeMessage.style.color = danger ? 'var(--danger)' : '';
    }

    function validateAgreement() {
        var valid = agreement.checked;
        agreement.setAttribute('aria-invalid', valid ? 'false' : 'true');
        agreementError.textContent = valid ? '' : '请先阅读并同意用户协议和隐私政策';
        return valid;
    }

    function validateFaceInputs() {
        var captcha = authcode.value.trim();
        authcode.setAttribute('aria-invalid', captcha ? 'false' : 'true');
        authcodeError.textContent = captcha ? '' : '刷脸登录前请输入验证码';
        return Boolean(captcha) && validateAgreement();
    }

    function showAlternativeSubmitting(label) {
        var submit = form.querySelector('.submit-button');
        submit.disabled = true;
        submit.innerHTML = '<span class="button-spinner" aria-hidden="true"></span><span>'
                + label + '</span>';
        faceButton.disabled = true;
        qrButton.disabled = true;
    }

    function setModeAvailability(modes) {
        var values = String(modes || '').split(',').map(function (value) {
            return value.trim();
        });
        var faceEnabled = values.indexOf('6') !== -1;
        var qrEnabled = values.indexOf('5') !== -1;
        faceButton.disabled = !faceEnabled;
        qrButton.disabled = !qrEnabled;
        faceButton.title = faceEnabled ? '' : '当前单位未启用刷脸登录';
        qrButton.title = qrEnabled ? '' : '当前单位未启用扫码登录';
        if (!faceEnabled && !qrEnabled) {
            setAlternativeMessage('当前单位未启用刷脸或扫码登录', false);
        } else {
            setAlternativeMessage('', false);
        }
    }

    function refreshLoginModes() {
        if (!domain || !domain.value) {
            setAlternativeMessage('未找到可用的登录单位', true);
            return;
        }
        faceButton.disabled = true;
        qrButton.disabled = true;
        fetch('org/getdomaininfo?domainid=' + encodeURIComponent(domain.value), {
            method: 'GET',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest'}
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function (payload) {
            setModeAvailability(payload.logintype);
        }).catch(function () {
            setAlternativeMessage('暂时无法读取统一认证方式，请稍后刷新重试', true);
        });
    }

    function stopFaceLogin() {
        if (typeof window.stopFaceLoginTracker === 'function') {
            window.stopFaceLoginTracker();
        }
    }

    function closeFaceDialog() {
        stopFaceLogin();
        if (faceDialog.open) faceDialog.close();
    }

    function resetFaceMode() {
        if (faceSubmitting) return;
        loginType.value = '0';
        facePic.value = '';
        document.getElementById('user').disabled = false;
        document.getElementById('encryptedPass').disabled = false;
    }

    function captureFace() {
        var video = document.getElementById('video2');
        var canvas = document.getElementById('faceCaptureCanvas');
        if (!video || !canvas || video.videoWidth <= 0 || video.videoHeight <= 0) {
            throw new Error('摄像头画面尚未准备完成');
        }
        var width = 320;
        var height = Math.round(video.videoHeight / (video.videoWidth / width));
        canvas.width = width;
        canvas.height = height;
        var context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, width, height);
        var encoded = canvas.toDataURL('image/jpeg').split(',')[1] || '';
        if (!encoded) throw new Error('无法采集人脸图像');
        facePic.value = encoded;
    }

    function startFaceLogin() {
        if (!validateFaceInputs()) return;
        if (typeof window.initFaceLoginTracker !== 'function'
                || typeof window.startFaceLoginTracker !== 'function') {
            setAlternativeMessage('人脸识别组件未加载，请刷新页面后重试', true);
            return;
        }
        faceSubmitting = false;
        loginType.value = '6';
        facePic.value = '';
        faceStatus.textContent = '正在启动摄像头...';
        faceDialog.showModal();
        window.initFaceLoginTracker({
            videoId: 'video2',
            overlayId: 'overlay',
            onPassed: function () {
                try {
                    captureFace();
                    faceSubmitting = true;
                    stopFaceLogin();
                    faceDialog.close();
                    document.getElementById('user').disabled = true;
                    document.getElementById('encryptedPass').disabled = true;
                    showAlternativeSubmitting('正在进行人脸认证...');
                    form.submit();
                } catch (failure) {
                    faceStatus.textContent = failure.message || '人脸图像采集失败，请重试';
                }
            },
            onError: function (failure) {
                faceStatus.textContent = failure && failure.message
                        ? failure.message : '无法访问摄像头，请检查浏览器权限';
            }
        });
        if (typeof window.primeFaceLoginAudio === 'function') {
            window.primeFaceLoginAudio();
        }
        window.startFaceLoginTracker();
    }

    function createClientId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID().replace(/-/g, '');
        }
        var chars = '0123456789abcdef';
        var result = '';
        for (var index = 0; index < 32; index += 1) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    function closeScanSocket() {
        if (scanSocket) {
            scanSocket.onclose = null;
            scanSocket.close();
            scanSocket = null;
        }
        scanCompleting = false;
    }

    function closeQrDialog() {
        closeScanSocket();
        qrHost.innerHTML = '';
        if (qrDialog.open) qrDialog.close();
    }

    function completeScanLogin(token) {
        if (scanCompleting || !scanCompleteUrl) return;
        scanCompleting = true;
        qrStatus.textContent = '手机端已确认，正在完成登录...';
        fetch(scanCompleteUrl, {
            method: 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams({scanToken: token})
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function (payload) {
            if (payload.state !== 'success' || !payload.redirectTo) {
                throw new Error(payload.message || '扫码登录失败');
            }
            closeScanSocket();
            window.location.assign(payload.redirectTo);
        }).catch(function (failure) {
            scanCompleting = false;
            qrStatus.textContent = failure.message || '扫码登录失败，请关闭后重试';
        });
    }

    function handleScanMessage(message) {
        if (message === 'REQHB') {
            if (scanSocket) scanSocket.send('RESHB');
            return;
        }
        var payload;
        try {
            payload = JSON.parse(decodeURI(message));
        } catch (ignored) {
            return;
        }
        if (payload.state !== 'success' || payload.type !== 'scantologin') return;
        var token = String(payload.token || '');
        if (!token || token === 'cancel') {
            qrStatus.textContent = '手机端已取消登录，请关闭后重试';
        } else if (token === 'scaned') {
            qrStatus.textContent = '已扫描，等待' + (payload.user || '用户') + '在手机端确认登录';
        } else {
            completeScanLogin(token);
        }
    }

    function loadScanConfig() {
        if (!scanConfigUrl) {
            return Promise.resolve({
                state: 'success',
                ws: form.dataset.wsUrl,
                wss: form.dataset.wssUrl,
                clientType: clientType
            });
        }
        return fetch(scanConfigUrl, {
            method: 'GET',
            headers: {'Accept': 'application/json'},
            credentials: 'same-origin'
        }).then(function (response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        });
    }

    function connectQrSocket(config, clientId) {
        var socketUrl = config.wss || (window.location.protocol === 'http:' ? config.ws : '');
        if (!socketUrl) {
            qrStatus.textContent = '统一认证消息服务未配置';
            return;
        }
        clientType = config.clientType || clientType;
        try {
            scanSocket = new WebSocket(socketUrl);
        } catch (failure) {
            qrStatus.textContent = '无法连接统一认证消息服务';
            return;
        }
        scanSocket.onopen = function () {
            scanSocket.send(JSON.stringify({
                clienttypeid: clientType,
                clientid: clientId,
                clientna: 'clientna'
            }));
            scanSocket.send(JSON.stringify({type: 'xt'}));
            qrHost.innerHTML = '';
            var qrCode = new QRCode(qrHost, {width: 200, height: 200});
            qrCode.makeCode(clientId + appId);
            qrStatus.textContent = '请使用统一认证 APP 扫描二维码';
        };
        scanSocket.onmessage = function (event) {
            handleScanMessage(event.data);
        };
        scanSocket.onerror = function () {
            qrStatus.textContent = '统一认证消息服务连接失败，请稍后重试';
        };
        scanSocket.onclose = function () {
            if (!scanCompleting && qrDialog.open) {
                qrStatus.textContent = '扫码连接已断开，请关闭后重试';
            }
        };
    }

    function startQrLogin() {
        if (!validateAgreement()) return;
        if (!window.QRCode || !window.WebSocket || !appId) {
            setAlternativeMessage('扫码登录组件或应用配置不可用', true);
            return;
        }
        closeScanSocket();
        qrHost.innerHTML = '';
        qrStatus.textContent = '正在连接统一认证服务...';
        qrDialog.showModal();
        var clientId = createClientId();
        loadScanConfig().then(function (config) {
            if (!qrDialog.open) return;
            if (!config || config.state !== 'success') {
                qrStatus.textContent = config && config.message
                        ? config.message : '统一认证消息服务配置不可用';
                return;
            }
            connectQrSocket(config, clientId);
        }).catch(function () {
            if (qrDialog.open) {
                qrStatus.textContent = '无法加载统一认证消息服务配置，请稍后重试';
            }
        });
    }

    faceButton.addEventListener('click', startFaceLogin);
    qrButton.addEventListener('click', startQrLogin);
    document.querySelectorAll('[data-face-login-close]').forEach(function (button) {
        button.addEventListener('click', closeFaceDialog);
    });
    document.querySelectorAll('[data-qr-login-close]').forEach(function (button) {
        button.addEventListener('click', closeQrDialog);
    });
    faceDialog.addEventListener('cancel', function () {
        stopFaceLogin();
    });
    faceDialog.addEventListener('close', function () {
        stopFaceLogin();
        resetFaceMode();
    });
    qrDialog.addEventListener('cancel', function () {
        closeScanSocket();
        qrHost.innerHTML = '';
    });
    domain.addEventListener('change', refreshLoginModes);
    window.addEventListener('beforeunload', function () {
        stopFaceLogin();
        closeScanSocket();
    });
    refreshLoginModes();
}());
