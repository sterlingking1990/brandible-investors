"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type BlogPost = {
  id: string;
  title: string;
  cover_image_url?: string;
  created_at: string;
  published_at: string;
  author_id: string;
  profiles: {
    full_name: string;
  };
};

export default function BlogListPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        const response = await fetch('/api/blog');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: BlogPost[] = await response.json();
        setBlogPosts(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogPosts();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p>Loading blog posts...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 md:p-24 bg-gray-50">
        <p className="text-red-500">Error loading blog posts: {error}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="container mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-8 text-center">Brandible Blog</h1>

        {blogPosts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No blog posts published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Link href={`/blog/${post.id}`} key={post.id} className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                {post.cover_image_url && (
                  <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      fill
                      style={{ objectFit: 'cover' }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{post.title}</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    By {post.profiles?.full_name || 'Unknown Author'} on {new Date(post.published_at || post.created_at).toLocaleDateString()}
                  </p>
                  {/* You might want to add a short excerpt here */}
                  <span className="text-indigo-600 hover:text-indigo-500 font-medium">Read More &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
