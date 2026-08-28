import { Router } from 'express';

import { 
    authenticateUser 
} from '../middlewares/auth.middleware.js';

import {
    addAddress,
    fecthAddress,
    fecthAllAddresses,
    deleteAddress,
    editAddress,
    fetchDefaultAddress
} from '../controllers/address.controller.js';


const router = Router();


router.use(authenticateUser);


router.post('/add', addAddress);
router.get('/all', fecthAllAddresses);
router.get('/default', fetchDefaultAddress);
router.get('/:addressId', fecthAddress);
router.put('/:addressId', editAddress);
router.delete('/:addressId', deleteAddress);


export default router;