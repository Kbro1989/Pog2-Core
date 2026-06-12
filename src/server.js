const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const BASE_DIR = path.join(__dirname, '..'); // Root directory

// Middleware to list contents
app.get('/list', (req, res) => {
    const dir = req.query.path ? path.join(BASE_DIR, req.query.path) : BASE_DIR;
    
    fs.readdir(dir, { withFileTypes: true }, (err, files) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const fileList = files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory()
        }));
        
        res.json(fileList);
    });
});

// Middleware to serve file contents
app.get('/serve', (req, res) => {
    const filePath = path.join(BASE_DIR, req.query.path);
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: err.message });
        res.send(data);
    });
});

const getAllFiles = (dir, fileList = []) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.name === '.git' || file.name === 'node_modules') continue;
        const filePath = path.join(dir, file.name);
        const relativePath = path.relative(BASE_DIR, filePath);
        if (file.isDirectory()) {
            fileList.push({ path: relativePath, type: 'directory' });
            getAllFiles(filePath, fileList);
        } else {
            fileList.push({ path: relativePath, type: 'file' });
        }
    }
    return fileList;
};

app.get('/export/csv', (req, res) => {
    const allFiles = getAllFiles(BASE_DIR);
    let csv = 'path,type\n';
    for (const item of allFiles) {
        csv += `"${item.path.replace(/"/g, '""')}","${item.type}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="directory_structure.csv"');
    res.send(csv);
});

app.listen(PORT, () => {
    console.log(`Parsing window active at http://localhost:${PORT}`);
});
