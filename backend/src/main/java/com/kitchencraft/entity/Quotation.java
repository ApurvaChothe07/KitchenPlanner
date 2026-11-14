package com.kitchencraft.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "quotations", indexes = {
        @Index(name = "idx_quotations_project", columnList = "project_id"),
        @Index(name = "idx_quotations_design", columnList = "design_id"),
        @Index(name = "idx_quotations_number", columnList = "quotation_number"),
        @Index(name = "idx_quotations_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Quotation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "quotation_number", nullable = false, unique = true, length = 50)
    private String quotationNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "design_id", nullable = false)
    private Design design;

    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private QuotationStatus status = QuotationStatus.DRAFT;

    @Column(name = "client_name", length = 150)
    private String clientName;

    @Column(name = "client_email", length = 150)
    private String clientEmail;

    @Column(name = "client_phone", length = 50)
    private String clientPhone;

    @Column(name = "carcass_material_snapshot", length = 150)
    private String carcassMaterialSnapshot;

    @Column(name = "shutter_material_snapshot", length = 150)
    private String shutterMaterialSnapshot;

    @Column(name = "countertop_material_snapshot", length = 150)
    private String countertopMaterialSnapshot;

    @Column(name = "material_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal materialSubtotal;

    @Column(name = "wastage_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal wastagePercentage;

    @Column(name = "wastage_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal wastageAmount;

    @Column(name = "labor_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal laborPercentage;

    @Column(name = "labor_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal laborAmount;

    @Column(name = "installation_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal installationPercentage;

    @Column(name = "installation_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal installationAmount;

    @Column(name = "gross_subtotal", nullable = false, precision = 12, scale = 2)
    private BigDecimal grossSubtotal;

    @Column(name = "discount_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    @Column(name = "discount_amount", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "net_taxable_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal netTaxableAmount;

    @Column(name = "tax_percentage", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxPercentage = new BigDecimal("18.00");

    @Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "final_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal finalTotal;

    @Column(name = "valid_until")
    private LocalDate validUntil;

    @Column(name = "issued_at")
    private Instant issuedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @OneToMany(mappedBy = "quotation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("sortOrder ASC, id ASC")
    private List<QuotationItem> items = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public void addItem(QuotationItem item) {
        items.add(item);
        item.setQuotation(this);
    }

    public void removeItem(QuotationItem item) {
        items.remove(item);
        item.setQuotation(null);
    }
}
