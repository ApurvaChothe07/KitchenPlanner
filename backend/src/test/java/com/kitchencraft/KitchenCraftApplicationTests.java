package com.kitchencraft;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class KitchenCraftApplicationTests {

    @Test
    @DisplayName("Application Context should load cleanly")
    void contextLoads() {
    }
}
