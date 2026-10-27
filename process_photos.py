import os
import json
import base64
import io
from PIL import Image, ExifTags

SOURCE_DIR = "raw_exports"
THUMB_DIR = "images/thumbs"
FULL_DIR = "images/full"
MANIFEST_FILE = "photos.json"

# Create destination directories if they don't exist
os.makedirs(THUMB_DIR, exist_ok=True)
os.makedirs(FULL_DIR, exist_ok=True)


def get_exif_data(img):
    """Safely extracts human-readable camera, shutter, aperture, and ISO."""
    try:
        exif_raw = img.getexif()
        if not exif_raw:
            return default_exif()

        exif = {}
        for tag_id, val in exif_raw.items():
            tag = ExifTags.TAGS.get(tag_id, tag_id)
            exif[tag] = val

        # Check nested IFD for specific shot parameters
        if hasattr(ExifTags, 'IFD') and ExifTags.IFD.Exif in exif_raw:
            nested = exif_raw.get_ifd(ExifTags.IFD.Exif)
            for tag_id, val in nested.items():
                tag = ExifTags.TAGS.get(tag_id, tag_id)
                exif[tag] = val

        make = str(exif.get('Make', '')).strip()
        model = str(exif.get('Model', '')).strip()
        camera = model if model.startswith(make) else f"{make} {model}".strip()

        shutter = exif.get('ExposureTime')
        if shutter:
            try:
                s_val = float(shutter)
                shutter = f"1/{int(round(1/s_val))}s" if s_val < 1 else f"{s_val}s"
            except (ValueError, ZeroDivisionError):
                shutter = str(shutter)

        f_num = exif.get('FNumber')
        if f_num:
            try:
                f_val = float(f_num)
                aperture = f"f/{f_val:.1f}" if f_val % 1 else f"f/{int(f_val)}"
            except ValueError:
                aperture = str(f_num)
        else:
            aperture = None

        iso_val = exif.get('ISOSpeedRatings') or exif.get('PhotographicSensitivity')
        iso = f"ISO {iso_val}" if iso_val else None

        lens = str(exif.get('LensModel', '')).strip()

        return {
            "camera": camera or "Nikon D700",
            "lens": lens or "Prime Lens",
            "shutter": shutter or "1/1000s",
            "aperture": aperture or "f/4",
            "iso": iso or "ISO 200"
        }
    except Exception:
        return default_exif()


def default_exif():
    return {
        "camera": "Nikon D700",
        "lens": "Prime Lens",
        "shutter": "1/1000s",
        "aperture": "f/4",
        "iso": "ISO 200"
    }


def generate_lqip(img):
    """Generates an ultra-tiny 16px micro-thumbnail as a base64 string (~300 bytes)"""
    micro = img.copy()
    micro.thumbnail((16, 16), Image.Resampling.LANCZOS)
    if micro.mode in ("RGBA", "P"):
        micro = micro.convert("RGB")
    buffer = io.BytesIO()
    micro.save(buffer, format="JPEG", quality=40)
    b64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"


def main():
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: Could not find folder '{SOURCE_DIR}'. Create it and add photos.")
        return

    # Load existing manifest to preserve custom edits (titles, tags, locations)
    existing_data = {}
    if os.path.exists(MANIFEST_FILE):
        try:
            with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
                for entry in json.load(f):
                    existing_data[entry.get("id")] = entry
        except Exception:
            pass

    # Find valid images and sort by file modification date (oldest first, newest last)
    valid_exts = ('.jpg', '.jpeg', '.png', '.avif', '.webp')
    files = [
        f for f in os.listdir(SOURCE_DIR)
        if f.lower().endswith(valid_exts)
    ]
    files.sort(key=lambda f: os.path.getmtime(os.path.join(SOURCE_DIR, f)))

    if not files:
        print(f"No valid image files found in '{SOURCE_DIR}'.")
        return

    photos_list = []

    for filename in files:
        filepath = os.path.join(SOURCE_DIR, filename)
        name_stem = os.path.splitext(filename)[0].lower().replace(" ", "-")

        try:
            with Image.open(filepath) as img:
                # Convert RGBA/P images (e.g. PNGs) to RGB for clean WebP compression
                if img.mode in ("RGBA", "P"):
                    rgb_img = img.convert("RGB")
                else:
                    rgb_img = img.copy()

                exif = get_exif_data(img)
                lqip = generate_lqip(rgb_img)

                # 1. Full-res Lightbox WebP (2048px long edge)
                full_rel_path = f"{FULL_DIR}/{name_stem}.webp"
                full_img = rgb_img.copy()
                full_img.thumbnail((2048, 2048), Image.Resampling.LANCZOS)
                full_img.save(full_rel_path, format="WEBP", quality=82)

                # 2. Grid Thumbnail WebP (600px long edge)
                thumb_rel_path = f"{THUMB_DIR}/{name_stem}.webp"
                thumb_img = rgb_img.copy()
                thumb_img.thumbnail((600, 600), Image.Resampling.LANCZOS)
                thumb_img.save(thumb_rel_path, format="WEBP", quality=75)

                aspect = round(img.height / img.width, 4)

                # Preserve any tags/titles previously written by hand
                saved = existing_data.get(name_stem, {})
                title = saved.get("title", name_stem.replace("-", " ").title())
                location = saved.get("location", "City, Country")  # Default placeholder
                tags = saved.get("tags", [])

                photos_list.append({
                    "id": name_stem,
                    "title": ".",
                    "location": location,
                    "aspect": aspect,
                    "lqip": lqip,
                    "thumb": thumb_rel_path,
                    "full": full_rel_path,
                    "tags": tags,
                    "exif": exif
                })

                print(f"✓ Processed {filename} -> {thumb_rel_path}")

        except Exception as e:
            print(f"✕ Skipping {filename}: {e}")

    # Write the sorted manifest to photos.json
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(photos_list, f, indent=2)

    print(f"\nYAHOOOOOOOOOOOOOOO Successfully indexed {len(photos_list)} photos into {MANIFEST_FILE}")


if __name__ == "__main__":
    main()