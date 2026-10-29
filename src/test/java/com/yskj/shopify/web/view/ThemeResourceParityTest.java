package com.yskj.shopify.web.view;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class ThemeResourceParityTest {

    private static final Path ROOT = Path.of("src/main/resources/META-INF/resources");

    @Test
    void classicCampaignEditorSubmitsSavedDraftsForApprovalAndGuardsUnsavedChanges()
            throws Exception {
        String source = Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-editor.jsp"));

        assertThat(source).contains(
                "data-campaign-editor-form",
                "${canManageCampaigns and editorCampaign.existing and editorCampaign.status eq 'DRAFT'}",
                "id=\"campaign-approval-form\"",
                "action=\"${ctx}/campaigns/action\"",
                "name=\"action\" value=\"SUBMIT\"",
                "data-campaign-approval-submit",
                "活动内容已有修改，请先保存活动后再提交审批",
                "campaignApprovalForm.requestSubmit()");
    }

    @Test
    void classicCampaignEditorRefreshesTestSendHistoryWithoutReloadingTheForm()
            throws Exception {
        String source = Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-editor.jsp"));
        String styles = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));

        assertThat(source).contains(
                "dashboard.css?v=20261016-campaign-editor-actions",
                "class=\"campaign-test-history-heading\"",
                "data-campaign-test-history-refresh",
                "data-campaign-test-history-content",
                "data-campaign-test-history-refresh-status",
                "fetch(window.location.href",
                "new DOMParser()",
                "正在刷新测试邮件状态…",
                "测试邮件状态已更新",
                "刷新失败，请稍后重试")
                .doesNotContain("window.location.reload()");
        assertThat(styles).contains(
                ".campaign-test-history-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }",
                ".campaign-test-history-heading > strong",
                ".campaign-test-history-heading > .form-actions");
    }

    @Test
    void carriesIndependentCompleteCopiesOfBothThemesAndLogin() throws Exception {
        Set<String> classic = views("shopify");
        Set<String> theme2 = views("shopify-theme2");

        assertThat(classic).hasSize(41).containsExactlyInAnyOrderElementsOf(theme2)
                .contains(Path.of("fragments","sender-domain-verification.jspf").toString());
        assertThat(ROOT.resolve("WEB-INF/org/index.jsp")).exists();
        assertThat(ROOT.resolve("shopify/css/dashboard.css")).exists();
        assertThat(ROOT.resolve("shopify-theme2/css/dashboard.css")).exists();
        assertThat(ROOT.resolve("shopify/js/session-keepalive.js")).exists();
    }

    @Test
    void campaignDetailSeparatesUnknownDeliveryResultsFromFailures() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("campaign-detail.jsp"));

            assertThat(page).contains(
                    "${campaignDetail.summary.unknown}",
                    "summary.unknown + ' 结果未知'");
        }
    }

    @Test
    void classicCampaignDetailShowsDeliveryRateAndRiskCategoryCountsOnLoadAndRefresh()
            throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-detail.jsp"));

        assertThat(page).contains(
                "id=\"campaign-delivery-rate\"",
                "campaignDetail.summary.accepted gt 0 ? campaignDetail.summary.delivered * 100.0 / campaignDetail.summary.accepted : 0",
                "id=\"campaign-risk-note\">退信 <c:out value=\"${campaignDetail.summary.bounced}\"/>",
                "function deliveryRate(delivered, accepted)",
                "setText('campaign-delivery-rate', '送达率 ' + deliveryRate(summary.delivered, summary.accepted)",
                "setText('campaign-risk-note', '退信 ' + summary.bounced + ' / 投诉 '");
    }

    @Test
    void classicCampaignDetailPreviewsAudienceOnlyBeforeApproval() throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-detail.jsp"));
        String styles = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));

        assertThat(page).contains(
                "canManageCampaigns && canViewCustomers",
                "campaignDetail.status eq 'DRAFT' or campaignDetail.status eq 'PENDING_APPROVAL'",
                "data-campaign-audience-preview-open",
                "data-campaign-audience-preview-dialog",
                "data-campaign-audience-preview-total",
                "data-campaign-audience-preview-rows",
                "data-campaign-audience-preview-previous",
                "data-campaign-audience-preview-next",
                "data-campaign-audience-preview-retry",
                "/campaigns/detail/audience-preview",
                "size: '50'",
                "cache: 'no-store'",
                "payload.message || '无法加载客户预览",
                "这是当前时点预览，正式批准时会按最新客户数据重新冻结");
        assertThat(styles).contains(
                ".campaign-audience-preview-button",
                ".campaign-audience-preview-dialog",
                ".campaign-audience-preview-pagination");
    }

    @Test
    void classicCampaignDetailOnlyShowsExecutionRefreshAfterExecutionStarts() throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-detail.jsp"));

        assertThat(page).contains(
                "var=\"showExecutionRefresh\"",
                "campaignDetail.status eq 'QUEUED'",
                "campaignDetail.status eq 'RUNNING'",
                "campaignDetail.status eq 'PAUSED'",
                "campaignDetail.status eq 'COMPLETED'",
                "campaignDetail.status eq 'CANCELLED'",
                "campaignDetail.status eq 'FAILED'",
                "<c:if test=\"${showExecutionRefresh}\">",
                "id=\"campaign-detail-refresh\"",
                "var campaignProgressUrl = '${campaignProgressUrl}'",
                "fetch(campaignProgressUrl",
                "if (campaignSnapshotRefresh) campaignSnapshotRefresh.addEventListener");
    }

    @Test
    void classicCampaignDetailShowsTestSendHistoryWithoutOfferingTestSending() throws Exception {
        Path root = ROOT.resolve("WEB-INF/shopify");
        String detail = Files.readString(root.resolve("campaign-detail.jsp"));
        String editor = Files.readString(root.resolve("campaign-editor.jsp"));
        String styles = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));

        assertThat(detail).contains("campaignTestSendHistory", "测试邮件明细",
                        "仅可在编辑活动时发送测试邮件", "暂无测试邮件记录",
                        "<details class=\"campaign-test-history-details\">",
                        "<summary class=\"section-heading\">")
                .doesNotContain("#campaign-test-send", "fa-flask",
                        "action=\"${ctx}/campaigns/test-send\"", "name=\"recipients\"",
                        "<details class=\"campaign-test-history-details\" open>");
        assertThat(editor).contains("id=\"campaign-test-send\"",
                "action=\"${ctx}/campaigns/test-send\"", "name=\"recipients\"");
        assertThat(styles).contains(".campaign-test-history-details > summary",
                ".campaign-test-history-details[open] > summary > i");
    }

    @Test
    void loginKeepsAgreementChoiceWithoutRememberingThePassword() throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/org/index.jsp"));

        assertThat(page).contains(
                "const agreementStorageKey = 'dida.login.agreement.accepted.v1'",
                "window.localStorage.getItem(agreementStorageKey) === 'true'",
                "window.localStorage.setItem(agreementStorageKey, agreement.checked ? 'true' : 'false')",
                "id=\"encryptedPass\" name=\"pass\" type=\"hidden\"",
                "encryptedPass.value = CryptoJS.AES.encrypt(rawPassword",
                "pass.value = ''")
                .doesNotContain("pass.value = CryptoJS.AES.encrypt");
    }

    @Test
    void loginDisplaysDraftedUserAgreementAndPrivacyPolicyInAccessibleDialogs() throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/org/index.jsp"));

        assertThat(page).contains(
                "data-policy-open=\"user-agreement-dialog\"",
                "data-policy-open=\"privacy-policy-dialog\"",
                "<dialog class=\"policy-dialog\" id=\"user-agreement-dialog\"",
                "<dialog class=\"policy-dialog\" id=\"privacy-policy-dialog\"",
                "《滴答互动用户协议》",
                "账号注册与使用",
                "营销内容与客户数据责任",
                "《滴答互动隐私政策》",
                "我们处理的信息",
                "您的个人信息权利",
                "data-policy-close");
    }

    @Test
    void classicCustomerImportAddsValidationWithoutChangingTheme2Layout() throws Exception {
        String classic = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));
        String theme2 = Files.readString(ROOT.resolve("shopify-theme2/css/dashboard.css"));

        assertThat(classic).contains(
                ".customer-import-fields { grid-template-columns: minmax(220px, 1.1fr) minmax(235px, 1.1fr) minmax(210px, 1fr) minmax(280px, 1.35fr) auto;",
                "@media (max-width: 1320px) { .customer-import-fields { grid-template-columns: repeat(2, minmax(0, 1fr));");
        assertThat(theme2).contains(
                ".customer-import-fields { grid-template-columns: minmax(240px, 1.15fr) minmax(280px, 1.2fr) minmax(260px, 1.45fr) auto;");
    }

    @Test
    void customerImportTemplateDownloadProvidesVisibleAccessibleFeedback() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("customer-imports.jsp"));

            assertThat(page).contains(
                    "data-template-download",
                    "data-template-download-status",
                    "role=\"status\"",
                    "aria-live=\"polite\"",
                    "正在下载导入模板…",
                    "下载已开始，请查看浏览器下载记录",
                    "templateDownload.addEventListener('click'");
        }
    }

    @Test
    void customerImportSubmissionImmediatelyShowsProgressAndPreventsDoubleSubmit()
            throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("customer-imports.jsp"));

            assertThat(page).contains(
                    "data-customer-import-form",
                    "data-customer-import-submit",
                    "data-customer-import-submit-status",
                    "aria-live=\"polite\"",
                    "正在上传并创建导入任务…",
                    "customerImportForm.addEventListener('submit'",
                    "customerImportSubmit.disabled=true",
                    "customerImportSubmit.setAttribute('aria-busy','true')");
        }
    }

    @Test
    void customerImportResultDownloadLivesInTheMatchingRecordActionCell() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("customer-imports.jsp"));

            int actionCellStart = page.indexOf("<td data-import-job-actions>");
            int actionCellEnd = page.indexOf("</td>", actionCellStart);
            int downloadLink = page.indexOf("data-import-result-download");

            assertThat(actionCellStart).isGreaterThanOrEqualTo(0);
            assertThat(actionCellEnd).isGreaterThan(actionCellStart);
            assertThat(downloadLink).isBetween(actionCellStart, actionCellEnd);
            assertThat(page).contains(">下载结果</a>")
                    .doesNotContain("<h2>可下载结果</h2>");
        }
    }

    @Test
    void classicCustomerImportShowsResultGenerationStateAndFailureReason() throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/shopify/customer-imports.jsp"));

        assertThat(page).contains(
                "job.resultStatus eq 'PENDING'", "job.resultStatus eq 'GENERATING'",
                "job.resultStatus eq 'FAILED'", "job.resultError",
                "结果生成中", "结果生成失败");
    }

    @Test
    void classicCustomerImportCanRequestMailgunEmailValidation() throws Exception {
        String page = Files.readString(ROOT.resolve("WEB-INF/shopify/customer-imports.jsp"));

        assertThat(page).contains(
                "name=\"validateEmails\"",
                "客户邮件验证",
                "不可投递或高风险邮件不会导入",
                "Mailgun");
    }

    @Test
    void classicImportAndTemplateTablesConstrainWideColumnsAndKeepActionsInline() throws Exception {
        String imports = Files.readString(ROOT.resolve("WEB-INF/shopify/customer-imports.jsp"));
        String templates = Files.readString(ROOT.resolve("WEB-INF/shopify/templates.jsp"));
        String styles = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));

        assertThat(imports).contains("dashboard.css?v=20261018-import-email-validation",
                "customer-import-history-table");
        assertThat(templates).contains("dashboard.css?v=20261020-template-list-actions",
                "template-list-table", "template-subject-cell",
                "template-list-actions");
        assertThat(styles).contains(
                ".customer-import-history-table { width: 100%; table-layout: fixed;",
                ".customer-import-history-table th:nth-child(1)",
                ".customer-import-history-table th:nth-child(2)",
                ".template-list-table { width: 100%; table-layout: fixed;",
                ".template-subject-cell",
                ".table-actions.template-list-actions { width: max-content; flex-wrap: nowrap; gap: 6px; }");
    }

    @Test
    void classicReportChartsShowNearestPointValuesOnPointerHover() throws Exception {
        String reports = Files.readString(ROOT.resolve("WEB-INF/shopify/reports.jsp"));
        String script = Files.readString(ROOT.resolve("shopify/js/reports-analytics.js"));
        String styles = Files.readString(ROOT.resolve("shopify/css/reports-analytics.css"));

        assertThat(reports).contains("reports-analytics.css?v=20261015-chart-tooltip",
                "reports-analytics.js?v=20261015-chart-tooltip-follow", "data-report-chart-tooltip");
        assertThat(script).contains(
                "function bindTooltip", "pointermove", "nearestPointIndex",
                "邮件发送", "送达", "打开", "点击");
        assertThat(styles).contains(".report-chart-tooltip");
    }
    @Test
    void classicDashboardTrendTooltipFollowsPointerVertically() throws Exception {
        String dashboard = Files.readString(ROOT.resolve("WEB-INF/shopify/dashboard.jsp"));
        String script = Files.readString(ROOT.resolve("shopify/js/dashboard-trend.js"));

        assertThat(dashboard).contains("dashboard-trend.js?v=20261015-tooltip-follow");
        assertThat(script).contains(
                "event.clientY - visual.getBoundingClientRect().top + 14",
                "visual.clientHeight - tooltip.offsetHeight - 8")
                .doesNotContain("tooltip.style.top = '14px'");
    }
    @Test
    void progressiveNavigationFallbackNeverLeavesTheMainAreaDisabled() throws Exception {
        String script = Files.readString(ROOT.resolve("shopify/js/console-navigation.js"));
        String searchStyles = Files.readString(ROOT.resolve("shopify/css/shop-switcher.css"));
        int catchStart = script.indexOf("}).catch(function (error) {");
        int finallyStart = script.indexOf("}).finally(function () {", catchStart);

        assertThat(catchStart).isGreaterThanOrEqualTo(0);
        assertThat(finallyStart).isGreaterThan(catchStart);
        assertThat(script.substring(catchStart, finallyStart))
                .contains("setBusy(false);", "window.location.assign(url);");
        assertThat(script).contains(
                "navigationFallbackTimer = window.setTimeout",
                "window.clearTimeout(navigationFallbackTimer)",
                "data-shop-switcher-search", "option.hidden", "option.value",
                "window.localStorage.setItem", "window.localStorage.getItem",
                "searchParams.has('shop')", "visibleOptions.length === 1");
        assertThat(searchStyles).contains(
                ".shop-switcher-search",
                ".shop-switcher-search:focus",
                "width: min(210px, 22vw)");
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String header = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("fragments/header.jspf"));
            assertThat(header).contains(
                    "console-navigation.js?v=20261020-shop-search",
                    "${uiAssetBase}/css/shop-switcher.css?v=20261020-shop-search-icon",
                    "data-shop-switcher-search",
                    "placeholder=\"搜索店铺名称或域名\"",
                    "data-shop-storage-key=\"shopify:last-shop:",
                    "data-shop-name=\"<c:out value='${shopItem.displayName}'/>");
        }
    }

    @Test
    void shopSearchUsesAMagnifyingGlassIcon() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String header = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("fragments/header.jspf"));
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/shop-switcher.css"));

            assertThat(header).contains(
                    "class=\"shop-switcher-search-wrap\"",
                    "class=\"fa fa-search shop-switcher-search-icon\" aria-hidden=\"true\"",
                    "shop-switcher.css?v=20261020-shop-search-icon");
            assertThat(styles).contains(
                    ".shop-switcher-search-wrap {",
                    ".shop-switcher-search-icon {",
                    "pointer-events: none",
                    "padding: 0 10px 0 32px",
                    "background: #fff")
                    .doesNotContain("linear-gradient(45deg");
        }
    }

    @Test
    void classicCampaignDetailShowsFrozenAudienceConditions() throws Exception {
        String detail = Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-detail.jsp"));
        String styles = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));

        assertThat(detail).contains(
                "目标受众", "dashboard.css?v=20261023-readable-recipients",
                "campaignDetail.audienceSourceDisplayName",
                "campaignDetail.hasSegmentAudience",
                "campaignDetail.includeTagModeDisplayName",
                "campaignDetail.includeTagsDisplayName",
                "campaignDetail.excludeTagsDisplayName")
                .doesNotContain("<span>客户分群</span>");
        assertThat(styles).contains(".campaign-audience-policy small");
    }

    @Test
    void classicSenderEmailMustMatchConfiguredChannelDomainBeforeSubmit() throws Exception {
        String stores = Files.readString(ROOT.resolve("WEB-INF/shopify/stores.jsp"));

        assertThat(stores).contains(
                "data-sender-settings-form", "data-sending-domain", "data-from-email",
                "emailDomain !== sendingDomain",
                "发件邮箱必须使用当前通道的发件域 @",
                "setCustomValidity", "reportValidity", "event.preventDefault()");
    }
    @Test
    void webPixelStatusUsesOneHourCacheAndSilentRefresh() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("stores.jsp"));
            assertThat(page).contains(
                    "pixelStatusCacheTtlMs = 60 * 60 * 1000",
                    "window.localStorage.getItem(pixelStatusCacheKey)",
                    "window.localStorage.setItem(pixelStatusCacheKey",
                    "if (cachedStatus) renderPixelStatus(cachedStatus);",
                    "writePixelStatusCache(result);",
                    "if (!cachedStatus) renderPixelStatusUnavailable();",
                    "enable.addEventListener('submit', clearPixelStatusCache)",
                    "data-can-reauthorize=\"${canManageStoreLifecycle}\"",
                    "panel.dataset.canReauthorize === 'true'");
        }
    }

    @Test
    void storeMembersExposeRoleAwareManagementActions() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("stores.jsp"));
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));

            assertThat(page).contains(
                    "data-store-member-grant",
                    "data-center-user-picker",
                    "/org/selectorgs",
                    "data-center-user-selection",
                    "${ctx}/stores/members/grant",
                    "${ctx}/stores/members/revoke",
                    "data-member-role-open",
                    "id=\"store-member-role-dialog\"",
                    "data-member-role-confirm",
                    "name=\"targetUserId\"",
                    "name=\"role\"",
                    "${canManageAccess}",
                    "${canManageOwners}",
                    "member.platformUserId eq logineduser.id",
                    "member.role eq 'OWNER' and not canManageOwners",
                    "仅 OWNER 可管理")
                    .doesNotContain("member-role-inline");
            assertThat(page).contains(
                    "${managementDepartmentBound}", "${managementDepartmentId}",
                    "请联系平台管理员绑定管理机构", "<c:param name=\"department\"");
            assertThat(page).doesNotContain(
                    "<c:param name=\"domain\" value=\"${logineduser.domainid}\"/>");
            assertThat(styles).contains(
                    ".store-member-picker-field .secondary-button { display: inline-flex; box-sizing: border-box; min-height: 36px; align-items: center; justify-content: center; gap: 7px; padding: 0 15px; white-space: nowrap; }");
        }
    }

    @Test
    void analystNavigationKeepsReadOnlyCustomerAndMarketingPages() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("fragments/navigation.jspf"));

            assertThat(page).contains("${canViewCustomers}", "${canViewCampaigns}",
                    "${canManageCustomers}", ">客户管理</span>", ">导入客户</span>",
                    ">抑制名单</span>",
                    "href=\"${ctx}/segments?shop=${selectedShop}\"", ">邮件模板</span>",
                    ">营销活动</span>", ">自动营销</span>");
        }
    }

    @Test
    void everyPrimaryNavigationLinkPreservesTheSelectedShop() throws Exception {
        List<String> paths = List.of(
                "dashboard", "stores", "customers", "customers/imports", "suppressions",
                "segments", "templates", "campaigns", "automations", "reports", "products");

        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String navigation = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("fragments/navigation.jspf"));

            for (String path : paths) {
                assertThat(navigation).contains(
                        "href=\"${ctx}/" + path + "?shop=${selectedShop}\"");
            }
        }
    }

    @Test
    void analystPagesHideCustomerAndMarketingWriteActions() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));
            String imports = Files.readString(root.resolve("customer-imports.jsp"));
            String templates = templateCatalogContract(root.resolve("templates.jsp"));
            String segments = Files.readString(root.resolve("segments.jsp"));
            String campaigns = Files.readString(root.resolve("campaigns.jsp"));
            String automations = Files.readString(root.resolve("automations.jsp"));
            String segmentEditor = Files.readString(root.resolve("segment-editor.jsp"));
            String templateEditor = Files.readString(root.resolve("template-editor.jsp"));
            String campaignEditor = Files.readString(root.resolve("campaign-editor.jsp"));

            assertThat(imports).contains("${not canManageCustomers}", "${canExportCustomerData}");
            assertThat(templates).contains("canManageCampaigns");
            assertThat(segments).contains("canManageCampaigns");
            assertThat(campaigns).contains("canManageCampaigns");
            assertThat(automations).contains("canManageCampaigns");
            assertThat(segmentEditor).contains("${not canManageCampaigns}");
            assertThat(templateEditor).contains("${not canManageCampaigns}");
            assertThat(campaignEditor).contains("${not canManageCampaigns}");
        }
    }

    @Test
    void importTemplateAndAutomationListsExposeServerSideFilters() throws Exception {
        for (String theme : Set.of("shopify")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));
            String imports = Files.readString(root.resolve("customer-imports.jsp"));
            String templates = templateCatalogContract(root.resolve("templates.jsp"));
            String automations = Files.readString(root.resolve("automations.jsp"));

            assertThat(imports).contains(
                    "class=\"filter-form list-filter-form\"", "name=\"filename\"",
                    "name=\"customerTag\"", "name=\"createdFrom\"", "name=\"createdTo\"",
                    "${importFilenameFilter}", "${importTagFilter}",
                    "<c:param name=\"filename\"", "<c:param name=\"customerTag\"");
            assertThat(templates).contains(
                    "class=\"filter-form list-filter-form\"", "name=\"name\"",
                    "name=\"subject\"", "name=\"updatedFrom\"", "name=\"updatedTo\"",
                    "${templateNameFilter}", "${templateSubjectFilter}",
                    "<c:param name=\"updatedFrom\"", "<c:param name=\"updatedTo\"");
            assertThat(automations).contains(
                    "class=\"filter-form list-filter-form automation-filter-form\"", "name=\"name\"",
                    "name=\"status\"", "name=\"triggerEvent\"",
                    "${automationNameFilter}", "${automationStatusFilter}",
                    "${automationTriggerFilter}", "items=\"${automationStatuses}\"",
                    "<c:param name=\"triggerEvent\"",
                    "data-automation-filter-layout",
                    ".automation-filter-form { grid-template-columns: minmax(220px,1fr) 130px minmax(240px,1fr) auto !important;",
                    ".automation-filter-form .form-actions { align-self: end !important; }",
                    "<a class=\"secondary-button clear-filter-button\" href=\"${ctx}/automations?shop=${selectedShop}\">"
                            + "<i class=\"fa fa-eraser\"></i><span>清空条件</span></a>");
            assertThat(styles).contains(
                    ".list-filter-form { display: grid;",
                    "grid-template-columns: repeat(4, minmax(0, 1fr)) auto;",
                    ".list-filter-form.automation-filter-form { grid-template-columns: minmax(220px, 1fr) 130px minmax(240px, 1fr) auto;",
                    ".list-filter-form .form-actions .action-button, .list-filter-form .form-actions .clear-filter-button",
                    "height: 38px; min-height: 38px;",
                    ".list-filter-form .form-actions { align-self: end !important;",
                    ".clear-filter-button { display: inline-flex; box-sizing: border-box;",
                    "border: 1px solid #aebbc7;", "background: #f4f7f6;",
                    "@media (max-width: 760px) { .list-filter-form.automation-filter-form",
                    "@media (max-width: 1100px) { .list-filter-form",
                    "@media (max-width: 620px) { .list-filter-form");
        }
    }

    @Test
    void classicTemplateEditorAndPreviewExposePreheader() throws Exception {
        Path root = ROOT.resolve("WEB-INF/shopify");
        String editor = Files.readString(root.resolve("template-editor.jsp"));
        String templates = templateCatalogContract(root.resolve("templates.jsp"));

        assertThat(editor).contains(
                "name=\"preheader\"", "${editorTemplate.preheader}", "收件箱预览摘要",
                "form.querySelector('[name=\"preheader\"]')",
                "subject + '\\n' + preheader + '\\n' + html + '\\n' + text");
        assertThat(templates).contains(
                "id=\"platform-template-preview-preheader\"",
                "template.preheaderTemplate || template.preheader || ''");
    }

    @Test
    void classicTemplateEditorUsesThreeIntentionalMetadataRows() throws Exception {
        String editor = Files.readString(ROOT.resolve("WEB-INF/shopify/template-editor.jsp"));

        assertThat(editor).contains(
                "data-template-meta-layout",
                "class=\"editor-meta-row editor-meta-settings\"",
                "class=\"editor-meta-row editor-meta-messaging\"",
                "class=\"editor-meta-row editor-meta-text\"",
                ".editor-meta-settings { grid-template-columns: minmax(320px,1fr) minmax(150px,180px) minmax(150px,180px) auto;",
                ".editor-meta-messaging { grid-template-columns: repeat(2,minmax(0,1fr)); }",
                ".editor-meta-text { grid-template-columns: 1fr; }");
    }

    @Test
    void templateLifecycleActionsLiveInEditorAndDisabledStatusIsExplicit() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String templates = templateCatalogContract(root.resolve("templates.jsp"));
            String editor = Files.readString(root.resolve("template-editor.jsp"));
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));

            assertThat(templates)
                    .contains("template.status eq 'DISABLED' ? 'blocked'", "已禁用",
                            "copyFrom=${template.templateId}", "<span>复制</span>",
                            "dashboard.css?v=20261020-template-list-actions")
                    .doesNotContain("name=\"action\" value=\"disable\"",
                            "name=\"action\" value=\"delete\"");
            assertThat(styles).contains(
                    ".table-actions.template-list-actions { width: max-content; flex-wrap: nowrap; gap: 6px; }",
                    ".template-list-actions > * { flex: 0 0 auto; }",
                    ".template-list-actions .action-button { white-space: nowrap; }");
            assertThat(editor).contains(
                    "class=\"template-management\"",
                    "${editorTemplate.status eq 'PUBLISHED'}",
                    "name=\"action\" value=\"disable\"",
                    "name=\"action\" value=\"delete\"",
                    "禁用后将从全部邮件通道删除该动态模板",
                    "删除后将从全部邮件通道清理，且不可恢复");
        }
    }

    @Test
    void templateLifecycleActionsConfirmInDialogAndShowPendingAnimation() throws Exception {
        Path scriptPath = ROOT.resolve("shopify/js/template-lifecycle-actions.js");
        String script = Files.exists(scriptPath) ? Files.readString(scriptPath) : "";

        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String editor = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("template-editor.jsp"));
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));

            assertThat(editor).contains(
                    "data-template-action-form",
                    "data-action-title=\"确认禁用模板\"",
                    "data-action-title=\"确认删除模板\"",
                    "id=\"template-action-dialog\"",
                    "data-template-action-confirm",
                    "data-template-action-cancel",
                    "template-lifecycle-actions.js?v=20261029-restore-draft")
                    .doesNotContain("onsubmit=\"return confirm(");
            assertThat(styles).contains(
                    ".template-action-dialog",
                    ".template-action-dialog::backdrop",
                    ".template-action-dialog.is-pending",
                    ".template-action-progress");
        }
        assertThat(script).contains(
                "[data-template-action-form]",
                "event.preventDefault()",
                "dialog.showModal()",
                "confirmButton.setAttribute('aria-busy', 'true')",
                "fa fa-spinner fa-spin",
                "window.setTimeout(function ()",
                "pendingForm.submit()");
    }

    @Test
    void everyClearFilterControlUsesTheCustomerListButtonStyle() throws Exception {
        java.util.regex.Pattern clearButton = java.util.regex.Pattern.compile(
                "class=\\\"secondary-button clear-filter-button\\\"[^>]*><i class=\\\"fa fa-eraser\\\"></i>"
                        + "(?:<span>)?清空条件(?:</span>)?</(?:a|button)>");
        for (String theme : Set.of("shopify")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            try (var paths = Files.list(root)) {
                for (Path page : paths.filter(path -> path.toString().endsWith(".jsp")).toList()) {
                    String source = Files.readString(page);
                    long labels = source.split("清空条件", -1).length - 1L;
                    if (labels > 0) {
                        assertThat(clearButton.matcher(source).results().count())
                                .as(page.toString()).isEqualTo(labels);
                    }
                }
            }
        }
    }

    @Test
    void ga4DetailPanelsShowTheEffectiveUtmConfiguration() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String campaign = Files.readString(root.resolve("campaign-detail.jsp"));
            String automations = Files.readString(root.resolve("automations.jsp"));
            String campaignEditor = Files.readString(root.resolve("campaign-editor.jsp"));

            assertThat(campaign).contains(
                    "ga4-utm-parameters",
                    "UTM 来源",
                    "${campaignDetail.utmSource}",
                    "UTM 媒介",
                    "${campaignDetail.utmMedium}",
                    "UTM 活动", "${campaignDetail.utmCampaign}",
                    "UTM 内容", "${campaignDetail.utmContentDisplayName}");
            assertThat(automations).contains(
                    "dashboard.css?v=20261002-utm-override",
                    "automations.js?v=20261004-recipient-export",
                    "ga4-utm-parameters",
                    "data-automation-utm-source",
                    "data-automation-utm-medium",
                    "data-automation-utm-campaign",
                    "data-automation-utm-content",
                    "name=\"utmCampaign\"", "name=\"utmContent\"");
            assertThat(campaignEditor).contains(
                    "name=\"utmCampaign\"", "name=\"utmContent\"",
                    "留空时使用活动名称", "留空时按链接自动生成");
        }

        assertThat(Files.readString(ROOT.resolve("WEB-INF/shopify/campaign-detail.jsp")))
                .contains("dashboard.css?v=20261023-readable-recipients");
        assertThat(Files.readString(ROOT.resolve("WEB-INF/shopify-theme2/campaign-detail.jsp")))
                .contains("dashboard.css?v=20261023-readable-recipients");
        String script = Files.readString(ROOT.resolve("shopify/js/automations.js"));
        assertThat(script).contains(
                "definition.utmSource, 'auw'",
                "definition.utmMedium, 'email'",
                "definition.utmCampaign || definition.name",
                "definition.utmContent, '按链接自动生成'",
                "[data-automation-utm-source]",
                "[data-automation-utm-medium]",
                "[data-automation-utm-campaign]",
                "[data-automation-utm-content]");
    }

    @Test
    void campaignViewsKeepSnapshotRefreshAndBuiltInCampaignMessage() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String detail = Files.readString(root.resolve("campaign-detail.jsp"));
            String campaignEditor = Files.readString(root.resolve("campaign-editor.jsp"));
            String templateEditor = Files.readString(root.resolve("template-editor.jsp"));

            assertThat(detail).contains(
                    "id=\"campaign-snapshot-refresh\"", "刷新冻结进度",
                    "campaignSnapshotRefresh.addEventListener('click', refreshProgress)");
            assertThat(campaignEditor).contains(
                    "id=\"campaign-message\"", "活动文案",
                    "variables.campaignMessage",
                    "模板中插入 {{campaignMessage}} 后显示此内容");
            assertThat(templateEditor).contains(
                    "addVariableButton('campaignMessage')");
        }
    }

    @Test
    void classicCampaignDetailKeepsGa4EvaluationCollapsedByDefault() throws Exception {
        Path root = ROOT.resolve("WEB-INF/shopify");
        String campaign = Files.readString(root.resolve("campaign-detail.jsp"));
        String styles = Files.readString(ROOT.resolve("shopify/css/dashboard.css"));

        assertThat(campaign).contains(
                        "<details class=\"ga4-campaign-evaluation-details\">",
                        "<summary class=\"section-heading ga4-campaign-evaluation-heading\">",
                        "campaignDetail.ga4Evaluation.statusDisplayName")
                .doesNotContain(
                        "<details class=\"ga4-campaign-evaluation-details\" open>");
        assertThat(styles).contains(".ga4-campaign-evaluation-details > summary",
                ".ga4-campaign-evaluation-details[open] .ga4-campaign-evaluation-toggle");
    }

    @Test
    void campaignMessageAppearsImmediatelyBeforeTheContentParametersSection() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String page = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("campaign-editor.jsp"));

            int audienceEnd = page.indexOf("</section>",
                    page.indexOf("class=\"campaign-audience-tags\""));
            int campaignMessage = page.indexOf("id=\"campaign-message\"");
            int contentParameters = page.indexOf("class=\"campaign-personalization\"");

            assertThat(audienceEnd).isGreaterThanOrEqualTo(0);
            assertThat(campaignMessage).isGreaterThan(audienceEnd);
            assertThat(contentParameters).isGreaterThan(campaignMessage);
        }
    }

    @Test
    void campaignContentParametersUseTheRequestedDesktopAndMobileLayout() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path themeRoot = ROOT.resolve("WEB-INF").resolve(theme);
            String page = Files.readString(themeRoot.resolve("campaign-editor.jsp"));
            String styles = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));

            assertThat(page).contains(
                    "活动名称 <span class=\"required-marker\" aria-hidden=\"true\">*</span>",
                    "name=\"name\"", "required maxlength=\"255\"",
                    "活动内容参数<span class=\"campaign-personalization-note\">"
                            + "（审批通过后与客户资料一起冻结，发送时提交给邮件通道动态模板）</span>",
                    "class=\"campaign-product-compose\"",
                    "class=\"campaign-product-search-row\"",
                    "class=\"campaign-discount-field\"");
            int product = page.indexOf("class=\"campaign-product-picker\"");
            int coupon = page.indexOf("class=\"campaign-discount-field\"");
            int selected = page.indexOf("class=\"campaign-selected-products\"");
            assertThat(coupon).isGreaterThan(product);
            assertThat(selected).isGreaterThan(coupon);
            assertThat(styles).contains(
                    ".campaign-message-field { grid-template-columns: 1fr; }",
                    ".campaign-audience-tags .checkbox-row > span { color:",
                    "font-weight: 600;",
                    "gap: 5px; font-size: 12px;",
                    ".campaign-product-compose { display: grid;",
                    "grid-template-areas: \"product selected\" \"coupon selected\";",
                    ".campaign-product-picker { grid-area: product;",
                    ".campaign-product-search-row { display: grid;",
                    "grid-template-columns: auto minmax(0, 1fr);",
                    "width: 100%;",
                    ".campaign-discount-field { grid-area: coupon;",
                    ".campaign-selected-products { grid-area: selected;",
                    "grid-template-areas: \"product\" \"coupon\" \"selected\";",
                    ".campaign-product-search-row { grid-template-columns: 1fr;");
        }
    }

    @Test
    void customerDeletionAndSuppressionReleaseExistInBothThemes() throws Exception {
        for (String theme : List.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String customers = Files.readString(root.resolve("customers.jsp"));
            String suppressions = Files.readString(root.resolve("suppressions.jsp"));

            assertThat(customers).contains(
                    "data-customer-delete", "customer-delete-dialog",
                    "/customers/delete", "runCustomerDeletion",
                    "fa fa-spinner fa-spin", "正在删除…",
                    "deleteForm.setAttribute('aria-busy', 'true')");
            assertThat(suppressions).contains(
                    "data-suppression-release", "suppression-release-dialog",
                    "/suppressions/release", "name=\"targetTag\"",
                    "runSuppressionRelease");
        }
    }

    private Set<String> views(String theme) throws Exception {
        Path root = ROOT.resolve("WEB-INF").resolve(theme);
        try (var files = Files.walk(root)) {
            return files.filter(Files::isRegularFile)
                    .filter(path -> path.toString().endsWith(".jsp")
                            || path.toString().endsWith(".jspf"))
                    .map(root::relativize).map(Path::toString)
                    .collect(Collectors.toSet());
        }
    }

    private static String templateCatalogContract(Path page) throws Exception {
        return Files.readString(page)
                + Files.readString(page.getParent().resolve("fragments/template-preview.jspf"))
                + Files.readString(ROOT.resolve("shopify/js/template-version-preview.js"));
    }
}
