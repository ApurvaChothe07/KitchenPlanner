package com.kitchencraft.config;

import com.kitchencraft.entity.Material;
import com.kitchencraft.entity.MaterialCategory;
import com.kitchencraft.entity.MaterialUnit;
import com.kitchencraft.entity.Role;
import com.kitchencraft.entity.User;
import com.kitchencraft.repository.MaterialRepository;
import com.kitchencraft.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final MaterialRepository materialRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed standard accounts with Password123!
        seedUserAccount("apurvachothe@gmail.com", "Apurva Chothe", "Password123!");
        seedUserAccount("demo@kitchencraft.com", "Demo Designer", "Password123!");

        if (materialRepository.count() == 0) {
            log.info("Material catalogue is empty. Seeding standard benchmark materials...");

            List<Material> defaultMaterials = List.of(
                    // Carcass Core Materials
                    Material.builder()
                            .name("BWR Plywood (IS 303)")
                            .category(MaterialCategory.CARCASS)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("95.00"))
                            .description("[Sample Pricing] Commercial boiling water resistant 18mm core")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("BWP Marine Plywood (IS 710)")
                            .category(MaterialCategory.CARCASS)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("130.00"))
                            .description("[Sample Pricing] Premium 18mm 710 marine plywood core")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("HDHMR Board (Moisture Resistant)")
                            .category(MaterialCategory.CARCASS)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("85.00"))
                            .description("[Sample Pricing] High-density moisture-resistant 18mm board")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("MDF Board (Pre-laminated)")
                            .category(MaterialCategory.CARCASS)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("65.00"))
                            .description("[Sample Pricing] Standard dry zone interior 18mm MDF board")
                            .active(true)
                            .build(),

                    // Shutter Finishes
                    Material.builder()
                            .name("Premium Acrylic High Gloss")
                            .category(MaterialCategory.SHUTTER)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("220.00"))
                            .description("[Sample Pricing] 1.5mm acrylic sheet with seamless zero-joint edge band")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("Anti-Fingerprint Matte Laminate")
                            .category(MaterialCategory.SHUTTER)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("120.00"))
                            .description("[Sample Pricing] 1.0mm anti-glare anti-scratch matte laminate")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("PU Paint Lacquer Gloss")
                            .category(MaterialCategory.SHUTTER)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("280.00"))
                            .description("[Sample Pricing] Multi-coat automotive polyurethane lacquer finish")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("PVC Thermofoil Membrane")
                            .category(MaterialCategory.SHUTTER)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("140.00"))
                            .description("[Sample Pricing] Vacuum-pressed thermofoil seamless shutter wrap")
                            .active(true)
                            .build(),

                    // Countertop Stones
                    Material.builder()
                            .name("Black Galaxy Granite (18mm)")
                            .category(MaterialCategory.COUNTERTOP)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("260.00"))
                            .description("[Sample Pricing] Natural polished black galaxy granite slab")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("Artificial Quartz Stone (White Vein)")
                            .category(MaterialCategory.COUNTERTOP)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("380.00"))
                            .description("[Sample Pricing] Engineered composite quartz non-porous stain-proof slab")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("Nano White Crystallized Glass")
                            .category(MaterialCategory.COUNTERTOP)
                            .unit(MaterialUnit.SQFT)
                            .unitPrice(new BigDecimal("450.00"))
                            .description("[Sample Pricing] Pure white non-porous crystallized glass slab")
                            .active(true)
                            .build(),

                    // Hardware & Accessories
                    Material.builder()
                            .name("Soft-Close Concealed Hinges (Pair)")
                            .category(MaterialCategory.HARDWARE)
                            .unit(MaterialUnit.PIECE)
                            .unitPrice(new BigDecimal("320.00"))
                            .description("[Sample Pricing] Stainless steel clip-on soft-close hinges with 3D adjustment")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("Tandem Drawer Runner Channels (Set)")
                            .category(MaterialCategory.HARDWARE)
                            .unit(MaterialUnit.PIECE)
                            .unitPrice(new BigDecimal("1850.00"))
                            .description("[Sample Pricing] Full extension synchronized soft-close tandem runners (45kg capacity)")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("SS304 Edge Profile Handle")
                            .category(MaterialCategory.HARDWARE)
                            .unit(MaterialUnit.PIECE)
                            .unitPrice(new BigDecimal("240.00"))
                            .description("[Sample Pricing] Brush-finished stainless steel 304 concealed edge profile handle")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("SS304 Double Bowl Sink with Drainboard")
                            .category(MaterialCategory.HARDWARE)
                            .unit(MaterialUnit.PIECE)
                            .unitPrice(new BigDecimal("5800.00"))
                            .description("[Sample Pricing] Heavy-gauge 1.2mm satin finish stainless steel kitchen sink")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("Twin Burner Toughened Glass Gas Hob")
                            .category(MaterialCategory.HARDWARE)
                            .unit(MaterialUnit.PIECE)
                            .unitPrice(new BigDecimal("7500.00"))
                            .description("[Sample Pricing] Cast iron pan support forged brass burner built-in hob")
                            .active(true)
                            .build(),
                    Material.builder()
                            .name("Hydraulic Bi-Fold Lift-Up System")
                            .category(MaterialCategory.HARDWARE)
                            .unit(MaterialUnit.PIECE)
                            .unitPrice(new BigDecimal("3400.00"))
                            .description("[Sample Pricing] Overhead wall cabinet lift-up stay mechanism with variable stop")
                            .active(true)
                            .build()
            );

            materialRepository.saveAll(defaultMaterials);
            log.info("Successfully seeded {} benchmark modular materials into database.", defaultMaterials.size());
        }
    }

    private void seedUserAccount(String email, String fullName, String password) {
        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    user.setPasswordHash(passwordEncoder.encode(password));
                    user.setActive(true);
                    userRepository.save(user);
                    log.info("Synchronized credentials for existing user [{}]", email);
                },
                () -> {
                    userRepository.save(User.builder()
                            .fullName(fullName)
                            .email(email)
                            .passwordHash(passwordEncoder.encode(password))
                            .role(Role.ROLE_USER)
                            .active(true)
                            .build());
                    log.info("Created user account for [{}]", email);
                }
        );
    }
}
