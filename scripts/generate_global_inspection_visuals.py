"""Generate crisp, lightweight WebP engineering diagrams for An-Thai Global Foundation & Full-Spectrum Inspection."""
import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ASSETS_DIR = Path("assets/images/insights")
ASSETS_DIR.mkdir(parents=True, exist_ok=True)

# Fonts
FONT_REG_PATH = "C:/Windows/Fonts/msyh.ttc"
FONT_BOLD_PATH = "C:/Windows/Fonts/msyhbd.ttc"
FONT_SEGOE_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_SEGOE_BOLD_PATH = "C:/Windows/Fonts/segoeuib.ttf"

def get_font(size, bold=False):
    try:
        path = FONT_BOLD_PATH if bold else FONT_REG_PATH
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
        return ImageFont.truetype(FONT_SEGOE_BOLD_PATH if bold else FONT_SEGOE_PATH, size)
    except Exception:
        return ImageFont.load_default()

def draw_header(draw, width, title, subtitle, tag="AN-THAI GLOBAL ENGINEERING"):
    # Header background
    draw.rectangle([0, 0, width, 95], fill="#0f172a")
    draw.rectangle([0, 93, width, 96], fill="#0284c7")
    
    # Tag
    f_tag = get_font(12, bold=True)
    draw.rounded_rectangle([30, 16, 260, 38], radius=4, fill="#0369a1")
    draw.text((38, 19), tag, font=f_tag, fill="#ffffff")
    
    # Title & Subtitle
    f_title = get_font(22, bold=True)
    f_sub = get_font(13, bold=False)
    draw.text((30, 44), title, font=f_title, fill="#f8fafc")
    draw.text((280, 20), subtitle, font=f_sub, fill="#94a3b8")

def draw_footer(draw, width, height, note="Standards: ASTM | ISO | EN Eurocode | ACI | AWS | ISO/IEC 17025 Accredited Methodology"):
    draw.rectangle([0, height - 38, width, height], fill="#0f172a")
    draw.rectangle([0, height - 39, width, height - 37], fill="#334155")
    f_foot = get_font(12, bold=False)
    f_brand = get_font(12, bold=True)
    draw.text((30, height - 26), "AN-THAI ENGINEERING (GLOBAL TECHNICAL INTELLIGENCE)", font=f_brand, fill="#38bdf8")
    bbox = draw.textbbox((0, 0), note, font=f_foot)
    draw.text((width - bbox[2] - 30, height - 26), note, font=f_foot, fill="#94a3b8")

def make_card(draw, box, fill="#1e293b", outline="#334155", radius=8, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

# ==========================================================
# 1. Dual-Core Architecture Diagram
# ==========================================================
def generate_dual_core_architecture():
    W, H = 1200, 720
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Global Foundation & Full-Spectrum Engineering Inspection Architecture",
                "Dual-Core Framework: Deep Foundations + 7 Disciplines Across Global Environments")

    # Global Footprint Banner
    make_card(draw, [30, 110, W - 30, 165], fill="#1e293b", outline="#0284c7")
    f_sec = get_font(13, bold=True)
    f_sub = get_font(12, bold=False)
    draw.text((45, 120), "GLOBAL GEOTECHNICAL & CLIMATIC FOOTPRINT (全球五大地质工程带适配)", font=f_sec, fill="#38bdf8")
    regions = [
        "Southeast Asia (Delta Clays & Monsoon)",
        "Middle East (Karst, Carbonates & Sabkha)",
        "Europe / N. America (Glacial Tills & Eurocodes)",
        "Africa (Laterites & Expansive Soils)",
        "Latin America (Seismic & Volcanic Alluvium)"
    ]
    rx = 45
    for r in regions:
        bbox = draw.textbbox((0, 0), r, font=f_sub)
        bw = bbox[2] - bbox[0] + 16
        draw.rounded_rectangle([rx, 140, rx + bw, 160], radius=4, fill="#0f172a", outline="#475569")
        draw.text((rx + 8, 142), r, font=f_sub, fill="#cbd5e1")
        rx += bw + 12

    # Left Core: Deep Foundations
    make_card(draw, [30, 180, 580, 660], fill="#0f172a", outline="#0369a1", width=2)
    draw.rounded_rectangle([30, 180, 580, 225], radius=6, fill="#0369a1")
    draw.text((45, 192), "CORE 1: DEEP FOUNDATIONS & PILING (深基础与基桩检测)", font=get_font(16, bold=True), fill="#ffffff")

    sub_items_core1 = [
        ("Low-Strain Integrity (PIT / Sonic Echo)", "ASTM D5882 / EN ISO 22477-4", "Wave reflection, beta index, defect triage & impedance limits"),
        ("High-Strain Dynamic Testing (PDA / CAPWAP)", "ASTM D4945 / BS EN ISO 22477-4", "Static/dynamic resistance separation, Case damping Jc, blow count"),
        ("Megaton Static Load Testing (SLT: Comp/Tension)", "ASTM D1143 / D3689 / D3966", "Maintained load, Davisson failure, thermal drift & anchor shear"),
        ("Bi-Directional Cell (O-Cell / 自平衡法)", "ASTM D8169 / JT/T 738", "Deep high-capacity rock-socketed shafts without surface kentledge"),
        ("Cross-Hole Sonic Logging (CSL / CSLT Tomo)", "ASTM D6760 / ISO 22477-10", "Ultrasonic wave speed, tube debonding diagnosis & 3D tomography"),
        ("Thermal Integrity Profiling (TIP)", "ASTM D7949", "Hydration temperature profiling for rebar cage alignment & necking"),
        ("Borehole Caliper & Slurry Sediments (Koden)", "ISO 22477-1 / DFI QA Guide", "Ultrasonic reflection for verticality, cavity collapse & bottom debris")
    ]
    cy = 235
    for title, std, desc in sub_items_core1:
        make_card(draw, [45, cy, 565, cy + 54], fill="#1e293b", outline="#334155")
        draw.text((55, cy + 5), title, font=get_font(13, bold=True), fill="#f1f5f9")
        draw.text((360, cy + 6), std, font=get_font(10, bold=True), fill="#38bdf8")
        draw.text((55, cy + 28), desc, font=get_font(11, bold=False), fill="#94a3b8")
        cy += 59

    # Right Core: Full-Spectrum Inspection
    make_card(draw, [620, 180, 1170, 660], fill="#0f172a", outline="#059669", width=2)
    draw.rounded_rectangle([620, 180, 1170, 225], radius=6, fill="#059669")
    draw.text((635, 192), "CORE 2: FULL-SPECTRUM ENGINEERING TESTING (全领域工程试验)", font=get_font(16, bold=True), fill="#ffffff")

    sub_items_core2 = [
        ("Concrete Superstructures & SHM", "BS EN 12504 / ASTM C805/C597", "Rebound + UPV (SonReb), core calibration, modal vibration & dynamic crack"),
        ("Advanced Steel NDT (PAUT / TOFD / MT)", "AWS D1.1 / ISO 13588 / ISO 16828", "Phased array ultrasonic weld scanning, TOFD, magnetic particle inspection"),
        ("High-Strength Bolts & Torque-Tension", "ASTM F3125 / EN 14399", "Skidmore-Wilhelm calibration, torque audit & DTI washer inspection"),
        ("Civil Engineering Materials Testing", "ASTM C39 / C1202 / NT BUILD 492", "High-performance concrete, rheology, ASR, chloride ion diffusion testing"),
        ("Geotechnical In-Situ (CPTu / SPT / VST)", "ASTM D5778 / D1586 / D2573", "Piezocone dissipation, shear strength, pressuremeter (PMT), plate load"),
        ("Environmental & Ground Monitoring", "ISO 18674 Series", "Inclinometers, vibrating wire piezometers, settlement & automated tilt"),
        ("Forensic Engineering & Accident Diagnosis", "ACI 562 / ASTM C42 / EN 1992-1-2", "Post-fire concrete degradation, differential settlement & crane fatigue")
    ]
    cy = 235
    for title, std, desc in sub_items_core2:
        make_card(draw, [635, cy, 1155, cy + 54], fill="#1e293b", outline="#334155")
        draw.text((645, cy + 5), title, font=get_font(13, bold=True), fill="#f1f5f9")
        draw.text((950, cy + 6), std, font=get_font(10, bold=True), fill="#34d399")
        draw.text((645, cy + 28), desc, font=get_font(11, bold=False), fill="#94a3b8")
        cy += 59

    draw_footer(draw, W, H, "AN-THAI Engineering Dual-Core Matrix | Benchmarked Against ASTM, ISO, EN Eurocodes, ACI, AWS & ASNT")
    out_path = ASSETS_DIR / "global-inspection-dual-core-architecture.webp"
    im.save(out_path, "WEBP", quality=88, method=6)
    print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

# ==========================================================
# 2. Low-Strain PIT Impedance Shadowing Diagram
# ==========================================================
def generate_pit_impedance_shadowing():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Low-Strain Integrity Testing (PIT / ASTM D5882)",
                "Wave Mechanics Dilemma: Impedance Shadowing & Shallow Bulb Masking Effect")

    # Left Column: Physical Pile Geometry
    make_card(draw, [30, 115, 380, 620], fill="#0f172a", outline="#334155")
    draw.text((45, 125), "PILE PROFILE & WAVE IMPEDANCE (Z = E*A/c)", font=get_font(13, bold=True), fill="#38bdf8")
    
    # Pile Head
    draw.rectangle([130, 160, 270, 200], fill="#334155", outline="#94a3b8")
    draw.text((150, 172), "Pile Head (L = 0m)", font=get_font(11, bold=True), fill="#ffffff")
    draw.polygon([(190, 140), (210, 140), (200, 158)], fill="#f59e0b") # Hammer arrow
    draw.text((220, 142), "Impact", font=get_font(11, bold=True), fill="#f59e0b")
    
    # Normal shaft section 1
    draw.rectangle([150, 200, 250, 270], fill="#1e293b", outline="#64748b")
    draw.text((165, 230), "Z1 (Nominal)", font=get_font(11, bold=False), fill="#cbd5e1")
    
    # Shallow Bulb (Expansion: Z2 > Z1)
    draw.rectangle([110, 270, 290, 350], fill="#0369a1", outline="#38bdf8", width=2)
    draw.text((125, 295), "SHALLOW BULB (+ΔZ)", font=get_font(12, bold=True), fill="#ffffff")
    draw.text((125, 315), "Z2 > Z1 (Over-break soil)", font=get_font(10, bold=False), fill="#bae6fd")
    
    # Normal shaft section 2
    draw.rectangle([150, 350, 250, 430], fill="#1e293b", outline="#64748b")
    draw.text((165, 385), "Z1 (Nominal)", font=get_font(11, bold=False), fill="#cbd5e1")
    
    # Deep Defect (Necking / Honeycombing: Z3 < Z1)
    draw.rectangle([170, 430, 230, 490], fill="#dc2626", outline="#f87171", width=2)
    draw.text((120, 450), "DEEP DEFECT (-ΔZ)", font=get_font(11, bold=True), fill="#fca5a5")
    draw.text((120, 468), "Severe Necking (Hidden!)", font=get_font(10, bold=False), fill="#fee2e2")
    
    # Bottom section to toe
    draw.rectangle([150, 490, 250, 560], fill="#1e293b", outline="#64748b")
    draw.line([140, 560, 260, 560], fill="#38bdf8", width=3)
    draw.text((160, 570), "Pile Toe (L = 28m)", font=get_font(11, bold=True), fill="#94a3b8")

    # Right Column: Velocity Waveforms & Signal Analysis
    make_card(draw, [400, 115, 1070, 620], fill="#0f172a", outline="#334155")
    draw.text((415, 125), "REFLECTOMETER SIGNAL (VELOCITY V vs TIME / DEPTH)", font=get_font(13, bold=True), fill="#38bdf8")
    
    # Draw Waveform Canvas
    make_card(draw, [420, 155, 1050, 390], fill="#020617", outline="#1e293b")
    draw.line([440, 270, 1030, 270], fill="#334155", width=1) # Zero axis
    
    # Plot curve:
    # 1. Initial hammer compression wave (upward peak)
    # 2. Reflection from bulb (+ΔZ -> downward tension wave R < 0)
    # 3. Wave trap / multiple reflections inside bulb
    # 4. Muted / absent reflection from deep necking
    points = [
        (440, 270), (455, 270), (470, 180), (485, 270), # Initial impact pulse
        (510, 270), (530, 270),
        (550, 340), (575, 270), # Deep negative trough from shallow bulb expansion (+Z)
        (610, 230), (640, 285), # Multiple internal resonance bouncing
        (680, 270), (750, 270), 
        (780, 262), (800, 275), (820, 270), # Deep necking: Severely muted signal!
        (900, 270), (950, 210), (980, 270), # Toe reflection
        (1020, 270)
    ]
    for i in range(len(points)-1):
        draw.line([points[i], points[i+1]], fill="#38bdf8", width=3)
        
    # Annotations on graph
    draw.text((465, 160), "1. Impact Pulse", font=get_font(11, bold=True), fill="#f59e0b")
    draw.text((535, 345), "2. Negative Peak from Bulb (+ΔZ)", font=get_font(11, bold=True), fill="#38bdf8")
    draw.text((605, 210), "3. High-Freq Ringing Resonance", font=get_font(10, bold=False), fill="#94a3b8")
    
    # Highlight Shadow Zone
    draw.rectangle([720, 175, 870, 365], fill=None, outline="#dc2626", width=2)
    draw.text((730, 185), "4. SHADOW ZONE", font=get_font(11, bold=True), fill="#ef4444")
    draw.text((730, 203), "Wave energy attenuated.", font=get_font(10, bold=False), fill="#fca5a5")
    draw.text((730, 220), "Deep defect signal hidden!", font=get_font(10, bold=True), fill="#fee2e2")

    # Lower Explanation & Action Protocol Box
    make_card(draw, [420, 410, 1050, 605], fill="#1e293b", outline="#475569")
    draw.text((435, 420), "ENGINEERING DISPUTE TRIAGE & RESOLUTION PROTOCOL (现场争议处置标准)", font=get_font(12, bold=True), fill="#f59e0b")
    
    notes = [
        "• Root Cause: When stress wave strikes an enlarged section (bulb), reflection coefficient R = (Z2-Z1)/(Z2+Z1) > 0 reflects a tension wave, while transmitted energy diminishes rapidly.",
        "• Masking Trap: In alluvial soft soils (Bangkok, Nile Delta, Gulf Coast), upper neckings or bulbs create high-frequency reverberations that blind the detector to deep cracks/neckings beyond L > 20D.",
        "• Mandatory Action 1: Never issue a definitive 'Pass' based on single-point PIT when a prominent upper impedance shift occurs. Perform Mobility Spectrum Analysis (Frequency Domain).",
        "• Mandatory Action 2: Secondary verification via Cross-Hole Sonic Logging (ASTM D6760) or High-Strain PDA (ASTM D4945) is legally mandatory before structural release."
    ]
    ny = 445
    for note in notes:
        draw.text((435, ny), note, font=get_font(10, bold=False), fill="#cbd5e1")
        ny += 38

    draw_footer(draw, W, H, "Low-Strain Wave Mechanics | ASTM D5882 / EN ISO 22477-4 Compliance Guide")
    out_path = ASSETS_DIR / "pit-impedance-shadowing-defect-masking.webp"
    im.save(out_path, "WEBP", quality=88, method=6)
    print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

# ==========================================================
# 3. Megaton Static Load Test Thermal Distortion Diagram
# ==========================================================
def generate_megaton_slt_diagram():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Megaton Static Pile Load Testing (SLT / ASTM D1143)",
                "Field Dilemma: Anchor Uplift Soil Shear & Reference Beam Diurnal Thermal Distortion")

    # Main Test Setup Diagram (Upper Canvas)
    make_card(draw, [30, 115, 1070, 430], fill="#0f172a", outline="#334155")
    draw.text((45, 125), "3,500-TON REACTION FRAME SETUP & PERTURBATION ZONES", font=get_font(13, bold=True), fill="#38bdf8")

    # Ground line
    draw.line([50, 310, 1050, 310], fill="#475569", width=2)
    draw.text((55, 315), "Ground Level (GL ±0.00m)", font=get_font(10, bold=False), fill="#64748b")

    # Test Pile (Center)
    draw.rectangle([510, 310, 590, 420], fill="#0284c7", outline="#38bdf8", width=2)
    draw.text((520, 350), "Test Pile", font=get_font(12, bold=True), fill="#ffffff")
    draw.text((520, 370), "D = 1.5m", font=get_font(10, bold=False), fill="#e0f2fe")

    # Hydraulic Jacks on Test Pile
    draw.rectangle([515, 260, 585, 305], fill="#f59e0b", outline="#fbbf24", width=2)
    draw.text((522, 275), "Jacks (35MN)", font=get_font(9, bold=True), fill="#0f172a")

    # Left Anchor Pile
    draw.rectangle([170, 310, 240, 420], fill="#334155", outline="#64748b")
    draw.text((175, 350), "Anchor 1", font=get_font(11, bold=True), fill="#cbd5e1")
    # Uplift arrows
    draw.polygon([(205, 290), (195, 305), (215, 305)], fill="#ef4444")
    draw.text((180, 275), "Uplift Tension", font=get_font(9, bold=True), fill="#f87171")

    # Right Anchor Pile
    draw.rectangle([860, 310, 930, 420], fill="#334155", outline="#64748b")
    draw.text((865, 350), "Anchor 2", font=get_font(11, bold=True), fill="#cbd5e1")
    # Uplift arrows
    draw.polygon([(895, 290), (885, 305), (905, 305)], fill="#ef4444")
    draw.text((870, 275), "Uplift Tension", font=get_font(9, bold=True), fill="#f87171")

    # Heavy Steel Reaction Girder
    draw.rectangle([150, 210, 950, 260], fill="#1e293b", outline="#cbd5e1", width=2)
    draw.text((450, 228), "MAIN REACTION GIRDER (CROSS BEAM ASSEMBLY)", font=get_font(12, bold=True), fill="#ffffff")

    # Reference Beam (36m long across setup)
    draw.line([70, 285, 1030, 285], fill="#a855f7", width=3)
    draw.text((80, 268), "REFERENCE BEAM (L = 36m)", font=get_font(11, bold=True), fill="#c084fc")

    # Reference Beam Supports
    draw.rectangle([90, 285, 110, 310], fill="#a855f7")
    draw.rectangle([990, 285, 1010, 310], fill="#a855f7")
    draw.text((70, 320), "Support A", font=get_font(9, bold=False), fill="#c084fc")
    draw.text((980, 320), "Support B", font=get_font(9, bold=False), fill="#c084fc")

    # Defect / Hazard Annotations
    # Hazard 1: Soil heave / shear influence zone
    draw.arc([100, 290, 310, 400], 0, 180, fill="#ef4444", width=2)
    draw.text((130, 395), "Soil Uplift Shear Bulb (Influence Zone)", font=get_font(9, bold=True), fill="#f87171")

    # Hazard 2: Sun thermal radiation on Reference Beam
    draw.text((700, 135), "☀️ Direct Sun Radiation (40°C Peak)", font=get_font(12, bold=True), fill="#facc15")
    draw.text((650, 155), "Top flange heated -> Thermal camber bowing upward (-2.8mm to +3.5mm)", font=get_font(10, bold=False), fill="#fef08a")
    draw.text((650, 172), "Creates FALSE settlement reading in digital dial gauges!", font=get_font(10, bold=True), fill="#f87171")

    # Lower Two Cards: Mitigation & Standards
    make_card(draw, [30, 445, 535, 620], fill="#0f172a", outline="#334155")
    draw.text((45, 455), "THERMAL DRIFT MECHANISM & NUMERICAL IMPACT", font=get_font(12, bold=True), fill="#f59e0b")
    t_lines = [
        "• Differential Flange Temp: ΔT = 15°C between sunlit top & shaded bottom flange.",
        "• Theoretical Deflection: δ = (α * ΔT * L²) / (8 * d). For L = 30m, d = 0.6m:",
        "  δ = (1.2e-5 * 15 * 900) / (8 * 0.6) = 33.7mm at center if fully pinned!",
        "• Field Impact: Unshielded beams routinely register 2 to 4 mm diurnal drift.",
        "• In failure criteria (Davisson / Chin-Kondner), 2mm error leads to wrongful pile rejection."
    ]
    ty = 480
    for l in t_lines:
        draw.text((45, ty), l, font=get_font(10, bold=False), fill="#cbd5e1")
        ty += 26

    make_card(draw, [555, 445, 1070, 620], fill="#0f172a", outline="#059669")
    draw.text((570, 455), "MANDATORY ASTM D1143 / ISO 22477-1 FIELD CONTROLS", font=get_font(12, bold=True), fill="#34d399")
    m_lines = [
        "1. Clearance Rule: Reference supports MUST be placed ≥ 5D or ≥ 2.5m (greater) away from test pile AND anchor piles to avoid anchor shear zone.",
        "2. Complete Sun Shielding: Enclose the entire reference beam in reflective canvas or insulated thermal cladding; install ambient & steel thermocouples.",
        "3. Independent Optical Triangulation: Continuous monitoring of reference beam posts using high-precision digital levels (0.01mm) referenced to deep benchmark outside site.",
        "4. Invar Wire / Constant Tension Systems: Use low-thermal-expansion Invar wire suspended from independent towers in mega-load tests (>20 MN)."
    ]
    my = 480
    for l in m_lines:
        draw.text((570, my), l, font=get_font(10, bold=False), fill="#cbd5e1")
        my += 26

    draw_footer(draw, W, H, "Megaton Static Load Testing | ASTM D1143 / ISO 22477-1 QA Specifications")
    out_path = ASSETS_DIR / "megaton-slt-anchor-thermal-distortion.webp"
    im.save(out_path, "WEBP", quality=88, method=6)
    print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

# ==========================================================
# 4. PAUT Weld Flaw vs Geometric Echo Diagram
# ==========================================================
def generate_paut_weld_flaw_diagram():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Advanced Ultrasonic NDT (PAUT / ISO 13588 & AWS D1.1)",
                "Structural Steel Inspection: True Weld Lack of Fusion vs Root Geometry False Indication")

    # Left: Weld Geometry & Ultrasonic Beam Phasing
    make_card(draw, [30, 115, 520, 620], fill="#0f172a", outline="#334155")
    draw.text((45, 125), "WELD CROSS-SECTION & SECTORIAL SWEEP (40° - 70°)", font=get_font(12, bold=True), fill="#38bdf8")

    # Draw Steel Plates (Double Bevel V-Weld)
    draw.rectangle([50, 300, 220, 480], fill="#334155", outline="#64748b") # Left plate
    draw.rectangle([330, 300, 500, 480], fill="#334155", outline="#64748b") # Right plate
    
    # Weld metal in center
    draw.polygon([(220, 300), (330, 300), (290, 480), (260, 480)], fill="#1e293b", outline="#0284c7")
    draw.text((245, 380), "Weld Metal", font=get_font(10, bold=True), fill="#94a3b8")

    # PAUT Probe on Rexolite Wedge
    draw.polygon([(90, 240), (190, 240), (190, 300), (90, 300)], fill="#0369a1", outline="#38bdf8")
    draw.text((100, 255), "PAUT Probe (64 elements)", font=get_font(9, bold=True), fill="#ffffff")
    draw.text((100, 275), "Angular Sweep: 40° - 70°", font=get_font(9, bold=False), fill="#bae6fd")

    # Ultrasonic Beams hitting fusion line & root
    draw.line([160, 300, 240, 360], fill="#f59e0b", width=2) # Beam to fusion line
    draw.line([160, 300, 275, 480], fill="#a855f7", width=2) # Beam to root bead

    # Flaw 1: Sidewall Lack of Fusion (True Defect)
    draw.line([230, 345, 250, 375], fill="#ef4444", width=4)
    draw.text((70, 350), "True Defect: Sidewall LOF", font=get_font(10, bold=True), fill="#f87171")

    # Indication 2: Root Geometry / Hi-Lo Misalignment
    draw.ellipse([265, 470, 285, 490], fill="#a855f7", outline="#c084fc")
    draw.text((290, 500), "False Indication: Root Penetration Bead", font=get_font(9, bold=True), fill="#c084fc")

    # Technical Specs Box Below
    make_card(draw, [45, 520, 505, 605], fill="#1e293b", outline="#475569")
    draw.text((55, 528), "ULTRASONIC ACOUSTIC PRINCIPLE (声学反射机理)", font=get_font(10, bold=True), fill="#38bdf8")
    draw.text((55, 548), "• Sidewall LOF is planar: Max reflection occurs when beam is perpendicular to bevel angle.", font=get_font(9, bold=False), fill="#cbd5e1")
    draw.text((55, 568), "• Root bead produces specular geometric corner trap reflection at 0.5 & 1.0 skip.", font=get_font(9, bold=False), fill="#cbd5e1")
    draw.text((55, 588), "• Misinterpreting geometric echoes causes unnecessary gouging of sound welds.", font=get_font(9, bold=False), fill="#fca5a5")

    # Right: S-Scan & Discrimination Criteria
    make_card(draw, [540, 115, 1070, 620], fill="#0f172a", outline="#334155")
    draw.text((555, 125), "PAUT S-SCAN COLOR PALETTE & DISCRIMINATION MATRIX", font=get_font(12, bold=True), fill="#38bdf8")

    # S-Scan Mockups (Two Sub-panels)
    # Panel 1: True LOF
    make_card(draw, [555, 155, 795, 380], fill="#020617", outline="#ef4444", width=2)
    draw.text((565, 165), "TRUE DEFECT: SIDEWALL L.O.F.", font=get_font(10, bold=True), fill="#f87171")
    draw.arc([575, 190, 775, 360], 210, 330, fill="#334155", width=1)
    # Intense red/orange flaw indication at bevel position
    draw.ellipse([670, 260, 700, 285], fill="#dc2626", outline="#f59e0b", width=2)
    draw.text((565, 330), "• High amplitude (>80% FSH)", font=get_font(9, bold=False), fill="#cbd5e1")
    draw.text((565, 346), "• Angle-dependent sharp peak (55°)", font=get_font(9, bold=False), fill="#cbd5e1")
    draw.text((565, 362), "• Persists over scan length > 15mm", font=get_font(9, bold=False), fill="#cbd5e1")

    # Panel 2: False Geometric Indication
    make_card(draw, [815, 155, 1055, 380], fill="#020617", outline="#a855f7", width=2)
    draw.text((825, 165), "FALSE ECHO: ROOT BEAD GEOMETRY", font=get_font(10, bold=True), fill="#c084fc")
    draw.arc([835, 190, 1035, 360], 210, 330, fill="#334155", width=1)
    # Diffuse purple/blue indicator exactly at bottom plate thickness line
    draw.ellipse([920, 310, 950, 330], fill="#7c3aed", outline="#c084fc", width=1)
    draw.text((825, 330), "• Located exactly at T (40.0mm)", font=get_font(9, bold=False), fill="#cbd5e1")
    draw.text((825, 346), "• Disappears when probe moves 5mm", font=get_font(9, bold=False), fill="#cbd5e1")
    draw.text((825, 362), "• Matches laser root bead profile", font=get_font(9, bold=False), fill="#cbd5e1")

    # Bottom Discrimination Matrix
    make_card(draw, [555, 395, 1055, 605], fill="#1e293b", outline="#475569")
    draw.text((570, 405), "DISCRIMINATION PROTOCOL (AWS D1.1 ANNEX K & ISO 13588 LEVEL 2/3)", font=get_font(11, bold=True), fill="#f59e0b")
    p_lines = [
        "1. Ray Tracing Overlay: Superimpose CAD weld preparation overlay on live S-scan. Confirm if echo epicenter falls inside the fusion boundary or on the root contour.",
        "2. Multi-Angle Verification: A true planar lack-of-fusion exhibits rapid loss of signal amplitude when angular deviation exceeds ±5° from the groove prep angle.",
        "3. Complementary TOFD (Diffraction): Deploy Time-of-Flight Diffraction (ISO 16828) across suspect zones. Planar flaws generate distinctive top & bottom tip-diffracted signals.",
        "4. ASNT / ISO 9712 Level III Authority: Automated threshold gating must never replace independent signal interpretation by certified Level III personnel on fatigue-critical joints."
    ]
    py = 430
    for l in p_lines:
        draw.text((570, py), l, font=get_font(9, bold=False), fill="#cbd5e1")
        py += 42

    draw_footer(draw, W, H, "Advanced Steel NDT | AWS D1.1 / ISO 13588 & ISO 16828 Compliance")
    out_path = ASSETS_DIR / "paut-weld-flaw-vs-geometric-echo.webp"
    im.save(out_path, "WEBP", quality=88, method=6)
    print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

# ==========================================================
# 5. Post-Fire Concrete Forensic Damage Diagram
# ==========================================================
def generate_post_fire_forensic_diagram():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Forensic Structural Engineering (ACI 562 & EN 1992-1-2)",
                "Post-Fire Reinforced Concrete Assessment: Temperature Isotherms, Spalling & Residual Capacity")

    # Left Column: Fire Exposed Column Cross-Section
    make_card(draw, [30, 115, 450, 620], fill="#0f172a", outline="#334155")
    draw.text((45, 125), "RC COLUMN CROSS-SECTION & THERMAL ISOTHERMS", font=get_font(12, bold=True), fill="#38bdf8")

    # Fire exposure arrows
    for y in [180, 250, 320, 390]:
        draw.polygon([(45, y), (70, y-10), (70, y+10)], fill="#f97316")
    draw.text((45, 155), "🔥 FIRE EXPOSURE (>1000°C ISO 834 Curve)", font=get_font(10, bold=True), fill="#fb923c")

    # Concentric Isotherm Layers of Column
    # Layer 4 (Sound Core): <300°C
    draw.rectangle([100, 190, 420, 470], fill="#1e293b", outline="#64748b", width=2)
    # Layer 3: 300°C - 500°C
    draw.rectangle([85, 175, 435, 485], fill=None, outline="#eab308", width=3)
    # Layer 2: 500°C - 800°C (Pink/Reddish)
    draw.rectangle([70, 160, 445, 500], fill=None, outline="#f97316", width=3)
    # Layer 1: >800°C (Calcined / Spalled surface)
    draw.rectangle([55, 145, 445, 515], fill=None, outline="#ef4444", width=3)

    # Rebar & Stirrups
    draw.rectangle([115, 205, 405, 455], fill=None, outline="#38bdf8", width=2)
    rebars = [(115, 205), (405, 205), (115, 455), (405, 455)]
    for rx, ry in rebars:
        draw.ellipse([rx-8, ry-8, rx+8, ry+8], fill="#38bdf8", outline="#ffffff")
    draw.text((220, 215), "Main Rebar (Yield Loss)", font=get_font(9, bold=False), fill="#bae6fd")

    # Core sound concrete
    draw.text((180, 320), "SOUND CONCRETE CORE", font=get_font(11, bold=True), fill="#ffffff")
    draw.text((200, 340), "T < 300°C | f'c > 85%", font=get_font(10, bold=False), fill="#94a3b8")
    draw.text((185, 360), "UPV > 3,800 m/s (Sound)", font=get_font(10, bold=False), fill="#34d399")

    # Legend for layers
    draw.rectangle([45, 530, 435, 605], fill="#1e293b", outline="#475569")
    draw.text((55, 535), "ISOTHERM ZONE CLASSIFICATION (表层至内部损伤分带)", font=get_font(10, bold=True), fill="#f59e0b")
    draw.text((55, 553), "🔴 Zone 1 (>800°C, 0-25mm): Calcined, chalky white, zero f'c, must be chipped.", font=get_font(9, bold=False), fill="#fca5a5")
    draw.text((55, 569), "🟠 Zone 2 (500-800°C, 25-55mm): Pink/red, Ca(OH)2 decomposes, 50% f'c loss.", font=get_font(9, bold=False), fill="#fdba74")
    draw.text((55, 585), "🟡 Zone 3 (300-500°C, 55-90mm): Micro-cracked, UPV drop 25%, repairable.", font=get_font(9, bold=False), fill="#fef08a")

    # Right Column: Multi-Method Forensic Testing Suite
    make_card(draw, [470, 115, 1070, 620], fill="#0f172a", outline="#334155")
    draw.text((485, 125), "NON-DESTRUCTIVE & LABORATORY FORENSIC SUITE (法医级鉴定体系)", font=get_font(12, bold=True), fill="#38bdf8")

    tests = [
        ("1. Ultrasonic Pulse Velocity (UPV / ASTM C597)",
         "Maps acoustic velocity across grid. UPV > 4000 m/s: sound; 3000-3500 m/s: medium damage; < 2500 m/s: severe dehydration. Identifies internal delamination.",
         "#38bdf8"),
        ("2. Colorimetric & Petrographic Analysis (EN 12504-1)",
         "Iron-bearing aggregate shifts from grey to pink/red at 300-600°C due to ferric oxide dehydration; turns chalky buff/white above 800°C. Definite isotherm proof.",
         "#fb923c"),
        ("3. Micro-Drilling Resistance & Rebound Hardness (ASTM C805)",
         "Constant-speed digital drilling penetrometer plots hardness vs depth (0-100mm), pinpointing the precise demarcation boundary between heat-affected paste and sound matrix.",
         "#facc15"),
        ("4. Rebar Tensile Testing & Metallography (ASTM A370)",
         "Cold-worked and quench-tempered rebars suffer irreversible yield strength drop if exposed to >500°C. Extract rebar coupons to verify residual yield fy and ductility elongation.",
         "#34d399"),
        ("5. Residual Structural Capacity Re-calculation (ACI 562 / EN 1992-1-2)",
         "500°C Isotherm Method: Discard all concrete hotter than 500°C. Re-calculate P-M interaction diagram with reduced effective cross-section b_eff * h_eff and degraded rebar fy.",
         "#c084fc")
    ]
    ty = 155
    for title, desc, col in tests:
        make_card(draw, [485, ty, 1055, ty + 85], fill="#1e293b", outline="#334155")
        draw.text((500, ty + 8), title, font=get_font(11, bold=True), fill=col)
        # Wrap desc
        words = desc.split(" ")
        line1 = " ".join(words[:14])
        line2 = " ".join(words[14:28])
        line3 = " ".join(words[28:])
        draw.text((500, ty + 28), line1, font=get_font(10, bold=False), fill="#cbd5e1")
        if line2:
            draw.text((500, ty + 44), line2, font=get_font(10, bold=False), fill="#cbd5e1")
        if line3:
            draw.text((500, ty + 60), line3, font=get_font(10, bold=False), fill="#cbd5e1")
        ty += 92

    draw_footer(draw, W, H, "Forensic Structural Assessment | ACI 562, EN 1992-1-2 & ASTM C597 Compliance")
    out_path = ASSETS_DIR / "post-fire-concrete-forensic-damage-zone.webp"
    im.save(out_path, "WEBP", quality=88, method=6)
    print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

# ==========================================================
# 6. ISO 17025 QA Chain of Custody Diagram
# ==========================================================
def generate_iso17025_qa_chain_diagram():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "International Quality Assurance & Legal Auditability",
                "ISO/IEC 17025 Unbroken Chain of Custody: From Field Sensor to Legal Report Sign-Off")

    steps = [
        ("STAGE 1: METROLOGICAL TRACEABILITY",
         "Sensor Calibration & Standards",
         ["• Calibration by ISO 17025 accredited metrology lab",
          "• NIST / UKAS / NIM traceable calibration sheets",
          "• Shunt calibration & zero-offset field verification",
          "• Valid sticker & non-expired calibration interval"],
         "#0284c7"),
        ("STAGE 2: RAW DATA TAMPER-PROOFING",
         "On-Site Acquisition Integrity",
         ["• Raw binary waveform / time-series archiving",
          "• GPS location & NTP atomic clock timestamping",
          "• Unaltered raw signals locked before filtering",
          "• Photo & borehole log witness verification"],
         "#059669"),
        ("STAGE 3: BLIND CROSS-VALIDATION",
         "Independent Peer Review",
         ["• Minimum dual-sensor channel verification",
          "• Signal re-analysis by secondary engineer",
          "• Multi-path acoustic matrix triangulation",
          "• Boundary condition sensitivity analysis"],
         "#d97706"),
        ("STAGE 4: BOUNDARY JUDGMENT",
         "Factual Data vs Subjective Opinion",
         ["• Clear separation: Measured data vs Interpretation",
          "• Limitation disclosure (e.g. skin friction masking)",
          "• Escalation triage: When core drilling is mandatory",
          "• Rejection of premature subjective conclusion"],
         "#7c3aed"),
        ("STAGE 5: LEGAL CERTIFICATION",
         "Chartered / PE Final Endorsement",
         ["• Formal ISO 17025 test report format & accreditation logo",
          "• Licensed Professional Engineer (PE/CEng) signature",
          "• Chain-of-custody transfer receipt to Project Owner",
          "• Defensible in FIDIC dispute adjudication / court"],
         "#dc2626")
    ]

    bx = 30
    card_w = 196
    for title, subtitle, bullets, col in steps:
        make_card(draw, [bx, 115, bx + card_w, 530], fill="#0f172a", outline=col, width=2)
        # Card header
        draw.rounded_rectangle([bx, 115, bx + card_w, 165], radius=6, fill=col)
        draw.text((bx + 10, 125), title.split(":")[0], font=get_font(10, bold=True), fill="#ffffff")
        draw.text((bx + 10, 142), title.split(":")[1].strip(), font=get_font(9, bold=True), fill="#ffffff")
        
        # Subtitle
        draw.text((bx + 10, 175), subtitle, font=get_font(10, bold=True), fill=col)
        draw.line([bx + 10, 195, bx + card_w - 10, 195], fill="#334155", width=1)
        
        # Bullets
        by = 205
        for b in bullets:
            draw.text((bx + 8, by), b[:24], font=get_font(9, bold=False), fill="#cbd5e1")
            if len(b) > 24:
                draw.text((bx + 18, by + 16), b[24:], font=get_font(9, bold=False), fill="#94a3b8")
                by += 34
            else:
                by += 26
        
        # Bottom Badge
        draw.rounded_rectangle([bx + 10, 485, bx + card_w - 10, 515], radius=4, fill="#1e293b", outline="#475569")
        draw.text((bx + 18, 493), "AUDITABLE GATEWAY", font=get_font(9, bold=True), fill="#38bdf8")

        # Arrow between cards
        if bx + card_w < 1000:
            ax = bx + card_w + 2
            draw.polygon([(ax, 320), (ax + 8, 325), (ax, 330)], fill="#64748b")

        bx += card_w + 13

    # Bottom Summary Banner
    make_card(draw, [30, 545, 1070, 625], fill="#1e293b", outline="#0284c7")
    draw.text((45, 555), "LEGAL & CONTRACTUAL INTEGRITY PILLAR (工程法律与合同法证效力)", font=get_font(11, bold=True), fill="#f59e0b")
    draw.text((45, 575), "• Compliance with ISO/IEC 17025:2017 Clause 7.8 (Reporting of results) and ILAC-P10 (Traceability).", font=get_font(10, bold=False), fill="#cbd5e1")
    draw.text((45, 595), "• Guarantees that every foundation and material test performed by AN-THAI is legally defensible under FIDIC conditions and local building laws.", font=get_font(10, bold=False), fill="#94a3b8")

    draw_footer(draw, W, H, "Testing Laboratory Competence | ISO/IEC 17025:2017 & ILAC-G8 Compliance")
    out_path = ASSETS_DIR / "iso17025-qa-chain-inspection-traceability.webp"
    im.save(out_path, "WEBP", quality=88, method=6)
    print(f"Generated {out_path} ({os.path.getsize(out_path)} bytes)")

if __name__ == "__main__":
    generate_dual_core_architecture()
    generate_pit_impedance_shadowing()
    generate_megaton_slt_diagram()
    generate_paut_weld_flaw_diagram()
    generate_post_fire_forensic_diagram()
    generate_iso17025_qa_chain_diagram()
    print("All 6 WebP visuals generated successfully.")
