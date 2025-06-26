import { Crypto } from "../utils/encrypt.decrypt.js";
import Admin from "../model/admin.model.js";
import config from "../config/index.js";

const crypto = new Crypto()

export const createSuperadmin = async () =>{
    try {
        const existsSuperadmin = await Admin.findOne({role: 'superadmin'})
        if(!existsSuperadmin){
            const hashedPassword = await crypto.encrypt(config.SUPERADMIN_PASSWORD)
            await Admin.create({
                username: config.SUPERADMIN_USER,
                email: config.SUPERADMIN_MAIL,
                phoneNumber: config.SUPERADMIN_PHONE,
                hashedPassword,
                role: 'superadmin'
            })
            console.log('Superadmin created successfully')
        }
    } catch (error) {
        console.log(`Error creating superadmin ${error}`)
    }
}