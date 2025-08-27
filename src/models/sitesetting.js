import mongoose from "mongoose";


const settingsSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Site name is required']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required']
    },
    rate_of_user: {
        type: Number,
        required: [true, 'Rate of user is required']
    },
    rate_of_admin: {
        type: Number,
        required: [true, 'Rate of admin is required']
    }
}, { timestamps: true });

const SiteSettings = mongoose.model("SiteSettings", settingsSchema);

export default SiteSettings;
