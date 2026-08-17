import os
import math
from PIL import Image, ImageDraw, ImageFilter

os.makedirs('build', exist_ok=True)
os.makedirs('public', exist_ok=True)

# Generate 1024x1024 master image for ultra crisp downscaling
SIZE = 1024
master = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(master)

# Background: Claude dark squircle with subtle warm border
margin = 48
radius = 240
bg_box = [margin, margin, SIZE - margin, SIZE - margin]

# Subtle shadow
shadow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
sdraw = ImageDraw.Draw(shadow)
sdraw.rounded_rectangle([margin, margin + 20, SIZE - margin, SIZE - margin + 20], radius=radius, fill=(10, 9, 8, 160))
shadow = shadow.filter(ImageFilter.GaussianBlur(radius=28))
master = Image.alpha_composite(shadow, master)
draw = ImageDraw.Draw(master)

# Dark squircle base (#191715)
draw.rounded_rectangle(bg_box, radius=radius, fill=(25, 23, 21, 255), outline=(55, 48, 42, 255), width=10)

# Inner warm glow
glow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse([SIZE//2 - 260, SIZE//2 - 260, SIZE//2 + 260, SIZE//2 + 260], fill=(217, 119, 87, 35))
glow = glow.filter(ImageFilter.GaussianBlur(radius=80))
master = Image.alpha_composite(master, glow)
draw = ImageDraw.Draw(master)

# Draw Claude-style 8-pointed star / Spark emblem
cx, cy = SIZE // 2, SIZE // 2

def draw_claude_star(target_draw, center_x, center_y, outer_r, inner_r, fill_color):
    points = []
    # 4 long main petals + 4 subtle intermediate rays
    for i in range(16):
        angle = i * (math.pi / 8) - (math.pi / 2)
        if i % 4 == 0:
            r = outer_r
        elif i % 2 == 0:
            r = outer_r * 0.48
        else:
            r = inner_r
        px = center_x + r * math.cos(angle)
        py = center_y + r * math.sin(angle)
        points.append((px, py))
    target_draw.polygon(points, fill=fill_color)

# Ambient spark glow
spark_glow = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
sg_draw = ImageDraw.Draw(spark_glow)
draw_claude_star(sg_draw, cx, cy, 320, 90, (217, 119, 87, 140))
spark_glow = spark_glow.filter(ImageFilter.GaussianBlur(radius=24))
master = Image.alpha_composite(master, spark_glow)
draw = ImageDraw.Draw(master)

# Primary Claude star (#d97757 warm terracotta)
draw_claude_star(draw, cx, cy, 300, 80, (217, 119, 87, 255))

# Center core highlight (#fbf7ee warm white)
core_r = 45
draw.ellipse([cx - core_r, cy - core_r, cx + core_r, cy + core_r], fill=(251, 247, 238, 240))

# Inner subtle glow inside core
core_glow = 24
draw.ellipse([cx - core_glow, cy - core_glow, cx + core_glow, cy + core_glow], fill=(255, 255, 255, 255))

# Save build/icon.png (512x512)
icon_512 = master.resize((512, 512), Image.Resampling.LANCZOS)
icon_512.save('build/icon.png', 'PNG')
icon_512.save('public/icon-512.png', 'PNG')

# Save multi-resolution Windows ICO
ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
icon_512.save('build/icon.ico', format='ICO', sizes=ico_sizes)
icon_512.save('public/favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

# Generate clean SVG favicon for browsers
svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#d97757" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#d97757" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="120" fill="#171615" stroke="#38322c" stroke-width="8"/>
  <circle cx="256" cy="256" r="160" fill="url(#glow)"/>
  <path d="M 256 96 C 256 180 200 236 116 236 C 200 236 256 292 256 376 C 256 292 312 236 396 236 C 312 236 256 180 256 96 Z" fill="#d97757"/>
  <path d="M 256 160 C 256 215 220 251 165 251 C 220 251 256 287 256 342 C 256 287 292 251 347 251 C 292 251 256 215 256 160 Z" fill="#fbf7ee" opacity="0.9"/>
  <circle cx="256" cy="256" r="22" fill="#ffffff"/>
</svg>'''

with open('public/favicon.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print("SUCCESS: All Claude-style icons generated successfully!")
