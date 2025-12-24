import { Router } from 'express';

import candidatRoutes from './candidat.routes';

const router = Router();

// Routes utilisateurs
//router.use('/users', userRoutes);

// Routes cadets
//router.use('/cadets', cadetRoutes);

router.use('/candidat', candidatRoutes);

export default router;
