const input = document.querySelector("input");
const preview = document.querySelector(".preview");

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
    if (validFileType(selectedFile)) {
      info.textContent = `File name: ${
        selectedFile.name
      }, size: ${returnFileSize(selectedFile.size)}.`;
      const image = document.createElement("img");
      image.src = URL.createObjectURL(selectedFile);
      preview.appendChild(info);
      preview.appendChild(image);
    } else {
      info.textContent = `File name ${selectedFile.name}: Not a valid file type.`;
      preview.appendChild(info);
    }
  }
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
