package com.yskj.shopify.web.controller;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CampaignTestUnsubscribeControllerTest {

    @Test
    void publicTestUnsubscribeEndpointExplainsThatItIsANoOp() {
        CampaignTestUnsubscribeController controller = new CampaignTestUnsubscribeController();

        assertThat(controller.explain().getBody())
                .contains("这是测试邮件", "不会改变任何客户的订阅状态");
        assertThat(controller.oneClick().getStatusCodeValue()).isEqualTo(204);
    }
}
