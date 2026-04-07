package com.devweb.infra.ai;

import java.util.List;
import java.util.regex.Pattern;

/**
 * AI 응답 텍스트에서 한국어 이외의 CJK 문자(중국어 한자, 일본어 히라가나/가타카나)를 제거한다.
 * Llama 계열 모델이 한국어 출력 중 간헐적으로 중국어/일본어를 혼입하는 문제를 후처리로 해결.
 */
public final class AiTextSanitizer {

    private AiTextSanitizer() {}

    // 일본어 히라가나 + 가타카나
    // CJK 통합 한자 (한국어 한자도 포함되지만, 이 서비스 맥락에서 한자는 불필요)
    // CJK 확장 A/B
    private static final Pattern NON_KOREAN_CJK = Pattern.compile(
            "[\\u3040-\\u309F" +   // Hiragana
            "\\u30A0-\\u30FF" +    // Katakana
            "\\u4E00-\\u9FFF" +    // CJK Unified Ideographs
            "\\u3400-\\u4DBF" +    // CJK Extension A
            "\\uF900-\\uFAFF]"     // CJK Compatibility Ideographs
    );

    public static String sanitize(String text) {
        if (text == null) return null;
        return NON_KOREAN_CJK.matcher(text).replaceAll("").replaceAll("\\s{2,}", " ").trim();
    }

    public static List<String> sanitizeList(List<String> items) {
        if (items == null) return null;
        return items.stream().map(AiTextSanitizer::sanitize).toList();
    }
}
