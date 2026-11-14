package com.kitchencraft.repository;

import com.kitchencraft.entity.Material;
import com.kitchencraft.entity.MaterialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    List<Material> findAllByActiveTrueOrderByCategoryAscNameAsc();

    List<Material> findAllByCategoryAndActiveTrueOrderByNameAsc(MaterialCategory category);

    Optional<Material> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);
}
