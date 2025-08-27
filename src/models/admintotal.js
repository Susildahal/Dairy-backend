import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
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
        required: [true, "month is required"]
    }
}, { timestamps: true })

const Admintotal = mongoose.model("Admintotal", adminSchema);

export default Admintotal;
