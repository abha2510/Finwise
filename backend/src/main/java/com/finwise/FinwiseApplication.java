package com.finwise;

import java.util.TimeZone;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FinwiseApplication {

    public static void main(String[] args) {
        // Must run before anything connects to the database. All month boundaries use IST.
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
        SpringApplication.run(FinwiseApplication.class, args);
    }
}