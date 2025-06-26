import { connect } from "mongoose";
import config from "../config/index.js";

export const ConnectDB = async () => {
    try {
        await connect(config.MONGO_URI)
        console.log('Database connected successfully')
    } catch (error) {
        console.log(`Error connecting to databse ${error}`)
    }
}