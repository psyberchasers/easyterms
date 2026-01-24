import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";

export default function BlogPage() {
  const posts = getAllPosts();
  const featuredPost = posts.find((p) => p.featured);
  const otherPosts = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-full bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Blog</h1>
          <p className="text-muted-foreground">
            Insights, updates, and guides for navigating the music industry.
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link href={`/dashboard/blog/${featuredPost.slug}`} className="block mb-8">
            <article className="group rounded-2xl border border-border bg-card p-6 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-500/10 text-purple-500">
                  Featured
                </span>
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {featuredPost.category}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-purple-500 transition-colors">
                {featuredPost.title}
              </h2>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  {featuredPost.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(featuredPost.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {featuredPost.readTime}
                </span>
              </div>
            </article>
          </Link>
        )}

        {/* Other Posts */}
        {otherPosts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              All Posts
            </h3>
            <div className="space-y-3">
              {otherPosts.map((post) => (
                <Link key={post.slug} href={`/dashboard/blog/${post.slug}`} className="block">
                  <article className="group rounded-xl border border-border bg-card p-4 hover:border-purple-500/50 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                            {post.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-purple-500 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {post.excerpt}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground shrink-0">
                        <span>
                          {new Date(post.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
