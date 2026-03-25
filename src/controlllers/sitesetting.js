import SiteSettings from "../models/sitesetting.js"
import {BadRequestError,NotFoundError } from "../middleware/errorHandler.js"
import { StatusCodes } from "http-status-codes";


export const saveSiteSettings = async (req, res, next) => {
  try {
    const { name, phone, email, rate_of_user, rate_of_admin } = req.body;
    const adminId = req.user.userId; 
    console.log(adminId)

    if (!name || !phone || !email || !rate_of_user || !rate_of_admin) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const existingSettings = await SiteSettings.findOne({ adminId });
    if (existingSettings) {
      throw new BadRequestError("Site settings for this admin already exist");
    }
    const data = new SiteSettings({
      name,
      phone,
      email,
      rate_of_user,
      rate_of_admin,
      adminId
    });

    await data.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Site settings saved successfully",
      data: data
    });
  } catch (error) {
    next(error);
  }
};


export const getdata = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const data = await SiteSettings.findOne({ adminId });
    if (!data) {
      throw new NotFoundError("Site settings not found for this admin");
    }
    res.status(StatusCodes.OK).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req, res, next) => {
  try {
    const { name, phone, email, rate_of_user, rate_of_admin } = req.body;
    const adminId = req.user.userId;
    const data = await SiteSettings.findOneAndUpdate({ adminId }, { name, phone, email, rate_of_user, rate_of_admin }, { new: true });
    if (!data) {
      throw new NotFoundError("Site settings not found for this admin");
    }
    res.status(StatusCodes.OK).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};
