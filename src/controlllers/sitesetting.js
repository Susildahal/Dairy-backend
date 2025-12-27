import SiteSettings from "../models/sitesetting.js"
import {BadRequestError,NotFoundError } from "../middleware/errorHandler.js"
import { StatusCodes } from "http-status-codes";





export const saveSiteSettings = async (req, res, next) => {
  try {
    const { name, phone, email, rate_of_user, rate_of_admin } = req.body;
    if (!name || !phone || !email || !rate_of_user || !rate_of_admin) {
      return res.status(400).json({ message: "All fields are required" });
    }
const total = await SiteSettings.countDocuments();
if(total >= 1) {
throw new BadRequestError("Only one site settings document is allowed");
}
    const data = new SiteSettings({
      name,
      phone,
      email,
      rate_of_user,
      rate_of_admin
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
    const data = await SiteSettings.findOne();
    if (!data) {
      throw new NotFoundError("Site settings not found");
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
    const data = await SiteSettings.findOneAndUpdate({}, { name, phone, email, rate_of_user, rate_of_admin }, { new: true });
    if (!data) {
      throw new NotFoundError("Site settings not found");
    }
    res.status(StatusCodes.OK).json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
};
