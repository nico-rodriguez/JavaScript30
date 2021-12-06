const video = document.querySelector('.player');
const canvas = document.querySelector('.photo');
const ctx = canvas.getContext('2d');
const strip = document.querySelector('.strip');
const snap = document.querySelector('.snap');
const effects = document.querySelectorAll('input[type="checkbox"]');


const FRAME_RATE = 16;

function getVideo() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
  .then(localMediaStream => {
    video.srcObject = localMediaStream;
    video.play();
  })
  .catch(err => {
    console.error(err);
    console.error('Camera access needed! Either there\'s no camera or you denied its access.');
  });
}

function paintToCanvas() {
  const width = video.videoWidth;
  const height = video.videoHeight;

  canvas.width = width;
  canvas.height = height;

  return setInterval(() => {
    ctx.drawImage(video, 0, 0, width, height);
    // take pixels out
    let pixels = ctx.getImageData(0, 0, width, height);
    // apply the effect
    pixels = applyEffects(pixels);
    // put the pixels back
    ctx.putImageData(pixels, 0, 0);
  }, 1000 / FRAME_RATE)
}

function takePhoto() {
  // play the sound
  snap.currentTime = 0;
  snap.play();

  // take data out of the canvas
  const data = canvas.toDataURL('image/jpeg');
  const link = document.createElement('a');
  link.href = data;
  link.setAttribute('download', 'handsome');
  link.innerHTML = `<img src="${data}" alt="Handsome man"/>`;

  strip.insertBefore(link, strip.firstChild);
}

// Filters
function redEffect(pixels) {
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i] += 50;      // red
    pixels.data[i + 1] -= 50;   // green
    pixels.data[i + 2] *= 0.5;  // blue
  }
  return pixels;
}

function rgbSplit(pixels) {
  for (let i = 0; i < pixels.data.length; i += 4) {
    pixels.data[i - 150] = pixels.data[i];      // red
    pixels.data[i + 500] = pixels.data[i + 1];  // green
    pixels.data[i - 550] = pixels.data[i + 2];  // blue
  }
  return pixels;
}

function greenScreen(pixels) {
  const levels = {};
  document.querySelectorAll('.rgb input').forEach(input => {
    levels[input.name] = input.value;
  });

  for (let i = 0; i < pixels.data.length; i += 4) {
    const red   = pixels.data[i];
    const green = pixels.data[i + 1];
    const blue  = pixels.data[i + 2];
    
    if (red >= levels.rmin
        && green >= levels.gmin
        && blue >= levels.bmin
        && red <= levels.rmax
        && green <= levels.gmax
        && blue <= levels.bmax) {
        pixels.data[i + 3] = 0;
      }
  }
  return pixels;
}

function matrixEffect(alpha = 0.2) {
  ctx.globalAlpha = alpha;
}

function applyEffects(pixels) {
  return Array.from(effects)
  .filter(input => input.checked)
  .reduce((currentPixels, input) => {
    const name = input.name;

    switch (name) {
      case 'red-effect':
        return redEffect(currentPixels);
      case 'rgb-split':
        return rgbSplit(currentPixels);
      case 'green-screen':
        return greenScreen(currentPixels);
      case 'ghost':
        matrixEffect(0.1);
      default:
        return currentPixels;
    }
  }, pixels);
}

getVideo();

video.addEventListener('canplay', paintToCanvas);