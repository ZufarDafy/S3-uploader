require("dotenv").config();
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const cors = require("cors");

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Konfigurasi AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

app.use(cors());
app.use(express.static("public"));

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  try {
    await s3.upload(params).promise();
    res.status(200).send("File uploaded successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// List files endpoint
app.get("/files", async (req, res) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents.map((file) => ({
      name: file.Key,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
    }));
    res.json(files);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Endpoint untuk mendapatkan detail file
app.get("/file-details", async (req, res) => {
  try {
    const data = await s3
      .listObjectsV2({
        Bucket: process.env.S3_BUCKET_NAME,
      })
      .promise();

    const files = data.Contents.map((file) => ({
      name: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
      url: `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`,
    }));

    res.json(files);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Delete file endpoint
app.delete("/files/:filename", async (req, res) => {
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: req.params.filename,
  };

  try {
    await s3.deleteObject(params).promise();
    res
      .status(200)
      .json({ success: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
