package com.devweb;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class DevWebApplication {
    public static void main(String[] args) {
        SpringApplication.run(DevWebApplication.class, args);
    }
}


