package com.kitchencraft.repository;

import com.kitchencraft.entity.Project;
import com.kitchencraft.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findAllByOwnerOrderByUpdatedAtDesc(User owner);

    Optional<Project> findByIdAndOwner(Long id, User owner);

    boolean existsByIdAndOwner(Long id, User owner);
}
