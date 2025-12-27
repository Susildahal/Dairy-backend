import Month from "../models/month.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";
import { StatusCodes } from "http-status-codes";
import Milk from "../models/milk.js";

// Create a new month entry
export const createMonth = async (req, res, next) => {
  try {
    const { year, month, status = false } = req.body;

   
    if (!year || !month) {
      throw new BadRequestError('Year and month are required');
    }


    const existingMonth = await Month.findOne({ year, month });
    if (existingMonth) {
      throw new BadRequestError(`${month} ${year} already exists`);
    }

   
    if (status === true) {
      await Month.updateMany({}, { status: false });
    }

   
    const newMonth = new Month({ year, month, status });
    await newMonth.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `${newMonth} created successfully`,
      data: newMonth
    });
  } catch (error) {
    if (error.code === 11000) {
      // Handle duplicate key error
      next(new BadRequestError(`This year and month combination already exists`));
    } else {
      next(error);
    }
  }
};


export const getAllMonths = async (req, res, next) => {
  try {
    const months = await Month.find().sort({ year: -1, month: 1 });
    
    res.status(StatusCodes.OK).json({
      success: true,
      count: months.length,
      data: months
    });
  } catch (error) {
    next(error);
  }
};


export const getMonthsByYear = async (req, res, next) => {
  try {
    const { year } = req.params;
    const months = await Month.find({ year: parseInt(year) }).sort({ month: 1 });
    
    res.status(StatusCodes.OK).json({
      success: true,
      year: parseInt(year),
      count: months.length,
      data: months
    });
  } catch (error) {
    next(error);
  }
};

// Activate a specific month (deactivates others)
export const activateMonth = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Deactivate all months first
    await Month.updateMany({}, { status: false });
    
    // Activate the specified month
    const month = await Month.findByIdAndUpdate(
      id,
      { status: true },
      { new: true }
    );
    
    if (!month) {
      throw new NotFoundError(`Month with ID ${id} not found`);
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `${month} activated successfully`,
      data: month
    });
  } catch (error) {
    next(error);
  }
};

// Get currently active month
export const getActiveMonth = async (req, res, next) => {
  try {
    const activeMonth = await Month.findOne({ status: true });
  

    if (!activeMonth) {
      throw new NotFoundError('No active month found');
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      data: activeMonth
    });
  } catch (error) {
    next(error);
  }
};

// Delete a month
export const deleteMonth = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const month = await Month.findById(id);
    if (!month) {
      throw new NotFoundError(`Month with ID ${id} not found`);
    }
    
    // Prevent deletion of active month
    if (month.status === true) {
      throw new BadRequestError('Cannot delete active month. Please activate another month first.');
    }
     const ismothhavedata =  await Milk.findOne({monthid:id})
     if(ismothhavedata){
      throw new BadRequestError("You can not delte this month in this month you have a data exist")
     }
    
    await Month.findByIdAndDelete(id);
    
    res.status(StatusCodes.OK).json({
      success: true,
      message: `${month} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};


