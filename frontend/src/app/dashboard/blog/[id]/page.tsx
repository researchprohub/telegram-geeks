"use client";

import { use } from "react";
import BlogEditor from "@/components/blog/blog-editor";

export default function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <BlogEditor postId={Number(id)} />;
}