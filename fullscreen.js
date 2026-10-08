(() => {
  const probe = document.createElement('canvas');
  let canvasSupported = false;

  try {
    const context = probe.getContext('2d');
    if (context) {
      context.fillRect(0, 0, 1, 1);
      canvasSupported = true;
    }
  } catch (error) {
    console.error('Canvas 2D capability check failed:', error);
  }

  window.gameCanvasSupported = canvasSupported;

  const stage = document.getElementById('game-stage');
  const button = document.getElementById('fullscreen-button');
  const status = document.getElementById('fullscreen-status');

  if (!canvasSupported) {
    stage.classList.add('canvas-unavailable');
    document.getElementById('progress-container').style.display = 'none';

    const fallback = document.createElement('section');
    fallback.className = 'canvas-fallback';
    fallback.setAttribute('role', 'alert');

    const heading = document.createElement('h1');
    heading.textContent = 'Canvas is unavailable';
    fallback.appendChild(heading);

    const explanation = document.createElement('p');
    explanation.textContent = 'These games need Canvas 2D to draw. WebGL is not required, and a website cannot override a browser or device policy that blocks Canvas.';
    fallback.appendChild(explanation);

    const steps = document.createElement('ol');
    [
      'Try a private/incognito window. If the game works there, allow this site in your ad-blocking or privacy extensions.',
      'Update and restart your browser, or try a current version of Chrome, Edge, or Firefox.',
      'Try toggling graphics acceleration in your browser settings, then restart the browser.',
      'On a school or work device, ask its administrator whether browser graphics or Canvas features are restricted.'
    ].forEach((step) => {
      const item = document.createElement('li');
      item.textContent = step;
      steps.appendChild(item);
    });
    fallback.appendChild(steps);

    const reload = document.createElement('button');
    reload.type = 'button';
    reload.textContent = 'Check again';
    reload.addEventListener('click', () => window.location.reload());
    fallback.appendChild(reload);

    stage.appendChild(fallback);
    return;
  }

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
