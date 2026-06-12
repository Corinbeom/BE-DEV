package com.bluehour.domain.resume.mail.port;

public interface EmailSenderPort {

    void send(String to, String subject, String htmlBody);
}
