package com.devweb.infra.storage.s3;

import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.domain.resume.session.port.FileStoragePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.net.URI;
import java.util.UUID;

@Component
@Profile("prod")
public class SupabaseS3FileStorageAdapter implements FileStoragePort {

    private final S3Client s3Client;
    private final String bucket;

    public SupabaseS3FileStorageAdapter(
            @Value("${devweb.storage.s3.endpoint}") String endpoint,
            @Value("${devweb.storage.s3.region:ap-southeast-1}") String region,
            @Value("${devweb.storage.s3.access-key-id}") String accessKeyId,
            @Value("${devweb.storage.s3.secret-access-key}") String secretAccessKey,
            @Value("${devweb.storage.s3.bucket}") String bucket
    ) {
        this.bucket = bucket;
        this.s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKeyId, secretAccessKey)))
                .forcePathStyle(true)
                .httpClientBuilder(software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient.builder())
                .build();
    }

    @Override
    public StoredFileRef save(byte[] bytes, String originalFilename, String contentType) {
        if (bytes == null || bytes.length == 0) throw new IllegalArgumentException("bytes는 필수입니다.");

        String safeName = originalFilename == null ? "file" : originalFilename.replaceAll("[\\\\/]", "_");
        String ext = "";
        int dot = safeName.lastIndexOf('.');
        if (dot >= 0 && dot < safeName.length() - 1) ext = safeName.substring(dot);

        String key = "resume/" + UUID.randomUUID() + ext;
        String resolvedContentType = contentType != null ? contentType : "application/octet-stream";

        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(key)
                .contentType(resolvedContentType)
                .contentLength((long) bytes.length)
                .build();

        s3Client.putObject(request, RequestBody.fromBytes(bytes));

        return new StoredFileRef(key, originalFilename, contentType, (long) bytes.length);
    }

    @Override
    public byte[] load(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) throw new IllegalArgumentException("storageKey는 필수입니다.");
        ResponseBytes<GetObjectResponse> obj = s3Client.getObject(
                GetObjectRequest.builder().bucket(bucket).key(storageKey).build(),
                ResponseTransformer.toBytes()
        );
        return obj.asByteArray();
    }

    @Override
    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) return;
        s3Client.deleteObject(DeleteObjectRequest.builder()
                .bucket(bucket)
                .key(storageKey)
                .build());
    }
}
