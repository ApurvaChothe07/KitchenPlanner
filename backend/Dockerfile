# Multi-stage Dockerfile for KitchenCraft Spring Boot Backend
# =========================================================
# Stage 1: Build stage
# =========================================================
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install bash for the maven wrapper script
RUN apk add --no-cache bash

# Copy Maven wrapper configuration and pom.xml for dependency layer caching
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and package executable production jar
COPY src src
RUN ./mvnw clean package -DskipTests -B

# =========================================================
# Stage 2: Minimal hardened runtime stage
# =========================================================
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Install curl for container health check
RUN apk add --no-cache curl

# Create unprivileged application user and group (security hardening)
RUN addgroup -S spring && adduser -S spring -G spring

# Copy compiled executable jar from builder stage
COPY --from=builder /workspace/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring:spring

EXPOSE 8080

# Environment variables with container-friendly JVM memory defaults
# Secrets are NEVER baked into the image; they must be provided at runtime
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Container healthcheck querying Spring Boot Actuator
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
