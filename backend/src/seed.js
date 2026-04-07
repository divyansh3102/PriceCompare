import fs from 'fs';
import csv from 'csv-parser';
import db from './db.js'; // Connects to your existing SQLite setup

const results = [];
const csvFilePath = './formatted_products.csv'; 

console.log('⏳ Reading CSV file...');

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(`📊 Found ${results.length} products. Inserting into database...`);
    
    // Prepare the SQL insert statement
    const stmt = db.prepare(`
      INSERT INTO products (name, price, category, city, status, image) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    let insertedCount = 0;

    // Loop through the CSV and insert each row
    results.forEach((row) => {
      try {
        stmt.run(
          row.name, 
          parseInt(row.price) || 0, 
          row.category || 'General', 
          row.city || 'Jamshedpur', 
          'approved', // We set status to 'approved' so it shows on frontend instantly
          row.image || 'https://via.placeholder.com/400'
        );
        insertedCount++;
      } catch (err) {
        console.error("Error inserting row:", err.message);
      }
    });

    console.log(`✅ Success! Added ${insertedCount} products to the SQLite database.`);
    console.log(`You can now start your server and view them on the frontend!`);
  });