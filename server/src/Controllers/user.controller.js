import { User } from "../Models/user.model.js";
import { Match } from "../Models/matchs.model.js";

const registerUser = async (req, res) => {
  try {
    const { jobrole, username, email, password } = req.body;
    if (
      [jobrole, username, email, password].some((field) => field?.trim() === "")
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existedUser = await User.findOne({ email });
    if (existedUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }

    const existedUsername = await User.findOne({ username });
    if (existedUsername) {
      return res.status(409).json({ message: "Username already taken" });
    }

    let user;

    if (jobrole.toLowerCase() === "match controller") {
      user = await User.create(req.body);
    } else {
      let tempholder;
      if (jobrole.toLowerCase() === "umpire") {
        tempholder = new User({
          ...req.body,
          isUmpire: true,
        });
      } else {
        tempholder = new User({
          ...req.body,
          isUmpire: true,
          isOperator: true,
        });
      }
      user = await User.create(tempholder);
    }

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
      return res
        .status(500)
        .json({ message: "Something went wrong while registering the user" });
    }

    return res
      .status(201)
      .json({ data: createdUser, message: "User registered successfully" });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Please select from the dropdown",
        err: error.message,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if ([email, password].some((field) => field?.trim() === "")) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      details: user,
      message: "Login successful",
      token: user.generateToken(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const allUsers = async (req, res) => {
  try {
    // Only return users that are not players (accounts)
    const users = await User.find({ isPlayer: { $ne: true } });
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// New function to get only players
const getAllPlayers = async (req, res) => {
  try {
    // Only return users that are players
    const players = await User.find({ isPlayer: true });
    res.status(200).json({ users: players });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const user = await User.findOne({
      username: req?.user?.username,
    })?.populate("matches");
    if (user) {
      return res.json({ userData: user });
    }
    return res.json({ message: "User not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateUserDetail = async (req, res) => {
  try {
    const { _id } = req.user;
    const existingUser = await User.findById({ _id });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const { jobrole, username, email } = req.body;
    if ([jobrole, username, email].some((field) => field?.trim() === "")) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const updatedDetails = await User.findByIdAndUpdate(_id, req.body, {
      new: true,
    });
    if (!updatedDetails) {
      return res
        .status(500)
        .json({ message: "Something went wrong while updating your data" });
    }

    return res.status(200).json({
      data: updatedDetails,
      message: "Your data has been updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const createNewPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if ([email, password].some((field) => field?.trim() === "")) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password;
    const updatedDetails = await user.save();

    if (!updatedDetails) {
      return res
        .status(500)
        .json({ message: "Something went wrong while updating your data" });
    }

    return res.status(200).json({
      message: "Your data has been updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const existedUser = await User.findById({ _id: userId });
    if (!existedUser) {
      return res.status(404).json({ message: "User details not found" });
    }

    const deletedUser = await User.findByIdAndDelete({ _id: userId });
    if (!deletedUser) {
      return res
        .status(500)
        .json({ message: "Something went wrong while deleting the user" });
    }

    // Send different messages based on whether it's a player or an account
    const message = deletedUser.isPlayer 
      ? "Player deleted successfully" 
      : "Account deleted successfully";

    return res.status(200).json({ data: deletedUser, message });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error deleting user" });
  }
};

// New function to import players from CSV
const importPlayersFromCSV = async (req, res) => {
  try {
    const { players } = req.body;
    
    if (!players || !Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ message: "No player data provided" });
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Process each player from the CSV
    for (const playerData of players) {
      try {
        // Validate required fields - now including age, gender, and phone
        if (!playerData.name || !playerData.email || !playerData.age || !playerData.gender || !playerData.phone) {
          results.failed++;
          const missingFields = [];
          if (!playerData.name) missingFields.push("name");
          if (!playerData.email) missingFields.push("email");
          if (!playerData.age) missingFields.push("age");
          if (!playerData.gender) missingFields.push("gender");
          if (!playerData.phone) missingFields.push("phone");
          
          results.errors.push(`Missing required fields (${missingFields.join(", ")}) for player ${playerData.name || playerData.email || "unknown"}`);
          continue;
        }
        
        // Generate a username from name if not provided
        const username = playerData.username || 
          playerData.name.toLowerCase().replace(/\s+/g, '_');
        
        // Generate a random password
        const password = Math.random().toString(36).slice(-8);
        
        // Check if user with this email already exists
        const existingUser = await User.findOne({ email: playerData.email });
        if (existingUser) {
          results.failed++;
          results.errors.push(`User with email ${playerData.email} already exists`);
          continue;
        }
        
        // Convert age to number if provided
        const age = parseInt(playerData.age, 10);
        if (isNaN(age)) {
          results.failed++;
          results.errors.push(`Invalid age value for player ${playerData.name}: ${playerData.age}`);
          continue;
        }
        
        // Create the user with player role
        const newUser = new User({
          jobrole: "match controller", // Default role for imported players
          username,
          email: playerData.email,
          password,
          isPlayer: true, // Mark as a player
          // Add additional fields from CSV
          playerDetails: {
            name: playerData.name,
            phone: playerData.phone,
            age: age,
            gender: playerData.gender,
            address: playerData.address || ""
          }
        });
        
        await newUser.save();
        results.success++;
      } catch (error) {
        console.error("Error importing player:", error);
        results.failed++;
        results.errors.push(`Error importing ${playerData.name || playerData.email}: ${error.message}`);
      }
    }
    
    return res.status(200).json({ 
      message: `Successfully imported ${results.success} players. Failed: ${results.failed}`,
      results 
    });
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(500).json({ message: error.message });
  }
};
export {
  registerUser,
  loginUser,
  allUsers,
  getAllPlayers,
  getUser,
  updateUserDetail,
  createNewPassword,
  deleteUser,
  importPlayersFromCSV
};
