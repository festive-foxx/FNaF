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


def test_game_loaders_do_not_include_obfuscated_redirect_payload():
    for game in ("3", "ps", "w"):
        main = (ROOT / game / "main.js").read_text(encoding="utf-8")
        assert "_0x4ae416" not in main, f"{game}: contains an obfuscated payload"
        assert "marzlib.cc" not in main, f"{game}: redirects to an unrelated site"


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


def test_game_pages_include_fullscreen_controls():
    for game in GAMES:
        html = (ROOT / game / "index.html").read_text(encoding="utf-8")
        assert 'id="game-stage"' in html, f"{game}: missing fullscreen target"
        assert 'id="fullscreen-button"' in html, f"{game}: missing fullscreen button"
        assert '../fullscreen.js' in html, f"{game}: missing fullscreen behavior"
        assert '../fullscreen.css' in html, f"{game}: missing fullscreen styles"


def test_game_stage_centers_canvas_in_viewport():
    styles = (ROOT / "fullscreen.css").read_text(encoding="utf-8")
    assert "#game-stage" in styles
    assert "width: 100vw;" in styles
    assert "place-items: center;" in styles
    assert "#game-stage > .MMFDiv" in styles
    assert "width: fit-content !important;" in styles
    assert "justify-self: center;" in styles


def test_fnaf_3_and_4_scale_to_viewport_without_distortion():
    styles = (ROOT / "fullscreen.css").read_text(encoding="utf-8")
    for game in ("3", "4"):
        html = (ROOT / game / "index.html").read_text(encoding="utf-8")
        assert 'id="game-stage" class="fit-to-screen"' in html

    assert "width: min(100vw, 177.7778vh) !important;" in styles
    assert "height: min(100vh, 56.25vw) !important;" in styles
    assert "width: 100% !important;" in styles
    assert "height: 100% !important;" in styles


def test_fnaf_world_keeps_runtime_managed_fullscreen_sizing():
    html = (ROOT / "w" / "index.html").read_text(encoding="utf-8")
    styles = (ROOT / "fullscreen.css").read_text(encoding="utf-8")
    assert 'id="game-stage" class="runtime-fullscreen"' in html
    assert "#game-stage.runtime-fullscreen:fullscreen #MMFCanvas" in styles
    assert "width: auto !important;" in styles
    assert "height: auto !important;" in styles


def test_fullscreen_button_is_positioned_in_top_left():
    styles = (ROOT / "fullscreen.css").read_text(encoding="utf-8")
    button_styles = styles.split("#fullscreen-button {", 1)[1].split("}", 1)[0]
    assert "top: 12px;" in button_styles
    assert "left: 12px;" in button_styles
    assert "right:" not in button_styles


def test_fnaf_world_tracks_standard_fullscreen_state():
    runtime = (ROOT / "w" / "Runtime.js").read_text(encoding="utf-8")
    assert "a.fullScreen=!!document.fullscreenElement;Lh(a)" in runtime
    assert "document.jB" not in runtime


def test_fnaf_world_releases_archive_after_extraction():
    main = (ROOT / "w" / "main.js").read_text(encoding="utf-8")
    assert "async function wedone(resources)" in main
    assert "window.fetch = originalFetch;" in main
    assert "URL.revokeObjectURL(resources);" in main
    assert "wedone(resources);" in main
