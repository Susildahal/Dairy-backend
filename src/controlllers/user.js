import User from "../models/user.js";
import {BadRequestError, NotFoundError} from "../middleware/errorHandler.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";

 export const saveUser = async (req, res, next) => {
  try {
      const { name, email, phone, password, role ,tagnumber ,status } = req.body;

      const emailexist = await User.find({email});
      if(emailexist.length===1){
        throw new BadRequestError("Email already exists");
      }
      const phonexist = await User.find({phone})
      if(phonexist.length===1){ 
        throw new BadRequestError("Phone number already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        tagnumber,
        status

      });
      res.status(StatusCodes.CREATED).json({
        success: true,
        data: {
          user,
        }
      });
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (req, res, next) => {
    try {
        const { email, phone, password } = req.body;

        if (!email && !phone) {
            throw new BadRequestError("Please provide email or phone and password");
        }

        const query = email ? { email } : { phone };
        const user = await User.findOne(query);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new BadRequestError("Invalid credentials");
        }

        const token = jwt.sign(
            { userId: user._id, role: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 3600000 // 1 hour
        });

        // omit password from response
        const userSafe = user.toObject ? user.toObject() : { ...user };
        delete userSafe.password;

        res.status(StatusCodes.OK).json({
            success: true,
            data: userSafe
        });
    } catch (error) {
        next(error);
    }
};


export const getUser = async (req, res, next) => {
    try {
        const user = await User.find().select('-password')  .select('-__v');
        if (!user) {
            throw new NotFoundError("User not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                user,
                total:user.length
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getme = async (req, res, next) => {
    try {
        res.status(StatusCodes.OK).json({
            success: true,
            data: req.user,
            
        });
    } catch (error) {
        next(error);
    }
};


export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) {
            throw new BadRequestError("User ID is required");
        }
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                user
            }
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUser = async (req, res, next) => {
    try {
        res.clearCookie("token");
        res.status(StatusCodes.OK).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const islogin = async (req, res ,next) => {
    try {
        res.status(StatusCodes.OK).json({
            success: true,
            message: "User is logged in"
        });
    } catch (error) {
        next(error);
    }
};


export const editUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {name, email, phone, password, role ,tagnumber ,status} = req.body;
       

     const userExist = await User.find({ email });

        const emailChanged = userExist.length === 1 && userExist[0]._id.toString() !== id;
        if (emailChanged) {
            throw new BadRequestError("Email already exists");
        }

        const phonexist = await User.find({phone});
        if (phonexist.length === 1 && phonexist[0]._id.toString() !== id) {
            throw new BadRequestError("Phone number already exists");
        }

        const user = await User.findByIdAndUpdate(id, {name, email, phone, password, role ,tagnumber ,status}, { new: true });
        if (!user) {
            throw new NotFoundError("User not found");
        }


        res.status(StatusCodes.OK).json({
            success: true,
            data: 
user
        });
    } catch (error) {
        next(error);
    }
};


export const getbyid=  async(req,resp)=>{
    try {
        const {id} = req.params;
        const user = await User.findById(id).select('-password');
        if (!user) {
            throw new NotFoundError("User not found");
        }

        resp.status(StatusCodes.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

export const updatestatus = async( req,resp,next)=>{
    try {
        const id = req.params.id;

        const user = await User.findById(id);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        user.status = !user.status;
        await user.save();

        resp.status(StatusCodes.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}
