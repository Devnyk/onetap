// Dummy controller
export const getUsers = (req, res) => {
  res.json([{ name: "Test User", email: "test@example.com" }]);
};