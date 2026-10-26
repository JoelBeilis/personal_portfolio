import os
import json
import base64
import io
from PIL import Image, ExifTags

SOURCE_DIR = "raw_exports"
THUMB_DIR = "images/thumbs"
FULL_DIR = "images/full"
MANIFEST_FILE = "photos.json"

os.makedirs(THUMB_DIR, exist_ok=True)
os.makedirs(FULL_DIR, exist_ok=True)

def get_exif_data(img):
    exif_raw = img.getexif()
    if not exif_raw:
        return {}
    
    exif = {}
    for tag_id, val in exif_raw.items():
        tag = ExifTags.TAGS.get(tag_id, tag_id)
        exif[tag] = val

    # Nested IFD for camera settings
    if hasattr(ExifTags, 'IFD') and ExifTags.IFD.Exif in exif_raw:
        nested = exif_raw.get_ifd(ExifTags.IFD.Exif)
        for tag_id, val in nested.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            exif[tag] = val

    # Format into human-readable strings
    camera = f"{exif.get('Make', '')} {exif.get('Model', '')}".strip() or "Nikon"
    shutter = str(exif.get('ExposureTime', ''))
    if shutter and float(shutter) < 1:
        shutter = f"1/{int(round(1/float(shutter)))}s"
    elif shutter:
        shutter = f"{shutter}s"
    
    f_num = exif.get('FNumber')
    aperture = f"f/{float(f_num):.1f}" if f_num else "f/4.0"
    iso = f"ISO {exif.get('ISOSpeedRatings', exif.get('PhotographicSensitivity', ''))}"

    return {
        "camera": camera,
        "shutter": shutter or "1/1000s",
        "aperture": aperture,
        "iso": iso if iso != "ISO " else "ISO 200"
    }

def generate_lqip(img):
    """Produces a 16px micro-thumbnail as a tiny base64 string (~300 bytes)"""
    micro = img.copy()
    micro.thumbnail((16, 16), Image.Resampling.LANCZOS)
    buffer = io.BytesIO()
    micro.save(buffer, format="JPEG", quality=40)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

photos_list = []

for filename in sorted(os.listdir(SOURCE_DIR)):
    if not filename.lower().endswith(('.jpg', '.jpeg', '.png', '.avif')):
        continue

    filepath = os.path.join(SOURCE_DIR, filename)
    name_stem = os.path.splitext(filename)[0].lower().replace(" ", "-")

    with Image.open(filepath) as img:
        exif = get_exif_data(img)
        lqip = generate_lqip(img)

        # 1. Lightbox High-Res WebP (2048px long edge)
        full_img = img.copy()
        full_img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
        full_rel_path = f"{FULL_DIR}/{name_stem}.webp"
        full_img.save(full_rel_path, format="WEBP", quality=82)

        # 2. Grid Thumbnail WebP (600px long edge)
        thumb_img = img.copy()
        thumb_img.thumbnail((600, 600), Image.Resampling.LANCZOS)
        thumb_rel_path = f"{THUMB_DIR}/{name_stem}.webp"
        thumb_img.save(thumb_rel_path, format="WEBP", quality=75)

        aspect_ratio = round(img.height / img.width, 4)

        # Default tags; edit manually in JSON or append by folder name
        photos_list.append({
            "id": name_stem,
            "title": name_stem.replace("-", " ").title(),
            "location": "Ontario, Canada",
            "aspect": aspect_ratio,
            "lqip": lqip,
            "thumb": thumb_rel_path,
            "full": full_rel_path,
            "tags": ["Wildlife", "Field"],
            "exif": exif
        })
        print(f"✓ Processed {filename} -> {thumb_rel_path}")

with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
    json.dump(photos_list, f, indent=2)

print(f"\nYAHOOOOOOO Successfully indexed {len(photos_list)} photos into {MANIFEST_FILE}")