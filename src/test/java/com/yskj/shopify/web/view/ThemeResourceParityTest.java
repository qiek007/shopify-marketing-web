package com.yskj.shopify.web.view;

import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

class ThemeResourceParityTest {

    private static final Path ROOT = Path.of("src/main/resources/META-INF/resources");

    @Test
    void carriesIndependentCompleteCopiesOfBothThemesAndLogin() throws Exception {
        Set<String> classic = views("shopify");
        Set<String> theme2 = views("shopify-theme2");

        assertThat(classic).hasSize(37).containsExactlyInAnyOrderElementsOf(theme2);
        assertThat(ROOT.resolve("WEB-INF/org/index.jsp")).exists();
        assertThat(ROOT.resolve("shopify/css/dashboard.css")).exists();
        assertThat(ROOT.resolve("shopify-theme2/css/dashboard.css")).exists();
        assertThat(ROOT.resolve("shopify/js/session-keepalive.js")).exists();
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
    void customerImportKeepsAllControlsOnOneRowAndGivesTheTagMoreSpace() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String css = Files.readString(ROOT.resolve(theme).resolve("css/dashboard.css"));

            assertThat(css).contains(
                    ".customer-import-fields { grid-template-columns: minmax(240px, 1.15fr) minmax(280px, 1.2fr) minmax(260px, 1.45fr) auto;",
                    "@media (max-width: 1320px) { .customer-import-fields { grid-template-columns: repeat(2, minmax(0, 1fr));");
        }
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
    void progressiveNavigationFallbackNeverLeavesTheMainAreaDisabled() throws Exception {
        String script = Files.readString(ROOT.resolve("shopify/js/console-navigation.js"));
        int catchStart = script.indexOf("}).catch(function (error) {");
        int finallyStart = script.indexOf("}).finally(function () {", catchStart);

        assertThat(catchStart).isGreaterThanOrEqualTo(0);
        assertThat(finallyStart).isGreaterThan(catchStart);
        assertThat(script.substring(catchStart, finallyStart))
                .contains("setBusy(false);", "window.location.assign(url);");
        assertThat(script).contains(
                "navigationFallbackTimer = window.setTimeout",
                "window.clearTimeout(navigationFallbackTimer)");
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            String header = Files.readString(ROOT.resolve("WEB-INF").resolve(theme)
                    .resolve("fragments/header.jspf"));
            assertThat(header).contains(
                    "console-navigation.js?v=20261001-navigation-recovery");
        }
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
                    ">抑制名单</span>", "href=\"${ctx}/segments\"", ">邮件模板</span>",
                    ">营销活动</span>", ">自动营销</span>");
        }
    }

    @Test
    void analystPagesHideCustomerAndMarketingWriteActions() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String imports = Files.readString(root.resolve("customer-imports.jsp"));
            String templates = Files.readString(root.resolve("templates.jsp"));
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
    void ga4DetailPanelsShowTheEffectiveUtmConfiguration() throws Exception {
        for (String theme : Set.of("shopify", "shopify-theme2")) {
            Path root = ROOT.resolve("WEB-INF").resolve(theme);
            String campaign = Files.readString(root.resolve("campaign-detail.jsp"));
            String automations = Files.readString(root.resolve("automations.jsp"));
            String campaignEditor = Files.readString(root.resolve("campaign-editor.jsp"));

            assertThat(campaign).contains(
                    "dashboard.css?v=20261004-recipient-export-v3",
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
}
