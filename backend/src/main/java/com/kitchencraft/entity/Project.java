package com.kitchencraft.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects", indexes = {
        @Index(name = "idx_projects_owner", columnList = "owner_id"),
        @Index(name = "idx_projects_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(name = "client_email")
    private String clientEmail;

    @Column(name = "client_phone", length = 50)
    private String clientPhone;

    @Column(name = "client_address", columnDefinition = "TEXT")
    private String clientAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ProjectStatus status = ProjectStatus.DRAFT;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Design> designs = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addDesign(Design design) {
        designs.add(design);
        design.setProject(this);
    }

    public void removeDesign(Design design) {
        designs.remove(design);
        design.setProject(null);
    }
}
