import User from "../models/User.js";

// GET /api/users
export const getUsers = async (req, res) => {

 
  try {
    const users = await User.find();

    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
  }
};

// GET /api/users/userslist
export const getUsersList = async (req, res) => {
  try {
    
    const users = await User.find().select("id username role");
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users list error:", error);
    res.status(500).json({
      message: "Failed to fetch users list",
      error: error.message
    });
  }
};

// GET /api/users/:id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Get user error:", error);

    res.status(500).json({
      message: "Failed to fetch user",
      error: error.message
    });
  }
};

// POST /api/users
export const createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      role
    } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required"
      });
    }

    if (!["User", "Admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be User or Admin"
      });
    }

    const existingUser = await User.findOne({
      username
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username already exists"
      });
    }

    const user = await User.create({
      username,
      password,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const response = user.toObject();

    delete response.password;

    res.status(201).json(response);
  } catch (error) {
    console.error("Create user error:", error);

    res.status(400).json({
      message: "Failed to create user",
      error: error.message
    });
  }
};

// PUT /api/users/:id
export const updateUser = async (req, res) => {
  try {
    const {
      password,
      createdAt,
      ...updateData
    } = req.body;

    if (updateData.role) {
      if (!["User", "Admin"].includes(updateData.role)) {
        return res.status(400).json({
          message: "Role must be User or Admin"
        });
      }
    }

    if (password) {
      updateData.password = password;
    }

    updateData.updatedAt = new Date().toISOString();

    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      {
        returnDocument: "after",
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Update user error:", error);

    res.status(400).json({
      message: "Failed to update user",
      error: error.message
    });
  }
};

// PATCH /api/users/:id
export const patchUser = async (req, res) => {
  try {
    const {
      id,
      password,
      createdAt,
      ...updateData
    } = req.body;

    if (updateData.role) {
      if (!["User", "Admin"].includes(updateData.role)) {
        return res.status(400).json({
          message: "Role must be user or admin"
        });
      }
    }

    if (password) {
      updateData.password = password;
    }

    updateData.updatedAt = new Date().toISOString();

    const user = await User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updateData },
      {
        new: true,
        runValidators: true
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Patch user error:", error);

    res.status(400).json({
      message: "Failed to update user",
      error: error.message
    });
  }
};

// DELETE /api/users/:id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Failed to delete user",
      error: error.message
    });
  }
};
