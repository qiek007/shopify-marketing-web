package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.web.security.PlatformUserContext;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import com.yskj.shopify.web.upload.SharedCustomerImportStore;
import com.yskj.shopify.web.upload.CustomerImportTransferClient;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import com.yskj.shopify.web.export.CustomerImportTemplateExporter;
import com.yskj.shopify.web.export.RemoteTrendExcelExporter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ContentDisposition;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Controller
public class MerchantConsoleController {

    private static final Set<String> ARRAY_PARAMETERS = Set.of(
            "fields", "operators", "values",
            "groupIds", "groupMatchModes", "ruleGroupIds");

    private final MerchantWebFacadeClient client;
    private final RemotePageSupport support;
    private SharedCustomerImportStore customerImportStore;
    private CustomerImportTransferClient customerImportTransfer;
    private CustomerImportTemplateExporter customerImportTemplateExporter;
    private RemoteTrendExcelExporter remoteTrendExcelExporter;

    public MerchantConsoleController(MerchantWebFacadeClient client, RemotePageSupport support) {
        this.client = client;
        this.support = support;
    }

    @Autowired(required = false)
    public void setCustomerImportStore(SharedCustomerImportStore value) {
        this.customerImportStore = value;
    }

    @Autowired(required = false)
    public void setCustomerImportTransfer(CustomerImportTransferClient value) {
        this.customerImportTransfer = value;
    }

    @Autowired(required = false)
    public void setCustomerImportTemplateExporter(CustomerImportTemplateExporter value) {
        this.customerImportTemplateExporter = value;
    }

    @Autowired(required = false)
    public void setRemoteTrendExcelExporter(RemoteTrendExcelExporter value) {
        this.remoteTrendExcelExporter = value;
    }

    @GetMapping({"/", "/dashboard"})
    public String dashboard(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("dashboard.load", params, session, model, redirect);
    }

    @GetMapping(value = "/dashboard/trends", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> trends(@RequestParam MultiValueMap<String, String> params,
                                    HttpSession session) {
        return body("dashboard.trends", params, session, null);
    }

    @GetMapping("/dashboard/trends/export.xlsx")
    public ResponseEntity<?> exportTrends(
            @RequestParam MultiValueMap<String, String> params, HttpSession session) {
        if (remoteTrendExcelExporter == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        }
        JSONObject response = client.exchange("dashboard.trends", requireUser(session),
                params.getFirst("shop"), parameters(params), null);
        if (!"JSON".equals(response.getString("kind"))) {
            support.applyBody(response);
            throw new IllegalStateException("Expected trend JSON response");
        }
        byte[] content = remoteTrendExcelExporter.export(response.getJSONObject("body"));
        return xlsx(content, "daily-marketing-trend.xlsx");
    }

    @GetMapping("/issues")
    public String issues(@RequestParam MultiValueMap<String, String> params,
                         HttpSession session, Model model, RedirectAttributes redirect) {
        return view("issues.page", params, session, model, redirect);
    }

    @PostMapping("/issues/replay")
    public String replayIssue(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("issues.replay", params, session, model, redirect);
    }

    @PostMapping("/issues/ignore")
    public String ignoreIssue(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("issues.ignore", params, session, model, redirect);
    }

    @GetMapping("/stores")
    public String stores(@RequestParam MultiValueMap<String, String> params,
                         HttpSession session, Model model, RedirectAttributes redirect) {
        return view("stores.load", params, session, model, redirect);
    }

    @GetMapping("/settings/ga4")
    public String ga4Settings(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("ga4.settings", params, session, model, redirect);
    }

    @PostMapping("/settings/ga4/service-account")
    public String connectGa4(@RequestParam MultiValueMap<String, String> params,
                             @RequestParam("serviceAccountFile") MultipartFile file,
                             HttpSession session, Model model, RedirectAttributes redirect) {
        if (file == null || file.isEmpty() || file.getSize() > 64L * 1024L) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Service Account JSON 文件无效或超过 64 KiB");
        }
        try {
            JSONObject payload = new JSONObject(Map.of(
                    "serviceAccountJson", new String(file.getBytes(), StandardCharsets.UTF_8)));
            return view("ga4.connect", params, payload, session, model, redirect);
        } catch (IOException failure) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "无法读取凭据文件", failure);
        }
    }

    @GetMapping(value = "/stores/web-pixel/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> webPixelStatus(@RequestParam MultiValueMap<String, String> params,
                                            HttpSession session) {
        return body("webpixel.status", params, session, null);
    }

    @PostMapping("/stores/web-pixel/enable")
    public String enableWebPixel(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("webpixel.enable", params, session, model, redirect);
    }

    @PostMapping("/stores/sender-settings")
    public String senderSettings(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("sender-settings.save", params, session, model, redirect);
    }

    @PostMapping("/stores/members/grant")
    public String grantStoreMember(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model,
                                   RedirectAttributes redirect) {
        return view("store-members.grant", params, session, model, redirect);
    }

    @PostMapping("/stores/members/revoke")
    public String revokeStoreMember(@RequestParam MultiValueMap<String, String> params,
                                    HttpSession session, Model model,
                                    RedirectAttributes redirect) {
        return view("store-members.revoke", params, session, model, redirect);
    }

    @PostMapping("/stores/sync")
    public String syncStore(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("store.sync", params, session, model, redirect);
    }

    @GetMapping("/customers")
    public String customers(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("customers.page", params, session, model, redirect);
    }

    @GetMapping("/customers/results")
    public String customerResults(@RequestParam MultiValueMap<String, String> params,
                                  HttpSession session, Model model, RedirectAttributes redirect) {
        return view("customers.results", params, session, model, redirect);
    }

    @GetMapping(value = "/customers/tags/options", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> customerTags(@RequestParam MultiValueMap<String, String> params,
                                          HttpSession session) {
        ResponseEntity<?> response = body("customer-tags.options", params, session, null);
        if (response.getBody() instanceof JSONObject object && object.containsKey("items")) {
            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON).body(object.get("items"));
        }
        return response;
    }

    @PostMapping(value = "/customers/tags/add", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> addCustomerTag(@RequestParam MultiValueMap<String, String> params,
                                            HttpSession session) {
        return body("customer-tags.add", params, session, null);
    }

    @PostMapping(value = "/customers/tags/remove", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> removeCustomerTag(@RequestParam MultiValueMap<String, String> params,
                                               HttpSession session) {
        return body("customer-tags.remove", params, session, null);
    }

    @PostMapping(value = "/segments/from-customer-filter",
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> segmentFromFilter(@RequestParam MultiValueMap<String, String> params,
                                               HttpSession session) {
        return body("segments.from-filter", params, session, null);
    }

    @GetMapping("/customers/imports")
    public String customerImports(@RequestParam MultiValueMap<String, String> params,
                                  HttpSession session, Model model, RedirectAttributes redirect) {
        return view("customer-imports.page", params, session, model, redirect);
    }

    @GetMapping("/customers/imports/template")
    public ResponseEntity<?> customerImportTemplate(HttpSession session) {
        requireUser(session);
        if (customerImportTemplateExporter == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
        }
        return xlsx(customerImportTemplateExporter.export(), "customer-import-template.xlsx");
    }

    @PostMapping("/customers/imports")
    public String uploadCustomers(@RequestParam MultiValueMap<String, String> params,
                                  @RequestParam("file") MultipartFile file,
                                  HttpSession session, Model model,
                                  RedirectAttributes redirect) {
        if (customerImportStore == null || customerImportTransfer == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "客户导入传输服务未配置");
        }
        String reference = null;
        try {
            reference = customerImportStore.save(file);
            LoginedUser user = requireUser(session);
            JSONObject startParameters = parameters(params);
            startParameters.put("originalFilename", file.getOriginalFilename());
            startParameters.put("contentType", file.getContentType() == null
                    ? "application/octet-stream" : file.getContentType());
            startParameters.put("sizeBytes", file.getSize());
            startParameters.put("fileSha256", customerImportStore.sha256(reference));
            JSONObject start = MerchantWebProtocol.validateResponse(client.exchange(
                    "customer-imports.upload-start", user, params.getFirst("shop"),
                    startParameters, null));
            JSONObject ticket = start.getJSONObject("body");
            try {
                uploadCustomerImport(customerImportStore.resolve(reference), ticket, ticket);
            } catch (IOException firstFailure) {
                JSONObject rebindParameters = new JSONObject(true);
                rebindParameters.put("uploadId", ticket.getString("uploadId"));
                rebindParameters.put("uploadToken", ticket.getString("token"));
                JSONObject rebound = MerchantWebProtocol.validateResponse(client.exchange(
                        "customer-imports.upload-endpoint", user, params.getFirst("shop"),
                        rebindParameters, null));
                uploadCustomerImport(customerImportStore.resolve(reference),
                        rebound.getJSONObject("body"), ticket);
            }
            JSONObject completeParameters = parameters(params);
            completeParameters.put("uploadId", ticket.getString("uploadId"));
            completeParameters.put("uploadToken", ticket.getString("token"));
            completeParameters.put("consentState", params.getFirst("consentState"));
            JSONObject complete = client.exchange("customer-imports.upload-complete", user,
                    params.getFirst("shop"), completeParameters, null);
            return support.applyView(complete, model, redirect);
        } catch (IOException | InterruptedException failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "无法将导入文件传输到业务服务", failure);
        } finally {
            if (reference != null) try { customerImportStore.delete(reference); }
            catch (IOException ignored) { }
        }
    }

    private void uploadCustomerImport(java.nio.file.Path file, JSONObject endpoint,
                                      JSONObject ticket)
            throws IOException, InterruptedException {
        customerImportTransfer.upload(file,
                endpoint.getString("serverId"), endpoint.getString("transferBaseUrl"),
                ticket.getString("uploadId"), ticket.getString("token"),
                ticket.getIntValue("chunkSize"), ticket.getIntValue("chunkCount"));
    }

    @GetMapping("/customers/imports/result")
    public ResponseEntity<StreamingResponseBody> customerImportResult(
            @RequestParam MultiValueMap<String, String> params, HttpSession session) {
        if (customerImportTransfer == null) throw new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE, "客户导入传输服务未配置");
        try {
            LoginedUser user = requireUser(session);
            JSONObject ticket = customerImportDownloadTicket(params, user);
            java.net.http.HttpResponse<java.io.InputStream> remote;
            try {
                remote = customerImportTransfer.download(
                        ticket.getString("serverId"), ticket.getString("transferBaseUrl"),
                        ticket.getString("jobId"), ticket.getString("token"));
            } catch (IOException firstFailure) {
                ticket = customerImportDownloadTicket(params, user);
                remote = customerImportTransfer.download(
                        ticket.getString("serverId"), ticket.getString("transferBaseUrl"),
                        ticket.getString("jobId"), ticket.getString("token"));
            }
            JSONObject resolvedTicket = ticket;
            java.net.http.HttpResponse<java.io.InputStream> resolvedRemote = remote;
            StreamingResponseBody stream = output -> {
                try (var input = resolvedRemote.body()) { input.transferTo(output); }
            };
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                            .filename(resolvedTicket.getString("filename"), StandardCharsets.UTF_8)
                            .build().toString())
                    .contentLength(resolvedTicket.getLongValue("sizeBytes")).body(stream);
        } catch (IOException | InterruptedException failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "无法下载导入结果", failure);
        }
    }

    private JSONObject customerImportDownloadTicket(
            MultiValueMap<String, String> params, LoginedUser user) {
        JSONObject response = MerchantWebProtocol.validateResponse(client.exchange(
                "customer-imports.result-download", user, params.getFirst("shop"),
                parameters(params), null));
        return response.getJSONObject("body");
    }

    @GetMapping("/suppressions")
    public String suppressions(@RequestParam MultiValueMap<String, String> params,
                               HttpSession session, Model model, RedirectAttributes redirect) {
        return view("suppressions.page", params, session, model, redirect);
    }

    @GetMapping("/products")
    public String products(@RequestParam MultiValueMap<String, String> params,
                           HttpSession session, Model model, RedirectAttributes redirect) {
        return view("products.page", params, session, model, redirect);
    }

    @GetMapping("/products/detail")
    public String productDetail(@RequestParam MultiValueMap<String, String> params,
                                HttpSession session, Model model, RedirectAttributes redirect) {
        return view("products.detail", params, session, model, redirect);
    }

    @GetMapping("/products/detail/orders")
    public String productOrders(@RequestParam MultiValueMap<String, String> params,
                                HttpSession session, Model model, RedirectAttributes redirect) {
        return view("products.orders", params, session, model, redirect);
    }

    @GetMapping("/orders")
    public String orders(@RequestParam MultiValueMap<String, String> params,
                         HttpSession session, Model model, RedirectAttributes redirect) {
        return view("orders.page", params, session, model, redirect);
    }

    @GetMapping("/discounts")
    public String discounts(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("discounts.page", params, session, model, redirect);
    }

    @GetMapping("/customers/detail")
    public String customerDetail(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        applyShell(params, session, model, redirect, "customers");
        JSONObject body = responseBody("customers.summary", params, session);
        model.addAttribute("customerDetail", body);
        model.addAttribute("timelineWindow", body.get("timelineWindow"));
        model.addAttribute("timelineEarlierKnown", true);
        return "shopify/customer-detail";
    }

    @GetMapping("/customers/detail/timeline")
    public String customerTimeline(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model) {
        MultiValueMap<String, String> remoteParams = timelineParameters(params);
        JSONObject body = responseBody("customers.timeline", remoteParams, session);
        model.addAttribute("selectedShop", params.getFirst("shop"));
        model.addAttribute("customerId", params.getFirst("customerId"));
        model.addAttribute("timelineWindow", body);
        model.addAttribute("timelineEarlierKnown", params.containsKey("checkEarlier"));
        model.addAttribute("timelineGroupPagingEnabled", false);
        model.addAttribute("canViewCampaigns", true);
        return "shopify/fragments/customer-timeline-window";
    }

    @GetMapping("/customers/detail/timeline/group")
    public String customerTimelineGroup(@RequestParam MultiValueMap<String, String> params,
                                        HttpSession session, Model model) {
        JSONObject body = responseBody("customers.timeline", timelineParameters(params), session);
        model.addAttribute("activities", timelineActivities(body, params));
        model.addAttribute("canViewCampaigns", true);
        model.addAttribute("hasMore", false);
        model.addAttribute("nextOffset", 0);
        return "shopify/fragments/customer-timeline-group-page";
    }

    @GetMapping("/templates")
    public String templates(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.page", params, session, model, redirect);
    }

    @PostMapping("/templates")
    public String saveTemplate(@RequestParam MultiValueMap<String, String> params,
                               HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.save", params, session, model, redirect);
    }

    @GetMapping("/templates/platform/catalog")
    public String platformCatalog(@RequestParam MultiValueMap<String, String> params,
                                  HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.platform-catalog", params, session, model, redirect);
    }

    @GetMapping("/templates/bindings")
    public String templateBindings(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.bindings", params, session, model, redirect);
    }

    @PostMapping("/templates/platform/copy")
    public String copyPlatformTemplate(@RequestParam MultiValueMap<String, String> params,
                                       HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.platform-copy", params, session, model, redirect);
    }

    @GetMapping(value = "/templates/platform/preview", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> platformTemplatePreview(
            @RequestParam MultiValueMap<String, String> params, HttpSession session) {
        return body("templates.platform-preview", params, session, null);
    }

    @GetMapping(value = "/templates/preview", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> templatePreview(@RequestParam MultiValueMap<String, String> params,
                                             HttpSession session) {
        return body("templates.preview", params, session, null);
    }

    @GetMapping("/templates/editor")
    public String templateEditor(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.editor", params, session, model, redirect);
    }

    @GetMapping(value = "/templates/products", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> templateProducts(@RequestParam MultiValueMap<String, String> params,
                                              HttpSession session) {
        return bodyItems("templates.products", params, session);
    }

    @GetMapping(value = "/templates/discounts", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> templateDiscounts(@RequestParam MultiValueMap<String, String> params,
                                               HttpSession session) {
        return bodyItems("templates.discounts", params, session);
    }

    @PostMapping("/templates/action")
    public String templateAction(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("templates.action", params, session, model, redirect);
    }

    @GetMapping(value = "/campaigns/template-options", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> templateOptions(@RequestParam MultiValueMap<String, String> params,
                                             HttpSession session) {
        return body("campaigns.template-options", params, session, null);
    }

    @GetMapping("/campaigns")
    public String campaigns(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.page", params, session, model, redirect);
    }

    @PostMapping("/campaigns")
    public String saveCampaign(@RequestParam MultiValueMap<String, String> params,
                               HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.save", params, session, model, redirect);
    }

    @GetMapping("/campaigns/editor")
    public String campaignEditor(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.editor", params, session, model, redirect);
    }

    @GetMapping("/campaigns/detail")
    public String campaignDetail(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.detail", params, session, model, redirect);
    }

    @GetMapping("/campaigns/detail/recipients")
    public String campaignRecipients(@RequestParam MultiValueMap<String, String> params,
                                     HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.recipients", params, session, model, redirect);
    }

    @GetMapping("/campaigns/detail/customer")
    public String campaignCustomer(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model) {
        model.addAttribute("selectedShop", params.getFirst("shop"));
        model.addAttribute("customerDetail", responseBody("customers.summary", params, session));
        return "shopify/fragments/campaign-customer-detail";
    }

    @GetMapping("/campaigns/detail/customer/timeline")
    public String campaignCustomerTimeline(@RequestParam MultiValueMap<String, String> params,
                                           HttpSession session, Model model) {
        LocalDateRange.ensure(params);
        return customerTimeline(params, session, model);
    }

    @GetMapping(value = "/campaigns/detail/progress", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> campaignProgress(@RequestParam MultiValueMap<String, String> params,
                                              HttpSession session) {
        return body("campaigns.progress", params, session, null);
    }

    @GetMapping("/campaigns/preview")
    public ResponseEntity<?> campaignPreview(@RequestParam MultiValueMap<String, String> params,
                                             HttpSession session) {
        return body("campaigns.preview", params, session, null);
    }

    @GetMapping("/customers/campaign-preview")
    public ResponseEntity<?> customerCampaignPreview(
            @RequestParam MultiValueMap<String, String> params, HttpSession session) {
        return body("campaigns.customer-preview", params, session, null);
    }

    @PostMapping("/campaigns/action")
    public String campaignAction(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.action", params, session, model, redirect);
    }

    @GetMapping("/segments")
    public String segments(@RequestParam MultiValueMap<String, String> params,
                           HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.page", params, session, model, redirect);
    }

    @PostMapping("/segments")
    public String saveSegment(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.save", params, session, model, redirect);
    }

    @GetMapping("/segments/editor")
    public String segmentEditor(@RequestParam MultiValueMap<String, String> params,
                                HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.editor", params, session, model, redirect);
    }

    @PostMapping("/segments/preview")
    public String segmentPreview(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.preview", params, session, model, redirect);
    }

    @PostMapping("/segments/preview/results")
    public String segmentPreviewResults(@RequestParam MultiValueMap<String, String> params,
                                        HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.preview-results", params, session, model, redirect);
    }

    @GetMapping("/segments/customer/detail")
    public String segmentCustomer(@RequestParam MultiValueMap<String, String> params,
                                  HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.customer-detail", params, session, model, redirect);
    }

    @GetMapping("/automations")
    public String automations(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.page", params, session, model, redirect);
    }

    @PostMapping("/automations")
    public String createAutomation(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.create", params, session, model, redirect);
    }

    @GetMapping(value = "/automations/detail", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> automationDetail(@RequestParam MultiValueMap<String, String> params,
                                              HttpSession session) {
        return body("automations.detail", params, session, null);
    }

    @PostMapping("/automations/update")
    public String updateAutomation(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.update", params, session, model, redirect);
    }

    @PostMapping("/automations/action")
    public String automationAction(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.action", params, session, model, redirect);
    }

    @GetMapping("/reports")
    public String reports(@RequestParam MultiValueMap<String, String> params,
                          HttpSession session, Model model, RedirectAttributes redirect) {
        return view("reports.page", params, session, model, redirect);
    }

    private String view(String operation, MultiValueMap<String, String> values,
                        HttpSession session, Model model, RedirectAttributes redirect) {
        return view(operation, values, null, session, model, redirect);
    }

    private String view(String operation, MultiValueMap<String, String> values, JSONObject payload,
                        HttpSession session, Model model, RedirectAttributes redirect) {
        JSONObject response = client.exchange(operation, requireUser(session),
                values.getFirst("shop"), parameters(values), payload);
        return support.applyView(response, model, redirect);
    }

    private ResponseEntity<?> body(String operation, MultiValueMap<String, String> values,
                                   HttpSession session, JSONObject payload) {
        return support.applyBody(client.exchange(operation, requireUser(session),
                values.getFirst("shop"), parameters(values), payload));
    }

    private JSONObject responseBody(String operation, MultiValueMap<String, String> values,
                                    HttpSession session) {
        JSONObject response = client.exchange(operation, requireUser(session),
                values.getFirst("shop"), parameters(values), null);
        if (!"JSON".equals(response.getString("kind"))) {
            support.applyBody(response);
            throw new IllegalStateException("Expected JSON response");
        }
        return response.getJSONObject("body");
    }

    private ResponseEntity<?> bodyItems(String operation,
                                        MultiValueMap<String, String> values,
                                        HttpSession session) {
        ResponseEntity<?> response = body(operation, values, session, null);
        if (response.getBody() instanceof JSONObject object && object.containsKey("items")) {
            return ResponseEntity.status(response.getStatusCode())
                    .contentType(MediaType.APPLICATION_JSON).body(object.get("items"));
        }
        return response;
    }

    private void applyShell(MultiValueMap<String, String> values, HttpSession session,
                            Model model, RedirectAttributes redirect, String activeMenu) {
        var params = new org.springframework.util.LinkedMultiValueMap<String, String>();
        params.putAll(values);
        params.set("activeMenu", activeMenu);
        view("shell.load", params, session, model, redirect);
    }

    private JSONObject parameters(MultiValueMap<String, String> source) {
        JSONObject values = new JSONObject(new LinkedHashMap<>());
        source.forEach((key, entries) -> {
            if (entries == null || entries.isEmpty()) return;
            if (entries.size() == 1 && !ARRAY_PARAMETERS.contains(key)) {
                values.put(key, entries.get(0));
            } else {
                JSONArray array = new JSONArray();
                array.addAll(entries);
                values.put(key, array);
            }
        });
        return values;
    }

    private LoginedUser requireUser(HttpSession session) {
        return PlatformUserContext.current(session)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    private ResponseEntity<byte[]> xlsx(byte[] content, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(filename, StandardCharsets.UTF_8).build());
        headers.setContentLength(content.length);
        return new ResponseEntity<>(content, headers, HttpStatus.OK);
    }

    private List<?> timelineActivities(JSONObject timeline, MultiValueMap<String, String> params) {
        JSONArray groups = timeline.getJSONArray("completeGroups");
        if (groups == null || groups.isEmpty()) return List.of();
        int index = parseInt(params.getFirst("groupIndex"), 0);
        if (index < 0 || index >= groups.size()) return List.of();
        JSONArray activities = groups.getJSONObject(index).getJSONArray("activities");
        return activities == null ? List.of() : activities;
    }

    private int parseInt(String value, int fallback) {
        try { return value == null ? fallback : Integer.parseInt(value); }
        catch (NumberFormatException ignored) { return fallback; }
    }

    private MultiValueMap<String, String> timelineParameters(
            MultiValueMap<String, String> source) {
        var result = new org.springframework.util.LinkedMultiValueMap<String, String>();
        result.putAll(source);
        if (!result.containsKey("fromDate") && result.getFirst("timelineFromDate") != null) {
            result.set("fromDate", result.getFirst("timelineFromDate"));
        }
        if (!result.containsKey("toDate") && result.getFirst("timelineToDate") != null) {
            result.set("toDate", result.getFirst("timelineToDate"));
        }
        return result;
    }

    private static final class LocalDateRange {
        private static void ensure(MultiValueMap<String, String> params) {
            if (!params.containsKey("timelineToDate")) {
                java.time.LocalDate to = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai"));
                params.set("timelineToDate", to.toString());
                params.set("timelineFromDate", to.minusDays(29).toString());
                params.set("fromDate", to.minusDays(29).toString());
                params.set("toDate", to.toString());
            }
        }
    }
}
