import mongoose from "mongoose";

const dailyMilkSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: [true, "userid is required"],
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    todaymilk: {
        type: Number, 
        required: [true, "today milk is required"]
    },
    todayfit: {
        type: Number,  
        required: [true, "today fit is required"]
    },
    todaymoney: {
        type: Number,
        required: [true, "today money is required"]
    },
    monthid:{
        type: String,
        required: [true, "month id is required"]
    }

}, { timestamps: true })

const Milk = mongoose.model("Milk", dailyMilkSchema);

export default Milk;