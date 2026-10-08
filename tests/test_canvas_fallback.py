from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
GAMES = ["1", "2", "3", "4", "4-halloween", "ps", "sl", "ucn", "w"]


def test_canvas_fallback_is_shared_by_all_game_pages():
    compatibility = (ROOT / "fullscreen.js").read_text(encoding="utf-8")
    assert "probe.getContext('2d')" in compatibility
    assert "window.gameCanvasSupported = canvasSupported" in compatibility
    assert "WebGL is not required" in compatibility
    assert "window.location.reload()" in compatibility

    for game in GAMES:
        html = (ROOT / game / "index.html").read_text(encoding="utf-8")
        loader = (ROOT / game / "main.js").read_text(encoding="utf-8")
        assert "../fullscreen.js" in html, f"{game}: missing compatibility check"
        assert "if (window.gameCanvasSupported)" in loader, f"{game}: loader is not gated"
