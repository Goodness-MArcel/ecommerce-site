
export const cartController = async (req, res) => {
    console.log('Cart Controller Loaded');
    const sessionUser = req.session.user || null;
    console.log('Session User:', sessionUser);
    console.log('Current Cart State:', req.session.cart);

    if (!sessionUser) {
        return res.redirect('/login');
    }

    try {
        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                total: 0
            };
        }

        // Ensure items array exists
        if (!req.session.cart.items) {
            req.session.cart.items = [];
        }

        // Calculate total (using proper price access)
        const total = req.session.cart.items.reduce((sum, item) => {
            const itemPrice = parseFloat(item.price || 0);
            const itemQuantity = parseInt(item.quantity || 1);
            return sum + (itemPrice * itemQuantity);
        }, 0);

        // Update the cart total
        req.session.cart.total = total;

        // Save session explicitly to ensure changes are persisted
        await new Promise((resolve) => {
            req.session.save(() => {
                resolve();
            });
        });

        console.log('Updated Cart State:', req.session.cart);

        res.render('cart', {
            title: 'Cart',
            page: 'cart',
            isLoggedIn: true,
            user: sessionUser,
            cart: req.session.cart,
            hasItems: req.session.cart.items.length > 0
        });
    } catch (error) {
        console.error('Cart Controller Error:', error);
        res.status(500).render('error', {
            message: 'Error loading cart',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

export const addToCartController = async (req, res) => {
    try {
        const { product_id, price, name, image , quantity = 1 } = req.body;
        console.log('Added to cart:', req.body);
        // Initialize cart if it doesn't exist
        if (!req.session.cart) {
            req.session.cart = {
                items: [],
                total: 0
            };
        }

        // Ensure items array exists
        if (!req.session.cart.items) {
            req.session.cart.items = [];
        }

        // Check if item already exists in cart
        const existingItemIndex = req.session.cart.items.findIndex(item => item.productId === product_id);

        if (existingItemIndex > -1) {
            // Update quantity if item exists
            req.session.cart.items[existingItemIndex].quantity += parseInt(quantity);
        } else {
            // Add new item if it doesn't exist
            req.session.cart.items.push({
                product_id,
                price: parseFloat(price),
                name,
                image_url: `${image}`,
                quantity: parseInt(quantity)
            });
        }

        // Calculate new total
        const total = req.session.cart.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

      

        req.session.cart.total = total;

        // Save session explicitly
        await new Promise((resolve) => {
            req.session.save(() => {
                resolve();
            });
        });
        const totalItems = req.session.cart.items.reduce((sum, item) => sum + item.quantity, 0);
        
        return res.status(200).json({
            success: true,
            message: 'Item added to cart by goodness',
            cart: req.session.cart,
            totalItems: totalItems,
            uniqueItems: req.session.cart.items.length
        });
        
    } catch (error) {
        console.error('Add to Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding item to cart'
        });
    }
};




export const getCartPage = async (req, res) => {
    try {
        // Get cart from session
        const cart = req.session.cart;
        const user = req.session.user;
        console.log('Cart:', cart);

        // Render cart page with appropriate message
        res.render('cart', {
            cart: cart,
            user: user,
            isEmpty: !cart || !cart.items || cart.items.length === 0
        });
    } catch (error) {
        console.error('Cart Page Error:', error);
        res.status(500).render('error', { 
            message: 'Error loading cart page' 
        });
    }
};


export const removeFromCartController = async (req, res) => {
    // console.log('Removing from cart:', req.params.product_id);
    try {
        const { product_id } = req.params;
       
        if (!req.session.cart || !req.session.cart.items) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove item from cart
        req.session.cart.items = req.session.cart.items.filter(item => 
            item.product_id !== product_id
        );

        // Recalculate total
        req.session.cart.total = req.session.cart.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        // Save session
        await new Promise((resolve) => {
            req.session.save(() => {
                resolve();
            });
        });

        res.redirect('/cart');

    } catch (error) {
        console.error('Remove from Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing item from cart'
        });
    }
};



export const clearCartController = async (req, res) => {
    try {
        // Reset cart
        req.session.cart = {
            items: [],
            total: 0
        };

        // Save session
        await new Promise((resolve) => {
            req.session.save(() => {
                resolve();
            });
        });

        res.redirect('/cart');

    } catch (error) {
        console.error('Clear Cart Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error clearing cart'
        });
    }
};

export const checkout = async (req, res) => {
    try {
        const cartItems = req.session.cart.items || [];
        const shippingOptions = [
            { id: 'standard', name: 'Standard Shipping (5-7 business days)', cost: 4.99 },
            { id: 'express', name: 'Express Shipping (2-3 business days)', cost: 9.99 }
        ];
        res.render('checkout', { cartItems, shippingOptions });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).send('Internal Server Error');
    }
};


