package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.JSONArray;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import com.yskj.shopify.web.upload.SharedCustomerImportStore;
import com.yskj.shopify.web.upload.CustomerImportTransferClient;
import com.yskj.shopify.web.export.CustomerImportTemplateExporter;
import com.yskj.shopify.web.export.RemoteTrendExcelExporter;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.ui.ExtendedModelMap;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.servlet.mvc.support.RedirectAttributesModelMap;

import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

class MerchantConsoleControllerTest {
    @Test void senderDomainCsrfIsStableAndRequiredBeforeVerificationRpc() {
        var expected=new JSONObject(Map.of("provider","INFOBIP","domain","mail.example.com","status","VERIFIED"));
        when(client.exchange(eq("sender-domain.status"),any(),eq("demo.myshopify.com"),any(),eq(null)))
                .thenReturn(MerchantWebProtocol.json(expected));
        when(client.exchange(eq("sender-domain.verify"),any(),eq("demo.myshopify.com"),any(),eq(null)))
                .thenReturn(MerchantWebProtocol.json(expected));
        var params=new LinkedMultiValueMap<String,String>();params.add("shop","demo.myshopify.com");params.add("provider","INFOBIP");
        var currentSession=session();
        String token=controller.senderDomainVerification(params,currentSession).getHeaders().getFirst("X-Store-Domain-Csrf");
        assertThat(token).isNotBlank();
        assertThat(controller.senderDomainVerification(params,currentSession).getHeaders().getFirst("X-Store-Domain-Csrf")).isEqualTo(token);
        var body=new JSONObject(Map.of("provider","INFOBIP","domain","attacker.example","actorId","attacker","configVersion",999));
        org.assertj.core.api.Assertions.assertThatThrownBy(()->controller.verifySenderDomain(params,body,null,currentSession))
                .isInstanceOfSatisfying(org.springframework.web.server.ResponseStatusException.class,e->assertThat(e.getStatus()).isEqualTo(org.springframework.http.HttpStatus.FORBIDDEN));
        org.assertj.core.api.Assertions.assertThatThrownBy(()->controller.verifySenderDomain(params,body,"incorrect",currentSession))
                .isInstanceOfSatisfying(org.springframework.web.server.ResponseStatusException.class,e->assertThat(e.getStatus()).isEqualTo(org.springframework.http.HttpStatus.FORBIDDEN));
        org.mockito.Mockito.verify(client,org.mockito.Mockito.never()).exchange(eq("sender-domain.verify"),any(),any(),any(),any());
        assertThat(controller.verifySenderDomain(params,body,token,currentSession).getBody()).isEqualTo(expected);
        var sent=org.mockito.ArgumentCaptor.forClass(JSONObject.class);
        verify(client).exchange(eq("sender-domain.verify"),any(),eq("demo.myshopify.com"),sent.capture(),eq(null));
        assertThat(sent.getValue()).doesNotContainKeys("domain","actorId","configVersion");
        assertThat(sent.getValue().getString("provider")).isEqualTo("INFOBIP");
    }
    @Test void senderDomainStatusUsesReadOnlyFacadeOperationAndNeverCachesResult() {
        var expected=new JSONObject(Map.of("provider","INFOBIP","domain","mail.example.com","status","VERIFIED"));
        when(client.exchange(eq("sender-domain.status"),any(),eq("demo.myshopify.com"),any(),eq(null)))
                .thenReturn(MerchantWebProtocol.json(expected));
        var params=new LinkedMultiValueMap<String,String>();params.add("shop","demo.myshopify.com");params.add("provider","INFOBIP");
        var response=controller.senderDomainVerification(params,session());
        assertThat(response.getBody()).isEqualTo(expected);
        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
        verify(client).exchange(eq("sender-domain.status"),any(),eq("demo.myshopify.com"),any(),eq(null));
    }

    private final MerchantWebFacadeClient client = mock(MerchantWebFacadeClient.class);
    private final MerchantConsoleController controller =
            new MerchantConsoleController(client, new RemotePageSupport());

    @Test
    void dashboardUsesTheLoggedInUserAndRemoteViewModel() {
        MockHttpSession session = session();
        when(client.exchange(eq("dashboard.load"), any(), eq("demo.myshopify.com"),
                any(), eq(null))).thenReturn(MerchantWebProtocol.view(
                "shopify/dashboard", new JSONObject(Map.of("selectedShop", "demo.myshopify.com"))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        ExtendedModelMap model = new ExtendedModelMap();

        String view = controller.dashboard(
                params, session, model, new RedirectAttributesModelMap());

        assertThat(view).isEqualTo("shopify/dashboard");
        assertThat(model).containsEntry("selectedShop", "demo.myshopify.com");
        verify(client).exchange(eq("dashboard.load"), any(), eq("demo.myshopify.com"),
                any(), eq(null));
    }

    @Test
    void campaignActionsReturnRemoteRedirectAndFlash() {
        MockHttpSession session = session();
        when(client.exchange(eq("campaigns.action"), any(), eq("demo.myshopify.com"),
                any(), eq(null))).thenReturn(MerchantWebProtocol.redirect(
                "/campaigns/detail", "已提交", null,
                new JSONObject(Map.of("shop", "demo.myshopify.com",
                        "campaignId", "campaign-1"))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("campaignId", "campaign-1");
        params.add("action", "SUBMIT");
        RedirectAttributesModelMap redirect = new RedirectAttributesModelMap();

        String view = controller.campaignAction(
                params, session, new ExtendedModelMap(), redirect);

        assertThat(view).isEqualTo("redirect:/campaigns/detail");
        assertThat(redirect.getFlashAttributes().get("successMessage")).isEqualTo("已提交");
    }

    @Test
    void campaignAudiencePreviewForwardsTheReadOnlyPagingRequest() {
        JSONObject body = new JSONObject(Map.of("total", 51, "page", 2, "pageSize", 50));
        when(client.exchange(eq("campaigns.audience-preview"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.json(body));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("campaignId", "campaign-1");
        params.add("page", "2");
        params.add("size", "50");

        var response = controller.campaignAudiencePreview(params, session());

        assertThat(response.getBody()).isEqualTo(body);
        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
        verify(client).exchange(eq("campaigns.audience-preview"), any(),
                eq("demo.myshopify.com"), org.mockito.ArgumentMatchers.argThat(parameters ->
                        "campaign-1".equals(parameters.getString("campaignId"))
                                && "2".equals(parameters.getString("page"))
                                && "50".equals(parameters.getString("size"))), eq(null));
    }

    @Test
    void campaignAudiencePreviewReturnsTheSafeConflictReasonWithoutCachingIt() {
        when(client.exchange(eq("campaigns.audience-preview"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.error(
                        "CONFLICT", "当前可发送受众超过100000人，请先细分受众", 409));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("campaignId", "campaign-1");

        var response = controller.campaignAudiencePreview(params, session());

        assertThat(response.getStatusCodeValue()).isEqualTo(409);
        assertThat(response.getHeaders().getCacheControl()).contains("no-store");
        assertThat(response.getBody()).isInstanceOf(JSONObject.class);
        assertThat(((JSONObject) response.getBody()).getString("message"))
                .contains("100000人", "细分受众");
    }

    @Test
    void customerAndSuppressionBulkActionsForwardToTheirWriteCommands() {
        JSONObject customerBody = new JSONObject(Map.of("affected", 4));
        JSONObject suppressionBody = new JSONObject(Map.of("released", 7, "tagged", 5));
        when(client.exchange(eq("customers.delete"), any(), eq("demo.myshopify.com"),
                any(), eq(null))).thenReturn(MerchantWebProtocol.json(customerBody));
        when(client.exchange(eq("suppressions.release"), any(), eq("demo.myshopify.com"),
                any(), eq(null))).thenReturn(MerchantWebProtocol.json(suppressionBody));
        var customerParams = new LinkedMultiValueMap<String, String>();
        customerParams.add("shop", "demo.myshopify.com");
        customerParams.add("q", "alice");
        var suppressionParams = new LinkedMultiValueMap<String, String>();
        suppressionParams.add("shop", "demo.myshopify.com");
        suppressionParams.add("reason", "HARD_BOUNCE");
        suppressionParams.add("targetTag", "恢复发送");

        assertThat(controller.deleteCustomers(customerParams, session()).getBody())
                .isEqualTo(customerBody);
        assertThat(controller.releaseSuppressions(suppressionParams, session()).getBody())
                .isEqualTo(suppressionBody);
        verify(client).exchange(eq("customers.delete"), any(), eq("demo.myshopify.com"),
                any(), eq(null));
        verify(client).exchange(eq("suppressions.release"), any(), eq("demo.myshopify.com"),
                any(), eq(null));
    }

    @Test
    void storeMemberFormsUseTheRemoteRoleCommands() {
        when(client.exchange(eq("store-members.grant"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.redirect(
                        "/stores", "店铺成员已更新", null,
                        new JSONObject(Map.of("shop", "demo.myshopify.com"))));
        when(client.exchange(eq("store-members.revoke"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.redirect(
                        "/stores", "店铺成员已移除", null,
                        new JSONObject(Map.of("shop", "demo.myshopify.com"))));
        var grant = new LinkedMultiValueMap<String, String>();
        grant.add("shop", "demo.myshopify.com");
        grant.add("targetUserId", "member-1");
        grant.add("targetUserName", "Member");
        grant.add("role", "MARKETER");
        var revoke = new LinkedMultiValueMap<String, String>();
        revoke.add("shop", "demo.myshopify.com");
        revoke.add("targetUserId", "member-1");

        assertThat(controller.grantStoreMember(grant, session(), new ExtendedModelMap(),
                new RedirectAttributesModelMap())).isEqualTo("redirect:/stores");
        assertThat(controller.revokeStoreMember(revoke, session(), new ExtendedModelMap(),
                new RedirectAttributesModelMap())).isEqualTo("redirect:/stores");

        verify(client).exchange(eq("store-members.grant"), any(),
                eq("demo.myshopify.com"), any(), eq(null));
        verify(client).exchange(eq("store-members.revoke"), any(),
                eq("demo.myshopify.com"), any(), eq(null));
    }

    @Test
    void customerImportStagesLocallyAndTransfersBinaryChunksToTheBackend() throws Exception {
        SharedCustomerImportStore store = mock(SharedCustomerImportStore.class);
        CustomerImportTransferClient transfer = mock(CustomerImportTransferClient.class);
        controller.setCustomerImportStore(store);
        controller.setCustomerImportTransfer(transfer);
        MockMultipartFile file = new MockMultipartFile(
                "file", "contacts.csv", "text/csv", "email\na@example.com".getBytes());
        java.nio.file.Path staged = java.nio.file.Path.of("staged.csv");
        when(store.save(file)).thenReturn("2026/09/staged.csv");
        when(store.resolve("2026/09/staged.csv")).thenReturn(staged);
        when(store.sha256("2026/09/staged.csv")).thenReturn("a".repeat(64));
        when(client.exchange(eq("customer-imports.upload-start"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of(
                        "uploadId", "impupl_1", "token", "token-1",
                        "chunkSize", 4, "chunkCount", 4,
                        "serverId", "server-12", "transferBaseUrl",
                        "http://10.0.0.12:7020/shopify-marketing"))));
        when(client.exchange(eq("customer-imports.upload-complete"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.redirect(
                        "/customers/imports", "已接收", null,
                        new JSONObject(Map.of("shop", "demo.myshopify.com", "jobId", "impjob_1"))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("customerTag", "VIP");
        params.add("consentState", "SUBSCRIBED");
        params.add("validateEmails", "true");

        String view = controller.uploadCustomers(
                params, file, session(), new ExtendedModelMap(), new RedirectAttributesModelMap());

        assertThat(view).isEqualTo("redirect:/customers/imports");
        verify(store).save(file);
        verify(client).exchange(eq("customer-imports.upload-start"), any(),
                eq("demo.myshopify.com"), org.mockito.ArgumentMatchers.argThat(value ->
                        "a".repeat(64).equals(value.getString("fileSha256"))
                                && !value.containsKey("storedPath")
                                && !value.containsKey("fileBytes")), eq(null));
        var uploadInvocation = org.mockito.Mockito.mockingDetails(transfer).getInvocations().stream()
                .filter(invocation -> "upload".equals(invocation.getMethod().getName()))
                .findFirst().orElseThrow();
        assertThat(uploadInvocation.getArguments()).containsExactly(
                staged, "server-12", "http://10.0.0.12:7020/shopify-marketing",
                "impupl_1", "token-1", 4, 4);
        verify(client).exchange(eq("customer-imports.upload-complete"), any(),
                eq("demo.myshopify.com"), org.mockito.ArgumentMatchers.argThat(value ->
                        "SUBSCRIBED".equals(value.getString("consentState"))
                                && value.getBooleanValue("validateEmails")), eq(null));
        verify(store).delete("2026/09/staged.csv");
    }

    @Test
    void customerImportRebindsOnceWhenTheSelectedInstanceStopsDuringUpload()
            throws Exception {
        SharedCustomerImportStore store = mock(SharedCustomerImportStore.class);
        AtomicInteger uploadAttempts = new AtomicInteger();
        CustomerImportTransferClient transfer = mock(CustomerImportTransferClient.class,
                invocation -> {
                    if ("upload".equals(invocation.getMethod().getName())
                            && uploadAttempts.getAndIncrement() == 0) {
                        throw new java.io.IOException("selected instance unavailable");
                    }
                    return org.mockito.Answers.RETURNS_DEFAULTS.answer(invocation);
                });
        controller.setCustomerImportStore(store);
        controller.setCustomerImportTransfer(transfer);
        MockMultipartFile file = new MockMultipartFile(
                "file", "contacts.csv", "text/csv", "email\na@example.com".getBytes());
        java.nio.file.Path staged = java.nio.file.Path.of("staged.csv");
        when(store.save(file)).thenReturn("2026/09/staged.csv");
        when(store.resolve("2026/09/staged.csv")).thenReturn(staged);
        when(store.sha256("2026/09/staged.csv")).thenReturn("a".repeat(64));
        when(client.exchange(eq("customer-imports.upload-start"), any(), any(), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of(
                        "uploadId", "impupl_1", "token", "token-1",
                        "chunkSize", 4, "chunkCount", 4,
                        "serverId", "server-11", "transferBaseUrl",
                        "http://10.0.0.11:7020/shopify-marketing"))));
        when(client.exchange(eq("customer-imports.upload-endpoint"), any(), any(), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of(
                        "uploadId", "impupl_1", "serverId", "server-12",
                        "transferBaseUrl", "http://10.0.0.12:7020/shopify-marketing"))));
        when(client.exchange(eq("customer-imports.upload-complete"), any(), any(), any(), eq(null)))
                .thenReturn(MerchantWebProtocol.redirect(
                        "/customers/imports", "已接收", null,
                        new JSONObject(Map.of("shop", "demo.myshopify.com"))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("consentState", "SUBSCRIBED");

        String view = controller.uploadCustomers(
                params, file, session(), new ExtendedModelMap(), new RedirectAttributesModelMap());

        assertThat(view).isEqualTo("redirect:/customers/imports");
        assertThat(uploadAttempts).hasValue(2);
        verify(client).exchange(eq("customer-imports.upload-endpoint"), any(),
                eq("demo.myshopify.com"), org.mockito.ArgumentMatchers.argThat(value ->
                        "impupl_1".equals(value.getString("uploadId"))
                                && "token-1".equals(value.getString("uploadToken"))), eq(null));
    }

    @Test
    void customerImportResultRebindsToAnotherRpcSelectedInstanceOnConnectionFailure()
            throws Exception {
        AtomicInteger downloadAttempts = new AtomicInteger();
        @SuppressWarnings("unchecked")
        java.net.http.HttpResponse<java.io.InputStream> remote =
                mock(java.net.http.HttpResponse.class);
        when(remote.body()).thenReturn(new java.io.ByteArrayInputStream("result".getBytes()));
        CustomerImportTransferClient transfer = mock(CustomerImportTransferClient.class,
                invocation -> {
                    if ("download".equals(invocation.getMethod().getName())) {
                        if (downloadAttempts.getAndIncrement() == 0) {
                            throw new java.io.IOException("selected instance unavailable");
                        }
                        return remote;
                    }
                    return org.mockito.Answers.RETURNS_DEFAULTS.answer(invocation);
                });
        controller.setCustomerImportTransfer(transfer);
        when(client.exchange(eq("customer-imports.result-download"), any(),
                eq("demo.myshopify.com"), any(), eq(null)))
                .thenReturn(
                        MerchantWebProtocol.json(new JSONObject(Map.of(
                                "jobId", "impjob_1", "token", "download-1",
                                "filename", "contacts-result.csv", "sizeBytes", 6,
                                "serverId", "server-11", "transferBaseUrl",
                                "http://10.0.0.11:7020/shopify-marketing"))),
                        MerchantWebProtocol.json(new JSONObject(Map.of(
                                "jobId", "impjob_1", "token", "download-2",
                                "filename", "contacts-result.csv", "sizeBytes", 6,
                                "serverId", "server-12", "transferBaseUrl",
                                "http://10.0.0.12:7020/shopify-marketing"))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("jobId", "impjob_1");

        var response = controller.customerImportResult(params, session());
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        response.getBody().writeTo(output);

        assertThat(output.toString()).isEqualTo("result");
        assertThat(downloadAttempts).hasValue(2);
        var downloads = org.mockito.Mockito.mockingDetails(transfer).getInvocations().stream()
                .filter(invocation -> "download".equals(invocation.getMethod().getName()))
                .map(invocation -> invocation.getArguments()).toList();
        assertThat(downloads).containsExactly(
                new Object[]{"server-11", "http://10.0.0.11:7020/shopify-marketing",
                        "impjob_1", "download-1"},
                new Object[]{"server-12", "http://10.0.0.12:7020/shopify-marketing",
                        "impjob_1", "download-2"});
    }

    @Test
    void localExcelEndpointsUseRemoteDataWithoutBackendFiles() {
        controller.setCustomerImportTemplateExporter(new CustomerImportTemplateExporter());
        controller.setRemoteTrendExcelExporter(new RemoteTrendExcelExporter());
        when(client.exchange(eq("dashboard.trends"), any(), eq("demo.myshopify.com"),
                any(), eq(null))).thenReturn(MerchantWebProtocol.json(new JSONObject(Map.of(
                "shopDomain", "demo.myshopify.com", "timeZone", "Asia/Shanghai"))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");

        var template = controller.customerImportTemplate(session());
        var trends = controller.exportTrends(params, session());

        assertThat((byte[]) template.getBody()).isNotEmpty();
        assertThat(template.getHeaders().getFirst("Content-Disposition"))
                .contains("customer-import-template.xlsx");
        assertThat((byte[]) trends.getBody()).isNotEmpty();
        assertThat(trends.getHeaders().getFirst("Content-Disposition"))
                .contains("daily-marketing-trend");
    }

    @Test
    void listJsonEndpointsReturnTheRemoteItemsArray() {
        JSONArray items = new JSONArray();
        items.add(new JSONObject(Map.of("sourceId", "product-1")));
        when(client.exchange(eq("templates.products"), any(), eq("demo.myshopify.com"),
                any(), eq(null))).thenReturn(MerchantWebProtocol.json(
                new JSONObject(Map.of("items", items))));
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");

        var response = controller.templateProducts(params, session());

        assertThat(response.getBody()).isEqualTo(items);
    }

    @Test
    void singleSegmentRuleKeepsListParametersAsJsonArraysAcrossRpc() {
        AtomicReference<JSONObject> captured = new AtomicReference<>();
        when(client.exchange(eq("segments.preview-results"), any(),
                eq("demo.myshopify.com"), any(), eq(null))).thenAnswer(invocation -> {
            captured.set(invocation.getArgument(3));
            return MerchantWebProtocol.view(
                    "shopify/fragments/segment-preview-results", new JSONObject());
        });
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com");
        params.add("matchMode", "ALL");
        params.add("fields", "TAG");
        params.add("operators", "EQ");
        params.add("values", "VIP");
        params.add("groupIds", "group-1");
        params.add("groupMatchModes", "ALL");
        params.add("ruleGroupIds", "group-1");
        params.add("previewPage", "1");

        String view = controller.segmentPreviewResults(
                params, session(), new ExtendedModelMap(), new RedirectAttributesModelMap());

        assertThat(view).isEqualTo("shopify/fragments/segment-preview-results");
        for (String key : new String[]{"fields", "operators", "values",
                "groupIds", "groupMatchModes", "ruleGroupIds"}) {
            assertThat(captured.get().get(key)).as(key).isInstanceOf(JSONArray.class);
            assertThat(captured.get().getJSONArray(key)).hasSize(1);
        }
    }

    @Test
    void segmentSaveForwardsTheChosenInnerAnyAndAllGroupMembershipArrays() {
        AtomicReference<JSONObject> captured = new AtomicReference<>();
        when(client.exchange(eq("segments.save"), any(), eq("demo.myshopify.com"), any(), eq(null)))
                .thenAnswer(invocation -> {
                    captured.set(invocation.getArgument(3));
                    return MerchantWebProtocol.redirect("/segments", "Saved", null,
                            new JSONObject(Map.of("shop", "demo.myshopify.com")));
                });
        var params = new LinkedMultiValueMap<String, String>();
        params.add("shop", "demo.myshopify.com"); params.add("segmentId", "seg-1");
        params.add("name", "Any contact"); params.add("matchMode", "ALL");
        params.add("fields", "EMAIL"); params.add("fields", "CUSTOMER_NAME");
        params.add("operators", "EQ"); params.add("operators", "CONTAINS");
        params.add("values", "person@example.test"); params.add("values", "Name");
        params.add("groupIds", "contact"); params.add("groupMatchModes", "ANY");
        params.add("ruleGroupIds", "contact"); params.add("ruleGroupIds", "contact");

        controller.saveSegment(params, session(), new ExtendedModelMap(), new RedirectAttributesModelMap());

        assertThat(captured.get().getJSONArray("groupMatchModes")).containsExactly("ANY");
        assertThat(captured.get().getJSONArray("groupIds")).containsExactly("contact");
        assertThat(captured.get().getJSONArray("ruleGroupIds")).containsExactly("contact", "contact");
        assertThat(captured.get().getJSONArray("fields")).containsExactly("EMAIL", "CUSTOMER_NAME");
        assertThat(captured.get().getString("matchMode")).isEqualTo("ALL");
    }

    private MockHttpSession session() {
        LoginedUser user = new LoginedUser();
        user.setId("user-1");
        user.setDomainid("domain-1");
        user.setApplicationid("app-1");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("logineduser", user);
        return session;
    }
}
