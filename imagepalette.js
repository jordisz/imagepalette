const input = document.querySelector("input");
const dropArea = document.querySelector(".drop-area");
const preview = document.querySelector(".img-info");
const paletteContainer = document.querySelector(".palette");
const canvas = document.querySelector(".canvas");
const context = canvas.getContext("2d");
// Valid image file types -> https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
const fileTypes = [
  "image/apng",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/pjpeg",
  "image/png",
  "image/svg+xml",
  "image/tiff",
  "image/webp",
  "image/x-icon",
];

input.addEventListener("change", updateImageDisplay);

// drag and drop functionality from this article -> https://www.smashingmagazine.com/2018/01/drag-drop-file-uploader-vanilla-js/
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(event) {
  event.preventDefault();
  event.stopPropagation();
}

["dragenter", "dragover"].forEach((eventName) => {
  dropArea.addEventListener(eventName, highlight, false);
});
["dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(event) {
  dropArea.classList.add("highlight");
}
function unhighlight(event) {
  dropArea.classList.remove("highlight");
}

dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(event) {
  const dt = event.dataTransfer;
  const files = dt.files;

  updateImageDisplay(files);
}

// If uploaded file is valid, show image and info
function updateImageDisplay(dropped) {
  if (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }
  const selectedFile = dropped[0] || input.files[0];
  if (!dropped && input.files.length === 0) {
    const info = document.createElement("p");
    info.textContent = "No files selected";
    preview.appendChild(info);
  } else {
    const info = document.createElement("p");
    info.classList.add("multiline-info");
    if (validFileType(selectedFile)) {
      info.textContent = `File name: ${
        selectedFile.name
      } \r\nFile size: ${returnFileSize(selectedFile.size)}.`;
      showImage(selectedFile);
      preview.appendChild(info);
    } else {
      info.textContent = `File name ${selectedFile.name}: Not a valid file type.`;
      preview.appendChild(info);
    }
  }
}

//Show image in canvas, and extract pixel colors array
function showImage(image) {
  const img = new Image();
  const reader = new FileReader();
  reader.readAsDataURL(image);
  reader.onload = (e) => {
    if (e.target.readyState == FileReader.DONE) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      img.src = reader.result;
      // now we have to wait for the image to load ;)
      img.onload = () => {
        const hRatio = canvas.width / img.width;
        const vRatio = canvas.height / img.height;
        const ratio = Math.min(hRatio, vRatio);
        const centerShift_x = (canvas.width - img.width * ratio) / 2;
        const centerShift_y = (canvas.height - img.height * ratio) / 2;
        context.drawImage(
          img,
          0,
          0,
          img.width,
          img.height,
          centerShift_x,
          centerShift_y,
          img.width * ratio,
          img.height * ratio
        );
        const imageData = context.getImageData(
          centerShift_x,
          centerShift_y,
          img.width * ratio,
          img.height * ratio
        );
        const rgbValues = getImgRgb(imageData.data);
        const paletteRGB = quantization(rgbValues, 0); // 16 colors (2^MAX_DEPTH); 0 = initial depth (will increase with every recursion until it reaches MAX_DEPTH)
        createPalette(orderByLuminance(paletteRGB));
      };
    }
  };
}

function createPalette(RGBPalette) {
  paletteContainer.innerHTML = "";
  for (let i = 0; i < RGBPalette.length; i++) {
    const hexColor = rgbToHex(RGBPalette[i]);
    const colorDiv = document.createElement("div");
    colorDiv.style.background = hexColor;
    colorDiv.appendChild(document.createTextNode(hexColor));
    paletteContainer.appendChild(colorDiv);
  }
}

function orderByLuminance(rgbValues) {
  return rgbValues.sort((p1, p2) => {
    return calculateLuminance(p2) - calculateLuminance(p1);
  });
}

function calculateLuminance(pixel) {
  return 0.2126 * pixel.r + 0.7152 * pixel.g + 0.0722 * pixel.b;
}

function returnFileSize(number) {
  if (number < 1024) {
    return number + "bytes";
  } else if (number >= 1024 && number < 1048576) {
    return (number / 1024).toFixed(1) + "KB";
  } else if (number >= 1048576) {
    return (number / 1048576).toFixed(1) + "MB";
  }
}

function rgbToHex(pixel) {
  const componentToHex = (c) => {
    const hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  };
  return (
    "#" +
    componentToHex(pixel.r) +
    componentToHex(pixel.g) +
    componentToHex(pixel.b)
  ).toUpperCase();
}

function validFileType(file) {
  return fileTypes.includes(file.type);
}

// ** Quantization / Palette creation functions **

function findBiggestColorRange(pixels) {
  let rMin = Number.MAX_VALUE;
  let gMin = Number.MAX_VALUE;
  let bMin = Number.MAX_VALUE;

  let rMax = Number.MIN_VALUE;
  let gMax = Number.MIN_VALUE;
  let bMax = Number.MIN_VALUE;

  pixels.forEach((pixel) => {
    rMin = Math.min(rMin, pixel.r);
    gMin = Math.min(gMin, pixel.g);
    bMin = Math.min(bMin, pixel.b);

    rMax = Math.max(rMax, pixel.r);
    gMax = Math.max(gMax, pixel.g);
    bMax = Math.max(bMax, pixel.b);
  });

  const rRange = rMax - rMin;
  const gRange = gMax - gMin;
  const bRange = bMax - bMin;

  const biggestRange = Math.max(rRange, gRange, bRange);
  if (biggestRange === rRange) {
    return "r";
  } else if (biggestRange === gRange) {
    return "g";
  } else return "b";
}

// Ignore pixel alpha content and create array of objects {r:x, g:y, b:z}
function getImgRgb(imageData) {
  const rgbValues = [];
  for (let i = 0; i < imageData.length; i += 4) {
    const rgb = {
      r: imageData[i],
      g: imageData[i + 1],
      b: imageData[i + 2],
    };
    rgbValues.push(rgb);
  }
  return rgbValues;
}

function quantization(pixels, depth) {
  const MAX_DEPTH = 4;
  if (depth === MAX_DEPTH || pixels.length === 0) {
    const color = pixels.reduce(
      (prev, cur) => {
        prev.r += cur.r;
        prev.g += cur.g;
        prev.b += cur.b;

        return prev;
      },
      {
        r: 0,
        g: 0,
        b: 0,
      }
    );
    color.r = Math.round(color.r / pixels.length);
    color.g = Math.round(color.g / pixels.length);
    color.b = Math.round(color.b / pixels.length);
    return [color];
  }

  const dominantComponent = findBiggestColorRange(pixels);
  pixels.sort((p1, p2) => {
    return p1[dominantComponent] - p2[dominantComponent];
  });
  const mid = pixels.length / 2;
  return [
    ...quantization(pixels.slice(0, mid), depth + 1),
    ...quantization(pixels.slice(mid + 1), depth + 1),
  ];
}
