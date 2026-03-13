import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  GraduationCap, 
  Trophy, 
  Users, 
  History, 
  ChevronRight, 
  Plus, 
  ArrowLeft, 
  MessageSquare, 
  User as UserIcon,
  Clock,
  Send,
  Trash2,
  Search
} from 'lucide-react';
import { User } from '../types';

interface Category {
  id: number;
  name: string;
  description: string;
  icon: string;
  topics_count: number;
  posts_count: number;
}

interface Topic {
  id: number;
  category_id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  author_name: string;
  author_role: string;
  replies_count: number;
}

interface Post {
  id: number;
  topic_id: number;
  user_id: number;
  content: string;
  created_at: string;
  author_name: string;
  author_role: string;
  author_avatar: string | null;
}

const iconMap: Record<string, any> = {
  MessageCircle,
  GraduationCap,
  Trophy,
  Users,
  History
};

export const Forum = ({ user, deepLink }: { user: User | null, deepLink: any }) => {
  const [view, setView] = useState<'categories' | 'topics' | 'topic'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTopic, setShowCreateTopic] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '' });
  const [newReply, setNewReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (deepLink) {
      if (deepLink.topic_id) {
        fetchTopicDetail(parseInt(deepLink.topic_id));
      } else if (deepLink.category_id) {
        const catId = parseInt(deepLink.category_id);
        fetchTopics(catId);
      }
    }
  }, [deepLink]);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/forum/categories');
      const data = await res.json();
      setCategories(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTopics = async (categoryId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum/categories/${categoryId}/topics`);
      const data = await res.json();
      setTopics(data);
      const cat = categories.find(c => c.id === categoryId);
      if (cat) setSelectedCategory(cat);
      setView('topics');
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTopicDetail = async (topicId: number) => {
    setLoading(true);
    try {
      const [topicRes, postsRes] = await Promise.all([
        fetch(`/api/forum/topics/${topicId}`),
        fetch(`/api/forum/topics/${topicId}/posts`)
      ]);
      const topicData = await topicRes.json();
      const postsData = await postsRes.json();
      setSelectedTopic(topicData);
      setPosts(postsData);
      setView('topic');
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCategory) return;
    try {
      const res = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_id: selectedCategory.id,
          user_id: user.id,
          ...newTopic
        })
      });
      if (res.ok) {
        const data = await res.json();
        setShowCreateTopic(false);
        setNewTopic({ title: '', content: '' });
        fetchTopicDetail(data.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopic || !newReply.trim()) return;
    try {
      const res = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic_id: selectedTopic.id,
          user_id: user.id,
          content: newReply
        })
      });
      if (res.ok) {
        setNewReply('');
        fetchTopicDetail(selectedTopic.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTopic = async (e: React.MouseEvent, topicId: number) => {
    e.stopPropagation();
    if (!user || user.role !== 'admin') return;
    if (!confirm('Are you sure you want to delete this topic and all its posts?')) return;

    try {
      const res = await fetch(`/api/forum/topics/${topicId}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedCategory) fetchTopics(selectedCategory.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!user || user.role !== 'admin') return;
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const res = await fetch(`/api/forum/posts/${postId}?user_id=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        if (selectedTopic) fetchTopicDetail(selectedTopic.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredTopics = topics.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(p => 
    p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && view === 'categories') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-school-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-display">Community Forum</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">Discuss, share, and connect with the Ndejjean community</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm focus:ring-2 focus:ring-school-primary outline-none transition-all shadow-sm"
            />
          </div>
          {view === 'topics' && user && (
            <button 
              onClick={() => setShowCreateTopic(true)}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-school-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-school-primary/20 whitespace-nowrap"
            >
              <Plus className="w-5 h-5" />
              <span className="sm:inline">New Topic</span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'categories' && (
          <motion.div 
            key="categories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon] || MessageCircle;
              return (
                <button
                  key={cat.id}
                  onClick={() => fetchTopics(cat.id)}
                  className="flex items-start gap-4 p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 hover:border-school-primary dark:hover:border-school-secondary transition-all text-left group"
                >
                  <div className="p-3 bg-school-primary/10 dark:bg-school-secondary/10 rounded-xl text-school-primary dark:text-school-secondary group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{cat.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{cat.description}</p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {cat.topics_count} Topics
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {cat.posts_count} Posts
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-school-primary transition-colors" />
                </button>
              );
            })}
          </motion.div>
        )}

        {view === 'topics' && (
          <motion.div 
            key="topics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button 
              onClick={() => setView('categories')}
              className="flex items-center gap-2 text-sm font-bold text-school-primary dark:text-school-secondary hover:underline mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Categories
            </button>
            
            <div className="bg-school-primary/5 dark:bg-school-secondary/5 p-4 rounded-xl border border-school-primary/10 dark:border-school-secondary/10 mb-6">
              <h2 className="text-xl font-bold text-school-primary dark:text-school-secondary">{selectedCategory?.name}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">{selectedCategory?.description}</p>
            </div>

            {filteredTopics.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">No topics found</h3>
                <p className="text-slate-500 dark:text-slate-400">{searchQuery ? 'Try a different search term' : 'Be the first to start a discussion in this category!'}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 overflow-hidden">
                {filteredTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => fetchTopicDetail(topic.id)}
                    className="w-full flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                        <UserIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-school-primary transition-colors line-clamp-1">{topic.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-[10px] sm:text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <span>By {topic.author_name}</span>
                            <span className="px-1 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[8px] sm:text-[9px] font-bold rounded uppercase tracking-wider">
                              {topic.author_role}
                            </span>
                          </div>
                          <span>•</span>
                          <span>{formatDate(topic.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4 pl-14 sm:pl-0">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-bold text-slate-900 dark:text-white">{topic.replies_count}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Replies</div>
                        </div>
                        {user?.role === 'admin' && (
                          <button 
                            onClick={(e) => handleDeleteTopic(e, topic.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            title="Delete Topic"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-300 hidden sm:block" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === 'topic' && selectedTopic && (
          <motion.div 
            key="topic-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <button 
              onClick={() => fetchTopics(selectedTopic.category_id)}
              className="flex items-center gap-2 text-sm font-bold text-school-primary dark:text-school-secondary hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Topics
            </button>

            {/* Original Topic Post */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 overflow-hidden shadow-sm">
              <div className="p-5 md:p-6 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-2">{selectedTopic.title}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <UserIcon className="w-4 h-4" />
                    <span className="font-bold text-school-primary dark:text-school-secondary">{selectedTopic.author_name}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[9px] md:text-[10px] font-bold rounded uppercase tracking-wider ml-1">
                      {selectedTopic.author_role}
                    </span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(selectedTopic.created_at)}
                  </div>
                </div>
              </div>
              <div className="p-5 md:p-6 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                {selectedTopic.content}
              </div>
            </div>

            {/* Replies */}
            <div className="space-y-4 sm:ml-4 md:ml-8 border-l-2 border-slate-100 dark:border-white/10 pl-4 md:pl-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Replies ({filteredPosts.length})</h3>
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 p-4 md:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {post.author_avatar ? (
                        <img src={post.author_avatar} className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">{post.author_name}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-[8px] sm:text-[10px] font-bold rounded uppercase tracking-wider">
                            {post.author_role}
                          </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-slate-400">{formatDate(post.created_at)}</span>
                      </div>
                    </div>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm whitespace-pre-wrap">
                    {post.content}
                  </div>
                </div>
              ))}

              {/* Reply Form */}
              {user ? (
                <form onSubmit={handleReply} className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/10 p-6 shadow-lg">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-4">Write a reply</h4>
                  <textarea
                    value={newReply}
                    onChange={(e) => setNewReply(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-school-primary transition-all text-slate-900 dark:text-white text-sm min-h-[120px] resize-none"
                    required
                  />
                  <div className="flex justify-end mt-4">
                    <button 
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 bg-school-primary text-white rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-school-primary/20"
                    >
                      <Send className="w-4 h-4" />
                      Post Reply
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-8 p-6 bg-slate-50 dark:bg-white/5 rounded-2xl text-center border border-dashed border-slate-200 dark:border-white/10">
                  <p className="text-slate-500 dark:text-slate-400">Please log in to participate in the discussion.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Topic Modal */}
      <AnimatePresence>
        {showCreateTopic && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/10 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Start a New Topic</h3>
                <button onClick={() => setShowCreateTopic(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors">
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
              <form onSubmit={handleCreateTopic} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Topic Title</label>
                  <input 
                    type="text"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({...newTopic, title: e.target.value})}
                    placeholder="What's on your mind?"
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-school-primary transition-all text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Content</label>
                  <textarea 
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({...newTopic, content: e.target.value})}
                    placeholder="Describe your topic in detail..."
                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-white/5 border-none outline-none focus:ring-2 focus:ring-school-primary transition-all text-slate-900 dark:text-white min-h-[200px] resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowCreateTopic(false)}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 px-4 rounded-xl font-bold bg-school-primary text-white hover:scale-[1.02] transition-all shadow-lg shadow-school-primary/20"
                  >
                    Create Topic
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
