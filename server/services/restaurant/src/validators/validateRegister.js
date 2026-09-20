import {
    verifyCoordinates
} from '@foodmesh/utils';


const validateRegisterRider = ({
    userId,
    data
})=>{
    
    const params = [userId];
    const errors = {};

    const name = data?.name?.trim() ?? null;
    if(!name){
        errors.name = 'Name is required';
    }else if(
        typeof name !== 'string' ||
        name.length < 2 || name.length > 50
    ){
        errors.name = 'Name must be between 2 and 50 characters';
    }
    params.push(name);


    const description = data?.description?.trim() ?? null;
    if(!description){
        errors.description = 'Name is required';
    }
    params.push(description);


    const email = data?.email?.trim() ?? null;
    if(!email){
        errors.email = 'Email is required';
    }else if(
        typeof email !== 'string' ||
        !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
            email
        )
    ){
        errors.email = 'Invalid email address';
    }
    params.push(email);


    const phone = data?.phone?.trim() ?? null;
    if(phone !== undefined && phone !== null) {
        if(
            typeof phone !== 'string' ||
            !/^\+[1-9][0-9]{6,14}$/.test(phone)
        ){
            errors.phone =
                'Phone must be in international format, e.g. +919876543210';
        }
    }
    params.push(phone);


    const address = data?.formattedAddress ?? data?.address ?? null;
    if(!address){
        errors.email = 'Invalid address address';
    }
    params.push(JSON.stringify(address));


    const longitude = Number(data?.longitude);
    const latitude = Number(data?.latitude);
    
    if(!verifyCoordinates({longitude, latitude})){
        errors.location = 'Location is required and Location details must be accurate';
    }
    params.push(longitude);
    params.push(latitude);


    return {
        valid: Object.keys(errors).length === 0,
        params,
        errors
    };
};


export {
    validateRegisterRider
}