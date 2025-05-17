const verifySellerOrAdmin = (req, res, next) => {
  const user = req.user;

  if (user && (user.role === "seller" || user.role === "admin")) {
    next();
  } else {
    return res.status(403).json({
      message: "Access denied. Only sellers or admins are allowed.",
    });
  }
};

export default verifySellerOrAdmin;
