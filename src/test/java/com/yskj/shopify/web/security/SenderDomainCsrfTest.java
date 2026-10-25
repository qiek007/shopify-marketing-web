package com.yskj.shopify.web.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.web.server.ResponseStatusException;
import static org.assertj.core.api.Assertions.*;

class SenderDomainCsrfTest {
    @Test void tokensAreStableWithinActorSessionButNotSharedAcrossSessions() {
        var session=new MockHttpSession();String token=SenderDomainCsrf.issue(session,"org:user");
        assertThat(token).hasSize(43);assertThat(SenderDomainCsrf.issue(session,"org:user")).isEqualTo(token);
        assertThat(SenderDomainCsrf.issue(new MockHttpSession(),"org:user")).isNotEqualTo(token);
        assertThatCode(()->SenderDomainCsrf.require(session,"org:user",token)).doesNotThrowAnyException();
    }
    @Test void missingWrongAndOtherActorsAreRejectedWithoutCreatingTokens() {
        var session=new MockHttpSession();
        assertThatThrownBy(()->SenderDomainCsrf.require(session,"org:user",null)).isInstanceOf(ResponseStatusException.class);
        String token=SenderDomainCsrf.issue(session,"org:user");
        assertThatThrownBy(()->SenderDomainCsrf.require(session,"org:user","wrong")).isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(()->SenderDomainCsrf.require(session,"other:user",token)).isInstanceOf(ResponseStatusException.class);
        String rotated=SenderDomainCsrf.issue(session,"org:new-user");assertThat(rotated).isNotEqualTo(token);
        assertThatThrownBy(()->SenderDomainCsrf.require(session,"org:new-user",token)).isInstanceOf(ResponseStatusException.class);
    }
}
