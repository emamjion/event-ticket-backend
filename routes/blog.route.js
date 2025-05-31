import express from "express";
import {
  createBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
} from "../controllers/blog.controller.js";
import upload from "../middleware/multer.js";
import verifyAdmin from "../middleware/verifyAdmin.js";
import verifyToken from "../middleware/verifyToken.js";

const blogRouter = express.Router();
blogRouter.post(
  "/create-blog",
  upload.single("featureImage"),
  verifyToken,
  verifyAdmin,
  createBlog
);
blogRouter.get("/blogs", getAllBlogs);
blogRouter.get("/blogs/:id", getBlogById);
blogRouter.put(
  "/update/:id",
  upload.single("featureImage"),
  verifyToken,
  verifyAdmin,
  updateBlog
);
blogRouter.delete("/delete/:id", verifyToken, verifyAdmin, deleteBlog);

export default blogRouter;
