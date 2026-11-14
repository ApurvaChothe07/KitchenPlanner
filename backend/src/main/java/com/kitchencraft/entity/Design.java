package com.kitchencraft.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "designs",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_designs_project_version", columnNames = {"project_id", "version"})
        },
        indexes = {
                @Index(name = "idx_designs_project", columnList = "project_id")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Design {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, length = 200)
    @Builder.Default
    private String name = "Initial Design";

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Column(name = "room_width_mm", nullable = false)
    private Integer roomWidthMm;

    @Column(name = "room_length_mm", nullable = false)
    private Integer roomLengthMm;

    @Column(name = "room_height_mm", nullable = false)
    private Integer roomHeightMm;

    @Enumerated(EnumType.STRING)
    @Column(name = "layout_type", nullable = false, length = 50)
    @Builder.Default
    private LayoutType layoutType = LayoutType.L_SHAPED;

    @Column(name = "layout_data_json", columnDefinition = "TEXT")
    private String layoutDataJson;

    @OneToMany(mappedBy = "design", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DesignCabinet> cabinets = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addCabinet(DesignCabinet cabinet) {
        cabinets.add(cabinet);
        cabinet.setDesign(this);
    }

    public void removeCabinet(DesignCabinet cabinet) {
        cabinets.remove(cabinet);
        cabinet.setDesign(null);
    }
}
