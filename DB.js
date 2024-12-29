import pkg from 'pg';
import dotenv from 'dotenv';

import express from 'express';
import session, { Store } from 'express-session';
import pgSession from 'connect-pg-simple';


const app = express();

dotenv.config({ path: './DB.env' });
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Create PostgreSQL session store
const PostgresqlStore = pgSession(session);

const sessionConfig = {
    store: new PostgresqlStore({
        pool: pool,
        tableName: 'user_sessions' // Table to store sessions
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
};

// Apply session middleware
app.use(session(sessionConfig));
// Middleware to attach session user to locals
const attachSessionUser = (req, res, next) => {
    res.locals.sessionUser = req.session.user || null;
    res.locals.isLoggedIn = !!req.session.user;
    next();
};
app.use(attachSessionUser);

// Error handling middleware for session store errors
app.use((err, req, res, next) => {
    if (err.code === 'EPGSERVERERROR') {
        console.error('PostgreSQL session store error:', err);
        // Handle session store errors appropriately
        return res.status(500).send('Internal server error');
    }
    next(err);
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Database connected successfully at:', res.rows[0].now);
    }
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

 const db = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
};


// Export both db and app as named exports
export { db, app  };

