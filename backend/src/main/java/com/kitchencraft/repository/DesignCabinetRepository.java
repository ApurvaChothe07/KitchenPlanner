package com.kitchencraft.repository;

import com.kitchencraft.entity.DesignCabinet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignCabinetRepository extends JpaRepository<DesignCabinet, Long> {

    List<DesignCabinet> findAllByDesignIdOrderByIdAsc(Long designId);

    Optional<DesignCabinet> findByIdAndDesignId(Long id, Long designId);
}
