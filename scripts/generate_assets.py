"""Generate TinyCare app icons and splash images.

Run:  python3 scripts/generate_assets.py
Requires: Pillow

Outputs (assets/):
  icon.png                       1024x1024, RGB, NO alpha  (iOS App Store requirement)
  android-icon-foreground.png    1024x1024, RGBA (adaptive icon foreground, safe zone respected)
  android-icon-background.png    1024x1024, RGB
  android-icon-monochrome.png    1024x1024, RGBA (themed icon)
  splash-icon.png                1024x1024, RGBA (light splash)
  splash-icon-dark.png           1024x1024, RGBA (dark splash)
  notification-icon.png          96x96, white-on-transparent (Android status bar)
  favicon.png                    48x48
"""
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "assets"
OUT.mkdir(exist_ok=True)

SS = 4  # supersampling factor for smooth edges
GREEN_TOP = (62, 184, 146)
GREEN_BOTTOM = (36, 130, 100)


def gradient(size, top, bottom):
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3))
        for x in range(size):
            px[x, y] = c
    return img


def heart_points(cx, cy, scale, n=240):
    pts = []
    for i in range(n):
        t = 2 * math.pi * i / n
        x = 16 * math.sin(t) ** 3
        y = 13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t)
        pts.append((cx + x * scale, cy - y * scale))
    return pts


def draw_symbol(size, heart_color, accent_color, scale_frac=0.62):
    """Heart with a sprout/baby-head accent, drawn on a transparent RGBA canvas."""
    big = size * SS
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    scale = big * scale_frac / 34
    cx, cy = big / 2, big / 2 + big * 0.02
    d.polygon(heart_points(cx, cy, scale), fill=heart_color)
    # accent: a small rounded "baby" head + curled body inside the heart
    head_r = big * 0.075
    hx, hy = cx, cy - big * 0.005
    d.ellipse([hx - head_r, hy - head_r, hx + head_r, hy + head_r], fill=accent_color)
    body_w, body_h = big * 0.20, big * 0.11
    by = hy + head_r + big * 0.01
    d.rounded_rectangle(
        [hx - body_w / 2, by, hx + body_w / 2, by + body_h],
        radius=big * 0.05,
        fill=accent_color,
    )
    return layer.resize((size, size), Image.LANCZOS)


def save_rgb(img, name):
    img.convert("RGB").save(OUT / name, "PNG", optimize=True)


def main():
    S = 1024

    # 1. iOS / store icon — opaque, full-bleed, no alpha channel
    bg = gradient(S, GREEN_TOP, GREEN_BOTTOM).convert("RGBA")
    bg.alpha_composite(draw_symbol(S, (255, 255, 255, 255), (47, 158, 122, 255)))
    save_rgb(bg, "icon.png")

    # 2. Android adaptive: background + foreground (symbol inside the 66% safe zone)
    save_rgb(gradient(S, GREEN_TOP, GREEN_BOTTOM), "android-icon-background.png")
    fg = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    fg.alpha_composite(draw_symbol(S, (255, 255, 255, 255), (47, 158, 122, 255), scale_frac=0.46))
    fg.save(OUT / "android-icon-foreground.png", "PNG", optimize=True)

    # 3. Android monochrome (themed icons): single-colour silhouette
    mono = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    heart = draw_symbol(S, (0, 0, 0, 255), (0, 0, 0, 0), scale_frac=0.46)
    mono.alpha_composite(heart)
    mono.save(OUT / "android-icon-monochrome.png", "PNG", optimize=True)

    # 4. Splash (transparent, centred logo; background colour is set in app.json)
    for name, heart_c, accent_c in (
        ("splash-icon.png", (47, 158, 122, 255), (255, 255, 255, 255)),
        ("splash-icon-dark.png", (94, 214, 176, 255), (14, 31, 25, 255)),
    ):
        sp = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        sp.alpha_composite(draw_symbol(S, heart_c, accent_c, scale_frac=0.78))
        sp.save(OUT / name, "PNG", optimize=True)

    # 5. Android notification icon — white on transparent
    n = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    n.alpha_composite(draw_symbol(96, (255, 255, 255, 255), (0, 0, 0, 0), scale_frac=0.8))
    n.save(OUT / "notification-icon.png", "PNG", optimize=True)

    # 6. Favicon
    fav = bg.resize((48, 48), Image.LANCZOS)
    fav.convert("RGB").save(OUT / "favicon.png", "PNG", optimize=True)

    # Verify the iOS icon has no alpha
    icon = Image.open(OUT / "icon.png")
    assert icon.mode == "RGB", f"icon.png must be RGB, got {icon.mode}"
    assert icon.size == (1024, 1024)
    print("Generated assets:", ", ".join(sorted(p.name for p in OUT.glob("*.png"))))


if __name__ == "__main__":
    main()
