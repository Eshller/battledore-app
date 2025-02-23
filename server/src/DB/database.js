import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`);
  } catch (error) {
    console.error("Error from DB file :: ", error.message);
    process.exit(1);
  }
};

export default connectDB;
