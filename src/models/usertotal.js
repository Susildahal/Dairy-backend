import mongoose from "mongoose";

const usermilkSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: [true, "id is required"]
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    totalMilk: {  // Changed from totalmilkmonth to totalMilk
        type: Number,  // Changed from String to Number
        required: [true, "total milk is required"],
        default: 0
    },
    totalMoney: {  // Changed from totalmoneythismonth to totalMoney
        type: Number,  // Changed from String to Number
        required: [true, "total money is required"],
        default: 0
    },
    monthid: {
        type: String,
        required: [true, "month id  is required"]
    }
}, { timestamps: true })

const Usertotal = mongoose.model("Usertotal", usermilkSchema);

export default Usertotal;
