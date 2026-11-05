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
            "shopify/campaign-editor", "mobile/campaign-editor",
            "shopify/campaign-detail", "mobile/campaign-detail");
    private static final Map<String, String> REDIRECTS = Map.of(
            "redirect:/campaigns", "redirect:/mobile/campaigns",
            "redirect:/campaigns/editor", "redirect:/mobile/campaigns/editor",
            "redirect:/campaigns/detail", "redirect:/mobile/campaigns/detail");

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
        LoginedUser user = PlatformUserContext.current(session)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        JSONObject response = client.exchange(operation, user, source.getFirst("shop"), parameters(source), null);
        String remoteView = support.applyView(response, model, redirect);
        String mobileView = VIEWS.get(remoteView);
        if (mobileView == null) mobileView = REDIRECTS.get(remoteView);
        if (mobileView == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Unsupported mobile response");
        return mobileView;
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
