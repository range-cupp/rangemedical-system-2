#!/usr/bin/env python3
"""Generate Range Medical free-session ad images via Gemini API (nano-banana)."""

import base64
import concurrent.futures
import json
import os
import pathlib
import sys
import urllib.request

API_KEY = os.environ["GEMINI_API_KEY"].strip().strip('"').strip("'")
MODEL = "gemini-2.5-flash-image"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

OUT_DIR = pathlib.Path("public/ads/free-session")
OUT_DIR.mkdir(parents=True, exist_ok=True)

BRAND_PRELUDE = (
    "Create a 1080x1080 square Instagram/Meta ad for RANGE MEDICAL, a Newport Beach "
    "regenerative-medicine clinic. Follow the Range Medical v2 brand system EXACTLY: "
    "ultra-minimal, editorial, high-contrast black-and-white like Stripe or Figma. "
    "Pure background color #1a1a1a (deep black). NO gradients, NO glows, NO fog, "
    "NO halos, NO vignettes, NO decorative textures, NO photographic imagery, "
    "NO illustrations, NO icons, NO ornament. The composition is strictly typographic "
    "and geometric — nothing else. \n\n"
    "STRICT TYPOGRAPHY RULES (Inter font family, white #ffffff text):\n"
    "- Small tracked-out eyebrow label top-left: 11px equivalent, 800 weight, 0.14em "
    "letter-spacing, UPPERCASE, color #a0a0a0. Include a small 8px solid gray (#808080) "
    "square bullet to the left of the label.\n"
    "- Main headline: Inter Black (900 weight), HUGE (equivalent to 140px), UPPERCASE, "
    "line-height 0.95, letter-spacing -0.03em, pure white. Left-aligned. Should occupy "
    "the upper-middle area, wrapped across 2-3 lines.\n"
    "- A single thin 1px horizontal rule (#404040) across full width below the headline "
    "block, with generous vertical whitespace above and below.\n"
    "- Bottom CTA: 12px equivalent, 800 weight, 0.12em letter-spacing, UPPERCASE, white, "
    "left-aligned. Single line.\n"
    "- Small 'RANGE MEDICAL' wordmark bottom-right: 13px, 800 weight, 0.15em letter-"
    "spacing, white. No logo mark, wordmark-only.\n"
    "Keep ALL text away from the outer 60px edge (Instagram safe zone).\n"
    "NO rounded corners anywhere. NO shadows. NO colored accents except the tiny "
    "square bullet next to the eyebrow label.\n"
    "Do not render pricing, URLs, phone numbers, or any other text beyond what is "
    "explicitly specified."
)

HBOT_CTA = 'CTA text bottom-left: "TRY A HYPERBARIC OXYGEN SESSION ON US".'
RLT_CTA = 'CTA text bottom-left: "TRY A RED LIGHT THERAPY SESSION ON US".'

HBOT_EYEBROW = 'Eyebrow label text: "HYPERBARIC OXYGEN · NEWPORT BEACH".'
RLT_EYEBROW = 'Eyebrow label text: "RED LIGHT THERAPY · NEWPORT BEACH".'

ADS = [
    # HBOT
    {
        "filename": "hbot-1-brain-fog.png",
        "prompt": BRAND_PRELUDE + " " + HBOT_EYEBROW + ' Main headline text: "BRAIN FOG THAT WON\u2019T LIFT?" ' + HBOT_CTA,
    },
    {
        "filename": "hbot-2-bounce-back.png",
        "prompt": BRAND_PRELUDE + " " + HBOT_EYEBROW + ' Main headline text: "SLOW TO BOUNCE BACK?" ' + HBOT_CTA,
    },
    {
        "filename": "hbot-3-headaches.png",
        "prompt": BRAND_PRELUDE + " " + HBOT_EYEBROW + ' Main headline text: "PERSISTENT HEADACHES?" ' + HBOT_CTA,
    },
    {
        "filename": "hbot-4-inflammation.png",
        "prompt": BRAND_PRELUDE + " " + HBOT_EYEBROW + ' Main headline text: "INFLAMMATION THAT WON\u2019T QUIT?" ' + HBOT_CTA,
    },
    {
        "filename": "hbot-5-3pm-crash.png",
        "prompt": BRAND_PRELUDE + " " + HBOT_EYEBROW + ' Main headline text: "RUNNING ON EMPTY BY 3PM?" ' + HBOT_CTA,
    },
    # RLT
    {
        "filename": "rlt-1-skin.png",
        "prompt": BRAND_PRELUDE + " " + RLT_EYEBROW + ' Main headline text: "SKIN NOT BOUNCING BACK?" ' + RLT_CTA,
    },
    {
        "filename": "rlt-2-scars-redness.png",
        "prompt": BRAND_PRELUDE + " " + RLT_EYEBROW + ' Main headline text: "SCARS, STRETCH MARKS, REDNESS?" ' + RLT_CTA,
    },
    {
        "filename": "rlt-3-joint-pain.png",
        "prompt": BRAND_PRELUDE + " " + RLT_EYEBROW + ' Main headline text: "CHRONIC JOINT OR MUSCLE PAIN?" ' + RLT_CTA,
    },
    {
        "filename": "rlt-4-recovery.png",
        "prompt": BRAND_PRELUDE + " " + RLT_EYEBROW + ' Main headline text: "SORE AFTER EVERY WORKOUT?" ' + RLT_CTA,
    },
    {
        "filename": "rlt-5-stress-sleep.png",
        "prompt": BRAND_PRELUDE + " " + RLT_EYEBROW + ' Main headline text: "STRESSED AND SLEEPING POORLY?" ' + RLT_CTA,
    },
]


def generate_one(ad):
    filename = ad["filename"]
    prompt = ad["prompt"]
    out_path = OUT_DIR / filename

    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseModalities": ["IMAGE"]},
    }).encode()

    req = urllib.request.Request(
        API_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
    )

    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")[:500]
        return filename, False, f"HTTP {e.code}: {body}"
    except Exception as e:
        return filename, False, f"ERR: {e}"

    # Find the inline image part
    try:
        parts = data["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError):
        return filename, False, f"No candidates in response: {json.dumps(data)[:400]}"

    img_b64 = None
    for p in parts:
        if "inlineData" in p and p["inlineData"].get("mimeType", "").startswith("image/"):
            img_b64 = p["inlineData"]["data"]
            break

    if not img_b64:
        return filename, False, f"No image in response parts: {[list(p.keys()) for p in parts]}"

    out_path.write_bytes(base64.b64decode(img_b64))
    return filename, True, f"saved {out_path} ({out_path.stat().st_size // 1024} KB)"


def main():
    print(f"Generating {len(ADS)} ad images to {OUT_DIR}...")
    results = []
    # Run 3 at a time to avoid hammering the API
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        for fname, ok, msg in pool.map(generate_one, ADS):
            tag = "OK " if ok else "FAIL"
            print(f"  [{tag}] {fname}: {msg}")
            results.append((fname, ok))

    succ = sum(1 for _, ok in results if ok)
    fail = len(results) - succ
    print(f"\nDone: {succ} succeeded, {fail} failed.")
    if fail:
        sys.exit(1)


if __name__ == "__main__":
    main()
