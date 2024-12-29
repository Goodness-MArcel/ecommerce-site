import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import bcrypt from 'bcrypt';  
import { fileURLToPath } from "url";
import { db, app ,} from './DB.js';
import { addProduct  , AdminPhoto ,AdminDisplyProducts } from './Product/Addproduct.js';
import { 
    getDiscountedProducts,
    displayDiscountedProductsAtfrontEnd,
    disPlayAllProductForAdmin,
} from './Admin/AdminController.js';
import { 
    addToCartController ,
    getCartPage, 
    removeFromCartController,
    clearCartController ,
    checkout
 } from './cart/cartRoute.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3001;

const upload = multer({ dest: 'uploads/profile-pictures/' });
// Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

// Home route
app.get('/', (req, res) => {
    const user = req.session.user;
    const cart = req.session.cart || [];
    console.log(user);
    res.render('index', { 
        title: 'Home',
        page: 'index',
        cart: cart,
        // // totalItems: totalItems,
        // uniqueItems: req.session.cart.items.length,
        isLoggedIn: !!user
    });
});

app.get('/shipping', (req , res) => {
    res.render('shipping' ,{
        title: 'shipping',
        page: 'shipping',
    })
});

// searchproduct
app.get('/search-products', async (req, res) => {
    const searchTerm = req.query.query;

    if (!searchTerm) {
        return res.status(400).json({ error: 'No search term provided' });
    }

    try {
        const products = await db.query(`
            SELECT product_id, name
            FROM products
            WHERE name ILIKE $1`, [`%${searchTerm}%`]
        );

        res.json({ products: products.rows });
    } catch (error) {
        console.error('Error searching for products:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// serve products when clicked

app.get('/product/:product_id', async (req, res) => {
    const productId = parseInt(req.params.product_id);

    if (isNaN(productId)) {
        return res.status(400).send('Invalid product ID');
    }

    try {
        // Retrieve the main product with its image details
        const productResult = await db.query(`
            SELECT p.*, pi.image_url
            FROM products p
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            WHERE p.product_id = $1`, [productId]
        );

        // If no product is found, return a 404 error
        if (productResult.rows.length === 0) {
            return res.status(404).send('Product not found');
        }

        // Normalize image URLs
        const product = productResult.rows[0];
        if (product.image_url) {
            product.image_url = product.image_url.replace(/\\/g, '/');
        }

        // Fetch related products in the same category
        const relatedProductsResult = await db.query(`
            SELECT p.*, pi.image_url
            FROM products p
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            WHERE p.category_id = $1 AND p.product_id != $2
            `, [product.category_id, productId]
        );

        // Normalize image paths for related products
        const relatedProducts = relatedProductsResult.rows.map(rProduct => {
            if (rProduct.image_url) {
                rProduct.image_url = rProduct.image_url.replace(/\\/g, '/');
            }
            return rProduct;
        });
         console.log(product)
        // Render product details along with related products
        res.render('allproducts', { product, relatedProducts });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Server Error');
    }
});




// Registration route
app.post('/register', async (req, res) => {
    const { fname, lname, email, password } = req.body;

    if (!password) {
        return res.status(400).json({ error: 'Password is required' });
    }
    
    try {
        console.log(req.body);
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (first_name, last_name, email, password, role_id) VALUES ($1, $2, $3, $4, (SELECT role_id FROM roles WHERE role_name = $5))',
            [fname, lname, email, hashedPassword, 'customer']
        );

        req.session.user = { firstName: fname, email: email };
        return res.status(200).json({ success: true, message: 'Registration successful' });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error. Please try again.' });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
            console.log('User not found');
            return res.status(400).json({ message: 'User not found' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log('Invalid password');
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        req.session.user = { 
            id: user.user_id,        // Make sure this is user.user_id from the database
            firstName: user.first_name,
            email: user.email,
            role: user.role_id
        };
        console.log(req.session)
        return res.json({ success: true });

    } catch (err) {
        console.error('Server error during login:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// Wishlist route
app.get('/wishlist', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    res.send('wishlist');
});

// Logout route
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        res.redirect('/');
    });
});
// ================ dashboard page routes starts here =======================

// Admin panel route
app.get('/admin-panel', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const [profileResult, productCount, revenueResult, customerCount] = await Promise.all([
        db.query('SELECT profile_picture FROM roles WHERE role_id = $1', [req.session.user.id]),
        db.query('SELECT COUNT(*) FROM products'),
        db.query('SELECT SUM(price) as total_revenue FROM products'),
        db.query('SELECT COUNT(*) FROM users WHERE role_id = 2')
    ]);
    
    const profilePicture = profileResult.rows[0]?.profile_picture || 'https://via.placeholder.com/150';
    const totalProducts = parseInt(productCount.rows[0].count);
    const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue) || 0;
    const totalCustomers = parseInt(customerCount.rows[0].count);
    
    res.render('adminPages/admin-panel', {
        title: 'Admin Panel',
        page: 'admin-panel',
        isLoggedIn: true,
        user: {
            ...req.session.user,
            profile_picture: profilePicture
        },
        totalProducts,
        totalRevenue,
        totalCustomers
    });
});
// Admin products routes

app.get('/adminproductsPage', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        let query = `
            SELECT 
                p.product_id,
                p.name,
                p.description,
                p.price,
                p.stock_quantity,
                pi.image_url
            FROM products p
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            WHERE p.name ILIKE $1 OR p.description ILIKE $1
            ORDER BY p.created_at DESC
            LIMIT $2 OFFSET $3
        `;

        let countQuery = `
            SELECT COUNT(*) 
            FROM products 
            WHERE name ILIKE $1 OR description ILIKE $1
        `;

        const searchPattern = `%${search}%`;

        const [productsResult, countResult] = await Promise.all([
            db.query(query, [searchPattern, limit, offset]),
            db.query(countQuery, [searchPattern])
        ]);

        const totalProducts = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);

        res.render('adminPages/products', {
            products: productsResult.rows,
            search: search,
            totalProducts,
            pagination: {
                currentPage: page,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error(error);
        res.render('adminPages/products', {
            products: [],
            search: search,
            pagination: {
                currentPage: 1,
                totalPages: 1,
                hasNext: false,
                hasPrev: false
            }
        });
    }
});



app.delete('/delete-product/:productId', async (req, res) => {
    const { productId } = req.params;
    console.log(`Deleting product with ID: ${productId}`);
    
    try {
        await db.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
        await db.query('DELETE FROM products WHERE product_id = $1', [productId]);
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});


app.put('/update-product/:productId', async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, stock_quantity } = req.body;
    
    try {
        await db.query(
            'UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4 WHERE product_id = $5',
            [name, description, price, stock_quantity, productId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});




// orders routes
app.get("/adminOrdersPage" , (req , res) =>{
    res.render('adminPages/orders', {
        title: 'Admin Orders Page',
        page: 'adminOrdersPage',
        isLoggedIn: !!req.session.user 
    })      
});

// cutomer route

app.get("/adminCustomersPage" , (req , res) =>{
    res.render('adminPages/customers', {
        title: 'Admin Customers Page',
        page: 'adminCustomersPage',
        isLoggedIn: !!req.session.user
    })
});

// analytic route

app.get('/adminAnalyticsPage', (req, res) => {
    res.render('adminPages/analytics', {
        title: 'Admin Analytics Page',
        page: 'adminAnalyticsPage',
        isLoggedIn: !!req.session.user
    });
}); 

// settings route

app.get('/adminSettingsPage', async (req, res) => {
    if (req.session.user) {
        const result = await db.query(
            'SELECT profile_picture FROM roles WHERE role_id = $1',
            [req.session.user.id]
        );
        
        const profilePicture = result.rows[0]?.profile_picture || 'https://via.placeholder.com/150';
        
        res.render('adminPages/settings', {
            title: 'Admin Settings Page',
            page: 'adminSettingsPage',
            isLoggedIn: true,
            user: {
                ...req.session.user,
                profile_picture: profilePicture
            }
        });
    } else {
        res.redirect('/login');
    }
});

// admin proile update
app.post('/update-profile-picture', upload.single('profile_picture'), AdminPhoto);

// ================ dashboard page routes ends here =======================




// Product route
app.get('/dashboard', (req, res) => {
    const sessionUser = req.session.user || null;
    const message = req.query.message || null; // Get the message from the query string
    res.render('dashboard', {
        title: 'dashboard',
        page: 'dashboard',
        message: message,  // Pass the message to the view
        messageType: 'success',
        sessionUser: sessionUser,
        isLoggedIn: !!sessionUser
    });
});

//ProductDetail.ejs route

app.get('/products/:product_id', async (req, res) => {
    const productId = parseInt(req.params.product_id);  // Capture the product ID
    if (isNaN(productId)) {
        return res.status(400).send('Invalid product ID');
    }

    try {
        const result = await db.query(`
                SELECT p.product_id, p.name, p.description, p.price, p.discount, pi.image_url
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                where p.product_id = $1
            `, [productId]);

            if (result.rows.length === 0) {
                return res.status(404).send('Product not found');
            }

            const product = result.rows[0];

            if (product.image_url) {
                product.image_url = product.image_url.replace(/\\/g, '/');
            }
          
           
        res.render('product-detail', {
            title: 'Product Detail',
            page: 'product-detail',
            product: product
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).send('Server Error');
    }
});

//cart route
app.get('/cart',getCartPage);
app.post('/cart/add' ,addToCartController );
app.get('/checkout',checkout);
app.post('/cart/clear', clearCartController);
app.post('/cart/remove/:product_id', removeFromCartController);

// updated routes for admin
app.post('/add-product', addProduct);





app.get('/api/admin/products',disPlayAllProductForAdmin)
// not yet working

// =====end here====

app.get('/admin/discounted-products', getDiscountedProducts);
// app.post('/admin/products/delete/:id', deleteProduct);
app.get('/admin/display-discountedProducts', displayDiscountedProductsAtfrontEnd);

// Server listen
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
