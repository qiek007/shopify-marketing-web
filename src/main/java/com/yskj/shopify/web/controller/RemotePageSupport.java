package com.yskj.shopify.web.controller;

import com.alibaba.fastjson.JSONObject;
import com.yskj.shopify.contract.web.MerchantWebProtocol;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.ui.Model;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.nio.charset.StandardCharsets;

@Component
public class RemotePageSupport {

    public String applyView(JSONObject source,
                            Model model,
                            RedirectAttributes redirectAttributes) {
        JSONObject response = MerchantWebProtocol.validateResponse(source);
        String kind = response.getString("kind");
        if (MerchantWebProtocol.ERROR.equals(kind)) throw remoteError(response);
        if (MerchantWebProtocol.VIEW.equals(kind)) {
            JSONObject values = response.getJSONObject("model");
            if (values != null) values.forEach(model::addAttribute);
            return response.getString("viewName");
        }
        if (MerchantWebProtocol.REDIRECT.equals(kind)) {
            JSONObject flash = response.getJSONObject("flash");
            if (flash != null) flash.forEach(redirectAttributes::addFlashAttribute);
            JSONObject parameters = response.getJSONObject("parameters");
            if (parameters != null) parameters.forEach(redirectAttributes::addAttribute);
            return "redirect:" + response.getString("location");
        }
        throw new IllegalArgumentException("Remote response is not a page response: " + kind);
    }

    public ResponseEntity<?> applyBody(JSONObject source) {
        JSONObject response = MerchantWebProtocol.validateResponse(source);
        String kind = response.getString("kind");
        if (MerchantWebProtocol.ERROR.equals(kind)) throw remoteError(response);
        if (MerchantWebProtocol.JSON.equals(kind)) {
            return ResponseEntity.status(response.getIntValue("httpStatus"))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(response.getJSONObject("body"));
        }
        if (MerchantWebProtocol.BINARY.equals(kind)) {
            byte[] body = MerchantWebProtocol.decodeBinary(response);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(response.getString("contentType")));
            ContentDisposition.Builder disposition = response.getBooleanValue("inline")
                    ? ContentDisposition.inline() : ContentDisposition.attachment();
            headers.setContentDisposition(disposition
                    .filename(response.getString("filename"), StandardCharsets.UTF_8).build());
            headers.setContentLength(body.length);
            return new ResponseEntity<>(body, headers,
                    org.springframework.http.HttpStatus.valueOf(response.getIntValue("httpStatus")));
        }
        throw new IllegalArgumentException("Remote response is not a body response: " + kind);
    }

    private ResponseStatusException remoteError(JSONObject response) {
        return new ResponseStatusException(
                org.springframework.http.HttpStatus.valueOf(response.getIntValue("httpStatus")),
                response.getString("message"));
    }
}
