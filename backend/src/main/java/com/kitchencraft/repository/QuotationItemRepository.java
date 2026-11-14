package com.kitchencraft.repository;

import com.kitchencraft.entity.QuotationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuotationItemRepository extends JpaRepository<QuotationItem, Long> {

    List<QuotationItem> findAllByQuotationIdOrderBySortOrderAscIdAsc(Long quotationId);
}
