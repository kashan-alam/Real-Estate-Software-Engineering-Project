
const express = require('express'); 
const mysql = require('mysql2');  
const bodyParser = require('body-parser'); 
 require('dotenv').config();
 const cors = require('cors');
 require('./db')


const app = express();
app.use(express.json());
app.use(cors(
 
));

// Middleware
app.use(bodyParser.json()); // Parse JSON request bodies
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

app.use('/users', require('./routes/users'))
app.use('/properties', require('./routes/properties'))


app.get('/', (req, res) => {
  res.send('Welcome to the Real Estate Management System API!');
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


