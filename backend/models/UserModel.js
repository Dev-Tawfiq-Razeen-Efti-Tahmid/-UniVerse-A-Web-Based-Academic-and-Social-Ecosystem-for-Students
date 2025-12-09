import mongoose from "mongoose";

// Define the structure (schema) of a User document
const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
    },
    student_id: { 
      type: String, 
      required: true,
      unique: true,
    },
    DateOfBirth: { 
      type: String, 
      required: true,
    },
    email: { 
      type: String, 
      required: true, 
      unique: true,
    },
    UserName: { 
      type: String, 
      required: true,
      unique: true,
    },
    password: { 
      type: String, 
      required: true,
    },
    department: { 
      type: String, 
      required: true,
    },
    profilePic: { 
      type: String, 
      required: false,
      default: null
    }
  },
  { timestamps: true } // automatically adds createdAt and updatedAt fields
);

// Create and export the model
export default mongoose.model("User", userSchema);
