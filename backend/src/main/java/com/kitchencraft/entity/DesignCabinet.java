package com.kitchencraft.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "design_cabinets", indexes = {
        @Index(name = "idx_design_cabinets_design", columnList = "design_id"),
        @Index(name = "idx_design_cabinets_type", columnList = "cabinet_type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesignCabinet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "design_id", nullable = false)
    private Design design;

    @Enumerated(EnumType.STRING)
    @Column(name = "cabinet_type", nullable = false, length = 50)
    private CabinetType cabinetType;

    @Column(name = "width_mm", nullable = false)
    private Integer widthMm;

    @Column(name = "depth_mm", nullable = false)
    private Integer depthMm;

    @Column(name = "height_mm", nullable = false)
    private Integer heightMm;

    @Column(name = "pos_x_mm", nullable = false)
    @Builder.Default
    private Double posX = 0.0;

    @Column(name = "pos_y_mm", nullable = false)
    @Builder.Default
    private Double posY = 0.0;

    @Column(name = "pos_z_mm", nullable = false)
    @Builder.Default
    private Double posZ = 0.0;

    @Column(name = "rotation_deg", nullable = false)
    @Builder.Default
    private Double rotation = 0.0;

    @Column(name = "carcass_material", length = 100)
    private String carcassMaterial;

    @Column(name = "shutter_material", length = 100)
    private String shutterMaterial;

    @Column(name = "finish_color", length = 100)
    private String finishColor;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
