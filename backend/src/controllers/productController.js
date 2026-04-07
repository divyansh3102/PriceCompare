import fs from 'fs';
import csv from 'csv-parser';
import db from '../db.js'; // Adjust path if your db.js is located elsewhere

export const uploadCSV = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  const results = [];
  
  // Read the uploaded file
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      try {
        const stmt = db.prepare('INSERT INTO products (name, price, category, city, status, image) VALUES (?, ?, ?, ?, ?, ?)');
        
        let insertedCount = 0;
        
        // Loop through CSV data and insert into your sql.js database
        results.forEach((row) => {
          stmt.run(
            row.name, 
            row.price ? parseInt(row.price) : 0, 
            row.category || 'General', 
            row.city || 'Jamshedpur', 
            row.status || 'active', 
            row.image || 'https://via.placeholder.com/400x200?text=No+Image'
          );
          insertedCount++;
        });
        
        // Delete the temporary file from 'uploads' folder
        fs.unlinkSync(req.file.path); 
        
        res.status(200).json({ 
          message: 'Products imported successfully!', 
          count: insertedCount 
        });
      } catch (error) {
        console.error("Database insert error:", error);
        res.status(500).json({ error: 'Error saving to database.' });
      }
    })
    .on('error', (error) => {
      console.error("CSV Parsing error:", error);
      res.status(500).json({ error: 'Error parsing CSV file' });
    });
};

export const getAllProducts = (req, res) => {
  try {
    // Fetch all products using your custom db.all() wrapper
    const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    res.status(200).json(rows);
  } catch (error) {
    console.error("Database fetch error:", error);
    res.status(500).json({ error: error.message });
  }
};