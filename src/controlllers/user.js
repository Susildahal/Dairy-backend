import User from "../models/user.js";
import {BadRequestError, NotFoundError} from "../middleware/errorHandler.js";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs";

 export const saveUser = async (req, res, next) => {
  try {
      const { name, email, phone, password, role ,tagnumber ,status  ,both ,maxUsers } = req.body;

      const emailexist = await User.find({email});
      if(emailexist.length===1){
        throw new BadRequestError("Email already exists");
      }
      const phonexist = await User.find({phone})
      if(phonexist.length===1){ 
        throw new BadRequestError("Phone number already exists");
      }
      const superadmin = await User.findOne({ role: 'superadmin' });
      if (role === 'superadmin' && superadmin) {
        throw new BadRequestError("A superadmin already exists you can not create more ok");
      }

      if(req.user.role === 'admin'){
        const admin = await User.findById(req.user.userId);
        const userCount = await User.countDocuments({adminId:req.user.userId});
        if(admin.maxUsers <= userCount){
            throw new BadRequestError("User limit reached for this admin");
        }
      }

      const createdBy = req.user.userId;
      let userAdminId = null;
      if (req.user.role === 'superadmin' && role === 'admin') {
        // When SuperAdmin creates an Admin, they are their own admin identifier? 
        // Or we leave it null for admins.
        userAdminId = null; 
      } else if (req.user.role === 'admin' && role === 'user') {
        userAdminId = req.user.userId;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        tagnumber,
        maxUsers: maxUsers || 10,
        status: status !== undefined ? status : true,
        both: both !== undefined ? both : true,
        createdBy,
        adminId: userAdminId
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

    if (!password || (!email && !phone)) {
      throw new BadRequestError("Please provide email or phone and password");
    }

    const user = await User.findOne(email ? { email } : { phone });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestError("Invalid credentials");
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,        // REQUIRED for SameSite=None
      sameSite: true,    // REQUIRED for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      success: true,
      message: "login successfully",
      auth_token: token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      data: userSafe
    });

  } catch (err) {
    next(err);
  }
};


export const logoutUser = async (req, res, next) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    // Clear cookies exactly as they were set
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/", // always include path
    });

    res.clearCookie("auth_status", {
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};


export const getUser = async (req, res, next) => {
    try {
        let filter = {};
        
        // If the requester is an admin, they can only see users they created/manage
        if (req.user.role === 'admin') {
            filter.adminId = req.user.userId;
            filter.role = 'user'; // Admins should typically only see 'user' role
        } 
        // If superadmin, they can see everything unless they provide a specific filter
        
        const user = await User.find(filter).select('-password').select('-__v');
        if (!user) {
            throw new NotFoundError("User not found");
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: {
                user,
                total: user.length
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getme = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) {
            throw new NotFoundError("User not found");
        }
        res.status(StatusCodes.OK).json({
            success: true,
            data: user,
            
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

export const getUsers = async (req, res, next) => {
    try {
        let { role, adminId } = req.query;
        let filter = {};

        // If an admin is requesting, force the filter to their own ID and role=user
        if (req.user.role === 'admin') {
            filter.adminId = req.user.userId;
            filter.role = 'user';
        } else {
            // Otherwise use query params (SuperAdmin can see anything)
            if (role) filter.role = role;
            if (adminId) filter.adminId = adminId;
        }

        const users = await User.find(filter).select("-password");
        res.status(StatusCodes.OK).json({
            success: true,
            data: users,
            count: users.length
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
    
        const {name, email, phone, password, role ,tagnumber ,status , both} = req.body;
      

     const userExist = await User.find({ email });

        const emailChanged = userExist.length === 1 && userExist[0]._id.toString() !== id;
        if (emailChanged) {
            throw new BadRequestError("Email already exists");
        }

        const phonexist = await User.find({phone});
        if (phonexist.length === 1 && phonexist[0]._id.toString() !== id) {
            throw new BadRequestError("Phone number already exists");
        }

        const user = await User.findByIdAndUpdate(id, {name, email, phone, password, role ,tagnumber ,status ,both}, { new: true });
        if (!user) {
            throw new NotFoundError("User not found");
        }


        res.status(StatusCodes.OK).json({
            success: true,
            message: "User updated successfully",
            data: user
        });
    } catch (error) {
        next(error);
    }
};


export const getbyid=  async(req,resp,next )=>{
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

export const updateBothStatus = async( req,resp,next)=>{
    try {
        const id = req.params.id;

        const user = await User.findById(id);
        if (!user) {
            throw new NotFoundError("User not found");
        }

        user.both = !user.both;
        await user.save();

        resp.status(StatusCodes.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
}