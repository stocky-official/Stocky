import os
import subprocess
from PIL import Image

SVG_512 = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="stockyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0062FF" />
      <stop offset="100%" stop-color="#004AD9" />
    </linearGradient>
  </defs>
  <!-- Squircle Background -->
  <rect width="512" height="512" rx="115" fill="url(#stockyGrad)" />
  
  <!-- Lucide Boxes Icon (White, Centered) -->
  <g transform="translate(106, 106) scale(12.5)" fill="none" stroke="#FFFFFF" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
    <path d="m7 16.5-4.74-2.85" />
    <path d="m7 16.5 5-3" />
    <path d="M7 16.5v5.17" />
    <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
    <path d="m17 16.5-5-3" />
    <path d="m17 16.5 4.74-2.85" />
    <path d="M17 16.5v5.17" />
    <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
    <path d="M12 8 7.26 5.15" />
    <path d="m12 8 4.74-2.85" />
    <path d="M12 13.5V8" />
  </g>
</svg>"""

SVG_MASKABLE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Solid Background for Maskable Icon -->
  <rect width="512" height="512" fill="#0057FF" />
  
  <!-- Scaled inside 80% safe zone -->
  <g transform="translate(136, 136) scale(10.0)" fill="none" stroke="#FFFFFF" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
    <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z" />
    <path d="m7 16.5-4.74-2.85" />
    <path d="m7 16.5 5-3" />
    <path d="M7 16.5v5.17" />
    <path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z" />
    <path d="m17 16.5-5-3" />
    <path d="m17 16.5 4.74-2.85" />
    <path d="M17 16.5v5.17" />
    <path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z" />
    <path d="M12 8 7.26 5.15" />
    <path d="m12 8 4.74-2.85" />
    <path d="M12 13.5V8" />
  </g>
</svg>"""

def render_svg_to_png(svg_content, out_png_path, width=512, height=512):
    temp_html = out_png_path + ".html"
    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
html, body {{ width: {width}px; height: {height}px; background: transparent; overflow: hidden; }}
svg {{ width: {width}px; height: {height}px; display: block; }}
</style>
</head>
<body>
{svg_content}
</body>
</html>"""
    with open(temp_html, "w", encoding="utf-8") as f:
        f.write(html_content)

    chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if not os.path.exists(chrome_path):
        chrome_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

    cmd = [
        chrome_path,
        "--headless",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={width},{height}",
        f"--screenshot={out_png_path}",
        "--default-background-color=00000000",
        temp_html
    ]
    subprocess.run(cmd, check=True)
    if os.path.exists(temp_html):
        os.remove(temp_html)

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    public_dir = os.path.join(root_dir, "apps", "web", "public")
    app_dir = os.path.join(root_dir, "apps", "web", "src", "app")
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(app_dir, exist_ok=True)

    # 1. Save SVG icons
    app_svg = os.path.join(app_dir, "icon.svg")
    public_svg = os.path.join(public_dir, "icon.svg")
    with open(app_svg, "w", encoding="utf-8") as f:
        f.write(SVG_512)
    with open(public_svg, "w", encoding="utf-8") as f:
        f.write(SVG_512)
    print("Saved SVG icons.")

    # 2. Render 512 PNG
    png_512 = os.path.join(public_dir, "icon-512.png")
    render_svg_to_png(SVG_512, png_512, 512, 512)
    print("Rendered icon-512.png")

    # 3. Render maskable 512 PNG
    maskable_512 = os.path.join(public_dir, "icon-maskable-512.png")
    render_svg_to_png(SVG_MASKABLE, maskable_512, 512, 512)
    print("Rendered icon-maskable-512.png")

    # 4. Generate 192x192, apple-touch-icon, and favicon.ico with Pillow
    img = Image.open(png_512)

    # icon-192.png
    img_192 = img.resize((192, 192), Image.Resampling.LANCZOS)
    img_192.save(os.path.join(public_dir, "icon-192.png"), "PNG")
    print("Generated icon-192.png")

    # apple-touch-icon (180x180)
    img_apple = img.resize((180, 180), Image.Resampling.LANCZOS)
    img_apple.save(os.path.join(public_dir, "apple-touch-icon.png"), "PNG")
    img_apple.save(os.path.join(app_dir, "apple-icon.png"), "PNG")
    print("Generated apple-touch-icon.png")

    # favicon.ico (multi-resolution 16, 32, 48)
    favicon_path_public = os.path.join(public_dir, "favicon.ico")
    favicon_path_app = os.path.join(app_dir, "favicon.ico")
    img.save(
        favicon_path_public,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    img.save(
        favicon_path_app,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("Generated favicon.ico (16/32/48 multi-size)")

if __name__ == "__main__":
    main()
