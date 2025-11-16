"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

type BlogPost = {
  id: string;
  title: string;
  content: string;
  cover_image_url?: string;
  created_at: string;
  published_at: string;
  author_id: string;
  profiles: {
    full_name: string;
  };
};

export default function BlogPostPage() {
  const { id } = useParams();
  const [blogPost, setBlogPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function fetchBlogPost() {
      try {
        const response = await fetch(`/api/blog/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BlogPost = await response.json();
        setBlogPost(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogPost();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p>Loading blog post...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-red-500">Error loading blog post: {error}</p>
        <Link href="/blog" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Blog
        </Link>
      </main>
    );
  }

  if (!blogPost) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-gray-700">Blog post not found.</p>
        <Link href="/blog" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Blog
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="container mx-auto bg-white rounded-lg shadow-md p-6 sm:p-8 lg:p-10">
        <Link href="/blog" className="text-indigo-600 hover:text-indigo-500 font-medium mb-4 block">
          &larr; Back to Blog
        </Link>

        {blogPost.cover_image_url && (
          <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden mb-6">
            <Image
              src={blogPost.cover_image_url}
              alt={blogPost.title}
              fill
              style={{ objectFit: 'cover' }}
              sizes="100vw"
            />
          </div>
        )}

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">{blogPost.title}</h1>
        <p className="text-sm text-gray-600 mb-6">
          By {blogPost.profiles?.full_name || 'Unknown Author'} on {new Date(blogPost.published_at || blogPost.created_at).toLocaleDateString()}
        </p>

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: blogPost.content }} />
      </div>
    </main>
  );
}
