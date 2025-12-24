// src/routes/cadet.routes.ts
import { Router } from 'express';
import { CadetController } from '../controllers/CadetController';
import { auth } from '../middlewares/auth';
import { authorize, filterFields } from '../middlewares/authorize';
import { validate, validators } from '../middlewares/validate';
import { RESOURCES, ACTIONS } from '../config/permissions';

const router = Router();

router.use(auth);
router.use(filterFields);

router.get('/',
  authorize({ resource: RESOURCES.CADET, action: ACTIONS.READ }),
  validate(validators.pagination),
  CadetController.getAll
);

router.get('/:id',
  validate([validators.id]),
  authorize({
    resource: RESOURCES.CADET,
    action: ACTIONS.READ,
    ownerField: 'user_id',
    resourceIdParam: 'id'
  }),
  CadetController.getById
);

router.post('/',
  authorize({ resource: RESOURCES.CADET, action: ACTIONS.CREATE }),
  validate(validators.cadet.create),
  CadetController.create
);

router.put('/:id',
  validate([validators.id, ...validators.cadet.update]),
  authorize({
    resource: RESOURCES.CADET,
    action: ACTIONS.UPDATE,
    ownerField: 'user_id',
    resourceIdParam: 'id'
  }),
  CadetController.update
);

router.delete('/:id',
  validate([validators.id]),
  authorize({ resource: RESOURCES.CADET, action: ACTIONS.DELETE }),
  CadetController.delete
);

export default router;