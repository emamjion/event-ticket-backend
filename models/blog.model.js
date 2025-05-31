import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    featureImage: { type: String },
    metaTitle: { type: String },
    metaDescription: { type: String },
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

const BlogModel = mongoose.models.Blog || mongoose.model("blog", blogSchema);
export default BlogModel;
