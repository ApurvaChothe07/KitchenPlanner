package com.kitchencraft.entity;

public enum QuotationStatus {
    DRAFT,
    ISSUED,
    CANCELLED;

    public boolean canTransitionTo(QuotationStatus newStatus) {
        if (this == newStatus) {
            return true;
        }
        return switch (this) {
            case DRAFT -> newStatus == ISSUED || newStatus == CANCELLED;
            case ISSUED -> newStatus == CANCELLED;
            case CANCELLED -> false; // Terminal state
        };
    }
}
