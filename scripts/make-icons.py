#!/usr/bin/env python3
"""Draws the app icon (crescent moon and stars on indigo) and writes the iOS and
Android icon files. Needs Pillow. Run from the repo root: python3 scripts/make-icons.py"""
import math
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SIZE = 1024
SS = 3  # supersampling factor for smooth edges


def draw_icon(size: int, circular: bool = False) -> Image.Image:
    s = size * SS
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    # Vertical gradient background.
    top, bottom = (27, 34, 80), (59, 76, 202)
    grad = Image.new('RGBA', (1, s))
    for y in range(s):
        t = y / (s - 1)
        grad.putpixel((0, y), tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(3)) + (255,))
    bg = grad.resize((s, s))
    mask = Image.new('L', (s, s), 0)
    d = ImageDraw.Draw(mask)
    if circular:
        d.ellipse((0, 0, s - 1, s - 1), fill=255)
    else:
        d.rectangle((0, 0, s, s), fill=255)
    img.paste(bg, (0, 0), mask)

    # Crescent moon: a cream disc with a shifted disc cut out of it.
    moon = Image.new('L', (s, s), 0)
    md = ImageDraw.Draw(moon)
    r = int(s * 0.27)
    cx, cy = int(s * 0.46), int(s * 0.52)
    md.ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    cut = Image.new('L', (s, s), 0)
    cd = ImageDraw.Draw(cut)
    ox, oy = int(s * 0.12), -int(s * 0.07)
    cd.ellipse((cx - r + ox, cy - r + oy, cx + r + ox, cy + r + oy), fill=255)
    moon = Image.composite(Image.new('L', (s, s), 0), moon, cut)
    cream = Image.new('RGBA', (s, s), (252, 234, 170, 255))
    img.paste(cream, (0, 0), moon)

    # Stars: small four-point sparkles.
    def star(x: float, y: float, rad: float):
        px, py, rr = int(s * x), int(s * y), int(s * rad)
        pts = []
        for i in range(8):
            ang = i * 3.14159265 / 4
            length = rr if i % 2 == 0 else rr * 0.3
            pts.append((px + length * math.cos(ang), py + length * math.sin(ang)))
        sd = ImageDraw.Draw(img)
        sd.polygon(pts, fill=(255, 247, 214, 255))

    star(0.72, 0.28, 0.07)
    star(0.80, 0.52, 0.04)
    star(0.70, 0.77, 0.045)
    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    ios = ROOT / 'ios/BedtimeStories/Images.xcassets/AppIcon.appiconset'
    draw_icon(1024).convert('RGB').save(ios / 'AppIcon-1024.png')
    (ios / 'Contents.json').write_text(
        '{\n  "images" : [\n    {\n      "filename" : "AppIcon-1024.png",\n'
        '      "idiom" : "universal",\n      "platform" : "ios",\n      "size" : "1024x1024"\n    }\n  ],\n'
        '  "info" : {\n    "author" : "xcode",\n    "version" : 1\n  }\n}\n'
    )
    res = ROOT / 'android/app/src/main/res'
    for folder, px in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
        draw_icon(px).save(res / f'mipmap-{folder}' / 'ic_launcher.png')
        draw_icon(px, circular=True).save(res / f'mipmap-{folder}' / 'ic_launcher_round.png')
    print('icons written')


if __name__ == '__main__':
    main()
