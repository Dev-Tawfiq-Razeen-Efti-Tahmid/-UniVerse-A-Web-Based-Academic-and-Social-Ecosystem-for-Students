import User from "../models/UserModel.js";

/**
 * Check if a user's suspension has expired and auto-reactivate if necessary
 * @param {Object} user - User object from database
 * @returns {Object} - { isExpired: boolean, user: updated user object or original }
 */
export const checkSuspensionExpiry = async (user) => {
  try {
    if (user.accountStatus !== "suspended" || !user.suspensionExpiresAt) {
      return { isExpired: false, user };
    }

    const now = new Date();
    if (now >= user.suspensionExpiresAt) {
      // Suspension has expired, reactivate account
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          accountStatus: "active",
          suspendedAt: null,
          suspensionDuration: null,
          suspensionExpiresAt: null,
          suspensionReason: null,
        },
        { new: true }
      );

      console.log(`[SUSPENSION] Auto-reactivated user ${user.UserName} (suspension expired)`);
      return { isExpired: true, user: updatedUser };
    }

    return { isExpired: false, user };
  } catch (err) {
    console.error("[SUSPENSION] Error checking suspension expiry:", err);
    return { isExpired: false, user };
  }
};

/**
 * Auto-reactivate all users with expired suspensions
 * Called by scheduled job
 */
export const autoReactivateExpiredSuspensions = async () => {
  try {
    const now = new Date();
    
    // Find all suspended users whose suspension has expired
    const expiredUsers = await User.find({
      accountStatus: "suspended",
      suspensionExpiresAt: { $lt: now },
    });

    if (expiredUsers.length === 0) {
      console.log("[SUSPENSION] No expired suspensions to reactivate");
      return { reactivatedCount: 0 };
    }

    // Batch update all expired suspensions
    const result = await User.updateMany(
      {
        accountStatus: "suspended",
        suspensionExpiresAt: { $lt: now },
      },
      {
        accountStatus: "active",
        suspendedAt: null,
        suspensionDuration: null,
        suspensionExpiresAt: null,
        suspensionReason: null,
      }
    );

    console.log(
      `[SUSPENSION] Auto-reactivated ${result.modifiedCount} users with expired suspensions`
    );
    return { reactivatedCount: result.modifiedCount };
  } catch (err) {
    console.error("[SUSPENSION] Error auto-reactivating suspended users:", err);
    return { reactivatedCount: 0, error: err.message };
  }
};

/**
 * Calculate suspension expiry time
 * @param {Number} durationHours - Duration in hours (null = permanent)
 * @returns {Date|null} - Expiry date or null for permanent suspension
 */
export const calculateSuspensionExpiry = (durationHours) => {
  if (!durationHours || durationHours === null) {
    return null; // Permanent suspension
  }

  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + durationHours);
  return expiryDate;
};

/**
 * Get human-readable suspension info
 * @param {Object} user - User object with suspension details
 * @returns {Object} - { status, message, hoursRemaining }
 */
export const getSuspensionInfo = (user) => {
  if (user.accountStatus !== "suspended") {
    return { status: "active", message: "Account is active", hoursRemaining: null };
  }

  if (!user.suspensionExpiresAt) {
    return {
      status: "permanently-suspended",
      message: "Account is permanently suspended",
      hoursRemaining: null,
      reason: user.suspensionReason,
    };
  }

  const now = new Date();
  const expiryTime = new Date(user.suspensionExpiresAt);
  const diffMs = expiryTime - now;

  if (diffMs <= 0) {
    return {
      status: "expired",
      message: "Suspension has expired",
      hoursRemaining: 0,
      reason: user.suspensionReason,
    };
  }

  const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  return {
    status: "temporarily-suspended",
    message: `Account suspended for ${daysRemaining}d ${hoursRemaining % 24}h`,
    hoursRemaining,
    daysRemaining,
    expiresAt: expiryTime,
    reason: user.suspensionReason,
  };
};
