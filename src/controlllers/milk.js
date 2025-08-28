import Usertotal from "../models/usertotal.js";
import Admintotal from "../models/admintotal.js";
import Milk from "../models/milk.js";
import { StatusCodes } from "http-status-codes";
import Month from "../models/month.js";
import mongoose from "mongoose";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";




export const savemilk = async (req, resp, next) => {
    try {
        const { userid, name, todaymilk, todaymoney, todayfit } = req.body;

        // Validate required fields
        if (!userid || !name || !todaymilk || !todaymoney || !todayfit) {
            return resp.status(400).json({
                success: false,
                message: "Missing required fields: userid, name, todaymilk, todaymoney, todayfit"
            });
        }
  const monthids = await Month.findOne({ status: true });
 const monthid =monthids._id
  if(!monthid){
    throw new BadRequestError ("Active month can not available")
  }
        const milkAmount = parseFloat(todaymilk);
        const moneyAmount = parseFloat(todaymoney);
        const fitAmount = parseFloat(todayfit || 0);

        // Create new milk entry
        const newMilk = new Milk({
            userid,
            name,
            todaymilk: milkAmount,
            todaymoney: moneyAmount,
            todayfit: fitAmount,
            monthid: monthid
        });

        // Update or create user total
        let userTotal = await Usertotal.findOne({ userid: userid, monthid: monthid });

        if (userTotal) {
            userTotal.totalMilk += milkAmount;
            userTotal.totalMoney += moneyAmount;
            await userTotal.save();
            console.log(`Updated user total for ${name}: milk=${userTotal.totalMilk}, money=${userTotal.totalMoney}`);
        } else {
            userTotal = new Usertotal({
                userid,
                name,
                totalMilk: milkAmount,
                totalMoney: moneyAmount,
                monthid: monthid
            });
            await userTotal.save();
        }

        // Update or create admin total
        let adminTotal = await Admintotal.findOne({ monthid: monthid });

        if (adminTotal) {
            adminTotal.totalMilk += milkAmount;
            adminTotal.totalMoney += moneyAmount;
            await adminTotal.save();
            console.log(`Updated admin total for ${monthid}: milk=${adminTotal.totalMilk}, money=${adminTotal.totalMoney}`);
        } else {
            adminTotal = new Admintotal({
                monthid,
                totalMilk: milkAmount,
                totalMoney: moneyAmount
            });
            await adminTotal.save();
            console.log(`Created new admin total for ${monthid}: milk=${milkAmount}, money=${moneyAmount}`);
        }

        // Save the daily milk entry
        await newMilk.save();

        resp.status(201).json({
            success: true,
            message: "Milk data saved successfully",
            data: {
                daily: newMilk,
                userTotal: userTotal,
                adminTotal: adminTotal
            }
        });
    } catch (error) {
        console.error("Error saving milk data:", error);
        next(error);
    }
}

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