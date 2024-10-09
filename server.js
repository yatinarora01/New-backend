const express = require('express');
const fs = require('fs');
const cors = require('cors'); // Import cors
const app = express();
const port = 3000;

app.use(cors()); // Enable CORS
app.use(express.json());

let productData = [];

// Load existing data from JSON file (if needed)
try {
    const data = fs.readFileSync('products.json');
    productData = JSON.parse(data);
} catch (err) {
    console.log('No existing data, starting fresh.');
}

// Add a new product (from billing.py)
app.post('/add-item', (req, res) => {
    const product = req.body;
    
    // Check if the product is already in the list
    const existingProduct = productData.find(p => p.name.toLowerCase() === product.name.toLowerCase());
    
    if (existingProduct) {
        return res.status(400).json({ message: 'Product already scanned. Please delete it first.' });
    }

    productData.push(product);

    // Save data to a JSON file
    fs.writeFileSync('products.json', JSON.stringify(productData, null, 2));

    res.status(200).json({ message: 'Product added successfully', product });
});

// Get all products
app.get('/products', (req, res) => {
    res.json(productData);
});

// Delete a product
app.delete('/delete-item/:name', (req, res) => {
    const productName = req.params.name.toLowerCase();
    productData = productData.filter(p => p.name.toLowerCase() !== productName);

    // Save updated data to a JSON file
    fs.writeFileSync('products.json', JSON.stringify(productData, null, 2));

    res.status(200).json({ message: 'Product deleted successfully' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
