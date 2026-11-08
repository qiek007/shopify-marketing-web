(function () {
    'use strict';
    document.querySelectorAll('[data-hot-cleanup]').forEach(function (panel) {
        var button = panel.querySelector('[data-hot-cleanup-preview]');
        var message = panel.querySelector('[data-hot-cleanup-message]');
        function url(suffix) {
            var result = new URL(panel.dataset.base + suffix, window.location.href);
            result.searchParams.set('shop', panel.dataset.shop);
            result.searchParams.set('campaignId', panel.dataset.campaign);
            return result;
        }
        async function read(response) {
            var body;
            try { body = await response.json(); } catch (_) { throw new Error('服务响应异常，请刷新后重试'); }
            if (!response.ok) throw new Error(body.message || '操作未完成，请重新预检');
            return body;
        }
        button.addEventListener('click', async function () {
            button.disabled = true;
            message.textContent = '正在核对归档和热数据…';
            try {
                var response = await fetch(url('/preview'), {credentials:'same-origin', cache:'no-store'});
                var review = await read(response);
                var csrf = response.headers.get('X-Hot-Cleanup-Csrf');
                if (!csrf || !review.fingerprint) throw new Error('预检信息不完整，请刷新后重试');
                var warning = '任务记录：' + review.expected + ' 条；当前归档来源：' + review.observed
                    + ' 条；待清理热明细：' + review.hotCount
                    + ' 条。\n核验情况：' + (review.explanation || '尚未确认')
                    + (review.verifiedAt ? '；上次核验：' + new Date(review.verifiedAt).toLocaleString('zh-CN',{hour12:false}) : '')
                    + '\n\n核验存在差异，清理后可能无法从热数据恢复缺失明细。确认授权后台清理吗？';
                if (!window.confirm(warning)) { message.textContent = '已取消，热数据将继续保留。'; return; }
                var form = new URLSearchParams();
                form.set('fingerprint', review.fingerprint);
                await read(await fetch(url(''), {method:'POST', credentials:'same-origin', cache:'no-store',
                    headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8','X-Hot-Cleanup-Csrf':csrf},
                    body:form.toString()}));
                message.textContent = '已记录管理员确认，后台将在满足清理依赖后执行。';
            } catch (error) {
                message.textContent = error.message || '预检失败，请稍后重试。';
            } finally { button.disabled = false; }
        });
    });
}());
