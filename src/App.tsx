import React, { useState, useEffect } from 'react';
import { 
  Home as HomeIcon, 
  BookOpen, 
  Calendar, 
  User as UserIcon, 
  LogOut, 
  PlusCircle, 
  MessageSquare, 
  Heart,
  Bell,
  Search,
  Menu,
  X,
  ChevronRight,
  Send,
  Trash2,
  Edit2,
  Clock,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Post, SchoolEvent, Comment, Message, Conversation } from './types';

// Components
const Navbar = ({ user, onLogout, activeTab, setActiveTab }: { 
  user: User | null, 
  onLogout: () => void, 
  activeTab: string, 
  setActiveTab: (tab: string) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: HomeIcon },
    { id: 'blog', label: 'School Blog', icon: BookOpen },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-8 h-8 bg-school-primary rounded-lg flex items-center justify-center">
                <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold font-display bg-clip-text text-transparent bg-gradient-to-r from-school-primary to-school-secondary">
                Ndejje SSS
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === item.id 
                    ? 'text-school-primary bg-school-primary/10' 
                    : 'text-slate-600 hover:text-school-primary hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
            {user ? (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('auth')}
                className="btn-primary text-sm"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-school-primary p-2"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium ${
                    activeTab === item.id 
                      ? 'text-school-primary bg-school-primary/10' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
              {user ? (
                <button 
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setActiveTab('auth');
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 btn-primary"
                >
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Home = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section with Video Background */}
      <section className="relative overflow-hidden rounded-[2rem] bg-school-primary text-white min-h-[600px] flex items-center p-8 md:p-20 shadow-2xl">
        {/* Video Background Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-school-primary/90 via-school-primary/60 to-transparent z-10"></div>
          <iframe
            className="absolute top-1/2 left-1/2 w-[300%] h-[300%] -translate-x-1/2 -translate-y-1/2 aspect-video opacity-60 scale-110"
            src="https://www.youtube.com/embed/wjGXg8rDT6U?autoplay=1&mute=1&loop=1&playlist=wjGXg8rDT6U&controls=0&showinfo=0&rel=0&iv_load_policy=3&modestbranding=1&enablejsapi=1"
            title="School Background Video"
            allow="autoplay; encrypted-media"
          ></iframe>
        </div>

        {/* Floating Decorative Elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-school-secondary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-1/2 w-64 h-64 bg-school-primary/30 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-school-secondary/20 backdrop-blur-md text-school-secondary text-sm font-bold tracking-wider uppercase mb-6 border border-school-secondary/30">
              Est. 1963 • Excellence in Education
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
              No Pain <br /> 
              <span className="text-school-secondary">No Gains</span>
            </h1>
            <p className="text-white/80 text-xl mb-10 max-w-xl leading-relaxed">
              Welcome to Ndejje Senior Secondary School. We are a Christ-centered institution dedicated to nurturing holistically competent citizens for a prosperous future.
            </p>
            <div className="flex flex-wrap gap-5">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('blog')} 
                className="bg-school-secondary text-school-primary px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-school-secondary/20 hover:bg-yellow-400 transition-all flex items-center gap-2"
              >
                Explore Blog <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('events')} 
                className="bg-white/10 text-white border border-white/20 backdrop-blur-md px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
              >
                School Events
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
        </motion.div>
      </section>

      {/* Quick Stats/Features */}
      <section className="grid md:grid-cols-3 gap-8">
        {[
          { title: 'Community Blog', desc: 'Stay updated with school news, student achievements, and academic insights.', icon: BookOpen, color: 'bg-school-primary', tab: 'blog' },
          { title: 'Event Calendar', desc: 'From sports days to parent meetings, never miss an important school date.', icon: Calendar, color: 'bg-school-secondary', tab: 'events' },
          { title: 'Parent Portal', desc: 'A dedicated space for direct engagement between parents and administration.', icon: UserIcon, color: 'bg-school-primary/80', tab: 'profile' },
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            whileHover={{ y: -10, scale: 1.02 }}
            className="group glass-card p-8 rounded-[2rem] cursor-pointer hover:shadow-2xl hover:shadow-school-primary/5 transition-all duration-300"
            onClick={() => setActiveTab(feature.tab)}
          >
            <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg group-hover:rotate-6 transition-transform`}>
              <feature.icon className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold mb-3 group-hover:text-school-primary transition-colors">{feature.title}</h3>
            <p className="text-slate-600 mb-6 leading-relaxed">{feature.desc}</p>
            <div className="flex items-center text-school-primary font-bold text-sm group-hover:translate-x-2 transition-transform">
              Explore Section <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </motion.div>
        ))}
      </section>

      {/* Announcements Section */}
      <section className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">School Announcements</h2>
              <p className="text-slate-500">Important updates for the Ndejje community</p>
            </div>
            <div className="p-3 bg-school-primary/5 rounded-2xl">
              <Bell className="text-school-primary w-7 h-7" />
            </div>
          </div>
          
          <div className="grid gap-4">
            {[
              { title: 'New Science Lab Opening Ceremony', date: 'Feb 28, 2026', tag: 'Facility', icon: '🔬' },
              { title: 'Term 1 Parent-Teacher Conference', date: 'Mar 05, 2026', tag: 'Meeting', icon: '🤝' },
              { title: 'Easter Break Schedule Released', date: 'Mar 10, 2026', tag: 'Holiday', icon: '📅' },
            ].map((item, i) => (
              <motion.div 
                key={i} 
                whileHover={{ x: 10 }}
                className="flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl group-hover:bg-white transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg group-hover:text-school-primary transition-colors">{item.title}</h4>
                    <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </div>
                <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest group-hover:bg-school-primary group-hover:text-white transition-colors">
                  {item.tag}
                </span>
              </motion.div>
            ))}
          </div>
          
          <button className="w-full mt-8 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-school-primary hover:text-school-primary transition-all">
            View All Announcements
          </button>
        </div>
      </section>
    </div>
  );
};

const Blog = ({ user }: { user: User | null }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  };

  const handleLike = async (postId: number) => {
    if (!user) return alert('Please sign in to like posts');
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id })
    });
    if (res.ok) fetchPosts();
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newPost, author_id: user.id })
    });
    if (res.ok) {
      setNewPost({ title: '', content: '' });
      setShowCreate(false);
      fetchPosts();
    }
  };

  const openComments = async (post: Post) => {
    setSelectedPost(post);
    const res = await fetch(`/api/posts/${post.id}/comments`);
    const data = await res.json();
    setComments(data);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost) return alert('Please sign in to comment');
    const res = await fetch(`/api/posts/${selectedPost.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, content: newComment })
    });
    if (res.ok) {
      setNewComment('');
      openComments(selectedPost);
      fetchPosts();
    }
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-primary"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">School Blog</h1>
          <p className="text-slate-600">Insights and updates from our community</p>
        </div>
        {user && (user.role === 'admin' || user.role === 'teacher') && (
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            New Post
          </button>
        )}
      </div>

      {showCreate && (user?.role === 'admin' || user?.role === 'teacher') && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg"
        >
          <form onSubmit={handleCreatePost} className="space-y-4">
            <input 
              type="text" 
              placeholder="Post Title" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
              value={newPost.title}
              onChange={e => setNewPost({...newPost, title: e.target.value})}
              required
            />
            <textarea 
              placeholder="What's on your mind?" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none min-h-[150px]"
              value={newPost.content}
              onChange={e => setNewPost({...newPost, content: e.target.value})}
              required
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">Publish Post</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-6">
        {posts.map(post => (
          <motion.article 
            key={post.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold">{post.author_name}</p>
                  <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-3">{post.title}</h2>
              <p className="text-slate-700 leading-relaxed mb-6 whitespace-pre-wrap">{post.content}</p>
              
              <div className="flex items-center gap-6 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => handleLike(post.id)}
                  className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span className="font-medium">{post.likes_count}</span>
                </button>
                <button 
                  onClick={() => openComments(post)}
                  className="flex items-center gap-2 text-slate-600 hover:text-school-primary transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">{post.comments_count}</span>
                </button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {/* Comments Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">Comments</h3>
                <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">No comments yet. Be the first to share your thoughts!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">{comment.user_name}</span>
                        <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-700 text-sm">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-100">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={user ? "Write a comment..." : "Sign in to comment"}
                    disabled={!user}
                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    disabled={!user || !newComment.trim()}
                    className="btn-primary"
                  >
                    Post
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Events = ({ user }: { user: User | null }) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', time: '', location: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('/api/events');
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    const method = editingEvent ? 'PUT' : 'POST';
    const url = editingEvent ? `/api/events/${editingEvent.id}` : '/api/events';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, user_id: user.id })
    });
    
    if (res.ok) {
      setFormData({ title: '', description: '', date: '', time: '', location: '' });
      setShowCreate(false);
      setEditingEvent(null);
      fetchEvents();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    const res = await fetch(`/api/events/${id}?user_id=${user?.id}`, {
      method: 'DELETE'
    });
    if (res.ok) fetchEvents();
  };

  const startEdit = (event: SchoolEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time || '',
      location: event.location
    });
    setShowCreate(true);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-primary"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Events</h1>
          <p className="text-slate-600">Mark your calendars for these school highlights</p>
        </div>
        {user && (user.role === 'admin' || user.role === 'teacher') && (
          <button 
            onClick={() => {
              setEditingEvent(null);
              setFormData({ title: '', description: '', date: '', time: '', location: '' });
              setShowCreate(!showCreate);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            {showCreate ? 'Close Form' : 'Add Event'}
          </button>
        )}
      </div>

      {showCreate && (user?.role === 'admin' || user?.role === 'teacher') && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input 
                type="text" 
                placeholder="Event Title" 
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            <input 
              type="date" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
            <input 
              type="time" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
              value={formData.time}
              onChange={e => setFormData({...formData, time: e.target.value})}
            />
            <div className="md:col-span-2">
              <input 
                type="text" 
                placeholder="Location" 
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2">
              <textarea 
                placeholder="Event Description" 
                className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none min-h-[100px]"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => { setShowCreate(false); setEditingEvent(null); }} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary">{editingEvent ? 'Update Event' : 'Create Event'}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {events.map(event => (
          <motion.div 
            key={event.id}
            whileHover={{ scale: 1.01 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex gap-6 relative group"
          >
            <div className="flex-shrink-0 w-20 h-20 bg-school-primary/10 rounded-2xl flex flex-col items-center justify-center text-school-primary">
              <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-3xl font-bold">{new Date(event.date).getDate()}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{event.title}</h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-sm mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{event.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{event.location}</span>
                </div>
              </div>
              <p className="text-slate-600 text-sm line-clamp-2">{event.description}</p>
            </div>
            
            {user && (user.role === 'admin' || user.role === 'teacher') && (
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(event)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-school-primary shadow-sm">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(event.id)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-red-600 shadow-sm">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Messages = ({ user }: { user: User | null }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeConversation) {
      fetchMessages(activeConversation);
      const interval = setInterval(() => fetchMessages(activeConversation), 5000);
      return () => clearInterval(interval);
    }
  }, [user, activeConversation]);

  const fetchConversations = async () => {
    const res = await fetch(`/api/messages/conversations/${user?.id}`);
    const data = await res.json();
    setConversations(data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.filter((u: User) => u.id !== user?.id));
  };

  const fetchMessages = async (otherId: number) => {
    const res = await fetch(`/api/messages/${user?.id}/${otherId}`);
    const data = await res.json();
    setMessages(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConversation || !newMessage.trim()) return;

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: user.id,
        receiver_id: activeConversation,
        content: newMessage
      })
    });

    if (res.ok) {
      setNewMessage('');
      fetchMessages(activeConversation);
      fetchConversations();
    }
  };

  const startChat = (otherId: number) => {
    setActiveConversation(otherId);
    setShowNewChat(false);
  };

  if (!user) return <Profile user={null} onLogout={() => {}} />;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex gap-6 pb-8">
      {/* Sidebar */}
      <div className="w-80 flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Messages</h2>
          <button 
            onClick={() => setShowNewChat(true)}
            className="p-2 bg-school-primary/10 text-school-primary rounded-xl hover:bg-school-primary/20 transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No conversations yet.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.other_user_id}
                onClick={() => setActiveConversation(conv.other_user_id)}
                className={`w-full p-4 flex gap-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                  activeConversation === conv.other_user_id ? 'bg-school-primary/5 border-l-4 border-l-school-primary' : ''
                }`}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 flex-shrink-0">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm truncate">{conv.other_user_name}</h4>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden">
        {activeConversation ? (
          <>
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold">
                  {conversations.find(c => c.other_user_id === activeConversation)?.other_user_name || 
                   users.find(u => u.id === activeConversation)?.name}
                </h3>
                <p className="text-xs text-slate-500 capitalize">
                  {conversations.find(c => c.other_user_id === activeConversation)?.other_user_role || 
                   users.find(u => u.id === activeConversation)?.role}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {messages.map(msg => (
                <div 
                  key={msg.id}
                  className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${
                    msg.sender_id === user.id 
                      ? 'bg-school-primary text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_id === user.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Type your message..."
                  className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="btn-primary flex items-center justify-center w-12 h-12 p-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Your Conversations</h3>
            <p className="max-w-xs">Select a conversation from the sidebar or start a new one to begin messaging.</p>
            <button 
              onClick={() => setShowNewChat(true)}
              className="mt-6 btn-primary"
            >
              Start New Chat
            </button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-xl font-bold">New Message</h3>
                <button onClick={() => setShowNewChat(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startChat(u.id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-2xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{u.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
const Profile = ({ user, onLogout }: { user: User | null, onLogout: () => void }) => {
  if (!user) return (
    <div className="max-w-md mx-auto text-center py-20">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
        <UserIcon className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
      <p className="text-slate-600 mb-8">Sign in to view your profile, manage your account, and see your activity.</p>
      <button className="btn-primary w-full">Sign In Now</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-school-primary to-school-secondary"></div>
        <div className="px-8 pb-8">
          <div className="relative -mt-12 mb-6">
            <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg">
              <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <UserIcon className="w-12 h-12" />
              </div>
            </div>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-slate-500">{user.email}</p>
              <div className="mt-2 flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  user.role === 'admin' ? 'bg-red-100 text-red-700' : 
                  user.role === 'teacher' ? 'bg-school-primary/10 text-school-primary' :
                  user.role === 'parent' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
            <button onClick={onLogout} className="btn-secondary text-red-600 border-red-100 hover:bg-red-50">
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <h3 className="text-xl font-bold mb-4">Account Settings</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50">
              <span className="text-slate-600">Change Password</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50">
              <span className="text-slate-600">Notification Preferences</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50">
              <span className="text-slate-600">Privacy Settings</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200">
          <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
          <div className="text-center py-8 text-slate-500">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No recent activity to show.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Auth = ({ onLogin }: { onLogin: (user: User) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email: formData.email, password: formData.password } : formData;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      onLogin(data);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-school-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-slate-500 mt-2">
            {isLogin ? 'Sign in to access your school portal' : 'Join our school community today'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">I am a...</label>
                <select 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none bg-white"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  required
                >
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="parent">Parent</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
              placeholder="you@school.edu"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="w-full btn-primary py-3 mt-4">
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-8 text-center pt-6 border-t border-slate-100">
          <p className="text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-school-primary font-bold hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const savedUser = localStorage.getItem('school_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('school_user', JSON.stringify(userData));
    setActiveTab('home');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('school_user');
    setActiveTab('home');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home setActiveTab={setActiveTab} />;
      case 'blog': return <Blog user={user} />;
      case 'events': return <Events user={user} />;
      case 'messages': return <Messages user={user} />;
      case 'profile': return <Profile user={user} onLogout={handleLogout} />;
      case 'auth': return <Auth onLogin={handleLogin} />;
      default: return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-school-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-school-secondary rounded flex items-center justify-center">
                  <BookOpen className="text-school-primary w-5 h-5" />
                </div>
                <span className="text-xl font-bold font-display">Ndejje Senior Secondary School</span>
              </div>
              <p className="text-white/70 max-w-xs mb-4">
                A Christ-centered school nurturing holistically competent citizens for development and prosperity.
              </p>
              <p className="text-school-secondary font-bold italic">"No Pain No Gains"</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-school-secondary">Quick Links</h4>
              <ul className="space-y-2 text-white/70">
                <li><button onClick={() => setActiveTab('home')} className="hover:text-school-secondary transition-colors">Home</button></li>
                <li><button onClick={() => setActiveTab('blog')} className="hover:text-school-secondary transition-colors">School Blog</button></li>
                <li><button onClick={() => setActiveTab('events')} className="hover:text-school-secondary transition-colors">Events</button></li>
                <li><button onClick={() => setActiveTab('messages')} className="hover:text-school-secondary transition-colors">Messages</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-school-secondary">Contact Us</h4>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-school-secondary mt-0.5" />
                  <span>8km West Bombo town</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-school-secondary" />
                  <span>+256 393 103812</span>
                </li>
                <li className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-school-secondary" />
                  <span>ndejjessshm@yahoo.com</span>
                </li>
              </ul>
              <div className="mt-6 flex gap-4">
                {/* Social icons could go here */}
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-school-secondary hover:text-school-primary transition-all cursor-pointer">
                  <span className="text-xs font-bold">FB</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-school-secondary hover:text-school-primary transition-all cursor-pointer">
                  <span className="text-xs font-bold">TW</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-school-secondary hover:text-school-primary transition-all cursor-pointer">
                  <span className="text-xs font-bold">IG</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/40 text-xs">
            © Copyright 2026 - Ndejje Senior Secondary School. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
