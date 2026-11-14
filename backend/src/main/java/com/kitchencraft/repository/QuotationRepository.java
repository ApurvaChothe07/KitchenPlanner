package com.kitchencraft.repository;

import com.kitchencraft.entity.Quotation;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuotationRepository extends JpaRepository<Quotation, Long> {

    List<Quotation> findAllByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<Quotation> findByQuotationNumber(String quotationNumber);

    boolean existsByQuotationNumber(String quotationNumber);

    @Query("SELECT q FROM Quotation q JOIN FETCH q.project p JOIN FETCH p.owner WHERE q.id = :id")
    Optional<Quotation> findByIdWithProjectAndOwner(@Param("id") Long id);

    @Query("SELECT q FROM Quotation q JOIN FETCH q.project p JOIN FETCH p.owner LEFT JOIN FETCH q.items WHERE q.id = :id")
    Optional<Quotation> findByIdWithItemsAndProject(@Param("id") Long id);

    @Query("SELECT COUNT(q) FROM Quotation q WHERE q.project.id = :projectId")
    long countByProjectId(@Param("projectId") Long projectId);
}
