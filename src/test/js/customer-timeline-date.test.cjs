const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function initialRequest(project, instant, browserZone, initialFrom = '', initialTo = '') {
    const oldZone = process.env.TZ;
    process.env.TZ = browserZone;
    try {
        const requests = [];
        const rootEvents = {};
        const form = {
            elements: { timelineFromDate: { value: initialFrom }, timelineToDate: { value: initialTo } },
            addEventListener() {}, querySelectorAll() { return []; }
        };
        const list = { querySelectorAll() { return []; } };
        const status = {};
        const error = {};
        const earlier = {};
        const historyEnd = {};
        const root = {
            dataset: { shop: 'shop.example', customerId: 'customer', timelineUrl: '/timeline' },
            classList: { toggle() {} },
            addEventListener(name, callback) { rootEvents[name] = callback; },
            querySelector(selector) {
                return {
                    '[data-timeline-window-list]': list,
                    '[data-timeline-status]': status,
                    '[data-timeline-error]': error,
                    '[data-timeline-load-earlier]': earlier,
                    '[data-timeline-history-end]': historyEnd,
                    '[data-timeline-date-form]': form
                }[selector];
            },
            querySelectorAll() { return []; }
        };
        class FixedDate extends Date {
            constructor(...args) { super(...(args.length ? args : [instant])); }
            static now() { return new Date(instant).getTime(); }
        }
        const script = fs.readFileSync(path.resolve(__dirname, '../../..',
            'src/main/resources/META-INF/resources/shopify/js/customer-timeline.js'), 'utf8');
        vm.runInNewContext(script, {
            Date: FixedDate, Intl, URLSearchParams,
            window: {}, document: { querySelectorAll() { return [root]; } },
            fetch(url) { requests.push(new URL(url, 'https://test.example')); return new Promise(() => {}); }
        });
        return { requests, rootEvents, form };
    } finally {
        if (oldZone === undefined) delete process.env.TZ;
        else process.env.TZ = oldZone;
    }
}

for (const project of ['public']) {
    for (const zone of ['America/Los_Angeles', 'Asia/Tokyo']) {
        for (const [instant, from, to] of [
            ['2026-11-04T15:59:59Z', '2026-10-06', '2026-11-04'],
            ['2026-11-04T16:00:00Z', '2026-10-07', '2026-11-05'],
            ['2026-11-04T23:59:59Z', '2026-10-07', '2026-11-05'],
            ['2026-11-05T00:00:00Z', '2026-10-07', '2026-11-05'],
            ['2025-12-31T16:00:00Z', '2025-12-03', '2026-01-01']
        ]) {
            test(`${project} requests Shanghai's last 30 calendar days at ${instant} in ${zone}`, () => {
                const { requests } = initialRequest(project, instant, zone);
                assert.equal(requests.length, 1);
                assert.equal(requests[0].searchParams.get('timelineFromDate'), from);
                assert.equal(requests[0].searchParams.get('timelineToDate'), to);
            });
        }
    }
    test(`${project} preserves an explicitly supplied date window`, () => {
        const { requests } = initialRequest(project, '2026-11-04T16:00:00Z', 'America/Los_Angeles',
            '2026-09-01', '2026-09-15');
        assert.equal(requests[0].searchParams.get('timelineFromDate'), '2026-09-01');
        assert.equal(requests[0].searchParams.get('timelineToDate'), '2026-09-15');
    });
    test(`${project} retains the selected end date when choosing a 90 day preset`, () => {
        const { requests, rootEvents } = initialRequest(project, '2026-11-04T16:00:00Z',
            'Asia/Tokyo', '2026-09-01', '2026-11-05');
        const preset = { dataset: { timelinePreset: '90' } };
        rootEvents.click({ target: { closest(selector) { return selector === '[data-timeline-preset]' ? preset : null; } } });
        assert.equal(requests[1].searchParams.get('timelineFromDate'), '2026-08-08');
        assert.equal(requests[1].searchParams.get('timelineToDate'), '2026-11-05');
    });
}
