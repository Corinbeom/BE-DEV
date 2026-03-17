package com.devweb.infra.ai;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.stereotype.Component;

@Component
public class AiMetrics {

    private final MeterRegistry registry;

    public AiMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public Timer.Sample startTimer() {
        return Timer.start(registry);
    }

    public void recordSuccess(Timer.Sample sample, String provider, String profile) {
        sample.stop(Timer.builder("devweb.ai.call.duration")
                .tag("provider", provider)
                .tag("profile", profile)
                .description("AI API call duration")
                .register(registry));
    }

    public void recordRetry(String provider, String profile) {
        Counter.builder("devweb.ai.call.retry")
                .tag("provider", provider)
                .tag("profile", profile)
                .description("AI API call retry count")
                .register(registry)
                .increment();
    }

    public void recordRateLimit(String provider) {
        Counter.builder("devweb.ai.call.ratelimit")
                .tag("provider", provider)
                .description("AI API rate limit count")
                .register(registry)
                .increment();
    }
}
