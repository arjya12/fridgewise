const fs = require("fs");
const path = require("path");
const https = require("https");

// Create directory if it doesn't exist
const iconDir = path.join(__dirname, "../assets/images/realistic-food-icons");
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// URL for a proper bread icon - using a different URL
const breadIconUrl = "https://cdn-icons-png.flaticon.com/512/3082/3082034.png";
const filePath = path.join(iconDir, "bread.png");

// Function to download a file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https
      .get(url, (response) => {
        response.pipe(file);

        file.on("finish", () => {
          file.close();
          console.log(`Downloaded: ${filePath}`);
          resolve();
        });

        file.on("error", (err) => {
          fs.unlink(filePath, () => {}); // Delete the file if there was an error
          reject(err);
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {}); // Delete the file if there was an error
        reject(err);
      });
  });
}

// First, delete the existing file
if (fs.existsSync(filePath)) {
  fs.unlinkSync(filePath);
  console.log(`Deleted existing file: ${filePath}`);
}

// Download the new bread icon
downloadFile(breadIconUrl, filePath)
  .then(() => {
    console.log("Bread icon replaced successfully!");
  })
  .catch((error) => {
    console.error("Error downloading bread icon:", error);
  });
