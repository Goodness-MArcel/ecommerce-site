import express from 'express';
import { getUsers, promoteUser, demoteUser } from './AdminController.js';

import { Router } from 'express';
const router = Router();

router.get('/', getUsers);
router.post('/promote/:id', promoteUser);
router.post('/demote/:id', demoteUser);

