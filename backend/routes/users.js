const router = require('express').Router();
const db = require('../db');


router.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log('Login attempt:', email);

    if (!email || !password) {
        return res.status(400).json({ 
            success: false,
            message: "Email and password are required" 
        });
    }

    
    const query = "SELECT * FROM user WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                success: false, 
                message: "Server error" 
            });
        }

        if (results.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: "Invalid email or password" 
            });
        }

        const user = results[0];
        console.log('Login successful for user:', user.UserID);
        
        
        const session = {
            userId: user.UserID,
            email: user.email,
            loggedIn: true,
            loginTime: new Date()
        };

        
        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.UserID,
                name: user.name,
                email: user.email,
                phone: user.ContactNumber
            },
            session: session
        });
    });
});


router.post('/register', (req, res) => {
    const { name, email, password, phone } = req.body;
    
    if (!name || !email || !password || !phone) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    
    db.query("SELECT * FROM user WHERE email = ?", [email], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (results.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email already registered"
            });
        }

        // Insert new user
        const query = "INSERT INTO user (name, email, password, ContactNumber) VALUES (?, ?, ?, ?)";
        db.query(query, [name, email, password, phone], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to register user"
                });
            }

            res.status(201).json({
                success: true,
                message: "User registered successfully",
                userId: result.insertId
            });
        });
    });
});


router.get('/profile/:userId', (req, res) => {
    const userId = req.params.userId;

    
    const userQuery = "SELECT UserID, name, email, ContactNumber FROM user WHERE UserID = ?";
    
    db.query(userQuery, [userId], (err, userResults) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        if (userResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const user = userResults[0];
        const profileData = {
            user: user,
            sellers: [], 
            buyer: null,
            properties: [],
            salesTransactions: [],
            purchaseTransactions: []
        };

       
        const sellerQuery = "SELECT * FROM seller WHERE UserID = ?";
        db.query(sellerQuery, [userId], (err, sellerResults) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: "Database error"
                });
            }

            if (sellerResults.length > 0) {
                // Store all seller records
                profileData.sellers = sellerResults;
                
                // Get all seller IDs for this user
                const sellerIds = sellerResults.map(seller => seller.sellerID);
                
                // Get properties listed by any of the user's seller IDs
                const propertiesQuery = `
                    SELECT p.*, l.city, l.town, s.sellerType
                    FROM property p 
                    JOIN location l ON p.locationID = l.locationID 
                    JOIN seller s ON p.sellerID = s.sellerID
                    WHERE p.sellerID IN (?)
                `;
                
                db.query(propertiesQuery, [sellerIds], (err, propertiesResults) => {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).json({
                            success: false,
                            message: "Database error"
                        });
                    }

                    profileData.properties = propertiesResults;

                    // Get sales transactions for all seller IDs
                    const salesQuery = `
                        SELECT t.*, p.propertyType, p.price, p.status, s.sellerType
                        FROM transaction t
                        JOIN property p ON t.propertyID = p.propertyID
                        JOIN seller s ON t.sellerID = s.sellerID
                        WHERE t.sellerID IN (?)
                    `;
                    
                    db.query(salesQuery, [sellerIds], (err, salesResults) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                success: false,
                                message: "Database error"
                            });
                        }

                        profileData.salesTransactions = salesResults;
                        checkBuyerAndComplete();
                    });
                });
            } else {
                checkBuyerAndComplete();
            }
        });

        
        function checkBuyerAndComplete() {
            const buyerQuery = "SELECT * FROM buyer WHERE UserID = ?";
            db.query(buyerQuery, [userId], (err, buyerResults) => {
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({
                        success: false,
                        message: "Database error"
                    });
                }

                if (buyerResults.length > 0) {
                    
                    profileData.buyers = buyerResults;
                    
                    
                    profileData.buyer = buyerResults[0];
                    
                    
                    const buyerIds = buyerResults.map(buyer => buyer.buyerID);
                    
                    
                    const purchaseQuery = `
                        SELECT t.*, p.propertyType, p.price, p.status
                        FROM transaction t
                        JOIN property p ON t.propertyID = p.propertyID
                        WHERE t.buyerID IN (?)
                    `;
                    
                    db.query(purchaseQuery, [buyerIds], (err, purchaseResults) => {
                        if (err) {
                            console.error('Database error:', err);
                            return res.status(500).json({
                                success: false,
                                message: "Database error"
                            });
                        }

                        profileData.purchaseTransactions = purchaseResults;
                        res.status(200).json({
                            success: true,
                            data: profileData
                        });
                    });
                } else {
                    
                    profileData.buyers = [];
                    profileData.buyer = null;
                    
                    res.status(200).json({
                        success: true,
                        data: profileData
                    });
                }
            });
        }
    });
});


router.get('/session/:userId', (req, res) => {
    const userId = req.params.userId;
    
    
    db.query("SELECT UserID FROM user WHERE UserID = ?", [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({
                success: false,
                isLoggedIn: false,
                message: "Session invalid or expired"
            });
        }
        
        res.status(200).json({
            success: true,
            isLoggedIn: true,
            userId: userId
        });
    });
});

// Logout endpoint
router.post('/logout', (req, res) => {
    
    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
});

// Create buyer record for a user
router.post('/create-buyer', (req, res) => {
    // Use 'buy' as default value since 'standard' is not in the enum
    const { userId, buyerType = 'buy' } = req.body;
    
    console.log('Creating buyer record with:', { userId, buyerType });
    
    if (!userId) {
        console.log('No userId provided in request');
        return res.status(400).json({
            success: false,
            message: "User ID is required"
        });
    }

    // Validate buyer type against allowed enum values
    if (buyerType !== 'buy' && buyerType !== 'tenant') {
        console.log('Invalid buyer type:', buyerType);
        return res.status(400).json({
            success: false,
            message: "buyerType must be either 'buy' or 'tenant'"
        });
    }

    // Check if user exists
    console.log('Checking if user exists:', userId);
    db.query("SELECT * FROM user WHERE UserID = ?", [userId], (err, userResults) => {
        if (err) {
            console.error('Database error when checking user:', err);
            return res.status(500).json({
                success: false,
                message: "Database error when checking user"
            });
        }

        console.log('User check results:', userResults);
        if (userResults.length === 0) {
            console.log('User not found with ID:', userId);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        
        console.log('Creating new buyer record for user:', userId, 'with type:', buyerType);
        const query = "INSERT INTO buyer (UserID, buyerType) VALUES (?, ?)";
        db.query(query, [userId, buyerType], (err, result) => {
            if (err) {
                console.error('Error creating buyer record:', err);
                return res.status(500).json({
                    success: false,
                    message: "Database error when creating buyer"
                });
            }

            console.log('Buyer record created successfully:', result);
            res.status(201).json({
                success: true,
                message: "Buyer record created successfully",
                buyerId: result.insertId
            });
        });
    });
});

module.exports = router;