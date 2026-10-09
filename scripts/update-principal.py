"""Refresh only Web 4 in the self-contained comparator; preserve other proposals."""
from pathlib import Path
from urllib.parse import urlsplit, unquote
import base64
import html
import json
import mimetypes
import re

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "opcion-4/index.html"
PORTAL = ROOT / "propuestas.html"

def local(ref, parent):
    parsed = urlsplit(html.unescape(ref))
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    path = (parent / unquote(parsed.path)).resolve()
    if not path.is_relative_to(ROOT):
        raise ValueError(ref)
    return path

def data_url(path):
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return "data:" + mime + ";base64," + base64.b64encode(path.read_bytes()).decode()

def attribute(tag, name):
    match = re.search(r"\b" + name + r"=[\'\"]([^\'\"]*)[\'\"]", tag, re.I)
    return match[1] if match else None

def css_assets(text, parent):
    def replace(match):
        target = local(match[1], parent)
        return 'url("' + data_url(target) + '")' if target else match[0]
    return re.sub(r"url\(\s*[\'\"]?([^\)\'\"\s]+)[\'\"]?\s*\)", replace, text)

def build():
    text = SOURCE.read_text(encoding="utf-8-sig")
    def link(match):
        tag = match[0]
        ref = attribute(tag, "href")
        target = local(ref, SOURCE.parent) if ref else None
        if not target:
            return tag
        rel = attribute(tag, "rel")
        if rel == "stylesheet":
            return "<style>" + css_assets(target.read_text(encoding="utf-8-sig"), target.parent) + "</style>"
        if rel == "preload":
            return ""
        return tag.replace(ref, data_url(target))
    text = re.sub(r"<link\b[^>]*>", link, text, flags=re.I)
    def script(match):
        target = local(attribute(match[1], "src"), SOURCE.parent)
        code = target.read_text(encoding="utf-8-sig")
        code = re.sub(r"([\'\"])(assets/[^\'\"]+)\1", lambda m: json.dumps(data_url(local(m[2], target.parent))), code)
        if re.search(r"\bdefer\b", match[1]):
            code = "document.addEventListener('DOMContentLoaded',()=>{\n" + code + "\n});"
        return "<script>" + code + "</script>"
    text = re.sub(r"(<script\b[^>]*\bsrc=[\'\"][^\'\"]+[\'\"][^>]*>)\s*</script>", script, text, flags=re.I)
    def image(match):
        target = local(match[2], SOURCE.parent)
        return match[1] + data_url(target) + match[3] if target else match[0]
    text = re.sub(r"(<(?:img|source)\b[^>]*\bsrc=[\'\"])([^\'\"]+)([\'\"])", image, text, flags=re.I)
    text = text.replace('href="../"', 'data-proposal="1" href="#"')
    return text

if __name__ == "__main__":
    portal = PORTAL.read_text(encoding="utf-8")
    start = portal.index("documents=") + len("documents=")
    first = start + 1
    previous, end = json.JSONDecoder().raw_decode(portal[first:])
    replacement = json.dumps(build(), ensure_ascii=False).replace("<", "\\u003c")
    updated = portal[:first] + replacement + portal[first + end:]
    PORTAL.write_text(updated, encoding="utf-8")
    print("Updated Web 4; other proposal documents preserved.")
