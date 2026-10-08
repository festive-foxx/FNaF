const runtimecanvas = "resources/FNAF1HTML5.cch";
const parts = 8;
const MAX_CONCURRENT_DOWNLOADS = 4;

// -----------------
const map = new Map();

function updateProgress(id, percent) {
    document.getElementById(id + '-bar').style.width = percent + '%';
    document.getElementById(id + '-text').innerText = percent + '%';
}

async function intercept() {
  const ogfetch = window.fetch;
  window.fetch = async function (input, init) {
    if (typeof input === 'string' && input.startsWith('resources/')) {
      const fileName = input.split('/').pop();
      if (map.has(fileName)) {
        return ogfetch(map.get(fileName), init);
      }
    }
    return ogfetch(input, init);
  };

  const ogopen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (method, url) {
    if (url.startsWith('resources/')) {
      const fileName = url.split('/').pop();
      if (map.has(fileName)) {
        url = map.get(fileName);
      }
    }
    return ogopen.apply(this, arguments);
  };

  const types = [HTMLImageElement, HTMLAudioElement, HTMLVideoElement];
  for (const Tag of types) {
    const descriptor = Object.getOwnPropertyDescriptor(Tag.prototype, 'src');
    if (descriptor && descriptor.set) {
      Object.defineProperty(Tag.prototype, 'src', {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: function (val) {
          if (typeof val === 'string' && val.startsWith('resources/')) {
            const fileName = val.split('/').pop();
            if (map.has(fileName)) {
              val = map.get(fileName);
            }
          }
          descriptor.set.call(this, val);
        }
      });
    }
  }
}

async function extract() {
  const response = await fetch("resources.zip");
  if (!response.ok) {
    throw new Error(`Failed to download resources.zip: ${response.status}`);
  }

  const archive = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(archive);
  const files = Object.keys(zip.files).filter(name => !zip.files[name].dir);
  const totalFiles = files.length;

  
  const workers = Array.from({ length: Math.min(MAX_CONCURRENT_DOWNLOADS, totalFiles) }, async () => {
    while (files.length > 0) {
      const file = files.shift();
      if (!file) return;

      const blob = await zip.files[file].async("blob");
      map.set(file, URL.createObjectURL(blob));
      updateProgress('extract', Math.floor(((totalFiles - files.length) / totalFiles) * 100));
    }
  });

  await Promise.all(workers);

}

async function wedone() {
  await extract();
  await intercept();

  const script = document.createElement('script');
  script.src = 'Runtime.js';
  script.onload = () => {
    new Runtime("MMFCanvas", runtimecanvas);
  };
  document.getElementById('progress-container').style.display = 'none';
  document.head.appendChild(script);
}

const originalFetch = window.fetch;

function mergeFiles(fileParts) {
  let totalSize = 0;
  let loadedSize = 0;
  let nextIndex = 0;
  const buffers = [];

  const worker = async () => {
    while (nextIndex < fileParts.length) {
      const index = nextIndex++;
      const part = fileParts[index];
      const response = await fetch(part);
      if (!response.ok) {
        throw new Error("Missing part: " + part);
      }

      const partSize = parseInt(response.headers.get('Content-Length') || '0', 10) || 0;
      totalSize += partSize || 0;
      const buffer = await response.arrayBuffer();
      const bytes = buffer.byteLength || partSize;
      buffers[index] = buffer;
      loadedSize += bytes;
      updateProgress('download', Math.floor((loadedSize / Math.max(totalSize, bytes)) * 100));
    }
  };

  return Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_DOWNLOADS, fileParts.length) }, () => worker())
  ).then(() => URL.createObjectURL(new Blob(buffers)));
}

function getParts(file, start, end) {
    let parts = [];
    for (let i = start; i <= end; i++) {
        parts.push(file + ".part" + i);
    }
    return parts;
}
Promise.all([
    mergeFiles(getParts("resources.zip", 1, parts))
]).then(([resources]) => {
    window.fetch = async function (url, ...args) {
        if (url.endsWith("resources.zip")) {
            return originalFetch(resources, ...args);
        } else {
            return originalFetch(url, ...args);
        }
    };
    wedone();
});