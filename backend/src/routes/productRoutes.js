import express from 'express';
import multer from 'multer';
import { uploadCSV, getAllProducts } from '../controllers/productController.js';

const router = express.Router();

// Multer config to save temporarily to 'uploads/' folder
const upload = multer({ dest: 'uploads/' });

// POST route for uploading the CSV
router.post('/upload', upload.single('file'), uploadCSV);

// GET route to fetch products for the dashboard
router.get('/', getAllProducts);

export default router;