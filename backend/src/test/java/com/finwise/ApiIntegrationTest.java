package com.finwise;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Real Postgres via Testcontainers; tokens are mocked, so Okta is never called. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Testcontainers
class ApiIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private static JwtRequestPostProcessor user(String sub) {
        return jwt().jwt(j -> j.subject(sub).claim("email", sub + "@example.com").audience(java.util.List.of("api://finwise")));
    }

    private long createAccount(JwtRequestPostProcessor who, String name) throws Exception {
        String body = mvc.perform(post("/api/accounts").with(who).contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","type":"BANK","openingBalance":1000.00}""".formatted(name)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body).get("id").asLong();
    }

    private String txnJson(long accountId, String amount, String date, String description) {
        return """
                {"accountId":%d,"amount":%s,"type":"EXPENSE","txnDate":"%s","description":"%s","tags":["food"]}"""
                .formatted(accountId, amount, date, description);
    }

    @Test
    void requestWithoutTokenIsRejectedWith401() throws Exception {
        mvc.perform(get("/api/me")).andExpect(status().isUnauthorized());
    }

    @Test
    void invalidBearerTokenIsRejectedWith401() throws Exception {
        mvc.perform(get("/api/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }

    @Test
    void firstLoginCreatesLocalUserWithDefaults() throws Exception {
        mvc.perform(get("/api/me").with(user("okta|first-login")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("okta|first-login@example.com")))
                .andExpect(jsonPath("$.currency", is("INR")))
                .andExpect(jsonPath("$.monthStartDay", is(1)));
        // second call returns the same user, not a new one
        mvc.perform(get("/api/me").with(user("okta|first-login"))).andExpect(status().isOk());
    }

    @Test
    void defaultCategoriesAreVisibleToEveryUser() throws Exception {
        mvc.perform(get("/api/categories").with(user("okta|cat-user")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.name=='Groceries')].isDefault").value(true));
    }

    @Test
    void userCannotSeeOrTouchAnotherUsersData() throws Exception {
        var userA = user("okta|user-a");
        var userB = user("okta|user-b");

        long accountA = createAccount(userA, "A's bank");
        String created = mvc.perform(post("/api/transactions").with(userA).contentType(MediaType.APPLICATION_JSON)
                        .content(txnJson(accountA, "450.00", "2026-11-01", "Dinner")))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long txnA = json.readTree(created).get("id").asLong();

        // B sees none of A's accounts or transactions
        mvc.perform(get("/api/accounts").with(userB)).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/transactions").with(userB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements", is(0)));

        // B cannot delete A's transaction or account (404, existence not leaked)
        mvc.perform(delete("/api/transactions/" + txnA).with(userB)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/accounts/" + accountA).with(userB)).andExpect(status().isNotFound());

        // B cannot attach a transaction to A's account
        mvc.perform(post("/api/transactions").with(userB).contentType(MediaType.APPLICATION_JSON)
                        .content(txnJson(accountA, "10.00", "2026-11-01", "Sneaky")))
                .andExpect(status().isNotFound());

        // A's data is untouched
        mvc.perform(get("/api/transactions").with(userA)).andExpect(jsonPath("$.totalElements", is(1)));
    }

    @Test
    void transactionsAreFilteredAndPaginatedWithAmountsKeptExact() throws Exception {
        var who = user("okta|filter-user");
        long account = createAccount(who, "Main");
        for (int i = 1; i <= 5; i++) {
            mvc.perform(post("/api/transactions").with(who).contentType(MediaType.APPLICATION_JSON)
                            .content(txnJson(account, "0.10", "2026-10-0" + i, i == 3 ? "Zomato order" : "Misc " + i)))
                    .andExpect(status().isCreated());
        }

        mvc.perform(get("/api/transactions").with(who).param("size", "2"))
                .andExpect(jsonPath("$.content", hasSize(2)))
                .andExpect(jsonPath("$.size", is(2)))
                .andExpect(jsonPath("$.totalElements", is(5)))
                .andExpect(jsonPath("$.content[0].txnDate", is("2026-10-05"))); // newest first

        mvc.perform(get("/api/transactions").with(who).param("q", "zomato"))
                .andExpect(jsonPath("$.totalElements", is(1)));

        mvc.perform(get("/api/transactions").with(who).param("from", "2026-10-04").param("to", "2026-10-05"))
                .andExpect(jsonPath("$.totalElements", is(2)));

        // page size is capped at 100
        mvc.perform(get("/api/transactions").with(who).param("size", "5000"))
                .andExpect(jsonPath("$.size", is(100)));

        // no floating-point drift: five 0.10 amounts, each returned as exactly 0.10
        String body = mvc.perform(get("/api/transactions").with(who))
                .andReturn().getResponse().getContentAsString();
        for (JsonNode n : json.readTree(body).get("content")) {
            org.junit.jupiter.api.Assertions.assertEquals(0, n.get("amount").decimalValue().compareTo(new java.math.BigDecimal("0.10")));
        }
    }

    @Test
    void invalidTransactionReturnsStandardErrorShape() throws Exception {
        var who = user("okta|validation-user");
        long account = createAccount(who, "Main");
        mvc.perform(post("/api/transactions").with(who).contentType(MediaType.APPLICATION_JSON)
                        .content(txnJson(account, "-5.00", "2026-11-01", "Bad")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("VALIDATION_ERROR")))
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.details").isArray());
    }
}
