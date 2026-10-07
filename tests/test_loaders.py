from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
GAMES = ["1", "2", "3", "4", "4-halloween", "ps", "sl", "ucn", "w"]


def test_game_loaders_use_bounded_concurrency():
    for game in GAMES:
        main = (ROOT / game / "main.js").read_text(encoding="utf-8")
        assert "MAX_CONCURRENT_DOWNLOADS = 4" in main, f"{game}: missing concurrency limit"
        assert "HEAD" not in main, f"{game}: uses unnecessary HEAD requests"
        assert "Promise.all(fileParts.map" not in main, f"{game}: downloads parts serially"


def test_game_pages_load_scripts_without_blocking():
    for game in GAMES:
        html = (ROOT / game / "index.html").read_text(encoding="utf-8")
        assert "defer" in html, f"{game}: main.js is blocking"
        assert "preconnect" in html, f"{game}: missing CDN connection hint"


def test_game_pages_use_single_script_bundle():
    for game in GAMES:
        html = (ROOT / game / "index.html").read_text(encoding="utf-8")
        scripts = re.findall(r'<script\b[^>]*src="([^"]+)"[^>]*>', html)
        assert scripts.count("main.js") == 1, f"{game}: duplicate main.js script"
