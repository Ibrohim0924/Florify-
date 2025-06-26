import { Schema, model } from "mongoose";

const adminSchema = new Schema({
    username: { type: String, unique: true, required: true},
    email: {type: String, unique: true, required: true},
    phoneNumber: {type: String, required: true},
    hashedPassword: {type: String, required: true},
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin'}
})

const Admin = model('Admin', adminSchema)
export default Admin