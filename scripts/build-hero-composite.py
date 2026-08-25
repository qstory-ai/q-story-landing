from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
ASSET_DIR = ROOT / "output" / "passhacker" / "assets"
SOURCE = ASSET_DIR / "hansel-gretel-hero.jpg"
OUTPUT = ASSET_DIR / "q-story-hero-composite.jpg"


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size, index=6 if bold else 0)
    return ImageFont.load_default()


def rounded_crop(image: Image.Image, size: tuple[int, int], radius: int) -> Image.Image:
    source_ratio = image.width / image.height
    target_ratio = size[0] / size[1]
    if source_ratio > target_ratio:
        width = int(image.height * target_ratio)
        left = (image.width - width) // 2
        image = image.crop((left, 0, left + width, image.height))
    else:
        height = int(image.width / target_ratio)
        top = (image.height - height) // 2
        image = image.crop((0, top, image.width, top + height))
    image = image.resize(size, Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0], size[1]), radius=radius, fill=255)
    image.putalpha(mask)
    return image


canvas = Image.new("RGBA", (1240, 760), (43, 26, 74, 255))
draw = ImageDraw.Draw(canvas)

# Main storybook frame.
draw.rounded_rectangle((72, 104, 1168, 656), radius=42, fill=(255, 247, 232, 255))
hero = rounded_crop(Image.open(SOURCE), (1070, 526), 31)
canvas.alpha_composite(hero, (85, 117))

# Caption panel.
draw.rounded_rectangle((112, 510, 1128, 622), radius=24, fill=(20, 9, 40, 232), outline=(255, 255, 255, 64), width=2)
draw.rounded_rectangle((138, 535, 270, 595), radius=14, fill=(255, 200, 0, 255))
draw.text((164, 548), "\uadf8\ub808\ud154", font=font(30, True), fill=(27, 13, 51, 255))
draw.text(
    (300, 548),
    "\uc774 \uc9d1, \ubc14\ub85c \ub4e4\uc5b4\uac00\ub3c4 \uad1c\ucc2e\uc744\uae4c? \ub124 \uc0dd\uac01\uc744 \ub4e4\ub824\uc904\ub798?",
    font=font(25),
    fill=(255, 255, 255, 235),
)

# Question bubble.
draw.rounded_rectangle((18, 20, 485, 118), radius=49, fill=(255, 255, 255, 255))
draw.ellipse((36, 36, 104, 104), fill=(201, 184, 255, 255))
draw.text((57, 48), "♪", font=font(34, True), fill=(43, 26, 74, 255))
draw.text(
    (126, 49),
    "\u201c\ucc3d\ubb38\ubd80\ud130 \uc0b4\ud3b4\ubcf4\uc790!\u201d",
    font=font(29, True),
    fill=(43, 26, 74, 255),
)

# Change note.
draw.rounded_rectangle((622, 650, 1218, 734), radius=42, fill=(255, 200, 0, 255))
draw.text(
    (660, 671),
    "\u2726  \uc9c8\ubb38\uacfc \uc120\ud0dd\uc73c\ub85c \uc911\uac04 \uc7a5\uba74\uc774 \ub2ec\ub77c\uc838\uc694",
    font=font(26, True),
    fill=(43, 26, 74, 255),
)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
canvas.convert("RGB").save(OUTPUT, quality=86, optimize=True, progressive=True)
print(OUTPUT)
