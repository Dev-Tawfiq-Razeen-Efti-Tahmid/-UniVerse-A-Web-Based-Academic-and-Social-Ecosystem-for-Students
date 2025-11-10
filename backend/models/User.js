import mongoose from "mongoose";

// Define the structure (schema) of a User document
const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    }
  },
  { timestamps: true } // automatically adds createdAt and updatedAt fields
);

// Create and export the model
export default mongoose.model("User", userSchema);
