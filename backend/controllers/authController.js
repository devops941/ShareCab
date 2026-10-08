const authService = require('../services/authService');

const signupCustomer = async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required for customer signup.' });
  }

  try {
    const newCustomer = await authService.createCustomer({ name, email, phone, password });
    console.log('New Customer Saved to DB:', newCustomer.email);

    res.status(201).json({ 
      message: 'Customer registered successfully', 
      user: { id: newCustomer._id, name: newCustomer.name, email: newCustomer.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create customer account' });
  }
};

const signupDriver = async (req, res) => {
  const { name, email, phone, password, carModel, vehicleNumber, license, insurance } = req.body;

  if (!name || !email || !phone || !password || !carModel || !vehicleNumber || !license || !insurance) {
    return res.status(400).json({ error: 'All fields are required for driver signup.' });
  }

  try {
    const newDriver = await authService.createDriver({ 
      name, email, phone, password, carModel, vehicleNumber, license, insurance 
    });
    console.log('New Driver Saved to DB:', newDriver.email);

    res.status(201).json({ 
      message: 'Driver registered successfully', 
      user: { id: newDriver._id, name: newDriver.name, email: newDriver.email } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create driver account' });
  }
};

const loginCustomer = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

  try {
    const user = await authService.loginCustomer(phone, password);
    if (!user) return res.status(401).json({ error: 'Invalid phone or password' });
    res.status(200).json({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email, role: 'customer' } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const loginDriver = async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' });

  try {
    const user = await authService.loginDriver(phone, password);
    if (!user) return res.status(401).json({ error: 'Invalid phone or password' });
    res.status(200).json({ message: 'Login successful', user: { id: user._id, name: user.name, email: user.email, role: 'driver' } });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

const getProfile = async (req, res) => {
  try {
    const { role, userId } = req.params;
    const user = await authService.getProfile(userId, role);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { role, userId } = req.params;
    const updateData = req.body;
    // Do not allow updating password via this route
    delete updateData.password;
    
    const updatedUser = await authService.updateProfile(userId, role, updateData);
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  signupCustomer,
  signupDriver,
  loginCustomer,
  loginDriver,
  getProfile,
  updateProfile
};
