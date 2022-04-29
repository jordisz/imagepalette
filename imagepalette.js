const input = document.querySelector("input");
const preview = document.querySelector(".img-info");
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

function updateImageDisplay() {
  if (preview.firstChild) {
    preview.removeChild(preview.firstChild);
  }
  const selectedFile = input.files[0];
  if (input.files.length === 0) {
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

function showImage(image) {
  const img = new Image();
  const reader = new FileReader();
  reader.readAsDataURL(image);
  reader.onload = (e) => {
    if (e.target.readyState == FileReader.DONE) {
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
        console.log(imageData);

        console.log(getImgRgb(imageData.data));
      };
    }
  };
}

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

function returnFileSize(number) {
  if (number < 1024) {
    return number + "bytes";
  } else if (number >= 1024 && number < 1048576) {
    return (number / 1024).toFixed(1) + "KB";
  } else if (number >= 1048576) {
    return (number / 1048576).toFixed(1) + "MB";
  }
}

function validFileType(file) {
  return fileTypes.includes(file.type);
}
