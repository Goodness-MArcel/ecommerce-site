import { db } from '../DB.js';

import multer from 'multer';
// Add file type validation
export const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type'));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });
  

  


// Category mapping (example: adjust according to your actual category IDs)
const categoryMap = {
    electronics: 1,
    clothing: 2,
    books: 3,
    home: 4,
    toys: 5
};

export const addProduct = [
    upload.array('product_images', 10),
    
    async (req, res) => {
        const { name, description, price, stock_quantity, category_id } = req.body;

        // Check if user is authenticated
        if (!req.session.user || !req.session.user.id) {
            return res.status(403).send('User not authenticated');
        }

        // Convert category string to corresponding ID if needed
        const categoryId = categoryMap[category_id];  // Assuming categoryMap is defined elsewhere
        if (!categoryId) {
            req.flash('error', 'Invalid category');
            return res.redirect('/admin-panel');
        }

        try {
            const productResult = await db.query(
                'INSERT INTO products (name, description, price, stock_quantity, category_id, vendor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING product_id',
                [name, description, price, stock_quantity, categoryId, req.session.user.id]
            );

            const productId = productResult.rows[0].product_id;

            // Insert product images
            const images = req.files;
            const imagePromises = images.map(image => {
                return db.query(
                    'INSERT INTO product_images (product_id, image_url) VALUES ($1, $2)',
                    [productId, image.path]
                );
            });

            await Promise.all(imagePromises);

            // Use flash to store success message
            res.redirect('/adminproductsPage?message=Product+uploaded+successfully&type=success');

        } catch (error) {
            console.error('Error uploading product:', error);

            // Use flash to store error message
            res.redirect('/adminproductsPage?message=Error+uploading+product&type=error');

        }
    }
];


export const AdminPhoto = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.session.user.id;

    try {
        const filePath = '/uploads/profile-pictures/' + req.file.filename;
        
        await db.query(
            'UPDATE roles SET profile_picture = $1 WHERE role_id = $2',
            [filePath, userId]
        );

        res.json({ success: true, filePath });
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({ error: 'Failed to update profile picture' });
    }
};


export const AdminDisplyProducts = async (req, res) => {
    try {
        const productsQuery = `
            SELECT 
                p.*,
                c.name as category_name,
                pi.image_url as primary_image
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            GROUP BY p.product_id, c.name, pi.image_url
            ORDER BY p.product_id DESC
            LIMIT 12`;
            
        const result = await db.query(productsQuery);
        
        res.render('adminPages/products', {
            products: result.rows
        });
    } catch (error) {
        console.error(error);
        res.render('adminPages/products', {
            products: []
        });
    }
}