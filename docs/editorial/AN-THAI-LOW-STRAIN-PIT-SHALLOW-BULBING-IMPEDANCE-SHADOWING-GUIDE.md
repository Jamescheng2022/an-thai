# Low-Strain Pile Integrity Testing (PIT): Shallow Bulbing, Acoustic Shadowing, False Necking Reflection Pairs, and Deep Defect Resolution

**Document Identifier**: `AT-MANUAL-2026-07-PIT`  
**Classification**: Geotechnical Engineering Field Manual & Forensic Practice Guide  
**Author**: AN-THAI Engineering Technical Directorate  
**Date of Release**: 2026-11-28  
**Standards Compliance**: ASTM D5882-16 (Reapproved 2024) | ISO 22477-4:2018 | EN 1997-1 (Eurocode 7) | EN 1536:2010 | ASTM D4945-20 | ASTM D6760-19 | ASTM C42/C42M | ISO/IEC 17025:2017  

---

## 1. Executive Summary & The Global Integrity Testing Landscape

Low-strain impact integrity testing (variously designated as the Sonic Echo [SE], Impulse Response [IR], or Pile Integrity Test [PIT]) is globally deployed as the primary, high-volume quality assurance screen for deep foundation elements. Governed internationally by **ASTM D5882-16 (Reapproved 2024)**, **ISO 22477-4:2018**, and **Eurocode 7 (EN 1997-1 / EN 1536)**, hundreds of thousands of bored cast-in-place shafts, continuous flight auger (CFA) piles, and driven precast concrete elements are evaluated annually across Southeast Asia, the Middle East, Europe, and the Americas.

The testing methodology is fundamentally elegant: a small hand-held impact device (typically an instrumented or non-instrumented hammer weighing 0.5 kg to 1.5 kg with an engineered nylon, polyurethane, or aluminum striking tip) delivers a light axial blow to the prepared, sound concrete pile head. The impact generates a low-strain elastic compression stress wave ($\epsilon < 10^{-5}$) that propagates downward along the pile shaft at bar wave velocity $c = \sqrt{E/\rho}$ (typically $3,500\text{ m/s}$ to $4,200\text{ m/s}$). High-sensitivity piezoelectric accelerometers or geophones temporarily bonded to the pile top record the particle velocity response $V(t) = \int a(t) dt$.

Despite its ubiquitous adoption, low-strain integrity testing is plagued by what AN-THAI terms the **Shallow Geometric Discontinuity Blind Spot**. In soft deltaic silts, marine clays (such as the Bangkok Soft Clay layer or Mekong Delta muds), and loose sands, drilling fluid pressures or casing termination levels frequently cause localized borehole overbreak (bulbing or shaft enlargement) within the upper 1.5 m to 5.0 m of the pile. 

When a transient stress wave enters and exits a shallow bulb, two catastrophic diagnostic errors routinely occur on international job sites:
1. **The False Necking Trap**: As the wave transitions from the enlarged bulb back to the nominal borehole diameter, the acoustic impedance drops ($Z_3 < Z_2$). This step-down generates a sharp, upward compressive velocity reflection ($+\Delta V$) that displays the exact same mathematical phase and polarity as a severe necking defect or transversal crack. Inexperienced testing agencies routinely misclassify this benign geometry transition as a structural failure, prompting unnecessary project stoppages, commercial litigation, and wasteful remedial coring.
2. **The Acoustic Energy Shadowing Trap**: The impedance mismatch at the bulb boundaries traps and reflects substantial portions of the incident wave energy. The resulting multiple reverberations between the pile head and the bulb, combined with aggressive skin damping from soft surrounding soils, rapidly attenuate the high-frequency components of the stress wave. Consequently, the downward-transmitted pulse beneath the bulb lacks sufficient energy to generate a detectable return from real defects (such as cold joints, honeycombing, soil inclusions, or necking) located at depths between 12 m and 25 m, or from the pile toe. Testing firms frequently report an uncritical "Category A (Pass)" rating, certifying a structurally compromised foundation that later fails under building superstructure loads.

This technical field manual details the governing one-dimensional wave mechanics, explicit diagnostic criteria, frequency-domain admittance equations, and a standardized four-tier forensic escalation protocol to definitively resolve shallow impedance ambiguities.

---

## 2. One-Dimensional Wave Mechanics & Acoustic Impedance Discontinuities

### 2.1 The Governing Wave Equation in Viscoelastic Media
Acoustic wave propagation along a slender cylindrical pile shaft ($L/D > 5$) is governed by the one-dimensional classical wave equation derived from dynamic equilibrium and linear elasticity:

$$\frac{\partial^2 u}{\partial t^2} = c^2 \frac{\partial^2 u}{\partial x^2} - \frac{R(x, t)}{\rho A}$$

where:
- $u(x, t)$ is the axial displacement along the pile shaft;
- $c = \sqrt{E/\rho}$ is the longitudinal bar wave velocity of sound concrete (where $E$ is dynamic Young's modulus and $\rho$ is mass density);
- $A(x)$ is the cross-sectional area;
- $R(x, t)$ represents external soil shaft resistance and viscous skin damping resisting pile motion.

In foundation integrity diagnostics, the primary physical parameter governing reflection and transmission is the **Characteristic Acoustic Impedance** ($Z$):

$$Z = \frac{E \cdot A}{c} = \rho \cdot c \cdot A$$

Because concrete density ($\rho \approx 2,350\text{ to }2,450\text{ kg/m}^3$) and bar wave velocity ($c \approx 3,700\text{ to }4,000\text{ m/s}$) are relatively stable in sound concrete, acoustic impedance $Z$ is directly proportional to the cross-sectional area $A$. Any physical variation in cross-section (overbreak, necking, wash-out) or concrete quality (soil intrusion, honeycombing, lower modulus $E$) creates an impedance boundary $\Delta Z$.

### 2.2 Reflection and Transmission Coefficients at Geometric Boundaries
Consider an incident downward-traveling compressive wave with force amplitude $F_i$ and particle velocity $V_i = F_i / Z_1$ striking a boundary between Section 1 ($Z_1$) and Section 2 ($Z_2$). From the conservation of momentum and continuity of displacement at the interface:

$$F_t = F_i + F_r \quad \text{and} \quad V_t = V_i + V_r$$

Substituting $V = F / Z$, the reflection coefficient for force ($R_f$) and particle velocity ($R_v$) are given by:

$$R_f = \frac{F_r}{F_i} = \frac{Z_2 - Z_1}{Z_2 + Z_1} \quad \text{and} \quad R_v = \frac{V_r}{V_i} = \frac{Z_1 - Z_2}{Z_1 + Z_2} = - R_f$$

The velocity transmission coefficient ($T_v$) into Section 2 is:

$$T_v = \frac{V_t}{V_i} = \frac{2 Z_1}{Z_1 + Z_2} = 1 + R_v$$

Three fundamental physical regimes govern wave behavior at the discontinuity:
1. **Uniform Sound Shaft ($Z_2 = Z_1$)**: $R_v = 0$, $T_v = 1.0$. The wave propagates without intermediate reflection, returning only from the pile toe at two-way travel time $t = 2L/c$.
2. **Impedance Reduction / Necking ($Z_2 < Z_1$)**: $R_v > 0$. The reflected velocity pulse is in-phase (positive polarity) with the incident impact. A tensile strain wave travels upward, registering as a sharp upward velocity peak on the reflectogram.
3. **Impedance Increase / Bulbing ($Z_2 > Z_1$)**: $R_v < 0$. The reflected velocity pulse is out-of-phase (negative polarity) relative to the incident impact. A compressive wave reflects upward, registering as a downward velocity trough on the reflectogram.

---

## 3. Failure Mode 1: The False Necking Trap of Shallow Bulbing Doublets

### 3.1 Anatomy of the Overbreak Reflection Pair
When bored piles are cast through soft alluvial clays or loose fill into stiffer underlying formations, overbreak commonly occurs directly beneath the temporary surface casing. For example, a nominal $1,000\text{ mm}$ diameter shaft ($A_1 = 0.785\text{ m}^2$) may expand to $1,350\text{ mm}$ ($A_2 = 1.431\text{ m}^2$, an overbreak ratio of $1.82$) between depths $2.0\text{ m}$ and $4.2\text{ m}$, before returning to nominal diameter $1,000\text{ mm}$ ($A_3 = 0.785\text{ m}^2$).

As the incident compression wave travels down this shaft:
1. **Entrance Boundary ($2.0\text{ m}$)**: The wave encounters $Z_2 > Z_1$. The reflection coefficient is:
   $$R_{v,top} = \frac{Z_1 - Z_2}{Z_1 + Z_2} = \frac{0.785 - 1.431}{0.785 + 1.431} = -0.291$$
   This produces a substantial downward velocity trough (negative polarity) at two-way travel time $t_1 = 2 \times 2.0\text{ m} / 3,800\text{ m/s} = 1.05\text{ ms}$.
2. **Exit Boundary ($4.2\text{ m}$)**: The transmitted wave propagates through the bulb and strikes the lower transition back to nominal diameter ($Z_3 < Z_2$). The reflection coefficient is:
   $$R_{v,bottom} = \frac{Z_2 - Z_3}{Z_2 + Z_3} = \frac{1.431 - 0.785}{1.431 + 0.785} = +0.291$$
   This produces a sharp upward velocity peak (positive polarity) at two-way travel time $t_2 = 2 \times 4.2\text{ m} / 3,800\text{ m/s} = 2.21\text{ ms}$.

### 3.2 The Field Misinterpretation Mechanism
In raw field records or poorly post-processed reports, site engineers and automated testing software frequently commit the following errors:
- **Trough Disregard**: Many routine software filters automatically suppress or clip negative velocity excursions beneath the baseline, treating them as soil damping baseline drift. Consequently, the reviewing engineer only sees the prominent positive peak at $t_2 = 2.21\text{ ms}$.
- **Blind Application of the Beta Defect Factor**: Under ASTM D5882 and industry practice, the structural integrity factor $\beta$ quantifies cross-sectional reduction:
  $$\beta = \frac{Z_2}{Z_1} = \frac{1 - \alpha}{1 + \alpha} \quad \text{where } \alpha = \frac{V_r}{V_i}$$
  If the positive peak at $t_2$ is erroneously analyzed as an isolated necking from the nominal shaft, software calculates $\beta \approx 0.55$ to $0.60$ (indicating an apparent $40\%\text{ to }45\%$ loss of cross-section). The testing firm classifies the pile as **Category C (Major Structural Defect)**.
- **The Forensic Correction**: In true physics, the positive peak at $t_2$ is merely the return of the pile to its nominal designed cross-section! The mandatory diagnostic proof is the **precursor negative velocity trough**: an isolated necking *never* exhibits an antecedent negative trough of equal duration and magnitude.

---

## 4. Failure Mode 2: The Acoustic Energy Shadowing Trap & Deep Flaw Masking

### 4.1 Internal Wave Trapping & Energy Attenuation Budget
While a shallow bulbing is structurally benign in axial compression (often providing enhanced end-bearing and skin friction in the upper layer), it is acoustically disastrous for low-strain testing. 

When a stress wave enters a bulb, internal multi-path reflections trap wave energy within the enlarged zone. The wave bounces repeatedly between the upper and lower impedance transitions with harmonic period:

$$\Delta t_{resonance} = \frac{2 \Delta L_{bulb}}{c}$$

For $\Delta L_{bulb} = 2.2\text{ m}$ and $c = 3,800\text{ m/s}$, $\Delta t_{resonance} \approx 1.16\text{ ms}$, creating high-frequency ringing in the velocity record.

Furthermore, wave transmission through the two consecutive boundaries incurs substantial geometric energy loss:

$$T_{net} = T_{v,in} \times T_{v,out} = \left(\frac{2 Z_1}{Z_1 + Z_2}\right) \times \left(\frac{2 Z_2}{Z_2 + Z_3}\right) = \frac{4 Z_1 Z_2}{(Z_1 + Z_2)^2}$$

For our overbreak ratio $Z_2/Z_1 = 1.82$:

$$T_{net} = \frac{4 \times 1.0 \times 1.82}{(1.0 + 1.82)^2} = \frac{7.28}{7.952} = 0.915$$

While a pure 1D elastic loss of $8.5\%$ seems modest, real piles are embedded in viscoelastic soils. Soil-pile interface damping attenuates stress waves exponentially:

$$V(x) = V_0 \cdot \exp(-\alpha_{damping} \cdot x)$$

In soft, saturated marine clays, the damping coefficient $\alpha_{damping}$ is strongly frequency-dependent ($\alpha \propto f^2$). The shallow bulbing causes geometrical wave scattering and mode conversion into transverse and Rayleigh surface waves. The transmitted downward wave is severely filtered, losing its high-frequency energy.

### 4.2 Concealment of Severe Structural Defects at Depth
By the time the remaining stress wave reaches a depth of $15\text{ m}$ to $22\text{ m}$, its particle velocity amplitude has decayed to less than $10\%$ to $15\%$ of the initial impact. If a genuine defect exists at this depth—such as a $35\%$ cross-section necking, mud entrapment, or a cold joint formed during tremie pipe repositioning—its reflected velocity return is:

$$V_{r,defect} = R_{v,defect} \cdot V_{incident}(x) \approx 0.20 \times 0.10 V_0 = 0.02 V_0$$

This signal amplitude is often smaller than ambient site vibrations (traffic, nearby drilling rigs, generator hum) and digital quantization noise ($\pm 0.03 V_0$). 

Unskilled operators routinely apply aggressive exponential amplification functions ($G(t) = \exp(k \cdot t)$) to artificially resurrect deep signals. However, exponential gain amplifies both noise and the tail-end reverberations of the shallow bulb, producing a chaotic, undulating baseline that conceals the true defect signature.

### 4.3 ASTM D5882 & ISO 22477-4 Testing Limits Mandate
ASTM D5882-16 §5.2 and ISO 22477-4:2018 explicitly recognize this fundamental limitation:
> *"A low-strain integrity test does not provide definitive information regarding the pile cross-section or concrete quality below a major impedance change or below depths where the signal-to-noise ratio is insufficient. Where a clear pile toe reflection cannot be identified in a slender pile ($L/D > 30$) or beneath significant impedance variations, the test must be reported as INCONCLUSIVE (Category D), not as Intact (Category A)."*

Certifying an inconclusive, shadowed test record as an unqualified "Pass" violates international standards and exposes the testing organization and developer to catastrophic geotechnical liability.

---

## 5. Frequency-Domain Admittance & Transient Dynamic Mobility Analysis

### 5.1 The Mechanical Admittance Spectrum
To overcome the inherent ambiguities of time-domain reflectograms, ASTM D5882 §6.2.2 and French standard NF P94-160-2 authorize the **Impulse Response (Transient Dynamic Response)** method. 

By utilizing an instrumented hammer equipped with a dynamic load cell, the input force time history $F(t)$ is measured simultaneously with pile head velocity $V(t)$. Performing a Fast Fourier Transform (FFT) yields the complex frequency response function, known as **Mechanical Admittance** or **Mobility** $N(f)$:

$$N(f) = \frac{V(f)}{F(f)}$$

The mobility spectrum provides three decisive physical parameters that cannot be faked by geometric reflections:

1. **Low-Frequency Dynamic Stiffness ($K_d$)**: At very low frequencies ($f \to 0$ to $50\text{ Hz}$), the pile-soil system acts as a rigid spring. The initial linear slope of the mobility curve yields dynamic stiffness:
   $$K_d = \frac{2\pi \cdot f}{N(f)} \quad \text{as } f \to 0$$
   A pile with shallow bulbing displays higher dynamic stiffness $K_d$ than a nominal shaft, whereas a pile with real structural necking displays significantly lower dynamic stiffness.
2. **Characteristic Baseline Mobility ($N_0$)**: At intermediate frequencies ($100\text{ Hz}$ to $1,000\text{ Hz}$), the mobility oscillates around an asymptotic baseline value $N_0$ governed solely by shaft impedance:
   $$N_0 = \frac{1}{\rho \cdot c \cdot A_0}$$
   - **For a Bulbed Pile**: The enlarged cross-section ($A_{eff} > A_0$) **depresses** the baseline mobility ($N_{bulb} < N_0$).
   - **For a Necked Pile**: The reduced cross-section ($A_{eff} < A_0$) **elevates** the baseline mobility ($N_{neck} > N_0$).
3. **Resonant Frequency Interval ($\Delta f$)**: The resonant peaks in the mobility spectrum correspond to natural acoustic standing waves along the shaft. The frequency spacing between successive peaks is:
   $$\Delta f = \frac{c}{2L}$$
   If a pile has a severe broken section or major defect at depth $d < L$, the dominant resonant spacing widens to $\Delta f_{defect} = c / 2d$. If the shaft is sound and merely bulbed, the primary standing wave spacing continues to reflect full length $L$.

---

## 6. Standardized Four-Tier Forensic Escalation Protocol

When a low-strain PIT record exhibits shallow impedance transitions, high baseline noise, or an unresolvable pile toe, testing teams must strictly adhere to AN-THAI's standardized Four-Tier Escalation Protocol:

```
+-----------------------------------------------------------------------------------+
|               TIER 1: Multi-Sensor Perimeter PIT (ASTM D5882 §6.1)                |
| - Minimum 2 to 4 accelerometers installed at 90° intervals around pile perimeter   |
| - Average symmetrical waveforms to cancel flexural bending modes and 3D surface waves|
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|              TIER 2: Numerical Impedance Deconvolution & PIT-W Modeling           |
| - Frequency mobility N(f) extraction via instrumented hammer force pulse          |
| - 1D wave equation multi-segment profile fitting with soil spring/dashpot damping|
| - Verification against concrete pour volume logs (>115% overbreak confirms bulb)  |
+-----------------------------------------+-----------------------------------------+
                                          |
                        [If signal remains shadowed or unconfirmed]
                                          v
+-----------------------------------------------------------------------------------+
|               TIER 3: High-Strain Dynamic Testing (PDA / CAPWAP, ASTM D4945)      |
| - Mobilize drop weight hammer (mass = 1.5% to 2.0% of pile ultimate capacity)     |
| - Impact energy of 20 kJ to 80 kJ generates large-amplitude stress wave (15-30 MPa)|
| - Easily overcomes shallow skin damping to fully mobilize pile toe & deep defects |
+-----------------------------------------+-----------------------------------------+
                                          |
                         [If structural deficiency confirmed]
                                          v
+-----------------------------------------------------------------------------------+
|           TIER 4: Intrusive Core Drilling & Ultrasonic CSL (ASTM C42 / D6760)     |
| - Continuous NQ/HQ double-tube diamond core drilling to rock socket              |
| - Core recovery (TCR/RQD) and unconfined compressive strength (ASTM C39) testing  |
| - Crosshole sonic logging (CSL) or thermal profiling (TIP) where tubes exist      |
+-----------------------------------------------------------------------------------+
```

### Protocol Detailed Breakdown:
- **Tier 1 (Surface Sensor Array)**: Piles with diameter $D \ge 1,000\text{ mm}$ must never be evaluated with a single central sensor. Symmetrical multi-sensor placement cancels non-axial Rayleigh waves and eliminates operator bias.
- **Tier 2 (Signal Deconvolution & Construction Audit)**: Reconcile PIT reflectograms directly against drilling logs, soil boring profiles, and tremie placement curves. If concrete pour records indicate a 4.0 m³ overconsumption between depths 2.0 m and 4.5 m, the impedance expansion is physically substantiated.
- **Tier 3 (High-Strain Dynamic Testing - PDA)**: A low-strain hammer delivers only $10\text{ to }50\text{ Joules}$ of energy. A high-strain PDA drop hammer delivers $20,000\text{ to }80,000\text{ Joules}$. This massive energy input easily punches through shallow overbreaks and high soil resistance, producing crisp, unshadowed force-velocity wave matching (CAPWAP) down to the toe.
- **Tier 4 (Diamond Coring & Sonic Logging)**: Diamond core drilling down through the concrete matrix provides incontrovertible forensic proof of concrete compressive strength, joint contamination, and rock socket bond integrity.

---

## 7. Forensic Case Study: The 1,000 mm Bored Pile Arbitration Protocol

### 7.1 Project Background & The Dispute
During construction of a major petrochemical process plant in the Eastern Economic Corridor (EEC) of Thailand, routine low-strain integrity testing was conducted on 420 bored friction-end-bearing piles ($D = 1,000\text{ mm}$, design length $L = 28.0\text{ m}$). 

The soil stratigraphy comprised:
- $0.0\text{ m to }4.5\text{ m}$: Very soft to soft marine clay ($s_u = 12\text{ to }20\text{ kPa}$, $N_{SPT} = 0\text{ to }1$);
- $4.5\text{ m to }14.0\text{ m}$: Medium stiff to stiff silty clay ($s_u = 45\text{ to }70\text{ kPa}$, $N_{SPT} = 6\text{ to }11$);
- $14.0\text{ m to }28.0\text{ m}$: Dense to very dense silty sand and weathered sandstone bedrock ($N_{SPT} > 40$).

On Pile TP-087, the contractor's testing subcontractor submitted a report with a definitive rejection:
> *"Test Pile TP-087 exhibits a sharp positive velocity reflection at 4.2 m depth with calculated Beta factor $\beta = 0.58$, indicating a 42% loss of cross-sectional area. No clear toe reflection is observed. Verdict: Category C (Major Defect / Broken Pile). Recommendation: Reject pile and install remedial underpinning micropiles."*

The structural designer halted foundation works for the adjacent compressor foundation, threatening a six-week project delay and $140,000 in remedial micropiling costs. The general contractor contested the finding, noting that drilling was smooth and concrete volume was normal. AN-THAI Engineering was retained as independent forensic arbitration specialist.

### 7.2 AN-THAI Forensic Investigation & Findings
1. **Raw Waveform Audit**: Re-inspection of the unfiltered raw velocity record revealed a pronounced negative velocity trough ($V_{min} = -0.18\text{ m/s}$) at $t_1 = 1.10\text{ ms}$ ($2.1\text{ m}$ depth), directly preceding the positive reflection ($V_{max} = +0.22\text{ m/s}$) at $t_2 = 2.22\text{ ms}$ ($4.2\text{ m}$ depth). The previous testing agency had applied a high-pass baseline filter that completely zeroed the negative trough!
2. **Construction Log Verification**: Concrete batching tickets confirmed that nominal theoretical volume for the upper $5\text{ m}$ was $3.93\text{ m}^3$, whereas actual volume pumped was $6.15\text{ m}^3$ (an overbreak of $+56\%$ across the soft marine clay layer).
3. **Transient Dynamic Mobility Test (Tier 2)**: AN-THAI executed instrumented hammer testing. The mobility spectrum revealed a baseline mobility $N_{bulb} = 0.95 \times 10^{-7}\text{ m/s/N}$, significantly below the nominal baseline $N_0 = 1.25 \times 10^{-7}\text{ m/s/N}$, proving that the pile had experienced a net **increase** in effective impedance, entirely disproving the necking hypothesis.
4. **High-Strain PDA Restrike (Tier 3)**: To definitively eliminate the acoustic shadowing concern and verify deep shaft integrity down to the sandstone socket, a 5.0-ton drop weight was mobilized with a 1.2 m fall height ($E = 58.8\text{ kJ}$). The CAPWAP analysis confirmed:
   - Upper shaft bulbing ($D = 1,280\text{ mm}$) between $2.0\text{ m}$ and $4.2\text{ m}$;
   - Sound, uniform nominal cross-section ($D = 1,000\text{ mm}$) from $4.2\text{ m}$ to $28.0\text{ m}$ with zero internal necking;
   - Mobilized geotechnical capacity $R_u = 5,840\text{ kN}$ (exceeding proof requirement of $5,000\text{ kN}$);
   - Clean, unmistakable pile toe reflection at $28.1\text{ m}$.

### 7.3 Arbitration Outcome
Based on AN-THAI's forensic evidence, the project owner, lead structural engineer, and international insurance loss adjusters fully re-certified Pile TP-087 as **Sound & Fit-for-Purpose (Category A)**. Foundation construction resumed immediately with zero structural underpinning, saving the project over four weeks of schedule delay and $140,000 in unnecessary construction expenses.

---

## 8. Summary Checklist & AN-THAI Technical Support

Before accepting or acting on a negative low-strain pile integrity test report, foundation engineers and project managers must verify the following five quality gates:

1. **Check for the Negative Precursor**: Does the reported positive "necking" reflection have an antecedent negative trough of similar amplitude? If yes, it is an overbreak bulbing boundary, not a structural defect.
2. **Cross-Check Concrete Consumption Logs**: Do batching records indicate overbreak ($>115\%$) at the depth of the anomaly?
3. **Verify Pile Toe Identification**: Does the record show a clear toe return at $t = 2L/c$? If not, and a shallow impedance transition exists, the test is **Category D (Inconclusive)** due to acoustic shadowing, requiring escalation.
4. **Demand Multi-Sensor Averaging**: Was the pile tested with multiple perimeter accelerometers to rule out 3D Rayleigh surface wave artifacts?
5. **Enact High-Strain Escalation**: Never break, core, or reject a foundation pile based solely on single-sensor low-strain testing. Escalate to High-Strain PDA (ASTM D4945) or Diamond Coring (ASTM C42) to establish legally defensible engineering evidence.

---

*AN-THAI Engineering provides accredited geotechnical investigation, advanced non-destructive testing (NDT), high-strain dynamic load testing (PDA/CAPWAP), static pile load testing (SLT), and independent forensic arbitration across Southeast Asia and global infrastructure markets.*
