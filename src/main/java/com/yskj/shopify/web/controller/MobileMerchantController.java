package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONArray;
import com.alibaba.fastjson.JSONObject;
import com.yskj.dao.dto.org.LoginedUser;
import com.yskj.shopify.web.security.PlatformUserContext;
import com.yskj.shopify.web.service.MerchantWebFacadeClient;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.servlet.http.HttpSession;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Controller
public class MobileMerchantController {
    private static final Set<String> ARRAY_PARAMETERS = Set.of(
            "fields", "operators", "values", "groupIds", "groupMatchModes", "ruleGroupIds");
    private static final Map<String, String> VIEWS = Map.of(
            "shopify/dashboard", "mobile/dashboard",
            "shopify/campaigns", "mobile/campaigns",
            "shopify/customers", "mobile/customers",
            "shopify/segments", "mobile/segments",
            "shopify/segment-editor", "mobile/segment-editor",
            "shopify/fragments/segment-preview-results", "mobile/fragments/segment-preview-results",
            "shopify/automations", "mobile/automations",
            "shopify/campaign-editor", "mobile/campaign-editor",
            "shopify/campaign-detail", "mobile/campaign-detail");
    private static final Map<String, String> REDIRECTS = Map.of(
            "redirect:/campaigns", "redirect:/mobile/campaigns",
            "redirect:/campaigns/editor", "redirect:/mobile/campaigns/editor",
            "redirect:/campaigns/detail", "redirect:/mobile/campaigns/detail",
            "redirect:/segments", "redirect:/mobile/segments",
            "redirect:/segments/editor", "redirect:/mobile/segments/editor",
            "redirect:/automations", "redirect:/mobile/automations");

    private final MerchantWebFacadeClient client;
    private final RemotePageSupport support;

    public MobileMerchantController(MerchantWebFacadeClient client, RemotePageSupport support) {
        this.client = client;
        this.support = support;
    }

    @GetMapping({"/mobile", "/mobile/dashboard"})
    public String dashboard(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("dashboard.load", params, session, model, redirect);
    }

    @GetMapping("/mobile/campaigns")
    public String campaigns(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.page", params, session, model, redirect);
    }

    @GetMapping("/mobile/campaigns/editor")
    public String editor(@RequestParam MultiValueMap<String, String> params,
                         HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.editor", params, session, model, redirect);
    }

    @GetMapping("/mobile/customers")
    public String customers(@RequestParam MultiValueMap<String, String> params,
                            HttpSession session, Model model, RedirectAttributes redirect) {
        String page = view("customers.page", params, session, model, redirect);
        model.addAttribute("customerResultsLoaded", false);
        Object shop = model.asMap().get("selectedShop");
        if ("1".equals(params.getFirst("query")) && shop != null && !shop.toString().isBlank()) {
            var selected = new org.springframework.util.LinkedMultiValueMap<String, String>(params);
            selected.set("shop", shop.toString());
            String result = support.applyView(request("customers.results", selected, session), model, redirect);
            if (!"shopify/fragments/customer-results".equals(result)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unexpected customer results");
            }
            model.addAttribute("customerResultsLoaded", true);
        }
        return page;
    }

    @GetMapping("/mobile/customers/detail")
    public String customerDetail(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model) {
        var selected = new org.springframework.util.LinkedMultiValueMap<String, String>(params);
        selected.set("activeMenu", "customers");
        body("shell.load", selected, session).forEach(model::addAttribute);
        Object shop = model.asMap().get("selectedShop");
        if (shop == null || shop.toString().isBlank()) return "redirect:/mobile/customers";
        selected.set("shop", shop.toString());
        JSONObject summary = body("customers.summary", selected, session);
        model.addAttribute("customerDetail", summary);
        if (params.containsKey("timelineFromDate") || params.containsKey("timelineToDate")) {
            selected.set("fromDate", params.getFirst("timelineFromDate"));
            selected.set("toDate", params.getFirst("timelineToDate"));
        } else {
            var today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai"));
            selected.set("fromDate", today.minusDays(29).toString());
            selected.set("toDate", today.toString());
        }
        model.addAttribute("timelineWindow", body("customers.timeline", selected, session));
        return "mobile/customer-detail";
    }

    @GetMapping("/mobile/campaigns/detail")
    public String detail(@RequestParam MultiValueMap<String, String> params,
                         HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.detail", params, session, model, redirect);
    }

    @PostMapping("/mobile/campaigns")
    public String save(@RequestParam MultiValueMap<String, String> params,
                       HttpSession session, Model model, RedirectAttributes redirect) {
        var campaignIds = params.get("campaignId");
        if (campaignIds != null && campaignIds.stream().anyMatch(id -> id != null && !id.isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "已有活动请在电脑端编辑");
        }
        return view("campaigns.save", params, session, model, redirect);
    }

    @GetMapping("/mobile/segments")
    public String segments(@RequestParam MultiValueMap<String, String> params,
                           HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.page", params, session, model, redirect);
    }

    @GetMapping("/mobile/segments/editor")
    public String segmentEditor(@RequestParam MultiValueMap<String, String> params,
                                HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.editor", params, session, model, redirect);
    }

    @PostMapping("/mobile/segments")
    public String saveSegment(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.save", params, session, model, redirect);
    }

    @PostMapping("/mobile/segments/preview/results")
    public String previewSegment(@RequestParam MultiValueMap<String, String> params,
                                 HttpSession session, Model model, RedirectAttributes redirect) {
        return view("segments.preview-results", params, session, model, redirect);
    }

    @GetMapping("/mobile/automations")
    public String automations(@RequestParam MultiValueMap<String, String> params,
                              HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.page", params, session, model, redirect);
    }

    @PostMapping("/mobile/automations")
    public String createAutomation(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.create", params, session, model, redirect);
    }

    @PostMapping("/mobile/automations/update")
    public String updateAutomation(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.update", params, session, model, redirect);
    }

    @PostMapping("/mobile/automations/action")
    public String automationAction(@RequestParam MultiValueMap<String, String> params,
                                   HttpSession session, Model model, RedirectAttributes redirect) {
        return view("automations.action", params, session, model, redirect);
    }

    @PostMapping("/mobile/campaigns/test-send")
    public String testSend(@RequestParam MultiValueMap<String, String> params,
                           HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.test-send", params, session, model, redirect);
    }

    @PostMapping("/mobile/campaigns/action")
    public String action(@RequestParam MultiValueMap<String, String> params,
                         HttpSession session, Model model, RedirectAttributes redirect) {
        return view("campaigns.action", params, session, model, redirect);
    }

    private String view(String operation, MultiValueMap<String, String> source,
                        HttpSession session, Model model, RedirectAttributes redirect) {
        JSONObject response = request(operation, source, session);
        String remoteView = support.applyView(response, model, redirect);
        String mobileView = VIEWS.get(remoteView);
        if (mobileView == null) mobileView = REDIRECTS.get(remoteView);
        if (mobileView == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unsupported mobile response");
        return mobileView;
    }

    private JSONObject request(String operation, MultiValueMap<String, String> source, HttpSession session) {
        LoginedUser user = PlatformUserContext.current(session)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return client.exchange(operation, user, source.getFirst("shop"), parameters(source), null);
    }

    private JSONObject body(String operation, MultiValueMap<String, String> source, HttpSession session) {
        Object body = support.applyBody(request(operation, source, session)).getBody();
        if (body instanceof JSONObject value) return value;
        throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unexpected customer data");
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
}
