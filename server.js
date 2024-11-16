// server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx'); // For generating Excel files
const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for JSON file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

// Route to handle JSON file upload and conversion to Excel
app.post('/upload', upload.single('json'), (req, res) => {
    try {
        const jsonUpload = req.file;

        if (!jsonUpload) {
            return res.json({ success: false, message: "JSON file is required." });
        }

        // Read the uploaded JSON file
        const jsonFilePath = path.join(__dirname, 'uploads', jsonUpload.filename);
        const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));

        // Generate Excel file from JSON data using xlsx library
        const ws = xlsx.utils.json_to_sheet(jsonData);
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

        // Generate file path for the Excel file
        const excelFilePath = path.join(__dirname, 'downloads', `${Date.now()}-output.xlsx`);

        // Ensure the downloads directory exists
        if (!fs.existsSync(path.dirname(excelFilePath))) {
            fs.mkdirSync(path.dirname(excelFilePath), { recursive: true });
        }

        // Write the Excel file to disk
        xlsx.writeFile(wb, excelFilePath);

        // Respond with the success message and the download URL
        res.json({
            success: true,
            message: "File processed successfully",
            downloadUrl: `/downloads/${path.basename(excelFilePath)}` // Provide correct download URL
        });

    } catch (error) {
        console.error("Error processing JSON file:", error);
        res.status(500).json({ success: false, message: "Server error processing JSON file." });
    }
});

// Serve the generated Excel files from the "downloads" directory
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
