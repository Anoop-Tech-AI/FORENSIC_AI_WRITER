const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/authRole');

// Delete all users endpoint
router.delete('/delete-all-users', protect, checkRole(['admin']), async (req, res) => {
  try {
    console.log('Deleting all users from database...');
    
    // Delete all users
    const result = await User.deleteMany({});
    
    console.log(`Deleted ${result.deletedCount} users from database`);
    
    // Verify deletion
    const remainingUsers = await User.countDocuments();
    console.log(`Remaining users in database: ${remainingUsers}`);
    
    if (remainingUsers === 0) {
      return res.json({ 
        message: "All users deleted successfully",
        deletedCount: result.deletedCount,
        remainingUsers: 0
      });
    } else {
      return res.status(500).json({ 
        message: "Some users may still remain",
        deletedCount: result.deletedCount,
        remainingUsers: remainingUsers
      });
    }
    
  } catch (error) {
    console.error('❌ ERROR deleting users:', error);
    return res.status(500).json({ 
      message: "Error deleting users",
      error: error.message 
    });
  }
});

module.exports = router;
