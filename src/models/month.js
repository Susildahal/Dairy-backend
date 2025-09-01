import mongoose from "mongoose";

const monthSchema = new mongoose.Schema({
    year: {
        type: String,
        required: [true, 'Year is required'],
    },
    month: {
        type: String,
        required: [true, 'Month name is required'],
          
        },
    status: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Create unique index for year + month combination to prevent duplicates
monthSchema.index({ year: 1, month: 1 }, { unique: true });

// Pre-save middleware to generate fullMonthName

const Month = mongoose.model("Month", monthSchema);

export default Month;
