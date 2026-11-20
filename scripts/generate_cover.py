"""Generate the Askly portfolio cover image.

Usage: python3 scripts/generate_cover.py
Output: public/askly-cover.png
"""

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageFont

W, H = 1200, 630
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


base = Image.new("RGB", (W, H), (10, 9, 18))

glow = Image.new("RGB", (W, H), (0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.ellipse((560, -280, 1320, 500), fill=(82, 52, 150))
base = ImageChops.add(base, glow.filter(ImageFilter.GaussianBlur(150)))

glow2 = Image.new("RGB", (W, H), (0, 0, 0))
glow2_draw = ImageDraw.Draw(glow2)
glow2_draw.ellipse((-260, 360, 540, 900), fill=(12, 98, 118))
base = ImageChops.add(base, glow2.filter(ImageFilter.GaussianBlur(160)))

grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
grid_draw = ImageDraw.Draw(grid)
for x in range(0, W, 60):
    grid_draw.line((x, 0, x, H), fill=(255, 255, 255, 8))
for y in range(0, H, 60):
    grid_draw.line((0, y, W, y), fill=(255, 255, 255, 8))
base = Image.alpha_composite(base.convert("RGBA"), grid)

draw = ImageDraw.Draw(base)

# Brand mark
draw.rounded_rectangle((70, 76, 122, 128), radius=16, fill=(167, 139, 250))
draw.ellipse((84, 90, 108, 114), outline=(10, 9, 18), width=3)
draw.line((110, 108, 118, 118), fill=(10, 9, 18), width=4)

draw.text((140, 86), "ASKLY", font=font(FONT_BOLD, 30), fill=(240, 237, 248))
draw.text((141, 126), "RAG KNOWLEDGE ASSISTANT", font=font(FONT_REG, 14), fill=(157, 150, 180))

# Headline
draw.text((70, 218), "Ask your docs.", font=font(FONT_BOLD, 66), fill=(240, 237, 248))
draw.text((70, 302), "Get cited answers.", font=font(FONT_BOLD, 66), fill=(167, 139, 250))

draw.text(
    (74, 414),
    "Streaming AI answers grounded in your own knowledge base.",
    font=font(FONT_REG, 23),
    fill=(157, 150, 180),
)

chips = [("Next.js 15", (167, 139, 250)), ("RAG", (34, 211, 238)), ("Neon AI", (52, 211, 153))]
x = 74
for label, color in chips:
    width = draw.textbbox((0, 0), label, font=font(FONT_REG, 17))[2] + 30
    draw.rounded_rectangle((x, 478, x + width, 518), radius=12, outline=color, width=2)
    draw.text((x + 15, 487), label, font=font(FONT_REG, 17), fill=color)
    x += width + 14

# Chat mockup
card = (690, 110, 1140, 540)
draw.rounded_rectangle(card, radius=24, fill=(19, 17, 32), outline=(44, 39, 64), width=2)
draw.text((726, 142), "Askly", font=font(FONT_BOLD, 18), fill=(240, 237, 248))
draw.rounded_rectangle((726, 178, 1040, 232), radius=14, fill=(26, 23, 41), outline=(44, 39, 64))
draw.text((742, 194), "How do webhooks work?", font=font(FONT_REG, 16), fill=(240, 237, 248))

draw.rounded_rectangle((762, 252, 1104, 400), radius=14, fill=(167, 139, 250, 40), outline=(167, 139, 250))
lines = [
    "Webhook deliveries are retried with",
    "exponential backoff for up to 24 hours.",
    "Check the delivery log and verify your",
    "endpoint returns 2xx within 10 seconds."
]
for i, line in enumerate(lines):
    draw.text((778, 268 + i * 30), line, font=font(FONT_REG, 15), fill=(240, 237, 248))

draw.rounded_rectangle((762, 418, 946, 452), radius=10, fill=(34, 211, 238, 35), outline=(34, 211, 238))
draw.text((776, 427), "[1] Troubleshooting.md", font=font(FONT_REG, 13), fill=(34, 211, 238))

draw.rounded_rectangle((726, 480, 1104, 522), radius=14, fill=(26, 23, 41), outline=(44, 39, 64))
draw.text((742, 494), "Ask a follow-up…", font=font(FONT_REG, 14), fill=(157, 150, 180))

output = Path(__file__).resolve().parents[1] / "public" / "askly-cover.png"
output.parent.mkdir(parents=True, exist_ok=True)
base.convert("RGB").save(output, optimize=True)
print(f"Wrote {output}")
