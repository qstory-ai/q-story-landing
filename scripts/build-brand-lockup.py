from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
WORKSPACE = ROOT.parents[1]
ICON_PATH = WORKSPACE / "05_최종산출물/passhacker/assets/q-story-logo-framed.png"
PUBLIC_OUTPUT = ROOT / "public/assets/q-story-brand-lockup.png"
IMPORT_OUTPUT = WORKSPACE / "05_최종산출물/passhacker/assets/q-story-brand-lockup.png"
IMPORT_JPEG_OUTPUT = WORKSPACE / "05_최종산출물/passhacker/assets/q-story-brand-lockup.jpg"

SCALE = 4
WIDTH = 187 * SCALE
HEIGHT = 42 * SCALE

canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
icon = Image.open(ICON_PATH).convert("RGBA").resize((HEIGHT, HEIGHT), Image.Resampling.LANCZOS)
canvas.alpha_composite(icon, (0, 0))

draw = ImageDraw.Draw(canvas)
wordmark_font = ImageFont.truetype(
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf", 78
)
slogan_font = ImageFont.truetype(
    "/System/Library/Fonts/AppleSDGothicNeo.ttc", 38, index=8
)

wordmark_x = 54 * SCALE
draw.text((wordmark_x, -7), "Q", font=wordmark_font, fill="#ffc800", anchor="lt")
q_width = draw.textlength("Q", font=wordmark_font)
draw.text(
    (wordmark_x + q_width - 2, -7),
    "-Story",
    font=wordmark_font,
    fill="#ffffff",
    anchor="lt",
)
draw.text(
    (wordmark_x, 27 * SCALE),
    "AI 시대, 스스로 묻는 아이로 자라게",
    font=slogan_font,
    fill="#aaa3b5",
    anchor="lt",
)

PUBLIC_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
IMPORT_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.save(PUBLIC_OUTPUT)
canvas.save(IMPORT_OUTPUT)

# PassHacker occasionally fails to composite very wide transparent PNGs in
# the published renderer. A header-colored JPEG is visually seamless on the
# Q-Story header/footer and renders reliably.
jpeg = Image.new("RGB", canvas.size, "#1b0d33")
jpeg.paste(canvas, mask=canvas.getchannel("A"))
jpeg.save(IMPORT_JPEG_OUTPUT, quality=94, subsampling=0)
