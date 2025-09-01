import Usertotal from "../models/usertotal.js";
import Admintotal from "../models/admintotal.js";
import Milk from "../models/milk.js";
import { StatusCodes } from "http-status-codes";
import Month from "../models/month.js";
import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import User from "../models/user.js";




export const savemilk = async (req, resp, next) => {
    try {
        const { userid, name, todaymilk, todaymoney, todayfit } = req.body;

        // Validate required fields
        if (!userid || !name || todaymilk === undefined || todaymoney === undefined || todayfit === undefined) {
            return resp.status(400).json({
                success: false,
                message: "Missing required fields: userid, name, todaymilk, todaymoney, todayfit"
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

        // Check if user has submitted within the last hour (3600000 milliseconds)
        if (user && user.updatedAt) {
            const now = Date.now();
            const lastUpdate = new Date(user.updatedAt).getTime();
            const timeDifference = now - lastUpdate;
            
            // 1 hour = 3600000 
            if (timeDifference < 3) {
                return resp.status(400).json({
                    success: false,
                    message: "You have already submitted milk data within the last hour"
                });
            }
        }

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
                todayfit: fitAmount
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

        // Check if milk record exists for this user and month
        const existingMilkRecord = await Milk.findOne({ 
            userid: userid, 
            monthid: monthid 
        });

        if (!existingMilkRecord) {
            // Create new milk record
            const newMilk = new Milk({
                userid,
                name,
                todaymilk: milkAmount,
                todaymoney: moneyAmount,
                todayfit: fitAmount,
                monthid: monthid
            });
            await newMilk.save();
        } else {
            // Update existing milk record
            existingMilkRecord.todaymilk += milkAmount;
            existingMilkRecord.todaymoney += moneyAmount;
            existingMilkRecord.todayfit += fitAmount;
            await existingMilkRecord.save();
        }

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
                monthid
            }
        });

    } catch (error) {
        console.error("Error saving milk data:", error);
        next(error);
    }
}
export const updatemilk = async (req, resp, next) => {
    const { id } = req.params;
    const { todaymilk, todaymoney, todayfit, userid, name } = req.body;

    if (!id) throw new BadRequestError("Milk entry ID is required");

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const existingMilk = await Milk.findById(id).session(session);
        if (!existingMilk) throw new NotFoundError("Milk entry not found");

        const monthids = await Month.findOne({ status: true }).session(session);
        if (!monthids) throw new BadRequestError("Active month is not available");
        const monthid = monthids._id;

        const oldMilkAmount = existingMilk.todaymilk;
        const oldMoneyAmount = existingMilk.todaymoney;
 

        const newMilkAmount = parseFloat(todaymilk);
        const newMoneyAmount = parseFloat(todaymoney);
        const newFitAmount = parseFloat(todayfit || 0);

        /** ---- USER TOTAL ---- */
        let userTotal = await Usertotal.findOne({ userid, monthid }).session(session);
        if (!userTotal) {
            // recreate if missing
            userTotal = new Usertotal({
                userid,
                name,
                totalMilk: newMilkAmount,
                totalMoney: newMoneyAmount,
                monthid
            });
        } else {
            userTotal.totalMilk = Math.max(0, userTotal.totalMilk - oldMilkAmount + newMilkAmount);
            userTotal.totalMoney = Math.max(0, userTotal.totalMoney - oldMoneyAmount + newMoneyAmount);
        }
        await userTotal.save({ session });

        /** ---- ADMIN TOTAL ---- */
        let adminTotal = await Admintotal.findOne({ monthid }).session(session);
        if (!adminTotal) {
            adminTotal = new Admintotal({
                monthid,
                totalMilk: newMilkAmount,
                totalMoney: newMoneyAmount
            });
        } else {
            adminTotal.totalMilk = Math.max(0, adminTotal.totalMilk - oldMilkAmount + newMilkAmount);
            adminTotal.totalMoney = Math.max(0, adminTotal.totalMoney - oldMoneyAmount + newMoneyAmount);
        }
        await adminTotal.save({ session });

        /** ---- UPDATE DAILY MILK ---- */
        existingMilk.todaymilk = newMilkAmount;
        existingMilk.todaymoney = newMoneyAmount;
        existingMilk.todayfit = newFitAmount;
        existingMilk.name = name || existingMilk.name;
        existingMilk.updatedAt = new Date();
        await existingMilk.save({ session });

        await session.commitTransaction();
        session.endSession();

        resp.status(StatusCodes.OK).json({
            success: true,
            message: "Milk entry updated successfully",
            data: { daily: existingMilk, userTotal, adminTotal }
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error updating milk:", error);
        next(error);
    }
};




export const allmilk = async (req, resp) => {
    try {
        const milkData = await Milk.find();
        resp.status(200).json({
            success: true,
            count: milkData.length,
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



export const dailyuserhistory = async (req, resp) => {
    try {
        const authuser = req.user;
        const userid = authuser._id.toString();
        const dailyuser = await Milk.find({ userid });

        resp.status(StatusCodes.OK).json({
            success: true,
            count: dailyuser.length,
            data: dailyuser
        });
    } catch (error) {
        console.error("Error getting daily user history:", error);
        resp.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: "Server error"
        });
    }
}

// Get admin total for a specific month
export const getAdminTotal = async (req, resp, next) => {
    try {
        const adminTotal = await Admintotal.find();

        if (!adminTotal || adminTotal.length === 0) {
            return resp.status(404).json({
                success: false,
                message: `No admin total found`
            });
        }

        // Convert string monthids to ObjectIds and filter out invalid ones
        const monthIds = adminTotal
            .map(at => at.monthid)
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));


        const monthNames = await Month.find({ _id: { $in: monthIds } });

        // Create a combined response with admin totals and their corresponding month names
        const adminDataWithMonths = adminTotal.map(admin => {
            const correspondingMonth = monthNames.find(month =>
                month._id.toString() === admin.monthid
            );

            return {
                _id: admin._id,
                totalMilk: admin.totalMilk,
                totalMoney: admin.totalMoney,
                monthid: admin.monthid,
                monthName: correspondingMonth ? correspondingMonth.fullMonthName || `${correspondingMonth.month} ${correspondingMonth.year}` : 'Unknown Month',
                monthDetails: correspondingMonth || null,
                createdAt: admin.createdAt,
                updatedAt: admin.updatedAt
            };
        });

        resp.status(200).json({
            success: true,
            count: adminTotal.length,
            data: adminDataWithMonths
        });
    } catch (error) {
        console.error("Error getting admin total:", error);
        next(error);
    }
}


export const getUserTotal = async (req, resp, next) => {
    try {
        const authuser = req.user;
        const userid = authuser._id.toString();
        if (!userid) {
            throw new BadRequestError("user id is required");
        }

        const total = await Usertotal.find({ userid });
        
        if (!total || total.length === 0) {
            return resp.status(404).json({
                success: false,
                message: `No user total found for user: ${userid}`
            });
        }

        // Convert string monthids to ObjectIds and filter out invalid ones
        const monthIds = total
            .map(t => t.monthid)
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

        console.log('Month IDs for user:', monthIds);

        const months = await Month.find({ _id: { $in: monthIds } });
        console.log('Found months for user:', months);

        // Create a combined response with user totals and their corresponding month names
        const userDataWithMonths = total.map(userTotal => {
            const correspondingMonth = months.find(month => 
                month._id.toString() === userTotal.monthid
            );
            
            return {
                _id: userTotal._id,
                userid: userTotal.userid,
                name: userTotal.name,
                totalMilk: userTotal.totalMilk,
                totalMoney: userTotal.totalMoney,
                monthid: userTotal.monthid,
                monthName: correspondingMonth ? correspondingMonth.fullMonthName || `${correspondingMonth.month} ${correspondingMonth.year}` : 'Unknown Month',
                monthDetails: correspondingMonth || null,
                createdAt: userTotal.createdAt,
                updatedAt: userTotal.updatedAt
            };
        });

        resp.json({ 
            status: StatusCodes.OK, 
            success: true,
            data: userDataWithMonths, 
            count: total.length 
        });

    } catch (error) {
        next(error);
    }
}


export const getTotalMonth = async (req, resp, next) => {
    try {
        const total = await Usertotal.find();
        
        if (!total || total.length === 0) {
            throw new NotFoundError("No user total found");
        }

        // Convert string monthids to ObjectIds and filter out invalid ones
        const monthIds = total
            .map(t => t.monthid)
            .filter(id => mongoose.Types.ObjectId.isValid(id))
            .map(id => new mongoose.Types.ObjectId(id));

     

        const months = await Month.find({ _id: { $in: monthIds } });

        // Create a combined response with user totals and their corresponding month names
        const userDataWithMonths = total.map(userTotal => {
            const correspondingMonth = months.find(month => 
                month._id.toString() === userTotal.monthid
            );
            
            return {
                _id: userTotal._id,
                userid: userTotal.userid,
                name: userTotal.name,
                totalMilk: userTotal.totalMilk,
                totalMoney: userTotal.totalMoney,
                monthid: userTotal.monthid,
                monthName: correspondingMonth ? correspondingMonth.fullMonthName || `${correspondingMonth.month} ${correspondingMonth.year}` : 'Unknown Month',
                monthDetails: correspondingMonth || null,
                createdAt: userTotal.createdAt,
                updatedAt: userTotal.updatedAt
            };
        });

        resp.json({ 
            status: StatusCodes.OK, 
            success: true,
            data: userDataWithMonths, 
            count: total.length 
        });

    } catch (error) {
        next(error);
    }
}