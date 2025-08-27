
import mongoose from "mongoose";


const userSchima =new mongoose.Schema({
    name:{
        type:String,
        required:[true,'Name is required'],
        minlength:[3,'Name must be at least 3 characters'],
        maxlength:[50,'Name must be at most 50 characters']
    },
    email:{
        type:String,
        required:[true,'Email is required'],
        unique:true,
        match:[/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,'Please fill a valid email address']
    },
      phone:{
        type:String,
        required:[true,'Phone number is required'],
        minlength:[10,'Phone number must be 10 digits'],
        unique:true,
        match:[/^\d{10}$/,'Please fill a valid phone number']
    },

    password:{
        type:String,
        required:[true,'Password is required'],
        minlength:[6,'Password must be at least 6 characters']
    },
    role:{
        type:String,
        enum:['user','admin' ],
        default:'user'
    },
    tagnumber:{
        type:String,
        required:[true,'Tag number is required']
    } ,
    status:{
        type:Boolean,
        default:true
    }   
},{timestamps:true});

const User = mongoose.model("User",userSchima);

export default User;