package com.devweb.api.health;

import io.swagger.v3.oas.annotations.Hidden;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Hidden
@RestController
public class HealthController {

    @GetMapping("/")
    public String health() {
        return "ok";
    }
}
