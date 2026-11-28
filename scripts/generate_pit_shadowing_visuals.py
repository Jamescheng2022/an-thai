"""Generate crisp, lightweight WebP engineering diagrams for Low-Strain PIT Shallow Bulbing & Deep Defect Shadowing."""
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

def draw_header(draw, width, title, subtitle, tag="AN-THAI GEOTECHNICAL & FOUNDATION TESTING"):
    draw.rectangle([0, 0, width, 95], fill="#0f172a")
    draw.rectangle([0, 93, width, 96], fill="#0284c7")
    
    f_tag = get_font(12, bold=True)
    draw.rounded_rectangle([30, 16, 310, 38], radius=4, fill="#0369a1")
    draw.text((38, 19), tag, font=f_tag, fill="#ffffff")
    
    f_title = get_font(21, bold=True)
    f_sub = get_font(13, bold=False)
    draw.text((30, 45), title, font=f_title, fill="#f8fafc")
    draw.text((330, 20), subtitle, font=f_sub, fill="#94a3b8")

def draw_footer(draw, width, height, note="Standards: ASTM D5882-16 (2024) | ISO 22477-4:2018 | EN 1997-1 | ASTM D4945 | ISO/IEC 17025"):
    draw.rectangle([0, height - 38, width, height], fill="#0f172a")
    draw.rectangle([0, height - 39, width, height - 37], fill="#334155")
    f_foot = get_font(12, bold=False)
    f_brand = get_font(12, bold=True)
    draw.text((30, height - 26), "AN-THAI ENGINEERING (LOW-STRAIN INTEGRITY TESTING INTELLIGENCE)", font=f_brand, fill="#38bdf8")
    bbox = draw.textbbox((0, 0), note, font=f_foot)
    draw.text((width - bbox[2] - 30, height - 26), note, font=f_foot, fill="#94a3b8")

def make_card(draw, box, fill="#1e293b", outline="#334155", radius=8, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def draw_wrapped_text(draw, text, pos, max_width, font, fill, line_spacing=4):
    words = text.split(' ')
    lines = []
    curr = []
    for w in words:
        test_line = ' '.join(curr + [w])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] <= max_width:
            curr.append(w)
        else:
            if curr:
                lines.append(' '.join(curr))
            curr = [w]
    if curr:
        lines.append(' '.join(curr))
    
    x, y = pos
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        y += font.size + line_spacing
    return y

# -------------------------------------------------------------
# 1. COVER: pit-shallow-bulbing-impedance-shadowing-cover.webp
# -------------------------------------------------------------
def generate_cover():
    w, h = 1200, 720
    im = Image.new("RGB", (w, h), "#090d16")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, w, "LOW-STRAIN PILE INTEGRITY (PIT): THE SHALLOW BULBING IMPEDANCE TRAP",
                "Acoustic Shadowing, False Necking Reflection Pairs, and Deep Defect Resolution")
    
    # Left Column: Pile & Wave Mechanics Diagram (x: 40 to 450)
    make_card(draw, [30, 110, 460, 660], fill="#131c2e", outline="#1e293b")
    f_sub = get_font(14, bold=True)
    draw.text((45, 122), "BORED PILE ACOUSTIC WAVE PROPAGATION", font=f_sub, fill="#38bdf8")
    
    # Pile Top & Impact (y: 155 to 220)
    draw.rectangle([180, 155, 310, 180], fill="#cbd5e1", outline="#94a3b8")
    draw.text((195, 160), "Pile Head (Sound Concrete)", font=get_font(10, bold=True), fill="#0f172a")
    
    # Hammer & Sensor
    draw.polygon([(190, 130), (220, 130), (205, 150)], fill="#f59e0b")
    draw.text((180, 115), "Impact Hammer", font=get_font(10, bold=True), fill="#f59e0b")
    draw.rectangle([270, 142, 290, 155], fill="#10b981")
    draw.text((295, 142), "Sensor (V)", font=get_font(10, bold=True), fill="#10b981")
    
    # Incident Wave Arrow
    draw.line([(245, 180), (245, 230)], fill="#38bdf8", width=3)
    draw.polygon([(240, 225), (250, 225), (245, 235)], fill="#38bdf8")
    draw.text((255, 195), "Incident Pulse I(t)", font=get_font(10), fill="#38bdf8")
    
    # Upper Shaft: D0 = 1.0m (y: 180 to 250)
    draw.rectangle([200, 180, 290, 250], fill="#334155", outline="#475569")
    draw.text((105, 205), "Z1 = ρc A0\n(Nominal D0)", font=get_font(11, bold=True), fill="#94a3b8")
    
    # Shallow Bulbing Zone: D = 1.4m (y: 250 to 370)
    draw.polygon([(200, 250), (160, 275), (160, 345), (200, 370),
                  (290, 370), (330, 345), (330, 275), (290, 250)], fill="#475569", outline="#0284c7", width=2)
    draw.text((175, 295), "BULBING (Z2 > Z1)\nOverbreak in Soft Clay", font=get_font(11, bold=True), fill="#e0f2fe")
    
    # Reflection 1 & 2 indicators
    draw.text((45, 260), "1. Bulb Inflow:\n   Z2 > Z1 -> R < 0\n   Negative Velocity (Tension)", font=get_font(10), fill="#38bdf8")
    draw.line([(150, 275), (165, 275)], fill="#38bdf8", width=2)
    
    draw.text((45, 360), "2. Bulb Outflow:\n   Z3 < Z2 -> R > 0\n   Positive Echo (FALSE NECK)", font=get_font(10), fill="#f87171")
    draw.line([(150, 370), (195, 370)], fill="#f87171", width=2)
    
    # Shaft continues (y: 370 to 500)
    draw.rectangle([200, 370, 290, 500], fill="#334155", outline="#475569")
    
    # Acoustic Shadowing Hatch
    for y_hatch in range(380, 490, 15):
        draw.line([(202, y_hatch), (288, y_hatch + 10)], fill="#1e293b", width=2)
    draw.text((210, 420), "ACOUSTIC SHADOW\nWave Attenuated\nHigh Freq Filtered", font=get_font(9, bold=True), fill="#f59e0b")
    
    # Deep Flaw: Cold Joint / Infiltration (y: 500 to 525)
    draw.rectangle([200, 500, 290, 520], fill="#ef4444", outline="#b91c1c")
    draw.text((55, 502), "Real Deep Flaw (18m)\nSoil Inclusion / Void", font=get_font(10, bold=True), fill="#ef4444")
    draw.line([(175, 510), (198, 510)], fill="#ef4444", width=2)
    
    # Lower Shaft & Toe (y: 520 to 620)
    draw.rectangle([200, 520, 290, 610], fill="#334155", outline="#475569")
    draw.rectangle([190, 610, 300, 625], fill="#64748b", outline="#94a3b8")
    draw.text((205, 630), "Pile Toe (28m)", font=get_font(10, bold=True), fill="#94a3b8")
    draw.text((60, 610), "Weak Toe Return\nSubmerged in Noise", font=get_font(10), fill="#64748b")
    
    # Right Side: 3 Key Forensic Cards (x: 480 to 1160)
    
    # Card 1: The False Necking Trap (y: 110 to 280)
    make_card(draw, [480, 110, 1160, 280], fill="#1e293b", outline="#334155")
    draw.text((500, 125), "TRAP 1: THE SHALLOW BULBING IMPEDANCE PAIR MISINTERPRETATION", font=f_sub, fill="#f87171")
    draw_wrapped_text(draw,
        "When an incident compressive stress wave enters an enlarged cross-section (Z2 > Z1, bulbing), it reflects a downward tensile wave (negative velocity peak). Upon exiting back to nominal diameter (Z3 < Z2), it reflects a sharp upward compressive wave (positive velocity peak). Inexperienced testing firms misclassify this second positive peak as an isolated structural necking or crack, triggering unjustified pile rejections or costly forensic coring.",
        (500, 155), 630, get_font(12), "#cbd5e1", line_spacing=3)
    
    # Mini wave graphic inside Card 1
    draw.rectangle([500, 230, 1140, 270], fill="#0f172a", outline="#475569")
    draw.line([(510, 250), (1130, 250)], fill="#334155", width=1)
    # Impact
    draw.line([(520, 250), (530, 235), (540, 250)], fill="#38bdf8", width=2)
    draw.text((520, 253), "Impact", font=get_font(9), fill="#38bdf8")
    # Negative Dip (Bulb In)
    draw.line([(570, 250), (585, 265), (600, 250)], fill="#0284c7", width=2)
    draw.text((565, 233), "-ΔV (Bulb Top)", font=get_font(9), fill="#38bdf8")
    # Positive Peak (Bulb Out)
    draw.line([(620, 250), (635, 235), (650, 250)], fill="#ef4444", width=2)
    draw.text((615, 253), "+ΔV (False Necking!)", font=get_font(9, bold=True), fill="#f87171")
    # Multiple internal resonance
    draw.line([(670, 250), (680, 258), (690, 245), (700, 250)], fill="#f59e0b", width=1)
    draw.text((670, 233), "Harmonic Ringing", font=get_font(9), fill="#f59e0b")
    # Weak toe
    draw.line([(1000, 250), (1015, 243), (1030, 250)], fill="#64748b", width=1)
    draw.text((990, 253), "Obscured Toe Return", font=get_font(9), fill="#94a3b8")
    
    # Card 2: The Acoustic Shadowing & Deep Masking (y: 295 to 465)
    make_card(draw, [480, 295, 1160, 465], fill="#1e293b", outline="#334155")
    draw.text((500, 310), "TRAP 2: ACOUSTIC ENERGY SHADOWING & CONCEALED DEEP FLAWS", font=f_sub, fill="#f59e0b")
    draw_wrapped_text(draw,
        "Shallow impedance discontinuities act as high-efficiency energy traps. The multiple reflections between the pile head and the bulbing boundary, combined with high skin damping in surrounding soft soils, rapidly deplete stress wave energy. The transmitted wave beneath the bulb suffers severe high-frequency attenuation. Severe defects (voids, inclusions) at 12m–25m depth produce returns buried under the noise floor, leading to catastrophic false-positive 'Pass' (Category A) ratings.",
        (500, 340), 630, get_font(12), "#cbd5e1", line_spacing=3)
    
    make_card(draw, [500, 415, 1140, 455], fill="#0f172a", outline="#475569")
    draw.text((515, 422), "Mathematical Energy Loss: Transmission T = 4*Z1*Z2 / (Z1 + Z2)^2 < 1.0 per boundary crossing.", font=get_font(11, bold=True), fill="#38bdf8")
    draw.text((515, 437), "Result: By depth 15m, signal-to-noise ratio (SNR) decays by >70% compared to uniform shaft.", font=get_font(11), fill="#f1f5f9")
    
    # Card 3: Multi-Tier Resolution Protocol (y: 480 to 660)
    make_card(draw, [480, 480, 1160, 660], fill="#1e293b", outline="#334155")
    draw.text((500, 495), "ENGINEERING RESOLUTION & FORENSIC ARBITRATION MATRIX", font=f_sub, fill="#10b981")
    
    # 3 Steps horizontal cards
    step_w = 205
    steps = [
        ("Tier 1: Mobility & Filtering", "Examine frequency admittance N(f). Bulbing depresses baseline mobility; necking elevates it. Multi-sensor setup cancels 3D modes.", "#0284c7"),
        ("Tier 2: High-Strain PDA", "Deploy ASTM D4945 dynamic load test with 20–80 kN-m energy hammer. Massive stress wave easily penetrates shallow bulbing.", "#f59e0b"),
        ("Tier 3: CSL / Core Drilling", "ASTM D6760 sonic logging or ASTM C42 diamond coring down to the toe to verify deep concrete compressive integrity.", "#10b981")
    ]
    for idx, (stitle, sdesc, scol) in enumerate(steps):
        sx = 500 + idx * (step_w + 8)
        make_card(draw, [sx, 525, sx + step_w, 645], fill="#0f172a", outline=scol)
        draw.text((sx + 10, 535), stitle, font=get_font(11, bold=True), fill=scol)
        draw_wrapped_text(draw, sdesc, (sx + 10, 555), step_w - 20, get_font(10), "#cbd5e1", line_spacing=2)
    
    draw_footer(draw, w, h)
    im.save(ASSETS_DIR / "pit-shallow-bulbing-impedance-shadowing-cover.webp", "WEBP", quality=90)
    print("Cover generated successfully.")

# -------------------------------------------------------------
# 2. FIGURE 1: pit-wave-propagation-impedance-boundaries.webp
# -------------------------------------------------------------
def generate_figure_1():
    w, h = 1100, 680
    im = Image.new("RGB", (w, h), "#090d16")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, w, "STRESS WAVE MECHANICS & ACOUSTIC IMPEDANCE BOUNDARY TRANSITIONS",
                "Mathematical Principles of 1D Wave Equation, Reflection (R) and Transmission (T)",
                tag="ASTM D5882 / ISO 22477-4 THEORY")
    
    # Formula bar across top (y: 105 to 165)
    make_card(draw, [30, 105, 1070, 165], fill="#131c2e", outline="#0284c7")
    draw.text((45, 115), "1D Wave Equation: ∂²u/∂t² = c² ∂²u/∂x²   |   Bar Velocity: c = √(E/ρ)   |   Acoustic Impedance: Z = ρ·c·A = E·A/c",
              font=get_font(12, bold=True), fill="#38bdf8")
    draw.text((45, 138), "Reflection (Velocity): Rv = (Z1 - Z2) / (Z1 + Z2)   |   Reflection (Force): Rf = (Z2 - Z1) / (Z1 + Z2)   |   Transmission: T = 2·Z1 / (Z1 + Z2)",
              font=get_font(12, bold=False), fill="#cbd5e1")
    
    # 3 Columns for 3 physical scenarios (y: 180 to 620)
    col_w = 330
    
    # Col 1: Sound Uniform Pile (x: 30 to 360)
    make_card(draw, [30, 180, 360, 620], fill="#1e293b", outline="#334155")
    draw.text((45, 195), "CASE 1: UNIFORM SOUND PILE", font=get_font(13, bold=True), fill="#10b981")
    draw.text((45, 215), "Impedance Z = Constant along length", font=get_font(11), fill="#94a3b8")
    
    # Pile graphic
    draw.rectangle([160, 245, 230, 470], fill="#334155", outline="#475569")
    draw.rectangle([150, 470, 240, 480], fill="#64748b", outline="#94a3b8")
    draw.text((165, 485), "Pile Toe (2L/c)", font=get_font(10), fill="#94a3b8")
    
    # Waveform box
    draw.rectangle([45, 505, 345, 605], fill="#0f172a", outline="#475569")
    draw.line([(55, 555), (335, 555)], fill="#334155", width=1)
    draw.line([(65, 555), (75, 520), (85, 555)], fill="#10b981", width=2)
    draw.text((60, 560), "Impact (t=0)", font=get_font(9), fill="#10b981")
    draw.line([(280, 555), (290, 530), (300, 555)], fill="#10b981", width=2)
    draw.text((270, 560), "Clear Toe Echo", font=get_font(9), fill="#10b981")
    draw.text((55, 510), "ASTM Category A (Intact)", font=get_font(10, bold=True), fill="#10b981")
    
    # Col 2: Necking / Defect (x: 385 to 715)
    make_card(draw, [385, 180, 715, 620], fill="#1e293b", outline="#334155")
    draw.text((400, 195), "CASE 2: TRUE SECTION REDUCTION", font=get_font(13, bold=True), fill="#ef4444")
    draw.text((400, 215), "Z2 < Z1 (Necking / Void / Soil Cavity)", font=get_font(11), fill="#94a3b8")
    
    # Pile graphic with necking
    draw.rectangle([515, 245, 585, 330], fill="#334155", outline="#475569")
    draw.rectangle([535, 330, 565, 380], fill="#ef4444", outline="#b91c1c")
    draw.rectangle([515, 380, 585, 470], fill="#334155", outline="#475569")
    draw.rectangle([505, 470, 595, 480], fill="#64748b", outline="#94a3b8")
    draw.text((420, 345), "Necking: A2 < A1\nRv > 0 (In-phase)", font=get_font(10, bold=True), fill="#ef4444")
    
    # Waveform box
    draw.rectangle([400, 505, 700, 605], fill="#0f172a", outline="#475569")
    draw.line([(410, 555), (690, 555)], fill="#334155", width=1)
    draw.line([(420, 555), (430, 520), (440, 555)], fill="#38bdf8", width=2)
    draw.text((415, 560), "Impact", font=get_font(9), fill="#38bdf8")
    # Positive Defect Echo
    draw.line([(510, 555), (525, 525), (540, 555)], fill="#ef4444", width=2)
    draw.text((500, 560), "+ΔV Defect (t1)", font=get_font(9, bold=True), fill="#ef4444")
    # Diminished Toe
    draw.line([(635, 555), (645, 540), (655, 555)], fill="#64748b", width=1)
    draw.text((630, 560), "Attenuated Toe", font=get_font(9), fill="#94a3b8")
    draw.text((410, 510), "ASTM Category B/C (Defective)", font=get_font(10, bold=True), fill="#ef4444")
    
    # Col 3: Bulbing Overbreak (x: 740 to 1070)
    make_card(draw, [740, 180, 1070, 620], fill="#1e293b", outline="#334155")
    draw.text((755, 195), "CASE 3: BULBING IMPEDANCE PAIR", font=get_font(13, bold=True), fill="#f59e0b")
    draw.text((755, 215), "Z2 > Z1 (Overbreak in Soft Strata)", font=get_font(11), fill="#94a3b8")
    
    # Pile graphic with bulb
    draw.rectangle([870, 245, 940, 310], fill="#334155", outline="#475569")
    draw.polygon([(870, 310), (840, 330), (840, 370), (870, 390),
                  (940, 390), (970, 370), (970, 330), (940, 310)], fill="#475569", outline="#0284c7")
    draw.rectangle([870, 390, 940, 470], fill="#334155", outline="#475569")
    draw.rectangle([860, 470, 950, 480], fill="#64748b", outline="#94a3b8")
    draw.text((755, 335), "Bulb Top: Rv < 0\nBulb Bot: Rv > 0", font=get_font(10, bold=True), fill="#38bdf8")
    
    # Waveform box
    draw.rectangle([755, 505, 1055, 605], fill="#0f172a", outline="#475569")
    draw.line([(765, 555), (1045, 555)], fill="#334155", width=1)
    draw.line([(775, 555), (785, 520), (795, 555)], fill="#38bdf8", width=2)
    draw.text((770, 560), "Impact", font=get_font(9), fill="#38bdf8")
    # Negative then Positive Pair
    draw.line([(830, 555), (845, 580), (860, 555)], fill="#0284c7", width=2)
    draw.text((825, 538), "-ΔV (Bulb In)", font=get_font(9), fill="#38bdf8")
    draw.line([(875, 555), (890, 525), (905, 555)], fill="#f87171", width=2)
    draw.text((875, 560), "+ΔV (Trap!)", font=get_font(9, bold=True), fill="#f87171")
    # Wave ring & obscured toe
    draw.line([(930, 555), (940, 563), (950, 550), (960, 555)], fill="#f59e0b", width=1)
    draw.text((930, 560), "Ringing/Shadow", font=get_font(9), fill="#f59e0b")
    draw.text((765, 510), "ASTM Category D (Inconclusive / Trap)", font=get_font(10, bold=True), fill="#f59e0b")
    
    draw_footer(draw, w, h)
    im.save(ASSETS_DIR / "pit-wave-propagation-impedance-boundaries.webp", "WEBP", quality=90)
    print("Figure 1 generated successfully.")

# -------------------------------------------------------------
# 3. FIGURE 2: pit-shallow-bulbing-vs-necking-reflectograms.webp
# -------------------------------------------------------------
def generate_figure_2():
    w, h = 1100, 680
    im = Image.new("RGB", (w, h), "#090d16")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, w, "REFLECTOGRAM ANATOMY: SHALLOW BULBING PAIR VS. STRUCTURAL NECKING",
                "Identifying the Inverted Trough Precursor (-ΔV) to Avoid False Rejections",
                tag="ASTM D5882 TIME-DOMAIN SIGNAL FORENSICS")
    
    # 2 Comparison Panels (Left: True Necking; Right: Shallow Bulbing)
    panel_w = 505
    
    # Left Panel: True Necking (x: 30 to 535)
    make_card(draw, [30, 105, 535, 620], fill="#1e293b", outline="#334155")
    draw.text((45, 120), "TRUE STRUCTURAL NECKING (ISOLATED DEFECT)", font=get_font(13, bold=True), fill="#ef4444")
    draw.text((45, 142), "Single in-phase compressive reflection from impedance drop", font=get_font(11), fill="#94a3b8")
    
    # Oscilloscope screen
    draw.rectangle([45, 170, 520, 430], fill="#0a0f1d", outline="#475569")
    # Grid lines
    for gx in range(85, 510, 45):
        draw.line([(gx, 175), (gx, 425)], fill="#1e293b", width=1)
    for gy in range(200, 420, 35):
        draw.line([(50, gy), (515, gy)], fill="#1e293b", width=1)
    draw.line([(50, 300), (515, 300)], fill="#334155", width=2) # Center line
    
    # Waveform: Impact -> Flat -> Positive Peak -> Flat -> Moderate Toe
    pts_neck = [
        (55, 300), (70, 300), (85, 210), (100, 300), (115, 305), (140, 300),
        (200, 300), (220, 240), (240, 300), (260, 303), (300, 300),
        (420, 300), (440, 260), (460, 300), (500, 300)
    ]
    for i in range(len(pts_neck)-1):
        draw.line([pts_neck[i], pts_neck[i+1]], fill="#ef4444", width=3)
    
    draw.text((70, 190), "Impact", font=get_font(10, bold=True), fill="#38bdf8")
    draw.text((200, 215), "+ΔV Defect\n(t = 2d/c)", font=get_font(11, bold=True), fill="#ef4444")
    draw.text((425, 240), "Toe Echo\n(Attenuated)", font=get_font(10), fill="#94a3b8")
    
    # Feature Callouts for Left
    draw.text((45, 445), "Key Diagnostic Signatures:", font=get_font(11, bold=True), fill="#f8fafc")
    calls_l = [
        "1. NO preceding negative velocity trough before the positive peak.",
        "2. Velocity remains at baseline or slightly elevated after return.",
        "3. Toe reflection (2L/c) remains visible if necking is moderate (<25%).",
        "4. Beta factor (β) quantification applies directly: β = (1 - α) / (1 + α)."
    ]
    for idx, c in enumerate(calls_l):
        draw.text((50, 470 + idx * 22), c, font=get_font(10), fill="#cbd5e1")
    
    make_card(draw, [45, 565, 520, 605], fill="#0f172a", outline="#ef4444")
    draw.text((55, 572), "FORENSIC VERDICT: Valid Structural Necking / Cross-Section Defect", font=get_font(10, bold=True), fill="#ef4444")
    draw.text((55, 587), "Requires geotechnical review of axial bearing and potential repair.", font=get_font(10), fill="#cbd5e1")
    
    # Right Panel: Shallow Bulbing (x: 565 to 1070)
    make_card(draw, [565, 105, 1070, 620], fill="#1e293b", outline="#334155")
    draw.text((580, 120), "SHALLOW BULBING REFLECTION PAIR (FALSE NECKING)", font=get_font(13, bold=True), fill="#f59e0b")
    draw.text((580, 142), "Trough-peak doublet caused by overbreak inflow and outflow", font=get_font(11), fill="#94a3b8")
    
    # Oscilloscope screen
    draw.rectangle([580, 170, 1055, 430], fill="#0a0f1d", outline="#475569")
    for gx in range(620, 1050, 45):
        draw.line([(gx, 175), (gx, 425)], fill="#1e293b", width=1)
    for gy in range(200, 420, 35):
        draw.line([(585, gy), (1050, gy)], fill="#1e293b", width=1)
    draw.line([(585, 300), (1050, 300)], fill="#334155", width=2)
    
    # Waveform: Impact -> Negative Trough -> Sharp Positive Peak -> Multiple Ringing -> Weak/Missing Toe
    pts_bulb = [
        (590, 300), (605, 300), (620, 210), (635, 300), (645, 305), (670, 300),
        (700, 300), (720, 355), (740, 300), # Negative trough (bulb top)
        (760, 300), (780, 235), (800, 300), # Positive peak (bulb bottom)
        (825, 300), (840, 330), (855, 300), (870, 275), (885, 300), # Ringing harmonics
        (980, 300), (995, 290), (1010, 300), (1040, 300) # Diminished toe
    ]
    for i in range(len(pts_bulb)-1):
        draw.line([pts_bulb[i], pts_bulb[i+1]], fill="#f59e0b", width=3)
    
    draw.text((605, 190), "Impact", font=get_font(10, bold=True), fill="#38bdf8")
    draw.text((695, 365), "-ΔV Bulb Top\n(Inverted Phase)", font=get_font(10, bold=True), fill="#38bdf8")
    draw.text((760, 210), "+ΔV False Necking\n(Trap Signal!)", font=get_font(11, bold=True), fill="#f87171")
    draw.text((830, 335), "Harmonics", font=get_font(9), fill="#f59e0b")
    draw.text((980, 270), "Toe Submerged", font=get_font(10), fill="#64748b")
    
    # Feature Callouts for Right
    draw.text((580, 445), "Key Diagnostic Signatures:", font=get_font(11, bold=True), fill="#f8fafc")
    calls_r = [
        "1. MANDATORY negative velocity trough (-ΔV) directly precedes positive peak.",
        "2. Trough-to-peak distance corresponds to physical length of bulbing zone.",
        "3. Secondary resonant reflections (ringing) repeat at interval Δt = 2ΔL/c.",
        "4. DO NOT blindly apply Beta factor; this is a benign geometry overbreak!"
    ]
    for idx, c in enumerate(calls_r):
        draw.text((585, 470 + idx * 22), c, font=get_font(10), fill="#cbd5e1")
    
    make_card(draw, [580, 565, 1055, 605], fill="#0f172a", outline="#f59e0b")
    draw.text((590, 572), "FORENSIC VERDICT: Geometrical Bulbing (False Necking Trap)", font=get_font(10, bold=True), fill="#f59e0b")
    draw.text((590, 587), "Confirm via excavation or concrete pour log (>115% overbreak).", font=get_font(10), fill="#cbd5e1")
    
    draw_footer(draw, w, h)
    im.save(ASSETS_DIR / "pit-shallow-bulbing-vs-necking-reflectograms.webp", "WEBP", quality=90)
    print("Figure 2 generated successfully.")

# -------------------------------------------------------------
# 4. FIGURE 3: pit-energy-shadowing-deep-defect-masking.webp
# -------------------------------------------------------------
def generate_figure_3():
    w, h = 1100, 680
    im = Image.new("RGB", (w, h), "#090d16")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, w, "ACOUSTIC ENERGY SHADOWING: MULTI-REFLECTION TRAPPING & DEEP MASKING",
                "How High Soil Damping and Shallow Discontinuities Conceal Catastrophic Defects",
                tag="ASTM D5882 / ISO 22477-4 ATTENUATION LIMITS")
    
    # Left: Physical Energy Budget Model (x: 30 to 480)
    make_card(draw, [30, 105, 480, 620], fill="#1e293b", outline="#334155")
    draw.text((45, 120), "ENERGY BUDGET DECAY PROFILE", font=get_font(13, bold=True), fill="#38bdf8")
    draw.text((45, 142), "Incident energy E0 partitioned across impedance boundaries", font=get_font(11), fill="#94a3b8")
    
    # Graph area
    draw.rectangle([45, 175, 465, 460], fill="#0a0f1d", outline="#475569")
    draw.line([(85, 190), (85, 430)], fill="#64748b", width=2) # Y axis
    draw.line([(85, 430), (450, 430)], fill="#64748b", width=2) # X axis
    draw.text((45, 185), "Wave\nEnergy\nE(x)", font=get_font(9, bold=True), fill="#94a3b8")
    draw.text((220, 438), "Depth along Pile Shaft (m)", font=get_font(10), fill="#94a3b8")
    
    # Depth marks
    draw.text((80, 435), "0m", font=get_font(9), fill="#64748b")
    draw.text((160, 435), "4m (Bulb)", font=get_font(9), fill="#64748b")
    draw.text((270, 435), "15m", font=get_font(9), fill="#64748b")
    draw.text((380, 435), "28m (Toe)", font=get_font(9), fill="#64748b")
    
    # Curve 1: Normal uniform shaft decay (Smooth exponential)
    pts_norm = []
    for x_m in range(85, 440, 10):
        frac = (x_m - 85) / 355.0
        y_val = 210 + 190 * (1 - math.exp(-1.8 * frac))
        pts_norm.append((x_m, int(y_val)))
    for i in range(len(pts_norm)-1):
        draw.line([pts_norm[i], pts_norm[i+1]], fill="#10b981", width=2)
    draw.text((300, 320), "Uniform Shaft (Clean Toe)", font=get_font(10, bold=True), fill="#10b981")
    
    # Curve 2: Shaft with shallow bulbing (Step drops and sharp attenuation)
    pts_bulb = []
    for x_m in range(85, 160, 5): # Surface to bulb
        frac = (x_m - 85) / 355.0
        pts_bulb.append((x_m, int(210 + 190 * (1 - math.exp(-1.8 * frac)))))
    # Step drop at bulb interfaces (energy reflection loss)
    pts_bulb.append((160, 275))
    pts_bulb.append((185, 320))
    for x_m in range(185, 440, 10):
        frac = (x_m - 185) / 255.0
        # Rapid decay below bulb
        y_val = 320 + 95 * (1 - math.exp(-2.5 * frac))
        pts_bulb.append((x_m, int(y_val)))
    for i in range(len(pts_bulb)-1):
        draw.line([pts_bulb[i], pts_bulb[i+1]], fill="#ef4444", width=3)
    draw.text((170, 370), "Bulbed Shaft\n(Energy Collapse)", font=get_font(10, bold=True), fill="#ef4444")
    
    # Ambient noise floor line
    draw.line([(85, 410), (450, 410)], fill="#f59e0b", width=1)
    draw.text((250, 395), "-- Ambient Noise Floor / Limit of Detection --", font=get_font(9), fill="#f59e0b")
    
    # Explanatory box
    make_card(draw, [45, 475, 465, 605], fill="#0f172a", outline="#334155")
    draw.text((55, 485), "Physics of Attenuation (ASTM D5882 §5.2):", font=get_font(10, bold=True), fill="#f8fafc")
    draw_wrapped_text(draw,
        "Wave damping follows E(x) = E0 · exp(-2αx). In soft saturated clays (e.g. Bangkok subsoils), the attenuation coefficient α increases dramatically with frequency (α ∝ f²). Because the shallow bulbing reflects and scrambles the initial high frequencies, remaining low-frequency energy lacks resolution to distinguish deep structural necking from toe resistance.",
        (55, 505), 400, get_font(9), "#cbd5e1", line_spacing=2)
    
    # Right: Structural Concealment Scenarios (x: 510 to 1070)
    make_card(draw, [510, 105, 1070, 620], fill="#1e293b", outline="#334155")
    draw.text((525, 120), "CONCEALED DEFECT DANGER: THE FALSE CATEGORY A TRAP", font=get_font(13, bold=True), fill="#ef4444")
    draw.text((525, 142), "Why a clean-looking record can hide fatal foundation failure", font=get_font(11), fill="#94a3b8")
    
    # 2 Risk Comparison Cards
    make_card(draw, [525, 175, 1055, 335], fill="#0f172a", outline="#f87171")
    draw.text((540, 188), "SCENARIO A: CATASTROPHIC DEEP CRACK MASKED", font=get_font(11, bold=True), fill="#f87171")
    draw_wrapped_text(draw,
        "A 30m bored pile has a 3m overbreak bulbing in soft upper marine clay. At 18m depth, drilling mud collapse created a 40% cross-section necking and soil inclusion. Because wave energy was depleted in the upper bulb, the reflected wave from 18m has an amplitude of only 0.002 m/s—far below the sensor noise floor. An uncritical tester certifies the pile as 'Sound / Intact' (Category A). The pile fails during building superstructure loading.",
        (540, 212), 495, get_font(10), "#cbd5e1", line_spacing=3)
    
    make_card(draw, [525, 350, 1055, 510], fill="#0f172a", outline="#f59e0b")
    draw.text((540, 363), "SCENARIO B: FALSE REJECTION & REDUNDANT JET GROUTING", font=get_font(11, bold=True), fill="#f59e0b")
    draw_wrapped_text(draw,
        "A healthy 24m foundation pile has a minor bulb at 3.5m. The test agency observes the positive echo at 4.2m and reports 'Major defect / necking at 4.2m, pile integrity compromised (Category C)'. The developer halts tower construction and spends $80,000 mobilizing high-pressure jet grouting and micro-piles, only for later high-strain PDA and diamond coring to prove the pile was 100% sound.",
        (540, 387), 495, get_font(10), "#cbd5e1", line_spacing=3)
    
    # Bottom Standard Mandate
    make_card(draw, [525, 525, 1055, 605], fill="#131c2e", outline="#0284c7")
    draw.text((540, 535), "ISO 22477-4 & ASTM D5882 MANDATORY STANDARD CLAUSE:", font=get_font(10, bold=True), fill="#38bdf8")
    draw_wrapped_text(draw,
        "'Where high surface resistance, impedance changes, or high length-to-diameter ratios (L/D > 30) preclude clear pile toe identification, the test is INCONCLUSIVE. Low-strain testing cannot confirm integrity beneath major impedance changes.'",
        (540, 555), 495, get_font(10, bold=False), "#f1f5f9", line_spacing=2)
    
    draw_footer(draw, w, h)
    im.save(ASSETS_DIR / "pit-energy-shadowing-deep-defect-masking.webp", "WEBP", quality=90)
    print("Figure 3 generated successfully.")

# -------------------------------------------------------------
# 5. FIGURE 4: pit-frequency-domain-mobility-admittance.webp
# -------------------------------------------------------------
def generate_figure_4():
    w, h = 1100, 680
    im = Image.new("RGB", (w, h), "#090d16")
    draw = ImageDraw.Draw(im)
    
    draw_header(draw, w, "FREQUENCY MOBILITY (N) & ESCALATION FORENSIC ARBITRATION MATRIX",
                "Transient Dynamic Response (Mobility Spectrum) and Multi-Method De-risking Protocol",
                tag="ASTM D5882 IMPULSE RESPONSE & ESCALATION")
    
    # Left: Frequency Domain Mobility Spectra (x: 30 to 520)
    make_card(draw, [30, 105, 520, 620], fill="#1e293b", outline="#334155")
    draw.text((45, 120), "IMPULSE RESPONSE: MOBILITY SPECTRUM N(f)", font=get_font(13, bold=True), fill="#38bdf8")
    draw.text((45, 142), "Mobility N(f) = |V(f) / F(f)|   |   Baseline Mobility: N0 = 1 / (ρ·c·A)", font=get_font(11), fill="#94a3b8")
    
    # Spectrum Graph
    draw.rectangle([45, 175, 505, 430], fill="#0a0f1d", outline="#475569")
    draw.line([(85, 190), (85, 400)], fill="#64748b", width=2) # Y
    draw.line([(85, 400), (490, 400)], fill="#64748b", width=2) # X
    draw.text((45, 185), "Mobility\nN(m/s/N)", font=get_font(9, bold=True), fill="#94a3b8")
    draw.text((240, 408), "Frequency f (Hz)", font=get_font(10), fill="#94a3b8")
    
    # Resonant frequency spacing markers: Δf = c / (2L)
    draw.line([(180, 200), (180, 400)], fill="#334155", width=1)
    draw.line([(280, 200), (280, 400)], fill="#334155", width=1)
    draw.line([(380, 200), (380, 400)], fill="#334155", width=1)
    draw.text((215, 215), "Peak Spacing: Δf = c / 2L", font=get_font(9), fill="#38bdf8")
    
    # Curve 1: Sound Nominal Shaft Baseline N0
    draw.line([(85, 320), (480, 320)], fill="#64748b", width=1)
    draw.text((400, 305), "Nominal N0 = 1/(ρcA0)", font=get_font(9), fill="#94a3b8")
    
    # Curve 2: Bulbed Shaft (Depressed baseline N_bulb < N0)
    pts_b = []
    for fx in range(85, 480, 5):
        # Sine oscillations around lowered baseline (y = 350)
        osc = math.sin((fx - 85) * 0.0628) * 25
        pts_b.append((fx, int(350 - osc)))
    for i in range(len(pts_b)-1):
        draw.line([pts_b[i], pts_b[i+1]], fill="#0284c7", width=2)
    draw.text((100, 365), "Bulbed: Baseline N_bulb < N0 (Impedance Increased)", font=get_font(10, bold=True), fill="#38bdf8")
    
    # Curve 3: Necked Shaft (Elevated baseline N_neck > N0)
    pts_n = []
    for fx in range(85, 480, 5):
        osc = math.sin((fx - 85) * 0.0628) * 35
        pts_n.append((fx, int(270 - osc)))
    for i in range(len(pts_n)-1):
        draw.line([pts_n[i], pts_n[i+1]], fill="#ef4444", width=2)
    draw.text((100, 245), "Necked: Baseline N_neck > N0 (Stiffness Lost)", font=get_font(10, bold=True), fill="#ef4444")
    
    # Bottom Note
    make_card(draw, [45, 450, 505, 605], fill="#0f172a", outline="#334155")
    draw.text((55, 460), "Transient Dynamic Admittance Benefits:", font=get_font(10, bold=True), fill="#10b981")
    calls_adm = [
        "• Dynamic Stiffness: Kd = 2π·fo / No reveals true head boundary condition.",
        "• Bulbing increases effective mass, depressing average mobility baseline.",
        "• True necking lowers shaft stiffness, shifting mobility baseline upward.",
        "• Frequency domain analysis resolves ambiguities that blind time-domain."
    ]
    for idx, c in enumerate(calls_adm):
        draw.text((55, 485 + idx * 22), c, font=get_font(10), fill="#cbd5e1")
    
    # Right: 4-Tier Forensic Arbitration Decision Matrix (x: 545 to 1070)
    make_card(draw, [545, 105, 1070, 620], fill="#1e293b", outline="#334155")
    draw.text((560, 120), "FOUR-TIER ESCALATION DECISION PROTOCOL", font=get_font(13, bold=True), fill="#10b981")
    draw.text((560, 142), "Standardized engineering pathway when PIT yields inconclusive results", font=get_font(11), fill="#94a3b8")
    
    tiers = [
        ("TIER 1: Multi-Sensor Perimeter PIT (ASTM D5882 §6.1)",
         "Install 2 to 4 accelerometers at 90° intervals around pile top. Average symmetrical signals to completely cancel 3D Rayleigh surface waves and flexural bending modes.",
         "#0284c7"),
        ("TIER 2: Numerical Impedance Deconvolution",
         "Run frequency mobility simulation and 1D wave equation profile fitting (e.g. PIT-W). Model physical soil spring damping to reproduce bulbing reflections.",
         "#38bdf8"),
        ("TIER 3: High-Strain Dynamic Testing (PDA / CAPWAP)",
         "ASTM D4945: Mobilize drop weight (1.5% to 2.0% pile ultimate capacity). 20–80 kJ high-energy pulse penetrates through shallow bulbs to mobilize pile toe.",
         "#f59e0b"),
        ("TIER 4: Intrusive Core Drilling & Ultrasonic CSL",
         "ASTM C42 diamond coring down to rock socket with point-load/unconfined compression tests, or ASTM D6760 crosshole sonic logging for cast-in-place shafts.",
         "#10b981")
    ]
    
    t_y = 175
    for title, desc, col in tiers:
        make_card(draw, [560, t_y, 1055, t_y + 98], fill="#0f172a", outline=col)
        draw.text((575, t_y + 10), title, font=get_font(11, bold=True), fill=col)
        draw_wrapped_text(draw, desc, (575, t_y + 32), 465, get_font(10), "#cbd5e1", line_spacing=2)
        t_y += 108
    
    draw_footer(draw, w, h)
    im.save(ASSETS_DIR / "pit-frequency-domain-mobility-admittance.webp", "WEBP", quality=90)
    print("Figure 4 generated successfully.")

if __name__ == "__main__":
    generate_cover()
    generate_figure_1()
    generate_figure_2()
    generate_figure_3()
    generate_figure_4()
    print("All 5 WebP engineering diagrams generated successfully.")
