const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const EventEmitter = require('events');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Ensure this is present to load environment variables
const app = express();
const port = process.env.PORT || 3000; // Use the port from environment variables

app.use(cors());
app.use(bodyParser.json());

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the Autofill Shopping Cart API!'); // Add a simple welcome message
});

let products = [];

// Event emitter for sending updates
const productUpdateEmitter = new EventEmitter();

app.post('/add-item', (req, res) => {
    const { name, price, weight } = req.body;
    const existingProduct = products.find(product => product.name === name);
    if (existingProduct) {
        return res.status(400).json({ message: 'Product already exists in the cart.' });
    }

    const newProduct = { name, price, weight };
    products.push(newProduct);
    
    // Emit an event to notify about the new product
    productUpdateEmitter.emit('productUpdated', products);

    return res.status(200).json({ message: 'Product added successfully.', products });
});

app.post('/delete-item', (req, res) => {
    const { name } = req.body;
    const productIndex = products.findIndex(product => product.name === name);

    if (productIndex !== -1) {
        products.splice(productIndex, 1);
        productUpdateEmitter.emit('productUpdated', products);
        return res.status(200).json({ message: 'Product deleted successfully.', products });
    }

    return res.status(404).json({ message: 'Product not found.' });
});

// Endpoint to fetch all items
app.get('/items', (req, res) => {
    res.json(products);
});

// Event source for real-time updates
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send current product list on connection
    res.write(`data: ${JSON.stringify(products)}\n\n`);

    const onProductUpdated = (updatedProducts) => {
        res.write(`data: ${JSON.stringify(updatedProducts)}\n\n`);
    };

    productUpdateEmitter.on('productUpdated', onProductUpdated);

    req.on('close', () => {
        productUpdateEmitter.off('productUpdated', onProductUpdated);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
