package com.kitchencraft.repository;

import com.kitchencraft.entity.Design;
import com.kitchencraft.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DesignRepository extends JpaRepository<Design, Long> {

    List<Design> findAllByProjectIdOrderByVersionDesc(Long projectId);

    Optional<Design> findByIdAndProjectOwner(Long id, User owner);

    boolean existsByProjectIdAndVersion(Long projectId, Integer version);

    @Query("SELECT MAX(d.version) FROM Design d WHERE d.project.id = :projectId")
    Optional<Integer> findMaxVersionByProjectId(@Param("projectId") Long projectId);
}
