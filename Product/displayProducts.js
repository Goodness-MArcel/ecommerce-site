export const getProducts = async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 8; // Products per page
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    try {
        let query = `
            SELECT 
                p.*, 
                c.name as category_name,
                (SELECT image_url FROM product_images WHERE product_id = p.product_id LIMIT 1) as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
        `;
        
        let countQuery = 'SELECT COUNT(*) FROM products p';
        
        if (search) {
            query += ` WHERE p.name ILIKE $1`;
            countQuery += ` WHERE name ILIKE $1`;
        }
        
        query += ` ORDER BY p.product_id DESC LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}`;
        
        const values = search ? 
            [`%${search}%`, limit, offset] : 
            [limit, offset];
            
        const [productsResult, countResult] = await Promise.all([
            db.query(query, values),
            db.query(countQuery, search ? [`%${search}%`] : [])
        ]);

        const totalProducts = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalProducts / limit);

        return {
            products: productsResult.rows,
            pagination: {
                currentPage: page,
                totalPages,
                totalProducts
            }
        };
    } catch (error) {
        throw error;
    }
};

export const deleteProduct = async (req, res) => {
    const { productId } = req.params;
    
    try {
        await db.query('DELETE FROM product_images WHERE product_id = $1', [productId]);
        await db.query('DELETE FROM products WHERE product_id = $1', [productId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    const { productId } = req.params;
    const { name, description, price, stock_quantity, category_id } = req.body;
    
    try {
        await db.query(
            'UPDATE products SET name = $1, description = $2, price = $3, stock_quantity = $4, category_id = $5 WHERE product_id = $6',
            [name, description, price, stock_quantity, category_id, productId]
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
