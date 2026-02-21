package com.devweb.infra.text;

import com.devweb.domain.resume.session.port.TextExtractorPort;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Component
public class PdfBoxTextExtractorAdapter implements TextExtractorPort {

    @Override
    public String extract(byte[] bytes, String contentType) {
        if (bytes == null || bytes.length == 0) throw new IllegalArgumentException("bytes는 필수입니다.");

        boolean looksPdf = (contentType != null && contentType.toLowerCase().contains("pdf"))
                || (bytes.length >= 4
                && bytes[0] == '%'
                && bytes[1] == 'P'
                && bytes[2] == 'D'
                && bytes[3] == 'F');

        if (!looksPdf) {
            return new String(bytes, StandardCharsets.UTF_8);
        }

        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (IOException e) {
            throw new IllegalArgumentException("PDF 텍스트 추출에 실패했습니다.", e);
        }
    }
}

