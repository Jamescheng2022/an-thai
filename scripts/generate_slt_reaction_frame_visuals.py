"""Generate crisp, lightweight WebP engineering diagrams for Megaton SLT Reaction Frame & Thermal Distortion."""
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

def draw_header(draw, width, title, subtitle, tag="AN-THAI GEOTECHNICAL ENGINEERING"):
    draw.rectangle([0, 0, width, 95], fill="#0f172a")
    draw.rectangle([0, 93, width, 96], fill="#0284c7")
    
    f_tag = get_font(12, bold=True)
    draw.rounded_rectangle([30, 16, 270, 38], radius=4, fill="#0369a1")
    draw.text((38, 19), tag, font=f_tag, fill="#ffffff")
    
    f_title = get_font(21, bold=True)
    f_sub = get_font(13, bold=False)
    draw.text((30, 44), title, font=f_title, fill="#f8fafc")
    draw.text((290, 20), subtitle, font=f_sub, fill="#94a3b8")

def draw_footer(draw, width, height, note="Standards: ASTM D1143 / D1143M | ISO 22477-1 | EN 1997-1 | BS 8004 | ISO/IEC 17025"):
    draw.rectangle([0, height - 38, width, height], fill="#0f172a")
    draw.rectangle([0, height - 39, width, height - 37], fill="#334155")
    f_foot = get_font(12, bold=False)
    f_brand = get_font(12, bold=True)
    draw.text((30, height - 26), "AN-THAI ENGINEERING (STATIC PILE TESTING INTELLIGENCE)", font=f_brand, fill="#38bdf8")
    bbox = draw.textbbox((0, 0), note, font=f_foot)
    draw.text((width - bbox[2] - 30, height - 26), note, font=f_foot, fill="#94a3b8")

def make_card(draw, box, fill="#1e293b", outline="#334155", radius=8, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def draw_wrapped_text(draw, text, pos, max_width, font, fill, line_spacing=3):
    words = text.split(" ")
    lines = []
    current_line = []
    for word in words:
        test_line = " ".join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(" ".join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    if current_line:
        lines.append(" ".join(current_line))

    x, y = pos
    total_height = 0
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), line, font=font)
        h = (bbox[3] - bbox[1]) + line_spacing
        y += h
        total_height += h
    return total_height


# ==========================================================
# 1. Cover: Reaction Frame System & Three Failure Modes (1200x720)
# ==========================================================
def generate_cover_visual():
    W, H = 1200, 720
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Megaton Static Pile Load Test (SLT): Reaction System & 3 Physical Failure Modes",
                "ASTM D1143 / ISO 22477-1: Tension Pull-Out, Thermal Deflection & Zone-of-Influence Traps")

    # System Overview Banner
    make_card(draw, [30, 110, W - 30, 160], fill="#1e293b", outline="#0284c7")
    draw.text((45, 118), "HIGH-CAPACITY PROOF TESTING HAZARDS (400t - 1500t / 4MN - 15MN LOAD REGIME)", font=get_font(13, bold=True), fill="#38bdf8")
    draw.text((45, 137), "Deep foundation verification requires massive reaction structures. Structural instability, thermal distortion, or flawed clearance geometry falsifies load-settlement curves.", font=get_font(12, bold=False), fill="#cbd5e1")

    # Mode 1 Card (Left)
    make_card(draw, [30, 175, 400, 660], fill="#0f172a", outline="#dc2626", width=2)
    draw.rounded_rectangle([30, 175, 400, 215], radius=6, fill="#991b1b")
    draw.text((42, 186), "FAILURE MODE 1: ANCHOR UPLIFT", font=get_font(14, bold=True), fill="#ffffff")
    
    make_card(draw, [45, 225, 385, 335], fill="#1e293b", outline="#475569")
    draw.text((55, 233), "Anchor Pile Tension Pull-Out & Tilt", font=get_font(12, bold=True), fill="#fca5a5")
    draw_wrapped_text(draw, "• Soft marine clay / sand interface causes sudden degradation of skin friction under sustained peak tension.", (55, 255), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Asymmetric uplift (delta > 15mm) causes main crosshead beam to tilt, imposing severe eccentric shear.", (55, 290), 315, get_font(11), "#cbd5e1")

    make_card(draw, [45, 345, 385, 475], fill="#1e293b", outline="#475569")
    draw.text((55, 353), "Structural Consequences", font=get_font(12, bold=True), fill="#fca5a5")
    draw_wrapped_text(draw, "• Fatal bending moment M = P * e on pile top.", (55, 375), 315, get_font(11), "#f87171")
    draw_wrapped_text(draw, "• Concrete spalling and crushing at pile head perimeter.", (55, 395), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Hydraulic jack piston seal blowout and catastrophic load loss during maximum proof load holding.", (55, 415), 315, get_font(11), "#cbd5e1")

    make_card(draw, [45, 485, 385, 645], fill="#1e293b", outline="#16a34a")
    draw.text((55, 493), "Mandatory Engineering Defense", font=get_font(12, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "1. Anchor pile design safety factor FS_tension >= 2.0 (never use 1.2 - 1.5).", (55, 515), 315, get_font(11), "#86efac")
    draw_wrapped_text(draw, "2. Symmetrical 4-8 anchor pile grid with equalized tension tie rods.", (55, 550), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "3. Real-time dial gauge monitoring of all anchor pile heads during test.", (55, 585), 315, get_font(11), "#cbd5e1")

    # Mode 2 Card (Middle)
    make_card(draw, [415, 175, 785, 660], fill="#0f172a", outline="#d97706", width=2)
    draw.rounded_rectangle([415, 175, 785, 215], radius=6, fill="#b45309")
    draw.text((427, 186), "FAILURE MODE 2: ZONE OF INFLUENCE", font=get_font(14, bold=True), fill="#ffffff")

    make_card(draw, [430, 225, 770, 335], fill="#1e293b", outline="#475569")
    draw.text((440, 233), "Defective Geometrical Clearance", font=get_font(12, bold=True), fill="#fcd34d")
    draw_wrapped_text(draw, "• Reference beam support placed inside ground displacement bowl (R < 5D or < 2.5m).", (440, 255), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Anchor pile upward ground heave or test pile settlement drag pulls beam supports downward/upward.", (440, 290), 315, get_font(11), "#cbd5e1")

    make_card(draw, [430, 345, 770, 475], fill="#1e293b", outline="#475569")
    draw.text((440, 353), "Measurement Distortion Trap", font=get_font(12, bold=True), fill="#fcd34d")
    draw_wrapped_text(draw, "• If support heaves with anchor soil: LVDT registers 20% - 40% false settlement excess.", (440, 375), 315, get_font(11), "#fbbf24")
    draw_wrapped_text(draw, "• If support drags down with test pile: LVDT under-registers settlement, masking failing piles.", (440, 410), 315, get_font(11), "#fbbf24")
    draw_wrapped_text(draw, "• Invalidates Davisson failure criterion analysis.", (440, 445), 315, get_font(11), "#cbd5e1")

    make_card(draw, [430, 485, 770, 645], fill="#1e293b", outline="#16a34a")
    draw.text((440, 493), "Mandatory Engineering Defense", font=get_font(12, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "1. Strict ASTM D1143 §7.3 clearance: clear distance R >= 5D and >= 2.5m.", (440, 515), 315, get_font(11), "#86efac")
    draw_wrapped_text(draw, "2. Sleeve reference support posts in lubricated PVC pipes to isolate shallow soil movement.", (440, 550), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "3. Crosshead reaction supports decoupled from instrument datum.", (440, 595), 315, get_font(11), "#cbd5e1")

    # Mode 3 Card (Right)
    make_card(draw, [800, 175, 1170, 660], fill="#0f172a", outline="#2563eb", width=2)
    draw.rounded_rectangle([800, 175, 1170, 215], radius=6, fill="#1d4ed8")
    draw.text((812, 186), "FAILURE MODE 3: THERMAL DEFLECTION", font=get_font(14, bold=True), fill="#ffffff")

    make_card(draw, [815, 225, 1155, 335], fill="#1e293b", outline="#475569")
    draw.text((825, 233), "Solar Diurnal Thermal Bowing", font=get_font(12, bold=True), fill="#93c5fd")
    draw_wrapped_text(draw, "• 20m - 30m steel reference beams exposed to tropical solar radiation (top flange 45°C vs bottom 25°C).", (825, 255), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Differential expansion induces thermal curvature kappa = alpha * deltaT / h, bowing beams 2-5 mm.", (825, 290), 315, get_font(11), "#cbd5e1")

    make_card(draw, [815, 345, 1155, 475], fill="#1e293b", outline="#475569")
    draw.text((825, 353), "Engineering Data Corruption", font=get_font(12, bold=True), fill="#93c5fd")
    draw_wrapped_text(draw, "• Apparent diurnal settlement oscillation masks true concrete creep and rebound.", (825, 375), 315, get_font(11), "#60a5fa")
    draw_wrapped_text(draw, "• Creep rate criteria (< 0.25 mm/hr) fail artificially during noon solar peaks.", (825, 410), 315, get_font(11), "#60a5fa")
    draw_wrapped_text(draw, "• Unloading rebound appears negative or zero at dawn.", (825, 445), 315, get_font(11), "#cbd5e1")

    make_card(draw, [815, 485, 1155, 645], fill="#1e293b", outline="#16a34a")
    draw.text((825, 493), "Mandatory Engineering Defense", font=get_font(12, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "1. Full-length thermal insulation wrap and reflective shade tarp over entire datum beam.", (825, 515), 315, get_font(11), "#86efac")
    draw_wrapped_text(draw, "2. High-precision optical auto-level (0.01mm) with closed-loop backsight to remote benchmark (R > 25m).", (825, 550), 315, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "3. Software temperature compensation calibration.", (825, 605), 315, get_font(11), "#cbd5e1")

    draw_footer(draw, W, H)
    im.save(ASSETS_DIR / "slt-reaction-frame-failure-modes.webp", "WEBP", quality=92)
    print("Generated slt-reaction-frame-failure-modes.webp")


# ==========================================================
# 2. Figure 1: Anchor Pile Tension Failure & Main Beam Tilting (1100x680)
# ==========================================================
def generate_anchor_pile_tension_visual():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Failure Mode 1: Reaction Anchor Pile Pull-Out & Crosshead Tilting",
                "Mechanics of Asymmetric Uplift, Secondary Eccentric Loading & Head Shear Destruction")

    # Left Column: Symmetrical Ideal Reaction
    make_card(draw, [30, 110, 530, 620], fill="#0f172a", outline="#059669", width=2)
    draw.rounded_rectangle([30, 110, 530, 150], radius=6, fill="#047857")
    draw.text((45, 122), "IDEAL DESIGN: SYMMETRICAL REACTION (FS >= 2.0)", font=get_font(13, bold=True), fill="#ffffff")

    # Schematic representation (Symmetrical)
    draw.rectangle([50, 170, 510, 195], fill="#334155", outline="#64748b")
    draw.text((180, 175), "STEEL MAIN CROSSHEAD BEAM", font=get_font(11, bold=True), fill="#f8fafc")
    
    # Tie rods
    draw.line([(90, 195), (90, 270)], fill="#38bdf8", width=4)
    draw.line([(470, 195), (470, 270)], fill="#38bdf8", width=4)
    draw.text((65, 220), "T1 = P/2", font=get_font(11, bold=True), fill="#38bdf8")
    draw.text((445, 220), "T2 = P/2", font=get_font(11, bold=True), fill="#38bdf8")

    # Anchor piles
    draw.rectangle([70, 270, 110, 420], fill="#1e293b", outline="#059669", width=2)
    draw.text((65, 430), "Anchor Pile 1", font=get_font(11, bold=True), fill="#a7f3d0")
    draw.rectangle([450, 270, 490, 420], fill="#1e293b", outline="#059669", width=2)
    draw.text((445, 430), "Anchor Pile 2", font=get_font(11, bold=True), fill="#a7f3d0")

    # Center jack & test pile
    draw.rectangle([250, 210, 310, 260], fill="#d97706", outline="#f59e0b", width=2)
    draw.text((255, 225), "HYD. JACK", font=get_font(10, bold=True), fill="#ffffff")
    draw.rectangle([240, 280, 320, 440], fill="#1e293b", outline="#38bdf8", width=2)
    draw.text((250, 450), "Test Pile", font=get_font(12, bold=True), fill="#38bdf8")
    
    # Force arrows
    draw.line([(280, 210), (280, 195)], fill="#ef4444", width=4)
    draw.polygon([(280, 190), (275, 202), (285, 202)], fill="#ef4444")
    draw.text((290, 198), "P (Upward)", font=get_font(10, bold=True), fill="#ef4444")

    draw.line([(280, 260), (280, 280)], fill="#22c55e", width=4)
    draw.polygon([(280, 285), (275, 273), (285, 273)], fill="#22c55e")
    draw.text((290, 265), "P (Axial)", font=get_font(10, bold=True), fill="#22c55e")

    # Technical text
    make_card(draw, [45, 480, 515, 605], fill="#1e293b", outline="#334155")
    draw_wrapped_text(draw, "• Pure axial concentric compression vector: e = 0, theta = 0.", (55, 490), 450, get_font(11, bold=True), "#86efac")
    draw_wrapped_text(draw, "• Anchor pile uplift delta_1 = delta_2 <= 5 mm within elastic range.", (55, 512), 450, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Symmetrical skin friction mobilization along entire shaft in stiff layer.", (55, 534), 450, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Zero lateral shear component transferred to pile head.", (55, 556), 450, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Spherical bearing plate seats uniformly without edge binding.", (55, 578), 450, get_font(11), "#cbd5e1")


    # Right Column: Asymmetric Anchor Pull-out & Eccentric Collapse
    make_card(draw, [570, 110, 1070, 620], fill="#0f172a", outline="#dc2626", width=2)
    draw.rounded_rectangle([570, 110, 1070, 150], radius=6, fill="#991b1b")
    draw.text((585, 122), "HAZARD: ASYMMETRIC UPLIFT & TILT COLLAPSE", font=get_font(13, bold=True), fill="#ffffff")

    # Schematic representation (Tilted)
    # Tilted main beam: line from (590, 160) to (1050, 205)
    draw.polygon([(590, 155), (1050, 195), (1050, 215), (590, 175)], fill="#7f1d1d", outline="#ef4444")
    draw.text((720, 160), "TILTED BEAM (theta > 3°)", font=get_font(11, bold=True), fill="#fca5a5")

    # Tie rods with asymmetric displacement
    draw.line([(630, 170), (630, 230)], fill="#ef4444", width=4)
    draw.line([(1010, 210), (1010, 280)], fill="#38bdf8", width=4)
    draw.text((600, 195), "Uplift delta >> 25mm", font=get_font(10, bold=True), fill="#f87171")
    draw.text((980, 240), "delta <= 4mm", font=get_font(10, bold=True), fill="#38bdf8")

    # Anchor piles
    draw.rectangle([610, 230, 650, 380], fill="#450a0a", outline="#ef4444", width=2)
    draw.text((595, 390), "Anchor 1 Pulled Out!", font=get_font(11, bold=True), fill="#fca5a5")
    draw.rectangle([990, 280, 1030, 430], fill="#1e293b", outline="#334155", width=2)
    draw.text((990, 440), "Anchor 2 Intact", font=get_font(11, bold=True), fill="#94a3b8")

    # Center jack & test pile with eccentric load
    draw.rectangle([790, 220, 850, 270], fill="#b45309", outline="#ef4444", width=2)
    draw.text((795, 235), "ECCENTRIC", font=get_font(10, bold=True), fill="#ffffff")
    draw.rectangle([780, 290, 860, 450], fill="#1e293b", outline="#ef4444", width=2)
    draw.text((785, 460), "Test Pile", font=get_font(12, bold=True), fill="#fca5a5")

    # Eccentric arrows
    draw.line([(835, 270), (835, 290)], fill="#ef4444", width=4)
    draw.polygon([(835, 295), (830, 283), (840, 283)], fill="#ef4444")
    draw.text((845, 275), "P_off-center", font=get_font(10, bold=True), fill="#ef4444")

    # Lateral shear vector
    draw.line([(820, 285), (780, 285)], fill="#f59e0b", width=3)
    draw.polygon([(775, 285), (785, 280), (785, 290)], fill="#f59e0b")
    draw.text((725, 270), "Shear V = P*sin(theta)", font=get_font(10, bold=True), fill="#f59e0b")

    # Spalling warning
    draw.text((865, 305), "Crushing / Spalling!", font=get_font(10, bold=True), fill="#ef4444")

    # Technical text
    make_card(draw, [585, 480, 1055, 605], fill="#1e293b", outline="#334155")
    draw_wrapped_text(draw, "• Soft marine clay tension friction debonding triggers sudden pull-out.", (595, 490), 450, get_font(11, bold=True), "#fca5a5")
    draw_wrapped_text(draw, "• Eccentric moment M = P * e exceeds concrete core shear strength.", (595, 512), 450, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Massive horizontal kick force V pushes jack sideways, crushing ram seals.", (595, 534), 450, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• Sudden release of 600t reaction energy presents catastrophic safety hazard.", (595, 556), 450, get_font(11), "#cbd5e1")
    draw_wrapped_text(draw, "• ASTM D1143 §6.2 requires spherical swivel head & tie-back lateral bracing.", (595, 578), 450, get_font(11), "#86efac")

    draw_footer(draw, W, H)
    im.save(ASSETS_DIR / "slt-anchor-pile-tension-failure.webp", "WEBP", quality=92)
    print("Generated slt-anchor-pile-tension-failure.webp")


# ==========================================================
# 3. Figure 2: Ground Zone of Influence & Clearance Geometry (1100x680)
# ==========================================================
def generate_zone_of_influence_visual():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Failure Mode 2: Ground Zone of Influence & Clearance Geometry Compliance",
                "ASTM D1143 §7.3 Clear Distance Criteria: Soil Heave Fields vs Settlement Depression Bowls")

    # Top Banner: The Rule
    make_card(draw, [30, 110, W - 30, 160], fill="#1e293b", outline="#0284c7")
    draw.text((45, 118), "ASTM D1143 §7.3 & ISO 22477-1 MANDATORY GEOMETRICAL CLEARANCE RULES", font=get_font(13, bold=True), fill="#38bdf8")
    draw.text((45, 137), "Clear distance between test pile and reaction anchor piles: R >= 5D (min 2.5m). Reference beam supports: R >= 5D (min 2.5m).", font=get_font(12, bold=False), fill="#cbd5e1")

    # Schematic Drawing Area (Center)
    make_card(draw, [30, 175, W - 30, 480], fill="#0f172a", outline="#334155")

    # Soil line
    draw.line([(50, 270), (W - 50, 270)], fill="#475569", width=2)
    draw.text((55, 250), "GROUND SURFACE (ORIGINAL LEVEL)", font=get_font(11, bold=True), fill="#64748b")

    # Center Test Pile
    draw.rectangle([520, 270, 580, 450], fill="#1e293b", outline="#38bdf8", width=2)
    draw.text((525, 350), "TEST PILE (D)", font=get_font(10, bold=True), fill="#38bdf8")
    draw.text((530, 365), "Dia = D", font=get_font(10), fill="#94a3b8")

    # Settlement Depression Bowl (curved downward around test pile)
    # Draw arc/polygon representing settlement bowl
    pts_bowl = [
        (380, 270), (450, 280), (510, 305), (520, 315),
        (580, 315), (590, 305), (650, 280), (720, 270)
    ]
    draw.line(pts_bowl, fill="#ef4444", width=3)
    draw.text((430, 320), "Settlement Bowl w_drag(r)", font=get_font(11, bold=True), fill="#fca5a5")

    # Anchor Piles (Left & Right)
    draw.rectangle([150, 270, 190, 430], fill="#1e293b", outline="#d97706", width=2)
    draw.text((130, 440), "Anchor Pile 1", font=get_font(11, bold=True), fill="#fcd34d")
    draw.rectangle([910, 270, 950, 430], fill="#1e293b", outline="#d97706", width=2)
    draw.text((890, 440), "Anchor Pile 2", font=get_font(11, bold=True), fill="#fcd34d")

    # Soil Heave Curves around Anchor Piles (bulging upward)
    pts_heave_left = [(90, 270), (130, 255), (170, 248), (210, 255), (260, 270)]
    draw.line(pts_heave_left, fill="#f59e0b", width=3)
    draw.text((120, 230), "Ground Heave (+w_heave)", font=get_font(10, bold=True), fill="#fcd34d")

    pts_heave_right = [(840, 270), (890, 255), (930, 248), (970, 255), (1010, 270)]
    draw.line(pts_heave_right, fill="#f59e0b", width=3)
    draw.text((870, 230), "Ground Heave (+w_heave)", font=get_font(10, bold=True), fill="#fcd34d")

    # Reference Beam Support Positions
    # Position A: WRONG (Inside Zone of Influence)
    draw.rectangle([340, 220, 360, 270], fill="#ef4444")
    draw.text((300, 200), "WRONG DATUM (R < 5D)", font=get_font(10, bold=True), fill="#ef4444")
    draw.line([(350, 200), (350, 220)], fill="#ef4444", width=2)

    # Position B: CORRECT (Outside Zone of Influence)
    draw.rectangle([70, 190, 90, 270], fill="#22c55e")
    draw.text((50, 172), "CORRECT DATUM (R >= 5D)", font=get_font(10, bold=True), fill="#22c55e")
    draw.rectangle([1010, 190, 1030, 270], fill="#22c55e")
    draw.text((990, 172), "CORRECT DATUM (R >= 5D)", font=get_font(10, bold=True), fill="#22c55e")

    # Dimension lines
    draw.line([(190, 460), (520, 460)], fill="#38bdf8", width=2)
    draw.line([(190, 455), (190, 465)], fill="#38bdf8", width=2)
    draw.line([(520, 455), (520, 465)], fill="#38bdf8", width=2)
    draw.text((280, 465), "Clear Dist R >= 5D (>= 2.5m)", font=get_font(11, bold=True), fill="#38bdf8")

    draw.line([(580, 460), (910, 460)], fill="#38bdf8", width=2)
    draw.line([(580, 455), (580, 465)], fill="#38bdf8", width=2)
    draw.line([(910, 455), (910, 465)], fill="#38bdf8", width=2)
    draw.text((670, 465), "Clear Dist R >= 5D (>= 2.5m)", font=get_font(11, bold=True), fill="#38bdf8")

    # Bottom Comparison Table
    make_card(draw, [30, 495, 535, 620], fill="#1e293b", outline="#ef4444")
    draw.text((45, 505), "DEFECTIVE CLEARANCE ERRORS (R < 5D)", font=get_font(12, bold=True), fill="#f87171")
    draw_wrapped_text(draw, "1. Beam support inside settlement depression: support sags with test pile, dial gauge measures relative settlement delta = w_pile - w_support, UNDERESTIMATING pile settlement by 20%-35%.", (45, 525), 475, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "2. Beam support inside anchor heave field: support lifts upward with anchor pile, dial gauge OVERESTIMATES settlement by 25%-45%, falsely failing a compliant pile.", (45, 568), 475, get_font(10), "#cbd5e1")

    make_card(draw, [565, 495, 1070, 620], fill="#1e293b", outline="#16a34a")
    draw.text((580, 505), "COMPLIANT RIGID DATUM ARCHITECTURE", font=get_font(12, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "1. Clear distance R >= 5D (and >= 2.5m) maintained strictly to both test pile and all anchor piles / kentledge cribbing.", (580, 525), 475, get_font(10), "#86efac")
    draw_wrapped_text(draw, "2. Datum supports driven >= 1.5m below ground surface, encased in greased PVC outer sleeves to isolate topsoil heave/shrinkage.", (580, 555), 475, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "3. Cross-beam reference spanning independently of reaction kentledge.", (580, 595), 475, get_font(10), "#cbd5e1")

    draw_footer(draw, W, H)
    im.save(ASSETS_DIR / "slt-reference-beam-zone-of-influence.webp", "WEBP", quality=92)
    print("Generated slt-reference-beam-zone-of-influence.webp")


# ==========================================================
# 4. Figure 3: Solar Radiation Thermal Deflection & Optical Benchmark (1100x680)
# ==========================================================
def generate_thermal_deflection_visual():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Failure Mode 3: Solar Radiation Thermal Bowing of Reference Beams",
                "Thermal Curvature Mechanics, Diurnal Settlement Drift Curves & Optical Survey Control")

    # Left: Thermal Mechanics
    make_card(draw, [30, 110, 530, 440], fill="#0f172a", outline="#f59e0b", width=2)
    draw.rounded_rectangle([30, 110, 530, 150], radius=6, fill="#b45309")
    draw.text((45, 122), "STEEL BEAM THERMAL BOWING MECHANICS", font=get_font(13, bold=True), fill="#ffffff")

    # Sun drawing
    draw.ellipse([450, 165, 500, 215], fill="#f59e0b", outline="#fde047", width=2)
    draw.text((455, 182), "SUN", font=get_font(11, bold=True), fill="#ffffff")

    # Beam cross-section showing differential temp
    draw.rectangle([60, 200, 420, 220], fill="#dc2626")
    draw.text((70, 204), "TOP FLANGE: DIRECT SUN (T_top = 45°C - 55°C)", font=get_font(10, bold=True), fill="#ffffff")
    
    draw.rectangle([230, 220, 250, 280], fill="#475569")
    draw.text((260, 245), "Web: H = 400mm", font=get_font(10), fill="#94a3b8")

    draw.rectangle([60, 280, 420, 300], fill="#2563eb")
    draw.text((70, 284), "BOTTOM FLANGE: SHADE / SOIL (T_bot = 25°C - 30°C)", font=get_font(10, bold=True), fill="#ffffff")

    # Formula box
    make_card(draw, [45, 315, 515, 425], fill="#1e293b", outline="#475569")
    draw.text((55, 323), "Governing Thermal Deflection Equations:", font=get_font(11, bold=True), fill="#38bdf8")
    draw.text((55, 345), "Thermal Gradient:  deltaT = T_top - T_bot = 20°C", font=get_font(11), fill="#fcd34d")
    draw.text((55, 365), "Thermal Curvature: kappa = alpha * deltaT / H_beam", font=get_font(11), fill="#fcd34d")
    draw.text((55, 385), "Midspan Deflection: delta_th = (kappa * L^2) / 8", font=get_font(11, bold=True), fill="#f87171")
    draw.text((55, 405), "For L = 24m, H = 0.4m, deltaT = 20°C  -->  delta_th = 4.32 mm!", font=get_font(11, bold=True), fill="#ef4444")

    # Right: Diurnal Settlement Drift vs Reality
    make_card(draw, [560, 110, 1070, 440], fill="#0f172a", outline="#38bdf8", width=2)
    draw.rounded_rectangle([560, 110, 1070, 150], radius=6, fill="#0369a1")
    draw.text((575, 122), "DIURNAL SETTLEMENT DRIFT VS TRUE PILE REBOUND", font=get_font(13, bold=True), fill="#ffffff")

    # Plot axes
    draw.line([(620, 370), (1030, 370)], fill="#475569", width=2) # X time
    draw.line([(620, 180), (620, 370)], fill="#475569", width=2) # Y settlement
    draw.text((580, 170), "Settlement (mm)", font=get_font(10), fill="#94a3b8")
    draw.text((1000, 380), "Time (hrs)", font=get_font(10), fill="#94a3b8")

    # Time markers
    draw.text((630, 375), "06:00", font=get_font(9), fill="#64748b")
    draw.text((720, 375), "12:00 (Noon)", font=get_font(9), fill="#64748b")
    draw.text((820, 375), "18:00 (Sunset)", font=get_font(9), fill="#64748b")
    draw.text((930, 375), "24:00 (Midnight)", font=get_font(9), fill="#64748b")

    # True pile settlement (smooth sustained line)
    draw.line([(620, 240), (720, 250), (820, 255), (930, 258), (1030, 260)], fill="#22c55e", width=3)
    draw.text((880, 240), "True Settlement (Creep < 0.1 mm/hr)", font=get_font(10, bold=True), fill="#86efac")

    # Uncorrected Dial Gauge Reading with Solar Thermal Camber
    draw.line([(620, 240), (670, 270), (720, 310), (770, 295), (820, 265), (870, 245), (930, 248), (1030, 252)], fill="#ef4444", width=3)
    draw.text((680, 320), "Uncorrected Dial Gauge (+3.5mm Solar Peak)", font=get_font(10, bold=True), fill="#fca5a5")

    # Warning text
    make_card(draw, [575, 395, 1055, 430], fill="#1e293b", outline="#475569")
    draw.text((585, 405), "Fatal Dispute: Apparent creep failure during afternoon sun, false 'heave' during cooling.", font=get_font(10, bold=True), fill="#f87171")

    # Bottom Full-Width: Dual Defense Protocol
    make_card(draw, [30, 460, W - 30, 620], fill="#1e293b", outline="#16a34a", width=2)
    draw.text((45, 470), "DUAL DEFENSE PROTOCOL: THERMAL WRAPPING & INDEPENDENT OPTICAL BENCHMARK", font=get_font(12, bold=True), fill="#4ade80")
    
    make_card(draw, [45, 495, 530, 605], fill="#0f172a", outline="#334155")
    draw.text((55, 505), "Passive Physical Mitigation", font=get_font(11, bold=True), fill="#38bdf8")
    draw_wrapped_text(draw, "• Wrap entire steel datum beam in 50mm reflective foil-backed mineral wool insulation.", (55, 525), 460, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "• Erect continuous UV shade tarp over full test frame and instrument bridge.", (55, 550), 460, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "• Paint reference beams high-reflectance titanium white (albedo > 0.85).", (55, 575), 460, get_font(10), "#cbd5e1")

    make_card(draw, [560, 495, 1055, 605], fill="#0f172a", outline="#334155")
    draw.text((570, 505), "Active Geodetic Benchmark Verification", font=get_font(11, bold=True), fill="#38bdf8")
    draw_wrapped_text(draw, "• High-precision optical level (0.01mm micrometer) setup outside test area (R > 25m).", (570, 525), 460, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "• Invar precision staff mounted directly on test pile head and reference beam supports.", (570, 550), 460, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "• Closed-loop backsight verification every load increment to mathematically purge thermal drift.", (570, 575), 460, get_font(10), "#86efac")

    draw_footer(draw, W, H)
    im.save(ASSETS_DIR / "slt-thermal-deflection-diurnal-drift.webp", "WEBP", quality=92)
    print("Generated slt-thermal-deflection-diurnal-drift.webp")


# ==========================================================
# 5. Figure 4: Hydraulic Jack Packing Friction & Calibration Chain (1100x680)
# ==========================================================
def generate_calibration_chain_visual():
    W, H = 1100, 680
    im = Image.new("RGB", (W, H), "#090d16")
    draw = ImageDraw.Draw(im)
    draw_header(draw, W, "Quality Chain: Hydraulic Jack Packing Friction vs Integral Calibration",
                "ASTM D1143 §7 Calibration Compliance: Packing Friction Hysteresis vs Certified Load Cell Verification")

    # Left: The Packing Friction Hysteresis Trap
    make_card(draw, [30, 110, 530, 620], fill="#0f172a", outline="#dc2626", width=2)
    draw.rounded_rectangle([30, 110, 530, 150], radius=6, fill="#991b1b")
    draw.text((45, 122), "THE HYDRAULIC PACKING FRICTION TRAP", font=get_font(13, bold=True), fill="#ffffff")

    make_card(draw, [45, 165, 515, 310], fill="#1e293b", outline="#475569")
    draw.text((55, 175), "Piston Seal Friction Mechanics", font=get_font(11, bold=True), fill="#fca5a5")
    draw_wrapped_text(draw, "Heavy-duty hydraulic jacks (500t - 1000t) utilize polyurethane U-cup or chevron packing seals. Seal squeeze against the cylinder wall generates immense friction F_friction:", (55, 195), 450, get_font(10), "#cbd5e1")
    draw.text((55, 240), "• Loading Phase:   P_gauge * Area = P_actual + F_friction", font=get_font(11, bold=True), fill="#ef4444")
    draw.text((70, 260), "--> Actual load on pile is 5% - 12% LOWER than indicated!", font=get_font(10), fill="#fca5a5")
    draw.text((55, 275), "• Unloading Phase: P_gauge * Area = P_actual - F_friction", font=get_font(11, bold=True), fill="#38bdf8")
    draw.text((70, 293), "--> Hysteresis loop distorts true elastic rebound measurements.", font=get_font(10), fill="#93c5fd")

    make_card(draw, [45, 325, 515, 465], fill="#1e293b", outline="#475569")
    draw.text((55, 335), "Why Pressure Gauge Alone Fails ASTM D1143", font=get_font(11, bold=True), fill="#fca5a5")
    draw_wrapped_text(draw, "1. Separate gauge calibration ignores ram packing friction entirely.", (55, 355), 450, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "2. Pump oil temperature rise decreases oil viscosity, altering seal drag mid-test.", (55, 380), 450, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "3. Eccentric tilting of ram increases metal-to-metal guide ring friction exponentially.", (55, 410), 450, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "4. Legal dispute: Design capacity claimed to be achieved was never reached in the soil.", (55, 440), 450, get_font(10), "#f87171")

    make_card(draw, [45, 480, 515, 605], fill="#1e293b", outline="#ef4444")
    draw.text((55, 490), "Dispute Evidence: Falsely Passed Piles", font=get_font(11, bold=True), fill="#fca5a5")
    draw_wrapped_text(draw, "At 10,000 kN nominal load, a 10% packing friction error means the pile only resisted 9,000 kN. The foundation is signed off under-strength, leading to long-term superstructure cracking and legal claims.", (55, 515), 450, get_font(10), "#cbd5e1")


    # Right: ASTM D1143 Certified Quality Chain
    make_card(draw, [570, 110, 1070, 620], fill="#0f172a", outline="#16a34a", width=2)
    draw.rounded_rectangle([570, 110, 1070, 150], radius=6, fill="#047857")
    draw.text((585, 122), "ASTM D1143 §7 CERTIFIED CALIBRATION CHAIN", font=get_font(13, bold=True), fill="#ffffff")

    make_card(draw, [585, 165, 1055, 310], fill="#1e293b", outline="#475569")
    draw.text((595, 175), "Integral System Calibration Standard", font=get_font(11, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "ASTM D1143 §7.1 mandates that hydraulic jack, pump, pressure gauge, and electronic load cell MUST be calibrated together as an integral system in an accredited testing press (ISO/IEC 17025):", (595, 195), 450, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "• Full calibration curve covers both ascending and descending cycles.", (595, 245), 450, get_font(10), "#86efac")
    draw_wrapped_text(draw, "• Calibration valid for maximum 6 months or after any hydraulic overhaul.", (595, 270), 450, get_font(10), "#86efac")
    draw_wrapped_text(draw, "• Calibrated spherical bearing plate placed between jack and crosshead.", (595, 290), 450, get_font(10), "#cbd5e1")

    make_card(draw, [585, 325, 1055, 465], fill="#1e293b", outline="#475569")
    draw.text((595, 335), "Independent In-Line Load Cell Verification", font=get_font(11, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "• A calibrated multi-column electronic load cell (strain-gauge based) is placed directly in series between the jack ram and the pile cap.", (595, 355), 450, get_font(10), "#cbd5e1")
    draw_wrapped_text(draw, "• Load cell measures TRUE compressive force delivered to the concrete pile, completely unaffected by hydraulic jack packing friction.", (595, 390), 450, get_font(10), "#86efac")
    draw_wrapped_text(draw, "• Pressure gauge serves only as secondary check and operator control.", (595, 430), 450, get_font(10), "#cbd5e1")

    make_card(draw, [585, 480, 1055, 605], fill="#1e293b", outline="#16a34a")
    draw.text((595, 490), "Auditable Field QA/QC Acceptance Criteria", font=get_font(11, bold=True), fill="#4ade80")
    draw_wrapped_text(draw, "1. Discrepancy between load cell and calibrated pressure gauge <= 2.0%.", (595, 515), 450, get_font(10), "#86efac")
    draw_wrapped_text(draw, "2. If discrepancy exceeds 5.0%, test must halt immediately for seal/cell inspection.", (595, 540), 450, get_font(10), "#fcd34d")
    draw_wrapped_text(draw, "3. Full calibration certificates with traceability to national metrology institutes (NIST / NIM / TISI) attached to official engineering test report.", (595, 565), 450, get_font(10), "#cbd5e1")

    draw_footer(draw, W, H)
    im.save(ASSETS_DIR / "slt-hydraulic-jack-calibration-chain.webp", "WEBP", quality=92)
    print("Generated slt-hydraulic-jack-calibration-chain.webp")


if __name__ == "__main__":
    generate_cover_visual()
    generate_anchor_pile_tension_visual()
    generate_zone_of_influence_visual()
    generate_thermal_deflection_visual()
    generate_calibration_chain_visual()
    print("All 5 WebP visuals successfully generated!")
