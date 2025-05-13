const express = require('express');
const db = require('../db');
const router = express.Router();

router.post('/search', (req, res) => {
  let { location, type, price, size } = req.body;


  

  const q2 = 'select locationID from location where town = ?'
  db.query(q2, [location], (err, data) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }


    location = data[0].locationID

      // const q = 'select * from property where locationID = ? and propertyType = ? and price = ? and size = ?';
  let q = 'select * from property where 1 = 1';
    let arr = []
  if (location) {
    q += ' and locationID = ?';
    arr.push(location)
  }
  if (type) {
    q += ' and propertyType = ?';
    arr.push(type)
  }
  if (price) {
    q += ' and price = ?';
    arr.push(price)
  }
  if (size) {
    q += ' and size = ?';
    arr.push(size)
  }

  q += ' order by propertyID desc';

  console.log(q);
  

  db.query(q, arr, (err, data) => {
    console.log(data);
    
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
    return res.status(200).json(data);
  })

    
  })
})


router.get('/all', (req, res) => {
  const query = `
    SELECT 
      p.propertyID,
      p.propertyType,
      p.price,
      p.size,
      p.description,
      l.city,
      l.town,
      i.imageURL
    FROM 
      property p
    JOIN 
      location l ON p.locationID = l.locationID
    LEFT JOIN 
      image i ON p.propertyID = i.propertyID
    WHERE 
      p.status = 'available'
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching properties:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }
    res.status(200).json(results); 
  });
});

router.post('/create', (req, res) => {
  const { propertyType, city, town, price, size, description } = req.body;
  const query = `
    INSERT INTO property (propertyType, city, town, price, size, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [propertyType, city, town, price, size, description], (err, results) => {
    if (err) {
      console.error('Error creating property:', err);
      return res.status(500).json({ error: 'Database query failed' });
    }

    res.status(200).json({ message: 'Property created successfully' });})
})





const insertProperty = (userId, locationID, propertyType, listingType, price, size, description, imageurl, res) => {
  // Create a new seller record for this specific property
  // The sellerType will be the listing type (sale or rent)
  const createSellerQuery = "INSERT INTO seller (UserID, sellerType) VALUES (?, ?)";
  db.query(createSellerQuery, [userId, listingType], (err, newSellerResult) => {
    if (err) {
      console.error("Error creating seller:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while creating seller" 
      });
    }
    
    const sellerId = newSellerResult.insertId;
    console.log(`Created new seller (ID: ${sellerId}) for user ${userId} with type ${listingType}`);
    
    
    insertPropertyWithSellerId(sellerId, locationID, propertyType, price, size, description, imageurl, res);
  });
};


function insertPropertyWithSellerId(sellerId, locationID, propertyType, price, size, description, imageurl, res) {
  const propertyQuery = "INSERT INTO property (sellerID, propertyType, locationID, price, size, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(propertyQuery, [sellerId, propertyType, locationID, price, size, description, "available"], (err, propertyResult) => {
    if (err) {
      console.error("Error inserting property:", err);
      return res.status(500).json({ 
        success: false, 
        message: "Database error while inserting property" 
      });
    }

    const propertyID = propertyResult.insertId; 

    
    const imageQuery = "INSERT INTO image (propertyID, imageURL) VALUES (?, ?)";
    db.query(imageQuery, [propertyID, imageurl], (err, imageResult) => {
      if (err) {
        console.error("Error inserting image:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Database error while inserting image" 
        });
      }

      
      res.status(201).json({ 
        success: true,
        message: "Property and image added successfully",
        propertyId: propertyID,
        sellerId: sellerId
      });
    });
  });
}


router.post('/register', async (req, res) => {
  const { userId, propertyType, listingType, city, town, price, size, description, imageurl } = req.body;
  let locationID;

  
  if (!userId) {
    return res.status(400).json({ 
      success: false,
      message: "User ID is required. Please log in first." 
    });
  }

  
  if (!listingType || (listingType !== 'sale' && listingType !== 'rent')) {
    return res.status(400).json({ 
      success: false,
      message: "Valid listing type (sale or rent) is required." 
    });
  }

  try {
    
    const locationQuery = "SELECT locationID FROM location WHERE city = ? AND town = ?";
    db.query(locationQuery, [city, town], (err, locationResult) => {
      if (err) {
        console.error("Error checking location:", err);
        return res.status(500).json({ 
          success: false, 
          message: "Database error while checking location" 
        });
      }

      if (locationResult.length > 0) {
        
        locationID = locationResult[0].locationID;
        insertProperty(userId, locationID, propertyType, listingType, price, size, description, imageurl, res);
      } else {
        
        const insertLocationQuery = "INSERT INTO location (city, town) VALUES (?, ?)";
        db.query(insertLocationQuery, [city, town], (err, result) => {
          if (err) {
            console.error("Error inserting location:", err);
            return res.status(500).json({ 
              success: false, 
              message: "Database error while creating location" 
            });
          }
          locationID = result.insertId; 
          insertProperty(userId, locationID, propertyType, listingType, price, size, description, imageurl, res);
        });
      }
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Unexpected error occurred" 
    });
  }
});

// Get property details by ID for purchase
router.get('/details/:propertyId', (req, res) => {
  const propertyId = req.params.propertyId;
  
  const query = `
    SELECT 
      p.propertyID,
      p.sellerID,
      p.propertyType,
      p.price,
      p.size,
      p.status,
      p.description,
      l.city,
      l.town,
      s.sellerType,
      i.imageURL
    FROM 
      property p
    JOIN 
      location l ON p.locationID = l.locationID
    JOIN
      seller s ON p.sellerID = s.sellerID
    LEFT JOIN 
      image i ON p.propertyID = i.propertyID
    WHERE 
      p.propertyID = ?
  `;

  db.query(query, [propertyId], (err, results) => {
    if (err) {
      console.error('Error fetching property details:', err);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    
    res.status(200).json({ success: true, data: results[0] });
  });
});

// Update property status
router.put('/status/:propertyId', (req, res) => {
  const propertyId = req.params.propertyId;
  const { status } = req.body;
  
  if (!status || !['available', 'under contract', 'sold'].includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid status. Must be "available", "under contract", or "sold"' 
    });
  }
  
  const query = "UPDATE property SET status = ? WHERE propertyID = ?";
  
  db.query(query, [status, propertyId], (err, result) => {
    if (err) {
      console.error('Error updating property status:', err);
      return res.status(500).json({ success: false, message: 'Database query failed' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    
    res.status(200).json({ success: true, message: 'Property status updated successfully' });
  });
});


router.post('/initiate-transaction', (req, res) => {
  const { propertyId, buyerId, sellerId } = req.body;
  
  console.log('Initiating transaction:', { propertyId, buyerId, sellerId });
  
  if (!propertyId || !buyerId || !sellerId) {
    return res.status(400).json({ 
      success: false, 
      message: 'PropertyID, BuyerID, and SellerID are required' 
    });
  }
  
  // First, check if a transaction already exists for this buyer and property
  const checkExistingTransactionQuery = `
    SELECT * FROM transaction 
    WHERE propertyID = ? AND buyerID = ?
  `;
  
  db.query(checkExistingTransactionQuery, [propertyId, buyerId], (err, existingTransactions) => {
    if (err) {
      console.error('Error checking existing transactions:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (existingTransactions.length > 0) {
      const existingTransaction = existingTransactions[0];
      
      return res.status(200).json({
        success: true,
        message: 'A transaction already exists for this property and buyer',
        data: {
          transactionId: existingTransaction.transactionID,
          propertyId: propertyId
        }
      });
    }
    
    // Check if the property is available
    const checkPropertyQuery = "SELECT status, price FROM property WHERE propertyID = ?";
    
    db.query(checkPropertyQuery, [propertyId], (err, propertyResults) => {
      if (err) {
        console.error('Error checking property:', err);
        return res.status(500).json({ success: false, message: 'Database error' });
      }
      
      if (propertyResults.length === 0) {
        return res.status(404).json({ success: false, message: 'Property not found' });
      }
      
      const property = propertyResults[0];
      
      if (property.status !== 'available') {
        return res.status(400).json({ 
          success: false, 
          message: `Property is not available for purchase. Current status: ${property.status}` 
        });
      }
      
      // Calculate commission (1% of property price)
      const price = parseFloat(property.price);
      const commission = price * 0.01;
      
      // Change property status to "unavailable"
      const updateStatusQuery = "UPDATE property SET status = 'unavailable' WHERE propertyID = ?";
      
      db.query(updateStatusQuery, [propertyId], (err, updateResult) => {
        if (err) {
          console.error('Error updating property status:', err);
          return res.status(500).json({ success: false, message: 'Database error' });
        }
        
        // Create transaction record
        try {
          // Use current date
          const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
          
          // First check the transaction table structure
          db.query('DESCRIBE transaction', (err, fields) => {
            if (err) {
              console.error('Error describing transaction table:', err);
              // Revert property status if we can't get the table structure
              db.query("UPDATE property SET status = 'available' WHERE propertyID = ?", [propertyId]);
              return res.status(500).json({ 
                success: false, 
                message: 'Database error when checking transaction table structure' 
              });
            }
            
            
            const fieldNames = fields.map(f => f.Field);
            console.log('Transaction table fields:', fieldNames);
            
            
            let createTransactionQuery = 'INSERT INTO transaction (';
            let valuePlaceholders = '';
            let values = [];
            
            // Add required fields
            if (fieldNames.includes('propertyID')) {
              createTransactionQuery += 'propertyID, ';
              valuePlaceholders += '?, ';
              values.push(propertyId);
            }
            
            if (fieldNames.includes('buyerID')) {
              createTransactionQuery += 'buyerID, ';
              valuePlaceholders += '?, ';
              values.push(buyerId);
            }
            
            if (fieldNames.includes('sellerID')) {
              createTransactionQuery += 'sellerID, ';
              valuePlaceholders += '?, ';
              values.push(sellerId);
            }
            
            if (fieldNames.includes('commission')) {
              createTransactionQuery += 'commission, ';
              valuePlaceholders += '?, ';
              values.push(commission);
            }
            
            if (fieldNames.includes('tdate')) {
              createTransactionQuery += 'tdate, ';
              valuePlaceholders += '?, ';
              values.push(currentDate);
            }
            
            if (fieldNames.includes('ttype')) {
              createTransactionQuery += 'ttype';
              valuePlaceholders += '?';
              values.push('sell'); 
            } else {
              
              createTransactionQuery = createTransactionQuery.replace(/, $/, '');
              valuePlaceholders = valuePlaceholders.replace(/, $/, '');
            }
            
            // Complete the query
            createTransactionQuery += ') VALUES (' + valuePlaceholders + ')';
            
            console.log('Creating transaction with query:', createTransactionQuery);
            console.log('Values:', values);
            
            db.query(createTransactionQuery, values, (err, transactionResult) => {
              if (err) {
                console.error('Error creating transaction:', err);
                // Revert property status if transaction creation fails
                db.query("UPDATE property SET status = 'available' WHERE propertyID = ?", [propertyId]);
                return res.status(500).json({ 
                  success: false, 
                  message: 'Database error when creating transaction' 
                });
              }
              
              const transactionId = transactionResult.insertId;
              
              res.status(201).json({
                success: true,
                message: 'Transaction initiated successfully',
                data: {
                  transactionId: transactionId,
                  propertyId: propertyId,
                  price: price,
                  commission: commission,
                  totalAmount: price + commission
                }
              });
            });
          });
        } catch (error) {
          console.error('Unexpected error:', error);
          
          db.query("UPDATE property SET status = 'available' WHERE propertyID = ?", [propertyId]);
          return res.status(500).json({ 
            success: false, 
            message: 'Unexpected error occurred' 
          });
        }
      });
    });
  });
});


router.post('/complete-transaction', (req, res) => {
  const { transactionId, paymentMethod, paymentDate } = req.body;
  
  console.log('Completing transaction:', { transactionId, paymentMethod, paymentDate });
  
  if (!transactionId || !paymentMethod) {
    return res.status(400).json({ 
      success: false, 
      message: 'TransactionID and payment method are required' 
    });
  }
  
  
  const checkTransactionQuery = `
    SELECT t.*, p.propertyID, p.price 
    FROM transaction t
    JOIN property p ON t.propertyID = p.propertyID
    WHERE t.transactionID = ?
  `;
  
  db.query(checkTransactionQuery, [transactionId], (err, transactionResults) => {
    if (err) {
      console.error('Error checking transaction:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    if (transactionResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    const transaction = transactionResults[0];
    const propertyId = transaction.propertyID;
    
    
    let totalAmount = parseFloat(transaction.price || 0);
    if (transaction.commission) {
      totalAmount += parseFloat(transaction.commission);
    }
    
    
    const actualPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    const formattedDate = actualPaymentDate.toISOString().slice(0, 10); // Format as YYYY-MM-DD
    
    
    db.query('DESCRIBE payment', (err, fields) => {
      if (err) {
        console.error('Error describing payment table:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Database error when checking payment table structure' 
        });
      }
      
      
      const fieldNames = fields.map(f => f.Field);
      console.log('Payment table fields:', fieldNames);
      
      
      let createPaymentQuery = 'INSERT INTO payment (';
      let valuePlaceholders = '';
      let values = [];
      
      
      if (fieldNames.includes('transactionID')) {
        createPaymentQuery += 'transactionID, ';
        valuePlaceholders += '?, ';
        values.push(transactionId);
      }
      
      if (fieldNames.includes('p_date')) {
        createPaymentQuery += 'p_date, ';
        valuePlaceholders += '?, ';
        values.push(formattedDate);
      }
      
      if (fieldNames.includes('p_method')) {
        createPaymentQuery += 'p_method, ';
        valuePlaceholders += '?, ';
        values.push(paymentMethod);
      }
      
      if (fieldNames.includes('amount')) {
        createPaymentQuery += 'amount';
        valuePlaceholders += '?';
        values.push(totalAmount);
      } else {
        
        createPaymentQuery = createPaymentQuery.replace(/, $/, '');
        valuePlaceholders = valuePlaceholders.replace(/, $/, '');
      }
      
      // Complete the query
      createPaymentQuery += ') VALUES (' + valuePlaceholders + ')';
      
      console.log('Creating payment with query:', createPaymentQuery);
      console.log('Values:', values);
      
      // Create payment record
      db.query(createPaymentQuery, values, (err, paymentResult) => {
        if (err) {
          console.error('Error creating payment:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Database error when creating payment' 
          });
        }
        
        // Update property status to "unavailable"
        const updatePropertyQuery = "UPDATE property SET status = 'unavailable' WHERE propertyID = ?";
        
        db.query(updatePropertyQuery, [propertyId], (err, updateResult) => {
          if (err) {
            console.error('Error updating property status:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
          }
          
          res.status(200).json({
            success: true,
            message: 'Transaction completed successfully',
            data: {
              transactionId: transactionId,
              paymentId: paymentResult.insertId,
              propertyId: propertyId,
              amount: totalAmount,
              date: formattedDate
            }
          });
        });
      });
    });
  });
});


router.get('/buyer-transactions/:buyerId', (req, res) => {
  const buyerId = req.params.buyerId;
  
  const query = `
    SELECT 
      t.transactionID,
      t.tdate,
      t.commission,
      p.propertyID,
      p.propertyType,
      p.price,
      p.status,
      p.description,
      l.city,
      l.town,
      s.sellerID,
      s.sellerType,
      i.imageURL
    FROM 
      transaction t
    JOIN 
      property p ON t.propertyID = p.propertyID
    JOIN 
      location l ON p.locationID = l.locationID
    JOIN
      seller s ON p.sellerID = s.sellerID
    LEFT JOIN 
      image i ON p.propertyID = i.propertyID
    LEFT JOIN
      payment py ON t.transactionID = py.transactionID
    WHERE 
      t.buyerID = ? AND py.paymentID IS NULL
  `;
  
  db.query(query, [buyerId], (err, results) => {
    if (err) {
      console.error('Error fetching buyer transactions:', err);
      return res.status(500).json({ success: false, message: 'Database error' });
    }
    
    res.status(200).json({
      success: true,
      data: results
    });
  });
});

module.exports = router;
