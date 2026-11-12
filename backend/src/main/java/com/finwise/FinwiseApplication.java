package com.finwise;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FinwiseApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinwiseApplication.class, args);
    }

    /** All month boundaries are computed in IST. */
    @PostConstruct
    void setDefaultZone() {
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }
}
