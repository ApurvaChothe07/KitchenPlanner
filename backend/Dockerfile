# Multi-stage Dockerfile for KitchenCraft Spring Boot Backend
# Stage 1: Build stage
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /workspace

# Install bash/curl if needed
RUN apk add --no-cache bash

# Copy maven wrapper and pom.xml for layer caching
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B || true

# Copy source code and build production jar
COPY src src
RUN ./mvnw clean package -DskipTests -B

# Stage 2: Minimal hardened runtime stage
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Run as non-privileged security user
RUN addgroup -S spring && adduser -S spring -G spring

# Copy compiled jar from builder stage
COPY --from=builder /workspace/target/*.jar app.jar
RUN chown spring:spring app.jar

USER spring:spring

EXPOSE 8080

# Environment variables with sensible container defaults
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
