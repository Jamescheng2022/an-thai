# Megaton Static Pile Load Testing (SLT): Reaction Anchor Pile Pull-Out, Reference Beam Thermal Deflection, and Zone-of-Influence Distortion

**Document Identifier**: `AT-MANUAL-2026-06-SLT`  
**Classification**: Geotechnical Engineering Field Manual & Technical Practice Guide  
**Author**: AN-THAI Engineering Technical Directorate  
**Date of Release**: 2026-11-27  
**Standards Compliance**: ASTM D1143/D1143M-20 | ASTM D3689/D3689M-22 | ASTM D3966/D3966M-22 | ISO 22477-1:2018 | EN 1997-1 (Eurocode 7) | BS 8004:2015 | ISO/IEC 17025:2017  

---

## 1. Executive Summary & The Megaton Testing Context

In deep foundation engineering for heavy infrastructure—spanning supertall towers, industrial petrochemical facilities, marine container berths, and high-speed rail viaducts—the static axial compressive load test (SLT) remains the definitive benchmark for foundation capacity verification. Under ASTM D1143/D1143M-20 and ISO 22477-1:2018, design proof testing routinely demands test loads between 400 metric tons and 1,500 metric tons (4 MN to 15 MN) applied to large-diameter bored shafts (diameter $D \ge 1.0\text{ m}$ to $2.5\text{ m}$) and deep rectangular barrettes.

In the 4 MN to 15 MN test regime, geotechnical engineers must choose between two primary reaction systems:
- **Kentledge (Dead-Weight Platform)**: Employs stacked concrete blocks or steel billets on heavy cribbing. Kentledge eliminates the cost, installation time, and pull-out risk of tension anchor piles. However, Kentledge introduces immense surface surcharges ($1.2 \times$ to $1.3 \times$ test load, i.e., 500 to 2,000 tons on ground cribbing). This heavy ground bearing generates a wide secondary surface settlement bowl that can encompass reference beam supports, requires large footprint clearances, and presents severe tipping/instability risks on soft soils.
- **Tension Anchor Piles (Reaction Frame)**: Uses 4 to 8 reaction piles with high-strength tie-rods and crosshead steel beams. Tension anchor frames eliminate the immense surcharge footprint of kentledge and minimize surface tipping hazards. However, they introduce uplift mechanics, potential crosshead tilting, and upward ground heave fields around the anchor piles.

However, field engineers frequently fall into the **Execution Verification Fallacy**: assuming that because a hydraulic jack pumped oil and dial gauges moved, the resulting load–settlement curve represents the true, uncorrupted geotechnical response of the test pile. At megaton scales, reaction structures are not rigid boundary conditions; they are active, highly stressed structural and geotechnical mechanisms undergoing substantial elastic and plastic deformation.

When megaton reaction frames are deployed on complex alluvial soils, soft marine deposits, or layered tropical strata, three primary physical failure mechanisms frequently corrupt test data:
1. **Reaction Anchor Pile Tension Pull-Out & Crosshead Lateral Instability**: Asymmetrical uplift in tension anchor piles induces beam tilting, transferring eccentric shear loads to the test pile head if spherical seatings bind, and triggering hydraulic ram seal blowouts.
2. **Ground Zone of Influence & Clearance Geometry Violations**: Placing reference datum beam supports within the interacting ground displacement fields of the test pile (settlement bowl) or anchor piles (ground heave) creates artificial measurement errors typically estimated between 20% and 45% in sensitive soils.
3. **Solar Radiation Thermal Deflection of Reference Beams**: Unshielded 20 m to 30 m steel reference beams experience differential thermal gradients ($\Delta T = 15^\circ\text{C}$ to $25^\circ\text{C}$), generating upward thermal camber (hogging) of up to 43.2 mm (theoretical unconstrained beam) that lifts gauge mounts, corrupts creep rate evaluation, and distorts elastic rebound records.

This technical field manual provides the governing mechanics, rigorous diagnostic equations, and mandatory site protocols required to eliminate these physical failure modes and establish legally defensible, auditable foundation acceptance records.

---

## 2. Failure Mode 1: Reaction Anchor Pile Tension Pull-Out & Crosshead Tilting

### 2.1 Tension Skin Friction Degradation Mechanics
In high-tonnage static tests, reaction frames typically utilize 4 to 8 tension anchor piles to resist the upward thrust of the hydraulic rams. A common design flaw is calculating anchor pile tensile resistance using compressive shaft friction parameters ($q_s$). 

In cohesive marine clays, silt-clay laminations, and unsaturated residual soils, ultimate unit skin friction in tension ($q_{s,tension}$) is systematically 15% to 30% lower than in compression:
$$q_{s,tension} = \beta_{tension} \cdot \sigma'_{v0} \quad \text{where} \quad \beta_{tension} \approx (0.70 \sim 0.85) \cdot \beta_{compression}$$

This reduction stems from the Poisson effect: tensile elongation causes slight radial contraction of the pile shaft ($\Delta r = -\nu \cdot \epsilon_z \cdot r$), reducing the effective horizontal stress ($\sigma'_h$) acting normal to the soil-pile interface. In contrast, compressive loading induces radial Poisson expansion, increasing interface confining pressure.

### 2.2 Asymmetric Uplift and Crosshead Tilting Mechanics
When anchor piles are socketed into heterogeneous alluvial soils (such as the Bangkok soft-to-stiff clay transition or deltaic silts), tensile capacity is rarely identical across all reaction piles. As load increases toward proof level ($1.5 \times$ to $2.0 \times$ design working load):
1. One anchor pile or pile group reaches its ultimate tensile friction limit ($T_1 \to Q_{ult,tension}$), shedding load and experiencing sudden plastic pull-out displacement ($\Delta \delta_1 > 15\text{ mm}$ to $35\text{ mm}$).
2. The opposite anchor pile group remains in the elastic regime ($\Delta \delta_2 \le 4\text{ mm}$).
3. The main steel crosshead reaction beam rotates through a tilt angle $\theta$:
$$\theta = \arctan\left(\frac{\Delta \delta_1 - \Delta \delta_2}{L_{crosshead}}\right)$$
4. For a typical crosshead span $L_{crosshead} = 6.0\text{ m}$ and differential uplift of 25 mm, $\theta \approx 0.24^\circ$. While spherical seating blocks per ASTM D1143-20 §8.1.3 are designed to accommodate minor angular misalignment and prevent bending moment transfer, excessive tilt or mechanical binding between the crosshead and the hydraulic ram assembly introduces an eccentric lateral shear force component:
$$V_{lateral} \approx P \cdot \sin(\theta) \approx 10,000\text{ kN} \times \sin(0.24^\circ) \approx 42\text{ kN}$$
accompanied by an eccentric moment $M = P \cdot e$ on the pile head if the spherical bearing binds or reaches its travel limit ($e$ is the lateral offset of the load line).

### 2.3 Structural Failure Consequences
- **Hydraulic Cylinder Jamming & Seal Blowout**: Hydraulic jacks are designed for pure concentric axial thrust. Even minor eccentricity generates severe transverse binding against the cylinder guide rings, scoring the hard chrome plating and blowing out polyurethane packing seals under 50 MPa to 70 MPa hydraulic pressures.
- **Pile Head Edge Spalling & Splitting**: Unreinforced or lightly reinforced concrete pile capping beams experience intense localized edge stresses if spherical seatings jam, leading to diagonal shear spalling, concrete blowout, and premature test abandonment.
- **Catastrophic Structural Overturning**: In extreme cases, complete tension pull-out of an anchor pile releases massive stored elastic energy, causing dynamic reaction frame overturning, equipment destruction, and life-safety hazards.

### 2.4 Mandatory Engineering Defenses
1. **Safety Factor Mandate**: The factor of safety for reaction anchor piles in tension must satisfy $FS_{tension} \ge 2.0$ against ultimate tensile pull-out under approved project geotechnical design criteria (never economize with temporary works safety factors of 1.2 to 1.3).
2. **Symmetrical Array & Load Equalization**: Anchor piles must be arranged in a radially symmetric pattern (4, 6, or 8 piles) with equalized tie-rod lengths and calibrated hydraulic manifold distribution.
3. **Spherical Swivel Bearing**: A calibrated hardened spherical bearing block (per ASTM D1143-20 §8.1.3) must be positioned between the hydraulic ram piston and the reaction beam soffit to accommodate rotations up to $3^\circ$ without transferring bending moments.
4. **Independent Uplift Monitoring**: Install dial indicators on every anchor pile head to track displacement during every loading step. If any anchor pile exhibits non-linear uplift acceleration exceeding 1.0 mm per load step, halt loading immediately.

---

## 3. Failure Mode 2: Ground Zone of Influence & Clearance Geometry Violations

### 3.1 Interacting Displacement Bowls
A static pile test generates two opposing displacement fields in the surrounding soil mass:
1. **Test Pile Settlement Bowl**: Axial load transfers downward into the soil via skin friction and end-bearing, dragging down the adjacent ground surface in a settlement depression bowl governed by elastic-plastic soil mechanics:
$$w_{drag}(r) = w_{pile} \cdot \frac{\ln(r_m / r)}{\ln(r_m / r_0)}$$
where $r_0$ is the pile radius, $w_{pile}$ is the pile head settlement, and $r_m$ is the radius of influence ($r_m \approx 2.5 \cdot L_{pile} \cdot (1 - \nu)$).
2. **Anchor Pile Ground Heave Field**: Reaction anchor piles pulled in tension transfer upward shear stress, causing the ground surface surrounding each anchor pile to bulge upward ($+w_{heave}(r)$).

### 3.2 The Clearance Defect Mechanism
Reference datum beams support the displacement transducers (dial indicators or LVDTs) that measure pile head settlement relative to the ground. If the reference beam support posts are positioned too close to either the test pile or the anchor piles:
- **Scenario A (Support inside Settlement Bowl)**: The reference beam supports settle together with the ground ($w_{support} > 0$). The LVDTs measure relative displacement:
$$\delta_{measured} = w_{pile} - w_{support}$$
Because $w_{support}$ is positive downward, $\delta_{measured} < w_{pile}$. Analytical models and field observations show the test record can **underestimate actual pile settlement by an estimated 20% to 35%**, allowing a structurally deficient pile to falsely pass acceptance criteria!
- **Scenario B (Support inside Anchor Heave Field)**: The reference beam supports are lifted by upward ground heave ($w_{support} < 0$). The LVDTs record:
$$\delta_{measured} = w_{pile} - (-w_{heave}) = w_{pile} + w_{heave}$$
The test record can **overestimate settlement by an estimated 25% to 45%**, triggering false contractual non-conformance, costly pile rejection, and unnecessary remedial micropiling.

### 3.3 Compliance Geometry per ASTM D1143 & ISO 22477-1
To guarantee that reference beam supports reside in virgin ground unaffected by stress fields:
- **Clearance to Reaction Piles / Cribbing (ASTM D1143-20 §8.3.1)**: Clear distance between the test pile and any reaction anchor pile must satisfy $R_{clear} \ge 5D$ (with an absolute minimum of 2.0 m to 2.5 m depending on pile type and diameter).
- **Clearance to Datum Supports (ASTM D1143-20 §9.1.1)**: Minimum clear distance from the test pile edge to reference beam supports must be $\ge 2.5\text{ m}$ (8 ft), and datum supports must be positioned $\ge 2.5\text{ m}$ clear of reaction anchor piles or kentledge cribbing.
- **ISO 22477-1:2018 §4.4 Geometry**: Recommends datum supports be placed at a clear distance $\ge \max(2.5D, 2.5\text{ m})$ from the test pile edge, and outside the direct zone of influence of reaction elements.
- **Sleeved Datum Embedment**: Where shallow surface heave, desiccation cracking, or construction equipment ground vibration is anticipated, reference support uprights should be driven $\ge 1.5\text{ m}$ below ground and encased in an outer PVC sleeve greased internally as a recommended risk-mitigation measure to isolate shallow ground movements.

---

## 4. Failure Mode 3: Solar Radiation Thermal Bowing of Reference Beams

### 4.1 Thermal Curvature and Deflection Physics
Steel reference beams span between 15 m and 30 m to satisfy the clearance criteria described above. Under tropical sunshine or desert exposure, direct solar radiation strikes the top flange, while the bottom flange remains shielded and cooled by the soil boundary layer.

This creates a vertical temperature gradient ($\Delta T = T_{top} - T_{bottom}$), frequently reaching $15^\circ\text{C}$ to $25^\circ\text{C}$ between 11:00 AM and 3:00 PM. The structural mechanics of differential thermal expansion dictate:
1. Top flange unit strain: $\epsilon_{top} = \alpha \cdot T_{top}$ (where $\alpha_{steel} \approx 1.2 \times 10^{-5}/\text{K}$).
2. Bottom flange unit strain: $\epsilon_{bottom} = \alpha \cdot T_{bottom}$.
3. Differential thermal curvature ($\kappa_{thermal}$):
$$\kappa_{thermal} = \frac{\alpha \cdot \Delta T}{H_{beam}}$$
where $H_{beam}$ is the depth of the reference beam section (e.g., $H_{beam} = 0.40\text{ m}$).
4. For an idealized, simply supported reference beam of span $L_{beam}$ free to rotate at supports under a uniform thermal gradient, the differential expansion causes the beam to arch **UPWARD** (camber / hogging) at midspan:
$$\delta_{thermal} = \frac{\kappa_{thermal} \cdot L_{beam}^2}{8} = \frac{\alpha \cdot \Delta T \cdot L_{beam}^2}{8 \cdot H_{beam}}$$

### 4.2 Numerical Reality Check & Measurement Distortion Mechanism
For a typical megaton test setup with $L_{beam} = 24.0\text{ m}$, $H_{beam} = 0.40\text{ m}$, and a midday solar gradient $\Delta T = 20^\circ\text{C}$:
$$\delta_{thermal} = \frac{(1.2 \times 10^{-5}) \cdot (20) \cdot (24.0)^2}{8 \cdot 0.40} = \frac{0.13824}{3.2} = 0.0432\text{ m} = 43.2\text{ mm}$$

This theoretical calculation demonstrates that an unshielded 24 m steel reference beam has the potential to bow upward by up to **43.2 mm at midspan** (under unconstrained simple supports and a uniform 20°C vertical gradient). 

**The Measurement Distortion Mechanism**:
Because displacement transducers (dial indicators or LVDTs) are mounted directly to this reference beam positioned over the test pile head, this upward thermal camber lifts the body of the displacement transducer upward away from the pile head. For a relative downward displacement transducer (measuring downward movement of the pile relative to the datum), this upward rise of the instrument mount registers as **apparent downward settlement** of the pile head!
- At midday, as solar heating peaks, the upward camber of the datum artificially inflates measured settlement.
- At night, as the beam cools and straightens, the datum lowers back down, producing an apparent upward heave or artificial elastic rebound of the pile head.

### 4.3 Engineering Impact on Test Evaluation
- **False Creep Failure**: Under sustained load holding (such as the optional maintained load test procedure under ASTM D1143-20 §10.1.3 where settlement rate must not exceed $0.25\text{ mm/hr}$ over a specified holding window), a diurnal thermal camber rate of $1.0$ to $2.0\text{ mm/hr}$ during peak sunshine can cause the pile to falsely exceed creep rate limits, triggering unjustified foundation rejection.
- **Apparent Negative Rebound (False Heave)**: During nighttime cooling, as the beam straightens and the datum lowers, measured pile head rebound can appear to exceed total recorded settlement, creating physically impossible negative net settlement that discredits the entire test record.

### 4.4 Mandatory Dual Defense Architecture
To eliminate thermal distortion, AN-THAI mandates a dual physical-geodetic defense:
1. **Passive Thermal Shielding**:
   - Wrap the entire length of steel reference beams in 50 mm foil-backed reflective insulation.
   - Erect a continuous UV-resistant shade canopy over the test pile head, jack assembly, and entire instrument bridge.
   - Coat all reference beams with high-reflectance titanium dioxide white paint (solar reflectance index $\text{SRI} > 85$).
2. **Active Geodetic Benchmark Control**:
   - Establish a permanent primary benchmark located at a stable distance ($R > 25\text{ m}$ to $30\text{ m}$) completely outside all construction influence.
   - Position a calibrated high-precision digital or optical level equipped with an optical micrometer (reading resolution $\pm 0.01\text{ mm}$) at an independent vantage point.
   - Mount calibrated invar precision level scales directly onto the pile head, both reference beam supports, and **crucially, on the reference beam datum directly at the displacement gauge mounting brackets over the pile head** (surveying only the beam ends completely fails to detect midspan thermal bowing).
   - Perform closed-loop backsight readings at every load increment and log time-stamped datum adjustments. Any thermal drift identified in the reference beam is mathematically corrected in the official load–settlement log.

---

## 5. Failure Mode 4: Hydraulic Jack Packing Friction & Calibration Chain

### 5.1 The Packing Friction Hysteresis Loop
Megaton testing utilizes high-pressure hydraulic cylinders (ram capacity 5,000 kN to 15,000 kN). To contain oil pressures up to 70 MPa, cylinder pistons employ heavy polyurethane U-cups, chevron V-packings, and bronze wear rings. 

When the piston extends under pressure, the packing seals press forcefully against the honed cylinder barrel, generating a friction resistance force ($F_{friction}$) that typically ranges between 5% and 12% of the theoretical hydraulic thrust ($P_{hyd} = p \cdot A_{ram}$), depending on cylinder geometry, seal compound, and operating pressure:
- **During Loading (Ram Advancing)**:
$$P_{actual} = (p \cdot A_{ram}) - F_{friction}$$
The true compressive load delivered to the concrete pile head is **5% to 12% lower** than indicated by a simple hydraulic pressure gauge conversion!
- **During Unloading (Ram Retracting)**:
$$P_{actual} = (p \cdot A_{ram}) + F_{friction}$$
The friction reverses direction, producing a pronounced mechanical hysteresis loop.

### 5.2 The Gauge-Only Calibration Vulnerability
A widespread non-conformance in developing markets is calibrating the hydraulic pressure gauge separately on a deadweight tester, while leaving the hydraulic jack uncalibrated. This practice introduces systematic error:
- At 10,000 kN nominal test load, an uncalibrated 10% packing friction error means the pile was only loaded to approximately 9,000 kN.
- The foundation is signed off as compliant for 10,000 kN, leaving a permanent 1,000 kN structural deficit in the building foundation!

### 5.3 ASTM D1143 & ISO 22477-1 Calibration Chain Compliance
To comply with ASTM D1143-20 §§8.2.3–8.2.6 and ISO 22477-1:2018 §4.5:
1. **Unit Calibration Mandate**: Per ASTM D1143-20 §8.2.3, the hydraulic jack, hydraulic pump, hoses, and pressure gauge should be calibrated **together as an integral unit** in an ISO/IEC 17025 accredited laboratory press within 6 months prior to the test where practicable. ISO 22477-1:2018 §4.5 permits calibrated pressure devices recalibrated within 6 months, or load cells recalibrated within 12 months.
2. **In-Line Load Cell**: ASTM D1143-20 §8.2.5 specifies placing an independently calibrated load cell in series with each hydraulic jack (without restricting this to tests over 5 MN). The load cell measures true mechanical force delivered to the concrete, completely unaffected by hydraulic seal drag.
3. **Tolerance Gate**: Cross-check load cell readings against calibrated jack pressure gauges. If the discrepancy exceeds 2.0%, investigate immediately; if it exceeds 5.0%, halt the test for hydraulic seal and zero-drift inspection.

---

## 6. International Standards Comparison Table

| Parameter / Requirement | ASTM D1143/D1143M-20 | ISO 22477-1:2018 | EN 1997-1 (Eurocode 7) | BS 8004:2015 |
| :--- | :--- | :--- | :--- | :--- |
| **Clear Distance (Test Pile to Datum Supports)** | $\ge 2.5\text{ m}$ (8 ft) edge-to-edge (§9.1.1) | $\ge \max(2.5D, 2.5\text{ m})$ edge-to-edge (§4.4) | $R \ge 4D$ or per national annex (typically $\ge 5D$) | $R \ge 5D$ and $\ge 2.5\text{ m}$ |
| **Clear Distance (Reaction Piles to Test Pile / Datum)** | Reaction piles $\ge 5D$ ($\ge 2.0\text{ m}\sim 2.5\text{ m}$, §8.3.1); datum $\ge 2.5\text{ m}$ to anchors (§9.1.1) | Outside direct zone of influence ($\ge 4D_{anchor}$ or isolated) | Must prevent interaction with datum | $\ge 5D_{anchor}$ or isolated by sleeve |
| **Anchor Pile Factor of Safety ($FS_{tension}$)** | $\ge 2.0$ against ultimate pull-out (approved design criteria) | $\ge 1.5$ to $2.0$ depending on consequence class | Design per ULS STR/GEO ($\gamma_s \ge 1.4\sim 1.6$) | $\ge 2.0$ for temporary test anchors |
| **Thermal Protection for Reference Beams** | Required; shelter from sun and wind (§9.1.2) | Mandatory thermal insulation & shading (§4.4) | Required to prevent spurious displacement | Mandatory sun and wind shields |
| **Independent Benchmark Optical Survey** | Required to check datum movement (§9.1.2 / §10.1.2) | Mandatory primary geodetic reference (§4.4) | Mandatory optical leveling check | Recommended optical precision verification |
| **Calibration Periodicity & Traceability** | Calibrated as unit where practicable, certified $< 6\text{ months}$ (§8.2.3) | Pressure devices $\le 6\text{ months}$; load cells $\le 12\text{ months}$ (§4.5) | Calibrated with national metrology traceability | Certified system calibration within 6 months |
| **Load Measurement Method** | Load cell in series with each jack + calibrated pressure gauge (§8.2.5) | Calibrated load cell or pressure transducer (§4.5) | Calibrated load cell or pressure cell | Load cell mandatory for critical piles |

---

## 7. Site Implementation Checklist & Dispute Prevention Protocol

### 7.1 Pre-Test Engineering Verification (T minus 48 Hours)
- [ ] **Structural Reaction Calculation**: Verify that the main crosshead beam section modulus $Z_x$ and shear capacity satisfy $FS_{struct} \ge 1.5$ at $1.5 \times$ maximum test load.
- [ ] **Anchor Pile Tension Verification**: Verify anchor pile shaft friction calculation with $FS_{tension} \ge 2.0$ using tension-reduced unit friction parameters under project geotechnical criteria.
- [ ] **Geometrical Survey**: Measure and record exact edge-to-edge clear distances from test pile edge to all reaction anchor piles (ASTM D1143 §8.3.1 $R \ge 5D$, floor 2.0–2.5 m) and to reference beam support footings (ASTM D1143 §9.1.1 $R \ge 2.5\text{ m}$; ISO 22477-1 §4.4 $R \ge \max(2.5D, 2.5\text{ m})$).
- [ ] **Datum Support Isolation**: Where shallow ground movement or equipment vibration is anticipated, ensure reference upright posts are embedded $\ge 1.5\text{ m}$ into ground and encased in greased PVC decoupling sleeves.
- [ ] **Thermal Protection Rigging**: Verify reflective insulation wrap on all steel reference spans and complete installation of UV sunshade canopies.
- [ ] **Remote Benchmark Setup**: Establish permanent concrete benchmark $R > 25\text{ m}$ from test center. Verify clear line of sight for high-precision optical level (0.01 mm micrometer).
- [ ] **Calibration Certification Check**: Verify validity of ISO/IEC 17025 calibration certificates for jack, pump, pressure gauge, and in-line electronic load cells (dated $< 6\text{ months}$ per ASTM / ISO).

### 7.2 Execution Phase Monitoring (During Active Testing)
- [ ] **Spherical Bearing Seating**: Confirm spherical seating block (ASTM D1143-20 §8.1.3) aligns concentrically without mechanical edge binding at initial 5% seating load.
- [ ] **Anchor Pile Uplift Tracking**: Record dial gauge readings on all anchor pile heads at every load increment. Verify differential uplift $\Delta\delta \le 5\text{ mm}$.
- [ ] **Optical Backsight Verification**: Take closed-loop optical level readings on test pile head, reference beam supports, **and reference beam datum directly at gauge mounts over pile head**, referenced to the remote benchmark at every load step. Record any datum adjustment in official field log.
- [ ] **Dual Load Verification**: Cross-check electronic load cell reading against calibrated hydraulic pressure gauge. Log discrepancy (must be $\le 2.0\%$).
- [ ] **Creep Rate Analysis**: Calculate creep rate ($\Delta s / \Delta \log t$ and $\text{mm/hr}$) strictly during holding periods (such as ASTM D1143-20 §10.1.3 maintained load procedure, target $< 0.25\text{ mm/hr}$ over final evaluation interval). Ensure optical datum adjustments are applied before calculating creep.

### 7.3 Post-Test Data Audit & Reporting Gate
- [ ] **Net Rebound Audit**: Confirm measured net elastic rebound matches theoretical elastic pile decompression:
$$\Delta_{elastic} = \frac{P \cdot L_{eff}}{A_c \cdot E_c}$$
If measured rebound exceeds total settlement or appears negative, perform thermal and zone-of-influence data reconciliation.
- [ ] **Davisson Failure Analysis**: Plot Davisson offset limit line ($s = 4.0\text{ mm} + D/120 + P \cdot L / (A \cdot E)$) using verified optical-level corrected settlement data.
- [ ] **Formal Sign-Off**: Secure counter-signatures of Geotechnical Testing Engineer, Supervising Consultant, and Project Structural Director on raw instrument sheets and calibration appendices.

---

## 8. Illustrative Engineering Application Protocol: Rayong EEC 600-Ton Static Pile Load Test Scenario

To illustrate the practical deployment of the mandatory engineering defenses described in this manual, consider an industrial foundation proof testing protocol developed for heavy manufacturing facilities in the Eastern Economic Corridor (EEC), Rayong, Thailand (`CASE-2026-02-SLT-RAYONG (Illustrative Protocol Scenario)`).

- **Test Pile Specification**: $D = 1,000\text{ mm}$ cast-in-place bored pile, length $L = 38.0\text{ m}$, designed for working load $Q_w = 3,000\text{ kN}$ ($300\text{ tons}$), tested to $200\%$ proof load ($Q_{test} = 6,000\text{ kN}$ / $600\text{ tons}$).
- **Ground Stratigraphy Model**: 8.0 m soft-to-medium marine clay ($S_u \approx 22\text{ kPa}$), underlain by dense silty sand transitioning to weathered granitic rock at 36.0 m.
- **Reaction Architecture**: 6-pile symmetrical reaction anchor array ($D = 800\text{ mm}$, $L = 32.0\text{ m}$), designed with $FS_{tension} = 2.15$ using tension-reduced unit shaft resistance. Edge-to-edge clear distance to anchor piles $R = 5.2\text{ m}$ ($> 5D$).
- **Instrument Bridge & Thermal Control**: Reference beam span $L = 22.0\text{ m}$, edge-to-edge clear distance to datum supports $R = 6.0\text{ m}$ ($6D$, exceeding ASTM §9.1.1 and ISO §4.4 criteria). Beams insulated with 50 mm foil-backed mineral wool and shaded by 30 m canopy.
- **Protocol Verification**: Peak proof load of 6,000 kN held for 24 hours under maintained load protocol. Differential anchor uplift was restricted to 3.2 mm. Optical level closed-loop backsight on the midspan gauge mount confirmed reference datum thermal drift was $< 0.12\text{ mm}$ across noon solar peaks. True pile settlement was recorded at $11.42\text{ mm}$, recovering to $2.84\text{ mm}$ residual net settlement, confirming full compliance with ASTM D1143 and project specifications without contractual dispute.

---
*AN-THAI Engineering Company Limited · Bangkok, Thailand*  
*Specialized Deep Foundation Engineering, Geotechnical Field Testing, NDT & Forensic Structural Inspection*
