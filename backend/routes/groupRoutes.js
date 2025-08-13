const express = require('express');
const router = express.Router();
const { checkJwt } = require('../middlewares/authMiddleware');
const Group = require('../models/Group');
const User = require('../models/User');

// Create a new group
router.post('/groups', checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { name, description, type } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    // Generate a unique invite code
    const generateInviteCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };

    let inviteCode;
    let isUnique = false;
    
    while (!isUnique) {
      inviteCode = generateInviteCode();
      const existing = await Group.findOne({ inviteCode });
      if (!existing) {
        isUnique = true;
      }
    }

    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      type: type || 'other',
      createdBy: userId,
      members: [userId],
      inviteCode: inviteCode
    });

    await group.save();
    res.status(201).json(group);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get user's groups
router.get('/groups', checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub;
    
    const groups = await Group.find({
      members: userId,
      isActive: true
    }).sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

// Get a specific group
router.get('/groups/:groupId', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;

    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Get group members
router.get('/groups/:groupId/members', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;

    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(userId)) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // For now, return mock data since we don't have user profiles yet
    // TODO: Replace with actual user data when user management is implemented
    const mockMembers = [
      { 
        id: userId, 
        name: 'You', 
        email: req.user.email || 'user@example.com', 
        isCurrentUser: true,
        avatar: req.user.picture || null
      }
    ];

    // Add other mock members for testing
    const otherMockMembers = [
      { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', isCurrentUser: false },
      { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', isCurrentUser: false },
      { id: 'user4', name: 'Alice Brown', email: 'alice@example.com', isCurrentUser: false }
    ];

    // Only add other members if this is a multi-member group
    const members = group.members.length > 1 ? [...mockMembers, ...otherMockMembers] : mockMembers;

    res.json(members);
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({ error: 'Failed to fetch group members' });
  }
});

// Join a group by invite code
router.post('/groups/join', checkJwt, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ error: 'Invite code is required' });
    }

    const group = await Group.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!group) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({ error: 'You are already a member of this group' });
    }

    group.members.push(userId);
    await group.save();

    res.json({ message: 'Successfully joined group', group });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({ error: 'Failed to join group' });
  }
});

// Update a group
router.put('/groups/:groupId', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;
    const updates = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only group admin can update
    if (group.createdBy !== userId) {
      return res.status(403).json({ error: 'Only group admin can update group' });
    }

    Object.assign(group, updates);
    await group.save();

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// Delete a group
router.delete('/groups/:groupId', checkJwt, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.sub;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Only group admin can delete
    if (group.createdBy !== userId) {
      return res.status(403).json({ error: 'Only group admin can delete group' });
    }

    await Group.findByIdAndDelete(groupId);
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ error: 'Failed to delete group' });
  }
});

module.exports = router;
