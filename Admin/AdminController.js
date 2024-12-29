
import { db } from '../DB.js';


// Fetch users for admin panel
export const getUsers = async (req, res) => {
    try {
        // Get all users from the database
        const result = await db.query('SELECT * FROM users');

        // Get the current user's session info
        const sessionUser = req.session.user || null;

        // Render the admin dashboard with users and session info
        res.render('admin_dashboard', { 
            users: result.rows,
            sessionUser: sessionUser,
            isLoggedIn: !!sessionUser
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

// Promote user to admin
export const promoteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        await db.query('UPDATE users SET role_id = 1 WHERE user_id = $1', [userId]);
        res.redirect('/admin-panel');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error promoting user');
    }
};

// Demote admin to customer
export const demoteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        await db.query('UPDATE users SET role_id = 2 WHERE user_id = $1', [userId]);
        res.redirect('/admin-panel');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error demoting user');
    }
};

// deleting products

// export const deleteProduct = async (req, res) => {
//     const productId = req.params.id;
//     try {
//         await db.query('DELETE FROM products WHERE product_id = $1', [productId]);
//         res.redirect('/admin/products?message=Product+deleted+successfully');
//     } catch (error) {
//         console.error('Error deleting product:', error);
//         res.status(500).redirect('/admin/products?message=Error+deleting+product');
//     }
// };

//selectng all products will contiue here 

export const displayProducts  = async (req , res) => {
    const page = parseInt(req.query.page) || 1; // Get the page from the query string, default is 1
    const limit = 5; // Number of products per page
    const offset = (page - 1) * limit; // Calculate the offset for the query
    try{
        const countResult = await db.query(
            `SELECT COUNT(*) AS total FROM products`
        );
        const totalProducts = countResult.rows[0].total;
        const productsResult = await db.query(
            'SELECT * FROM products LIMIT $1 OFFSET $2',
            [limit, offset]
        );
        
        

        const totalPages = Math.ceil(totalProducts / limit);
        res.render(
            'product',{
                products: productsResult.rows,
                currentPage: page,
                totalPages: totalPages,
                
            }
        );
    }catch(error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
}

//admin discount
export const discountProduct = async (req, res) => {
    try {
        const selectedProducts = req.body.selectedProducts;
        const discounts = [];
        
        console.log('Selected products:', selectedProducts);
        console.log('Form data:', req.body);
        
        if (!selectedProducts || !Array.isArray(selectedProducts) || selectedProducts.length === 0) {
            console.log('No products selected');
            return res.status(400).json({ success: false, message: 'No products selected' });
        }
        
        for (const productId of selectedProducts) {
            const discountField = `discount_${productId}`;
            const discountValue = req.body[discountField];
            
            console.log(`Processing product ${productId}, discount value: ${discountValue}`);
            
            if (discountValue && !isNaN(discountValue)) {
                try {
                    const result = await db.query(
                        'UPDATE products SET discount = $1 WHERE product_id = $2 RETURNING *',
                        [discountValue, productId]
                    );
                    console.log(`Updated product ${productId}:`, result.rows[0]);
                    discounts.push({ productId, discountValue });
                } catch (dbError) {
                    console.error(`Database error for product ${productId}:`, dbError);
                    throw dbError;
                }
            } else {
                console.log(`Invalid discount value for product ${productId}`);
            }
        }
        
        console.log('All discounts applied successfully');
        console.log('About to send success JSON response');
        return res.status(200).json({ success: true, message: 'Discount applied successfully' });
    } catch (error) {
        console.error('Error in discountProduct:', error);
        console.log('About to send error JSON response');
        return res.status(500).json({ success: false, message: 'Error applying discount' });
    } finally {
        console.log('discountProduct function completed');
    }
};




export const getDiscountedProducts = async (req, res) => {
    try {
        const { page = 1 } = req.query; // Get the page number from query params, default to 1
        const limit = 5; // Items per page
        const offset = (page - 1) * limit;

        // Query to get total number of discounted products
        const countResult = await db.query('SELECT COUNT(*) FROM products WHERE discount IS NOT NULL AND discount > 0');
        const totalProducts = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);

        // Query to get discounted products with pagination
        const result = await db.query(
            'SELECT * FROM products WHERE discount IS NOT NULL AND discount > 0 LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        res.json({
            products: result.rows,
            totalPages,
            currentPage: parseInt(page),
        });
    } catch (err) {
        console.error('Error fetching discounted products:', err);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }
};



export const displayDiscountedProductsAtfrontEnd = async (req, res) => {
   
        try {
            const products = await db.query(`
                SELECT p.product_id, p.name, p.price, p.discount, pi.image_url
                FROM products p
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
                WHERE p.discount > 0;
            `);
    
            // Normalize image paths by replacing backslashes with forward slashes
            const modifiedProducts = products.rows.map(product => {
                product.image_url = product.image_url.replace(/\\/g, '/');  // Replace backslashes
                return product;
            });
    
            res.json({ products: modifiedProducts });
        } catch (error) {
            console.error('Error fetching discounted products:', error);
            res.status(500).send('Server Error');
        }
}


export const disPlayAllProductForAdmin = async (req, res) =>{
    const page = parseInt(req.query.page) || 1;
    const limit = 8 ;
    const offset = (page - 1) * limit; 

    try{
        const countResult = await db.query('SELECT COUNT(*) FROM products');
        const totalProducts = parseInt(countResult.rows[0].count);

        const totalPages = Math.ceil(totalProducts / limit);
        const products =  await db.query(
            `
            SELECT 
                p.product_id, 
                p.name, 
                p.price,  
                c.category_name 
            FROM 
                products p 
            JOIN 
                categories c 
            ON 
                p.category_id = c.category_id
            LIMIT $1 OFFSET $2
            `,[limit, offset]
        );

        res.json({
            products: products.rows,
            totalPages,
            currentPage: page,
        });
    }catch(error){
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Server error. Please try again later.' });
    }

}


export const deleteProduct = async (req, res) => {
    const productId = req.params.id;
    console.log('Received productId:', productId);
    try {
        const result = await db.query(
            'DELETE FROM products WHERE product_id = $1 RETURNING *', 
            [productId]
        );
        
        if (result.rowCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}



export const updateProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, category, price, stock } = req.body;

    try {
        const result = await db.query(
            `UPDATE products 
             SET name = $1, category = $2, price = $3, stock = $4 
             WHERE product_id = $5 
             RETURNING *`,
            [name, category, price, stock, productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({ 
            success: true, 
            product: result.rows[0] 
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}


export const updateStock = async (req, res) => {
    const productId = req.params.id;
    const { stock } = req.body;

    try {
        const result = await db.query(
            'UPDATE products SET stock = $1 WHERE product_id = $2 RETURNING *',
            [stock, productId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        res.json({ 
            success: true, 
            product: result.rows[0] 
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
}

export const getAllProductForAdmin = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM products ORDER BY name ASC'
        );
        
        // Get unique categories for filter
        const categories = [...new Set(result.rows.map(product => product.category))];

        res.render('products', { 
            products: result.rows,
            categories: categories
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal server error');
    }
}