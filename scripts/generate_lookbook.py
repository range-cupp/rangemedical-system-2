#!/usr/bin/env python3
"""
Range Medical Services Lookbook Generator
Creates a high-end, coffee-table-quality lookbook PDF
"""

from reportlab.lib.pagesizes import landscape, letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import os

# Page dimensions (landscape letter)
PAGE_WIDTH, PAGE_HEIGHT = landscape(letter)

# Colors
LIGHT_GRAY_BG = HexColor('#e0e0e0')
DARKER_GRAY_BG = HexColor('#d9d9d9')
PLACEHOLDER_GRAY = HexColor('#c0c0c0')
TEXT_BLACK = HexColor('#171717')
ACCENT_GRAY = HexColor('#737373')

# Paths
LOGO_PATH = "/Users/chriscupp/Downloads/ChatGPT Image Jan 8, 2026, 09_19_41 AM (1).png"
OUTPUT_PATH = "/Users/chriscupp/Desktop/Range_Medical_Services_Lookbook_2025.pdf"

class LookbookGenerator:
    def __init__(self):
        self.c = canvas.Canvas(OUTPUT_PATH, pagesize=landscape(letter))
        self.page_num = 0
        self.half_width = PAGE_WIDTH / 2

    def draw_page_number(self, side='right'):
        """Draw page number in format PG | XX"""
        self.c.setFont("Helvetica", 8)
        self.c.setFillColor(ACCENT_GRAY)
        if side == 'left':
            self.c.drawString(0.5 * inch, 0.4 * inch, f"PG | {self.page_num:02d}")
        else:
            self.c.drawRightString(PAGE_WIDTH - 0.5 * inch, 0.4 * inch, f"PG | {self.page_num:02d}")

    def draw_footer_tagline(self):
        """Draw the Range Medical tagline"""
        self.c.setFont("Helvetica", 7)
        self.c.setFillColor(ACCENT_GRAY)
        tagline = "OPTIMIZE Beyond  |  PERFORM Beyond  |  LIVE Beyond"
        self.c.drawCentredString(PAGE_WIDTH / 2, 0.4 * inch, tagline)

    def draw_placeholder(self, x, y, width, height, text):
        """Draw a photo placeholder with description"""
        self.c.setFillColor(PLACEHOLDER_GRAY)
        self.c.rect(x, y, width, height, fill=1, stroke=0)
        self.c.setFillColor(ACCENT_GRAY)
        self.c.setFont("Helvetica-Oblique", 10)
        # Center text in placeholder
        text_width = self.c.stringWidth(text, "Helvetica-Oblique", 10)
        self.c.drawString(x + (width - text_width) / 2, y + height / 2 - 5, text)

    def draw_logo(self, x, y, size=1.5*inch):
        """Draw the Range Medical logo"""
        try:
            logo = ImageReader(LOGO_PATH)
            self.c.drawImage(logo, x - size/2, y - size/2, width=size, height=size, mask='auto')
        except:
            # Fallback if logo not found
            self.c.setFillColor(TEXT_BLACK)
            self.c.circle(x, y, size/2, fill=1)
            self.c.setFillColor(white)
            self.c.setFont("Helvetica-Bold", 12)
            self.c.drawCentredString(x, y - 5, "RANGE")

    def draw_benefit_box(self, x, y, width, title, description):
        """Draw a benefit callout box"""
        box_height = 0.8 * inch
        # Box background
        self.c.setFillColor(white)
        self.c.rect(x, y, width, box_height, fill=1, stroke=0)
        # Border
        self.c.setStrokeColor(HexColor('#e5e5e5'))
        self.c.setLineWidth(1)
        self.c.rect(x, y, width, box_height, fill=0, stroke=1)
        # Title
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 8)
        self.c.drawString(x + 10, y + box_height - 20, title)
        # Description
        self.c.setFont("Helvetica", 7)
        self.c.setFillColor(ACCENT_GRAY)
        # Word wrap description
        words = description.split()
        lines = []
        current_line = ""
        for word in words:
            test_line = current_line + " " + word if current_line else word
            if self.c.stringWidth(test_line, "Helvetica", 7) < width - 20:
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)

        y_offset = y + box_height - 35
        for line in lines[:2]:  # Max 2 lines
            self.c.drawString(x + 10, y_offset, line)
            y_offset -= 10

    def new_page(self, bg_color=None):
        """Start a new page"""
        if self.page_num > 0:
            self.c.showPage()
        self.page_num += 1
        if bg_color:
            self.c.setFillColor(bg_color)
            self.c.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)

    # ===== COVER PAGE =====
    def create_cover(self):
        """Page 1: Cover"""
        self.new_page(LIGHT_GRAY_BG)

        # Logo centered
        self.draw_logo(PAGE_WIDTH / 2, PAGE_HEIGHT / 2 + 0.5 * inch, size=2 * inch)

        # Subtitle
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica", 12)
        self.c.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT / 2 - 1.2 * inch, "SERVICES  |  Look Book 2025")

    # ===== TABLE OF CONTENTS =====
    def create_toc(self):
        """Page 2: Table of Contents"""
        self.new_page(LIGHT_GRAY_BG)

        # Left side - TOC
        left_margin = 0.75 * inch

        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 24)
        self.c.drawString(left_margin, PAGE_HEIGHT - 1.2 * inch, "Contents")

        toc_items = [
            ("OUR Story", "3–5"),
            ("OPTIMIZE Lab Panels & Blood Work", "6–9"),
            ("OPTIMIZE Hormone Therapy (HRT)", "10–13"),
            ("OPTIMIZE Weight Loss Programs", "14–17"),
            ("RESTORE IV Therapy & Injections", "18–23"),
            ("RESTORE NAD+ Therapy", "24–27"),
            ("RESTORE Methylene Blue IV", "28–29"),
            ("REGENERATE PRP Therapy", "30–33"),
            ("REGENERATE Exosome Therapy", "34–37"),
            ("REGENERATE Peptide Therapy", "38–41"),
            ("PERFORM Hyperbaric Oxygen Therapy", "42–45"),
            ("PERFORM Red Light Therapy", "46–49"),
            ("TRANSFORM 6-Week Cellular Reset", "50–53"),
        ]

        y = PAGE_HEIGHT - 2 * inch
        for item, pages in toc_items:
            # Split category from title
            parts = item.split(" ", 1)
            if len(parts) == 2:
                category, title = parts
                self.c.setFont("Helvetica-Bold", 9)
                self.c.setFillColor(TEXT_BLACK)
                self.c.drawString(left_margin, y, category)
                self.c.setFont("Helvetica", 9)
                self.c.setFillColor(ACCENT_GRAY)
                self.c.drawString(left_margin + self.c.stringWidth(category + " ", "Helvetica-Bold", 9), y, title)
            else:
                self.c.setFont("Helvetica", 9)
                self.c.setFillColor(ACCENT_GRAY)
                self.c.drawString(left_margin, y, item)

            # Page numbers
            self.c.drawRightString(self.half_width - 0.5 * inch, y, f"Pages {pages}")
            y -= 0.35 * inch

        # Right side - Photo placeholder
        self.draw_placeholder(
            self.half_width + 0.25 * inch,
            0.75 * inch,
            self.half_width - 0.5 * inch,
            PAGE_HEIGHT - 1.5 * inch,
            "Photo: Clinical space / lifestyle"
        )

        self.draw_page_number('left')

    # ===== OUR STORY =====
    def create_our_story(self):
        """Pages 3-5: Our Story"""
        # Page 3 - Story header with photo
        self.new_page(LIGHT_GRAY_BG)

        # Left side
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawString(0.75 * inch, PAGE_HEIGHT - 1.5 * inch, "OUR")
        self.c.setFont("Helvetica", 36)
        self.c.drawString(0.75 * inch, PAGE_HEIGHT - 2.2 * inch, "Story")

        # Right side - Photo placeholder
        self.draw_placeholder(
            self.half_width + 0.25 * inch,
            0.75 * inch,
            self.half_width - 0.5 * inch,
            PAGE_HEIGHT - 1.5 * inch,
            "Photo: Range Medical team or clinical space"
        )

        self.draw_page_number('left')
        self.draw_footer_tagline()

        # Page 4 - Story text
        self.new_page(LIGHT_GRAY_BG)

        story_text = """Range Medical was built on a simple idea: your body is capable of more than you think — it just needs the right support.

We're a health optimization and longevity clinic in Newport Beach, California, created for people who refuse to settle for 'normal.' Whether you're recovering from injury, fighting fatigue and brain fog, or chasing peak performance, we combine advanced diagnostics with cutting-edge therapies to help you get there.

Our approach starts with data — comprehensive lab panels that reveal what's actually happening inside your body. From there, we build personalized protocols using hormone optimization, peptide therapy, regenerative treatments, IV therapy, and recovery technologies like hyperbaric oxygen and red light therapy.

We work alongside your existing care team. If you're coming from Range Sports Therapy downstairs with an injury, we handle the medical side. If you're here for optimization, we start with labs and build from there.

Our mission is simple: help you optimize, perform, and live beyond your limits."""

        # Draw story text
        self.c.setFillColor(TEXT_BLACK)
        left_margin = 1 * inch
        right_margin = PAGE_WIDTH - 1 * inch
        text_width = right_margin - left_margin

        y = PAGE_HEIGHT - 1.5 * inch
        paragraphs = story_text.split("\n\n")

        for para in paragraphs:
            self.c.setFont("Helvetica", 11)
            words = para.split()
            lines = []
            current_line = ""
            for word in words:
                test_line = current_line + " " + word if current_line else word
                if self.c.stringWidth(test_line, "Helvetica", 11) < text_width:
                    current_line = test_line
                else:
                    lines.append(current_line)
                    current_line = word
            if current_line:
                lines.append(current_line)

            for line in lines:
                self.c.drawString(left_margin, y, line)
                y -= 16
            y -= 10  # Paragraph spacing

        # Signature block
        y -= 20
        self.c.setFont("Helvetica-Bold", 11)
        self.c.drawString(left_margin, y, "Range Medical Team")
        y -= 18
        self.c.setFont("Helvetica", 10)
        self.c.setFillColor(ACCENT_GRAY)
        self.c.drawString(left_margin, y, "1901 Westcliff Dr, Suite 10 · Newport Beach, CA 92660")
        y -= 14
        self.c.drawString(left_margin, y, "(949) 997-3988 · range-medical.com")

        self.draw_page_number('right')
        self.draw_footer_tagline()

        # Page 5 - Logo explanation
        self.new_page(LIGHT_GRAY_BG)

        # Left side - Logo section
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawString(0.75 * inch, PAGE_HEIGHT - 1.5 * inch, "OUR")
        self.c.setFont("Helvetica", 36)
        self.c.drawString(0.75 * inch, PAGE_HEIGHT - 2.2 * inch, "Logo")

        # Logo
        self.draw_logo(0.75 * inch + 1.5 * inch, PAGE_HEIGHT - 4 * inch, size=2 * inch)

        # Right side - Logo explanations
        right_start = self.half_width + 0.5 * inch
        y = PAGE_HEIGHT - 2 * inch

        explanations = [
            ("THE PEAK", "Represents pushing beyond limits — physically, mentally, and medically"),
            ("THE LINE", "Represents the baseline — knowing where you stand through diagnostics and data"),
            ("THE CIRCLE", "Represents the whole person — optimizing mind, body, and longevity"),
        ]

        for title, desc in explanations:
            self.c.setFillColor(TEXT_BLACK)
            self.c.setFont("Helvetica-Bold", 12)
            self.c.drawString(right_start, y, title)
            y -= 20
            self.c.setFont("Helvetica", 10)
            self.c.setFillColor(ACCENT_GRAY)
            # Word wrap
            words = desc.split()
            line = ""
            for word in words:
                test = line + " " + word if line else word
                if self.c.stringWidth(test, "Helvetica", 10) < self.half_width - 1 * inch:
                    line = test
                else:
                    self.c.drawString(right_start, y, line)
                    y -= 14
                    line = word
            if line:
                self.c.drawString(right_start, y, line)
            y -= 40

        self.draw_page_number('left')
        self.draw_footer_tagline()

    # ===== SERVICE SECTION TEMPLATE =====
    def create_section_divider(self, category, title, photo_desc):
        """Create a section divider spread"""
        self.new_page(LIGHT_GRAY_BG)

        # Left side - Category and title
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 14)
        self.c.drawString(0.75 * inch, PAGE_HEIGHT / 2 + 0.5 * inch, category)
        self.c.setFont("Helvetica", 32)

        # Handle multi-line titles
        if len(title) > 25:
            words = title.split()
            mid = len(words) // 2
            line1 = " ".join(words[:mid])
            line2 = " ".join(words[mid:])
            self.c.drawString(0.75 * inch, PAGE_HEIGHT / 2 - 0.2 * inch, line1)
            self.c.drawString(0.75 * inch, PAGE_HEIGHT / 2 - 0.7 * inch, line2)
        else:
            self.c.drawString(0.75 * inch, PAGE_HEIGHT / 2 - 0.2 * inch, title)

        # Right side - Photo placeholder
        self.draw_placeholder(
            self.half_width + 0.25 * inch,
            0.75 * inch,
            self.half_width - 0.5 * inch,
            PAGE_HEIGHT - 1.5 * inch,
            photo_desc
        )

        self.draw_page_number('left')
        self.draw_footer_tagline()

    def create_service_spread(self, service_name, french_name, description, benefits, pricing, photo_desc, extra_info=None):
        """Create a service detail spread"""
        self.new_page(LIGHT_GRAY_BG)

        left_margin = 0.75 * inch

        # Service name
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 22)

        # Handle long service names
        if len(service_name) > 30:
            words = service_name.split()
            mid = len(words) // 2
            self.c.drawString(left_margin, PAGE_HEIGHT - 1.3 * inch, " ".join(words[:mid]))
            self.c.drawString(left_margin, PAGE_HEIGHT - 1.7 * inch, " ".join(words[mid:]))
            name_bottom = PAGE_HEIGHT - 1.9 * inch
        else:
            self.c.drawString(left_margin, PAGE_HEIGHT - 1.5 * inch, service_name)
            name_bottom = PAGE_HEIGHT - 1.7 * inch

        # French name
        self.c.setFont("Helvetica-Oblique", 11)
        self.c.setFillColor(ACCENT_GRAY)
        self.c.drawString(left_margin, name_bottom, french_name)

        # Description
        y = name_bottom - 0.5 * inch
        self.c.setFont("Helvetica", 10)
        self.c.setFillColor(TEXT_BLACK)

        # Word wrap description
        words = description.split()
        lines = []
        current_line = ""
        max_width = self.half_width - 1.25 * inch
        for word in words:
            test_line = current_line + " " + word if current_line else word
            if self.c.stringWidth(test_line, "Helvetica", 10) < max_width:
                current_line = test_line
            else:
                lines.append(current_line)
                current_line = word
        if current_line:
            lines.append(current_line)

        for line in lines:
            self.c.drawString(left_margin, y, line)
            y -= 14

        # Benefits boxes
        y -= 0.3 * inch
        box_width = (self.half_width - 1.25 * inch) / 2 - 0.1 * inch

        for i, (title, desc) in enumerate(benefits):
            row = i // 2
            col = i % 2
            box_x = left_margin + col * (box_width + 0.2 * inch)
            box_y = y - row * (0.9 * inch)
            self.draw_benefit_box(box_x, box_y, box_width, title, desc)

        # Pricing
        rows_needed = (len(benefits) + 1) // 2
        pricing_y = y - rows_needed * 0.9 * inch - 0.4 * inch

        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(left_margin, pricing_y, "Pricing:")
        self.c.setFont("Helvetica", 10)

        if isinstance(pricing, list):
            for p in pricing:
                pricing_y -= 16
                self.c.drawString(left_margin + 0.5 * inch, pricing_y, p)
        else:
            self.c.drawString(left_margin + 0.6 * inch, pricing_y, pricing)

        # Extra info if provided
        if extra_info:
            pricing_y -= 25
            self.c.setFont("Helvetica", 9)
            self.c.setFillColor(ACCENT_GRAY)
            for info in extra_info:
                self.c.drawString(left_margin, pricing_y, info)
                pricing_y -= 12

        # Right side - Photo placeholder
        self.draw_placeholder(
            self.half_width + 0.25 * inch,
            0.75 * inch,
            self.half_width - 0.5 * inch,
            PAGE_HEIGHT - 1.5 * inch,
            photo_desc
        )

        self.draw_page_number('left')
        self.draw_footer_tagline()

    # ===== ALL SERVICES =====
    def create_lab_panels(self):
        """Pages 6-9: Lab Panels & Blood Work"""
        self.create_section_divider(
            "OPTIMIZE",
            "Lab Panels & Blood Work",
            "Photo: Blood draw / lab vials"
        )

        # Extra page for visual balance
        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Lab results review / consultation setting")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "DIAGNOSTIC LAB PANELS",
            "Panneaux Diagnostiques",
            "Every optimization journey starts with data. Our comprehensive lab panels measure the biomarkers that matter — hormones, thyroid, metabolic health, vitamins, inflammation, and more. Your results come with a 1-on-1 provider review and a written plan built around your goals.",
            [
                ("COMPREHENSIVE TESTING", "Hormones, thyroid, metabolic, vitamins, inflammation markers"),
                ("PROVIDER REVIEW", "1-on-1 results consultation with your provider"),
                ("WRITTEN PLAN", "Personalized protocol based on your data"),
            ],
            ["Essential Panel — $350 — Core hormone + metabolic markers",
             "Elite Panel — $750 — Full optimization panel with 50+ biomarkers"],
            "Photo: Lab results review / consultation"
        )

    def create_hormone_therapy(self):
        """Pages 10-13: Hormone Therapy"""
        self.create_section_divider(
            "OPTIMIZE",
            "Hormone Therapy",
            "Photo: Active lifestyle — hiking, exercising"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Active, vibrant lifestyle")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "HORMONE REPLACEMENT THERAPY",
            "Thérapie Hormonale",
            "Restore your hormones to optimal levels and feel like yourself again. Our bioidentical hormone programs for men and women address testosterone, estrogen, progesterone, and thyroid — with ongoing monitoring, labs, and provider support.",
            [
                ("ENERGY & MOOD", "Restore natural energy levels and mental clarity"),
                ("BODY COMPOSITION", "Support lean muscle and healthy metabolism"),
                ("LONGEVITY", "Optimize hormones for long-term health and vitality"),
            ],
            "Starts at $250/month — includes monitoring, labs, and ongoing support",
            "Photo: Active, vibrant patient"
        )

    def create_weight_loss(self):
        """Pages 14-17: Weight Loss"""
        self.create_section_divider(
            "OPTIMIZE",
            "Weight Loss Programs",
            "Photo: Transformation / active lifestyle"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Healthy lifestyle / body composition")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "MEDICAL WEIGHT LOSS",
            "Programme de Perte de Poids",
            "Science-backed weight loss medications with real medical oversight. Our programs use GLP-1 medications like tirzepatide, retatrutide, and semaglutide — combined with labs, monthly check-ins, and provider support for safe, sustainable results.",
            [
                ("GLP-1 MEDICATIONS", "Tirzepatide, retatrutide, semaglutide"),
                ("MEDICAL OVERSIGHT", "Monthly check-ins and monitoring"),
                ("SUSTAINABLE RESULTS", "Built for long-term weight management"),
            ],
            "Starts at $350/month",
            "Photo: Healthy lifestyle / transformation"
        )

    def create_iv_therapy(self):
        """Pages 18-23: IV Therapy & Injections"""
        self.create_section_divider(
            "RESTORE",
            "IV Therapy & Injections",
            "Photo: IV drip / clinical lounge setting"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: IV lounge / patient relaxing")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "IV THERAPY",
            "Thérapie Intraveineuse",
            "Vitamins, minerals, and amino acids delivered directly into your bloodstream for maximum absorption. Choose from our curated IV formulas or build a custom Range IV with up to 5 ingredients based on your symptoms and goals.",
            [
                ("DIRECT DELIVERY", "Bypasses digestion for near-100% absorption"),
                ("CUSTOM FORMULAS", "Build your own Range IV or choose a preset"),
                ("FAST RESULTS", "Feel the difference within hours, not days"),
            ],
            "Starts at $225",
            "Photo: IV session / lounge",
            extra_info=["IV Options: Energy, Hydration, Immune, Glow, Brain, Performance, Custom Range IV"]
        )

        # Injection Therapy spread
        self.create_service_spread(
            "INJECTION THERAPY",
            "Thérapie par Injection",
            "Quick 5–15 minute wellness injections for targeted support. From B12 and glutathione to NAD+ and L-carnitine, our injection menu covers energy, detox, fat metabolism, and immune support.",
            [
                ("QUICK & TARGETED", "5–15 minutes, no appointment needed"),
                ("WIDE SELECTION", "B12, glutathione, D3, L-carnitine, MIC+B12, taurine, NAD+"),
                ("AFFORDABLE", "Starts at $35"),
            ],
            "Starts at $35",
            "Photo: Injection being administered"
        )

    def create_nad_therapy(self):
        """Pages 24-27: NAD+ Therapy"""
        self.create_section_divider(
            "RESTORE",
            "NAD+ Therapy",
            "Photo: Brain/cellular energy concept"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Patient in IV chair / cellular concept")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "NAD+ THERAPY",
            "Thérapie NAD+",
            "NAD+ is a coenzyme in every cell of your body that's essential for energy production, DNA repair, and cellular health. As you age, NAD+ levels decline. Our NAD+ therapy — available as IV infusion, injection, or nasal spray — helps restore what time takes away.",
            [
                ("CELLULAR ENERGY", "Supports mitochondrial function and ATP production"),
                ("BRAIN CLARITY", "May improve focus, memory, and mental sharpness"),
                ("ANTI-AGING", "Supports DNA repair and cellular longevity"),
            ],
            ["NAD+ Injection: Starts at $25 (50mg) — $1/mg",
             "NAD+ IV: 250mg $375 | 500mg $525 | 750mg $650 | 1000mg $775"],
            "Photo: NAD+ IV session"
        )

    def create_methylene_blue(self):
        """Pages 28-29: Methylene Blue IV"""
        self.create_service_spread(
            'METHYLENE BLUE IV — "THE BLU"',
            "Thérapie au Bleu de Méthylène",
            "A mitochondrial support therapy that may help boost energy production, cognitive function, and oxygen delivery at the cellular level. Available as a standalone IV or combined with magnesium and high-dose vitamin C for enhanced effect.",
            [
                ("MITOCHONDRIAL SUPPORT", "May boost cellular energy production"),
                ("COGNITIVE FUNCTION", "May support focus, memory, and clarity"),
                ("OXYGEN DELIVERY", "May improve circulation and oxygenation"),
            ],
            "Starts at $197",
            "Photo: Blue-tinted IV / clinical aesthetic",
            extra_info=["Options: Methylene Blue IV | Methylene Blue + Magnesium + High-Dose Vitamin C IV"]
        )

    def create_prp_therapy(self):
        """Pages 30-33: PRP Therapy"""
        self.create_section_divider(
            "REGENERATE",
            "PRP Therapy",
            "Photo: Joint treatment / regenerative concept"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: PRP processing / treatment")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "PRP THERAPY — PLATELET-RICH PLASMA",
            "Thérapie PRP",
            "PRP uses your body's own healing factors — concentrated from your blood — to accelerate tissue repair, reduce inflammation, and promote regeneration. Used for joint and tendon injuries, hair restoration, and facial rejuvenation.",
            [
                ("YOUR OWN HEALING", "Uses concentrated platelets from your blood"),
                ("JOINT & TENDON", "Accelerates injury recovery and tissue repair"),
                ("HAIR & SKIN", "Hair restoration and facial rejuvenation protocols"),
            ],
            "Consultation-based",
            "Photo: PRP treatment session",
            extra_info=["Treatment Areas: Single joint, hair restoration, facial rejuvenation"]
        )

    def create_exosome_therapy(self):
        """Pages 34-37: Exosome Therapy"""
        self.create_section_divider(
            "REGENERATE",
            "Exosome Therapy",
            "Photo: Regenerative / cellular concept"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Scientific/cellular imagery")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "EXOSOME THERAPY",
            "Thérapie par Exosomes",
            "Exosomes are cellular messengers that signal your body to repair, regenerate, and reduce inflammation. Delivered via IV infusion or targeted injection, exosome therapy represents the frontier of regenerative medicine.",
            [
                ("CELLULAR MESSENGERS", "Signal repair and regeneration at the cellular level"),
                ("ANTI-AGING", "May support tissue repair and cellular renewal"),
                ("VERSATILE", "IV infusion for systemic support or targeted for hair"),
            ],
            "Consultation-based",
            "Photo: Cellular/scientific concept",
            extra_info=["Options: Exosome IV Infusion | Exosomes for Hair"]
        )

    def create_peptide_therapy(self):
        """Pages 38-41: Peptide Therapy"""
        self.create_section_divider(
            "REGENERATE",
            "Peptide Therapy",
            "Photo: Athletic recovery / performance"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Athlete / recovery / performance")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "PEPTIDE THERAPY",
            "Thérapie Peptidique",
            "Targeted peptide protocols for healing, fat loss, muscle recovery, sleep, cognitive performance, and immune support. Peptides are small chains of amino acids that signal specific functions in your body — delivered as injections, nasal sprays, or capsules.",
            [
                ("RECOVERY", "BPC-157, TB-500 for injury recovery and gut repair"),
                ("PERFORMANCE", "Tesamorelin, CJC/Ipamorelin for GH support, fat loss"),
                ("COGNITIVE", "Semax, Selank for focus, mood, stress management"),
                ("CELLULAR", "MOTS-C, SS-31 for mitochondrial energy support"),
            ],
            "Starts at $250",
            "Photo: Performance / athletic recovery"
        )

    def create_hbot(self):
        """Pages 42-45: Hyperbaric Oxygen Therapy"""
        self.create_section_divider(
            "PERFORM",
            "Hyperbaric Oxygen Therapy",
            "Photo: HBOT chamber"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Patient relaxing in HBOT chamber")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "HYPERBARIC OXYGEN THERAPY (HBOT)",
            "Oxygénothérapie Hyperbare",
            "Relax in a pressurized chamber while breathing concentrated oxygen. HBOT floods your tissues with up to 15x normal oxygen levels, accelerating healing, reducing inflammation, and supporting brain function. Our chambers operate at 2.0 ATA with 60-minute sessions.",
            [
                ("15x OXYGEN", "Dramatically increases tissue oxygenation"),
                ("BRAIN & HEALING", "Supports cognitive function and tissue repair"),
                ("INFLAMMATION", "Reduces systemic inflammation and promotes recovery"),
            ],
            "Starts at $185/session — packages available",
            "Photo: HBOT chamber interior"
        )

    def create_red_light(self):
        """Pages 46-49: Red Light Therapy"""
        self.create_section_divider(
            "PERFORM",
            "Red Light Therapy",
            "Photo: Red light therapy bed"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: Red light therapy session")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "RED LIGHT THERAPY",
            "Thérapie par Lumière Rouge",
            "Full-body red light therapy using 14,400 medical-grade LEDs at 660nm (red) and 850nm (near-infrared) wavelengths. Red light penetrates your skin to stimulate mitochondria — the power plants in your cells — boosting energy production, reducing inflammation, and supporting recovery.",
            [
                ("14,400 LEDs", "Medical-grade full-body coverage"),
                ("DUAL WAVELENGTH", "660nm red + 850nm near-infrared"),
                ("CELLULAR ENERGY", "Stimulates mitochondria and ATP production"),
            ],
            "Starts at $85/session — packages available",
            "Photo: Red light bed / session",
            extra_info=["Session: 15–20 minutes"]
        )

    def create_cellular_reset(self):
        """Pages 50-53: 6-Week Cellular Reset"""
        self.create_section_divider(
            "TRANSFORM",
            "6-Week Cellular Reset",
            "Photo: Transformation / energy concept"
        )

        self.new_page(LIGHT_GRAY_BG)
        self.draw_placeholder(0.5 * inch, 0.75 * inch, PAGE_WIDTH - 1 * inch, PAGE_HEIGHT - 1.5 * inch,
                             "Photo: HBOT + Red Light combo / transformation")
        self.draw_page_number('right')
        self.draw_footer_tagline()

        self.create_service_spread(
            "6-WEEK CELLULAR RESET",
            "Réinitialisation Cellulaire de 6 Semaines",
            "Our flagship program combines red light therapy and hyperbaric oxygen therapy over 6 weeks to fundamentally reset how your cells produce energy. Think of your cells like a phone battery — over time, stress, poor sleep, and inflammation wear them down. The Cellular Reset recharges them.",
            [
                ("36 SESSIONS", "18 HBOT + 18 Red Light over 6 weeks"),
                ("3 VISITS/WEEK", "~90 minutes per visit"),
                ("IV UPGRADE AVAILABLE", "Add 6 weekly IVs for maximum benefit"),
            ],
            ["6-Week Cellular Reset: $3,997",
             "With IV Upgrade: $5,094 (save $253 vs. à la carte)"],
            "Photo: Transformation / energy"
        )

    def create_back_cover(self):
        """Back cover"""
        self.new_page(LIGHT_GRAY_BG)

        center_x = PAGE_WIDTH / 2

        # Logo
        self.draw_logo(center_x, PAGE_HEIGHT / 2 + 1 * inch, size=1.5 * inch)

        # Tagline
        self.c.setFillColor(TEXT_BLACK)
        self.c.setFont("Helvetica", 14)
        self.c.drawCentredString(center_x, PAGE_HEIGHT / 2 - 0.5 * inch, "OPTIMIZE Beyond  |  PERFORM Beyond  |  LIVE Beyond")

        # Contact info
        y = PAGE_HEIGHT / 2 - 1.5 * inch
        self.c.setFont("Helvetica", 11)
        self.c.setFillColor(ACCENT_GRAY)

        contact_lines = [
            "1901 Westcliff Dr, Suite 10 · Newport Beach, CA 92660",
            "(949) 997-3988",
            "range-medical.com",
            "@rangemedical"
        ]

        for line in contact_lines:
            self.c.drawCentredString(center_x, y, line)
            y -= 20

    def generate(self):
        """Generate the complete lookbook"""
        print("Generating Range Medical Services Lookbook...")

        # Cover and intro
        self.create_cover()
        self.create_toc()
        self.create_our_story()

        # OPTIMIZE section
        self.create_lab_panels()
        self.create_hormone_therapy()
        self.create_weight_loss()

        # RESTORE section
        self.create_iv_therapy()
        self.create_nad_therapy()
        self.create_methylene_blue()

        # REGENERATE section
        self.create_prp_therapy()
        self.create_exosome_therapy()
        self.create_peptide_therapy()

        # PERFORM section
        self.create_hbot()
        self.create_red_light()

        # TRANSFORM section
        self.create_cellular_reset()

        # Back cover
        self.create_back_cover()

        # Save
        self.c.save()
        print(f"Lookbook saved to: {OUTPUT_PATH}")
        print(f"Total pages: {self.page_num}")

if __name__ == "__main__":
    generator = LookbookGenerator()
    generator.generate()
