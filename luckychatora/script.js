// Add your pictures to the photos/ folder, then list them here.
const photos = [
  { file: "photo1.jpg", caption: "Caption 1" },
  { file: "photo2.jpg", caption: "Caption 2" },
  { file: "photo3.jpg", caption: "Caption 3" },
];

const gallery = document.getElementById("gallery");
photos.forEach(({ file, caption }) => {
  const figure = document.createElement("figure");
  const img = document.createElement("img");
  img.src = "photos/" + file;
  img.alt = caption;
  img.loading = "lazy";
  const cap = document.createElement("figcaption");
  cap.textContent = caption;
  figure.append(img, cap);
  gallery.append(figure);
});

document.getElementById("year").textContent = new Date().getFullYear();
