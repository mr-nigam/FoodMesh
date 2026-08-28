import { Router } from 'express';

import { 
    authenticateUser 
} from '../middlewares/auth.middleware.js';

import {
    addAddress,
    fecthAddresses,
    fecthAllAddresses,
    deleteAddress,
    editAddress
} from '../controllers/address.controller.js';


const router = Router();


router.use(authenticateUser);


router.post('/', addAddress);
router.get('/', fecthAllAddresses);
router.get('/:addressId', fecthAddresses);
router.put('/:addressId', editAddress);
router.put('/', editAddress);
router.delete('/:addressId', deleteAddress);


export default router;