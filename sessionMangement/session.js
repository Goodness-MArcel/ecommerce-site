import session from 'express-session';
import pgSession from 'connect-pg-simple';
import { pool } from '../DB.js';

// Create PostgreSQL session store
const PostgresqlStore = pgSession(session);

const sessionConfig = {
    store: new PostgresqlStore({
        pool: pool,                // Existing database pool
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