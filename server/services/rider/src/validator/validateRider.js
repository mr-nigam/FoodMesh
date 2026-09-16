import {
    verifyCoordinates
} from '@foodmesh/utils';


const validateRegisterRider = ({
    userId,
    data
}) => {

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


    const aadharNumber = data?.aadharNumber?.trim() ?? null;
    if(!aadharNumber){
        errors.aadharNumber = 'Aadhar number is required';
    }else if(
        typeof aadharNumber !== 'string' ||
        !/^[0-9]{12}$/.test(aadharNumber)
    ){
        errors.aadharNumber =
            'Aadhar number must contain exactly 12 digits';
    }
    params.push(aadharNumber);


    const drivingLicenseNumber = data?.drivingLicenseNumber?.trim() ?? null;
    if(!drivingLicenseNumber){
        errors.drivingLicenseNumber =
            'Driving license number is required';
    }else if(
        typeof drivingLicenseNumber !== 'string' ||
        drivingLicenseNumber.length > 16
    ){
        errors.drivingLicenseNumber =
            'Driving license number must not exceed 16 characters';
    }
    params.push(drivingLicenseNumber);


    const gender = data?.gender?.trim() ?? null;
    if(gender !== undefined && gender !== null) {
        const allowedGenders = [
            'male',
            'female',
            'other',
            'not_shared'
        ];

        if(!allowedGenders.includes(gender)){
            errors.gender = 'Invalid gender';
        }
    }
    params.push(gender);
    

    const rawDob = data?.date_of_birth ?? data?.dateOfBirth ?? null;
    const dateOfBirth = rawDob ? String(rawDob).trim() : null;
    let dob = null;
    if(dateOfBirth) {
        const parsedDob = new Date(dateOfBirth);

        if(Number.isNaN(parsedDob.getTime())) {
            errors.dateOfBirth = 'Invalid date of birth';
        }else{
            const now = new Date();

            const minDate = new Date();
            minDate.setFullYear(
                minDate.getFullYear() - 120
            );

            if(parsedDob > now) {
                errors.dateOfBirth =
                    'Date of birth cannot be in the future';
            }else if(parsedDob < minDate) {
                errors.dateOfBirth =
                    'Date of birth cannot be more than 120 years ago';
            }else{
                dob = parsedDob;
            }
        }
    }
    params.push(dob);


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
};