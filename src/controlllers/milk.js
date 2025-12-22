
import Milk from "../models/milk.js";
import { StatusCodes } from "http-status-codes";
import Month from "../models/month.js";
import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import User from "../models/user.js";




export const savemilk = async (req, resp, next) => {
    try {
        const { userid, name, todaymilk, todaymoney, todayfit , session } = req.body;

        // Validate required fields
        if (!userid || !name || todaymilk === undefined || todaymoney === undefined || todayfit === undefined || !session) {
            return resp.status(400).json({
                success: false,
                message: "Missing required fields: userid, name, todaymilk, todaymoney, todayfit, session"
            });
        }

        // Find user by userid or _id
        let user = await User.findOne({ userid: userid });
        if (!user && mongoose.Types.ObjectId.isValid(userid)) {
            user = await User.findById(userid);
        }

        if (!user) {
            return resp.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        console.log('Found user:', user);

        // Parse numeric values
        const milkAmount = parseFloat(todaymilk) || 0;
        const moneyAmount = parseFloat(todaymoney) || 0;
        const fitAmount = parseFloat(todayfit) || 0;

        // Validate numeric values
        if (milkAmount < 0 || moneyAmount < 0 || fitAmount < 0) {
            return resp.status(400).json({
                success: false,
                message: "Milk, money, and fit values must be non-negative numbers"
            });
        }

        // Update user's last entry information
        const lastUpdatePayload = {
            lastUpdateAt: new Date(),
            lastUpdateDisplay: new Date().toLocaleString(),
            lastEntry: {
                name,
                todaymilk: milkAmount,
                todaymoney: moneyAmount,
                todayfit: fitAmount,
                session: session
            }
        };

        // Update user by userid field first, fallback to _id
        let updatedUser = await User.findOneAndUpdate(
            { userid: userid },
            { $set: lastUpdatePayload },
            { new: true }
        );

        if (!updatedUser && mongoose.Types.ObjectId.isValid(userid)) {
            updatedUser = await User.findByIdAndUpdate(
                userid,
                { $set: lastUpdatePayload },
                { new: true }
            );
        }

        if (!updatedUser) {
            return resp.status(400).json({
                success: false,
                message: "Failed to update user's last-entry data"
            });
        }

        // Find active month
        const activeMonth = await Month.findOne({ status: true });
        if (!activeMonth) {
            return resp.status(400).json({
                success: false,
                message: "No active month available"
            });
        }

        const monthid = activeMonth._id;

    
            const newMilk = new Milk({
                userid,
                name,
                todaymilk: milkAmount,
                todaymoney: moneyAmount,
                todayfit: fitAmount,
                monthid: monthid,
                session: session
            });
            await newMilk.save();
        

        // Return success response
        return resp.status(200).json({
            success: true,
            message: "Milk data saved successfully",
            data: {
                userid,
                name,
                todaymilk: milkAmount,
                todaymoney: moneyAmount,
                todayfit: fitAmount,
                monthid,
                session
            }
        });

    } catch (error) {
        console.error("Error saving milk data:", error);
        next(error);
    }
}
export const updatemilk = async (req, resp, next) => {
    const { id } = req.params;
    const { userid, name, todaymilk, todaymoney, todayfit, session } = req.body;

    try {
        // Validate required fields
        if (!userid || !name || todaymilk === undefined || todaymoney === undefined || todayfit === undefined || !session) {
            return resp.status(400).json({
                success: false,
                message: "Missing required fields: userid, name, todaymilk, todaymoney, todayfit, session"
            });
        }

        // Find existing milk record
        const existingMilk = await Milk.findById(id);
        if (!existingMilk) {
            return resp.status(404).json({
                success: false,
                message: "Milk data not found"
            });
        }

        // Parse numeric values
        const milkAmount = parseFloat(todaymilk) || 0;
        const moneyAmount = parseFloat(todaymoney) || 0;
        const fitAmount = parseFloat(todayfit) || 0;

        if (milkAmount < 0 || moneyAmount < 0 || fitAmount < 0) {
            return resp.status(400).json({
                success: false,
                message: "Milk, money, and fit values must be non-negative numbers"
            });
        }

        // Find user by userid or _id
        let user = await User.findOne({ userid: userid });
        if (!user && mongoose.Types.ObjectId.isValid(userid)) {
            user = await User.findById(userid);
        }

        if (!user) {
            return resp.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Update user's last entry
        const lastUpdatePayload = {
            lastUpdateAt: new Date(),
            lastUpdateDisplay: new Date().toLocaleString(),
            lastEntry: {
                name,
                todaymilk: milkAmount,
                todaymoney: moneyAmount,
                todayfit: fitAmount,
                session: session
            }
        };

        let updatedUser = await User.findOneAndUpdate(
            { userid: userid },
            { $set: lastUpdatePayload },
            { new: true }
        );

        if (!updatedUser && mongoose.Types.ObjectId.isValid(userid)) {
            updatedUser = await User.findByIdAndUpdate(
                userid,
                { $set: lastUpdatePayload },
                { new: true }
            );
        }

        // Update milk record
        existingMilk.userid = userid;
        existingMilk.name = name;
        existingMilk.todaymilk = milkAmount;
        existingMilk.todaymoney = moneyAmount;
        existingMilk.todayfit = fitAmount;
        existingMilk.session = session;
        // Keep the same monthid
        await existingMilk.save();

        return resp.status(200).json({
            success: true,
            message: "Milk data updated successfully",
            data: existingMilk
        });

    } catch (error) {
        console.error("Error updating milk data:", error);
        next(error);
    }
};


export const allmilk = async (req, resp) => {
    const { session, monthid, userid, page, limit } = req.query;

    try {
        // Pagination setup
        const pageNumber = parseInt(page) || 1;
        const limitNumber = parseInt(limit) || 1;
        const skip = (pageNumber - 1) * limitNumber;

        // Build filter object
        const filter = {};
        if (session) filter.session = session;
        if (monthid) filter.monthid = monthid;
        if (userid) filter.userid = userid;

        // Get total count for pagination metadata
        const totalCount = await Milk.countDocuments(filter);
        const totalPages = Math.ceil(totalCount / limitNumber);

        // Get paginated data
        const milkData = await Milk.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        // Pagination metadata
        const pagination = {
            currentPage: pageNumber,
            totalPages: totalPages,
            totalItems: totalCount,
            itemsPerPage: limitNumber,
            hasNextPage: pageNumber < totalPages,
            hasPrevPage: pageNumber > 1,
            nextPage: pageNumber < totalPages ? pageNumber + 1 : null,
            prevPage: pageNumber > 1 ? pageNumber - 1 : null
        };

        resp.status(200).json({
            success: true,
            count: milkData.length,
            pagination: pagination,
            data: milkData
        });

    } catch (error) {
        console.error("Error getting all milk data:", error);
        resp.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
}



export const delatemilk = async (req, resp) => {
    const { id } = req.params;
    try {
        const deletedMilk = await Milk.findByIdAndDelete(id);
        if (!deletedMilk) {
            return resp.status(404).json({
                success: false,
                message: "Milk data not found"
            });
        }
        resp.status(200).json({
            success: true,
            message: "Milk data deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting milk data:", error);
        resp.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
}
