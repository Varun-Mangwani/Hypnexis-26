import pathlib
import subprocess
import xml.etree.ElementTree as ET
import zipfile

pptx_path = pathlib.Path(r"C:\Users\Dell\Downloads\Problem_Statements_hypn.pptx")
if not pptx_path.exists():
    raise FileNotFoundError(f"Cannot find {pptx_path}")

z = zipfile.ZipFile(pptx_path)

slides = []
for i in range(1, 25):
    name = f"ppt/slides/slide{i}.xml"
    if name in z.namelist():
        text = " ".join(ET.fromstring(z.read(name)).itertext()).strip()
        if text:
            slides.append((i, text))

html_content = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Hackathon Problem Statements</title>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    max-width: 840px;
    margin: 30px auto;
    padding: 0 20px;
  }
  h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; }
  h2 { color: #0284c7; margin-top: 24px; font-size: 1.25rem; }
  .track { background: #f8fafc; border-left: 4px solid #0284c7; padding: 12px 16px; margin: 20px 0; border-radius: 0 8px 8px 0; font-weight: bold; }
  .ps { margin-bottom: 20px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff; }
  .highlight { border: 2px solid #10b981; background: #f0fdf4; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.1); }
  .badge { display: inline-block; background: #10b981; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; margin-bottom: 8px; }
  p { margin: 8px 0; }
</style>
</head>
<body>
<h1>MUJ HackX 4.0 &mdash; Official Problem Statements</h1>
<p><strong>Tracks Overview:</strong> 6 Tracks &bull; 15 Problem Statements</p>
"""

for idx, text in slides:
    clean = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if "AI-04" in clean:
        html_content += f'<div class="ps highlight"><span class="badge">OUR HACKATHON FOCUS &bull; AI-04</span><p>{clean}</p></div>\n'
    elif "TRACK" in clean and len(clean) < 150:
        html_content += f'<div class="track"><h2>{clean}</h2></div>\n'
    else:
        html_content += f'<div class="ps"><p>{clean}</p></div>\n'

html_content += "</body></html>"

data_dir = pathlib.Path(r"C:\Users\Dell\Desktop\Hackathon\data")
data_dir.mkdir(parents=True, exist_ok=True)
temp_html = data_dir / "problem_statement.html"
temp_html.write_text(html_content, encoding="utf-8")

pdf_out = pathlib.Path(r"C:\Users\Dell\Downloads\problem_statement.pdf")
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [chrome, "--headless", "--disable-gpu", f"--print-to-pdf={str(pdf_out)}", str(temp_html)]
subprocess.run(cmd, check=True)

# Also save a copy inside data/demo/ for easy evaluation replay
demo_copy = data_dir / "problem_statement.pdf"
demo_copy.write_bytes(pdf_out.read_bytes())

print(f"Generated PDF in Downloads: {pdf_out} ({pdf_out.stat().st_size} bytes)")
print(f"Generated PDF copy in data/: {demo_copy} ({demo_copy.stat().st_size} bytes)")
