(() => {
  const stage = document.getElementById('game-stage');
  const button = document.getElementById('fullscreen-button');
  const status = document.getElementById('fullscreen-status');

  if (typeof stage.requestFullscreen !== 'function' || typeof document.exitFullscreen !== 'function') {
    button.disabled = true;
    status.textContent = 'Fullscreen is not supported in this browser.';
    return;
  }

  button.addEventListener('click', async () => {
    status.textContent = '';

    try {
      if (document.fullscreenElement === stage) {
        await document.exitFullscreen();
      } else {
        await stage.requestFullscreen();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status.textContent = `Could not change fullscreen: ${message}`;
      console.error('Fullscreen request failed:', error);
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement === stage;
    button.textContent = isFullscreen ? 'Exit fullscreen' : 'Fullscreen';
    button.setAttribute('aria-label', button.textContent);
  });
})();
