import { Router } from "express";

import CandidatController from "../controller/candidatController";
import { auth } from '../middlewares/auth';
import { authorize, filterFields } from '../middlewares/authorize';
import { validate, validators } from '../middlewares/validate';
import { RESOURCES, ACTIONS } from "../config/permissions"; 


const router = Router();

router.use(auth);
router.use(filterFields);

router.post('/',
    authorize({ resource: RESOURCES.CANDIDAT, action: ACTIONS.CREATE }),
    validate(validators.auth.registerCandidat),
    CandidatController.createCandidat
)


export default router;