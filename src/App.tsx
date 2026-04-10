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
  Search as SearchIcon,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Send,
  Trash2,
  Edit2,
  Clock,
  MapPin,
  Image as ImageIcon,
  Camera,
  Shield,
  Users,
  Settings as SettingsIcon,
  BarChart,
  CheckCheck,
  ExternalLink,
  Phone,
  Info,
  ScrollText,
  Moon,
  Sun,
  MessageCircle,
  FileText,
  Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Forum } from './components/Forum';
import { supabase, createNotification } from './lib/supabase';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { User, Post, SchoolEvent, Comment, Message, Conversation, Notification, Announcement } from './types';

// Components
const NotificationDropdown = ({ 
  notifications, 
  onMarkAsRead, 
  onMarkAllAsRead,
  setActiveTab,
  onDeepLink
}: { 
  notifications: Notification[], 
  onMarkAsRead: (id: number) => void,
  onMarkAllAsRead: () => void,
  setActiveTab: (tab: string) => void,
  onDeepLink: (link: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotifClick = (notif: Notification) => {
    onMarkAsRead(notif.id);
    onDeepLink(notif.link);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-school-primary hover:bg-slate-50 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-notif-badge text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => {
                      onMarkAllAsRead();
                      setIsOpen(false);
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-school-primary hover:text-school-secondary transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Read all
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'message' ? 'bg-blue-100 text-blue-600' :
                          notif.type === 'event' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}>
                          {notif.type === 'message' ? <MessageSquare className="w-4 h-4" /> :
                           notif.type === 'event' ? <Calendar className="w-4 h-4" /> :
                           <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-slate-700 leading-snug">{notif.content}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavDropdown = ({ label, icon: Icon, items, activeTab, setActiveTab }: { 
  label: string, 
  icon: any, 
  items: { id: string, label: string, icon: any }[],
  activeTab: string,
  setActiveTab: (tab: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActive = items.some(item => item.id === activeTab);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
          isActive 
            ? 'text-school-primary bg-school-primary/10' 
            : 'text-slate-500 hover:text-school-primary hover:bg-slate-50'
        }`}
      >
        <Icon className="w-4 h-4" />
        {label}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
            className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden p-1"
          >
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === item.id 
                    ? 'text-school-primary bg-school-primary/5' 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const Navbar = ({ user, onLogout, activeTab, setActiveTab, notifications, onMarkAsRead, onMarkAllAsRead, onDeepLink }: { 
  user: User | null, 
  onLogout: () => void, 
  activeTab: string, 
  setActiveTab: (tab: string) => void,
  notifications: Notification[],
  onMarkAsRead: (id: number) => void,
  onMarkAllAsRead: () => void,
  onDeepLink: (link: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const communityItems = [
    { id: 'blog', label: 'School Blog', icon: BookOpen },
    { id: 'forum', label: 'Forum', icon: MessageCircle },
    { id: 'events', label: 'Events', icon: Calendar },
  ];

  const profileItems = [
    { id: 'profile', label: 'My Profile', icon: UserIcon },
  ];

  if (user) {
    profileItems.push({ id: 'settings', label: 'Settings', icon: SettingsIcon });
  }

  if (user?.role === 'admin') {
    profileItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield });
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 flex items-center justify-center">
                <img 
                  src="https://images.seeklogo.com/logo-png/55/2/ndejje-senior-secondary-school-bombo-logo-png_seeklogo-556141.png?v=1958513566915908752" 
                  alt="Ndejje SSS Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xl font-bold font-display text-school-primary hidden sm:inline">
                THEE NDEJJEAN CONNECT
              </span>
              <span className="text-xl font-bold font-display text-school-primary sm:hidden">
                TNC
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'home' 
                  ? 'text-school-primary bg-school-primary/10' 
                  : 'text-slate-500 hover:text-school-primary hover:bg-slate-50'
              }`}
            >
              <HomeIcon className="w-4 h-4" />
              Home
            </button>

            <NavDropdown 
              label="Community" 
              icon={Users} 
              items={communityItems} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
            />

            <button
              onClick={() => setActiveTab('messages')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'messages' 
                  ? 'text-school-primary bg-school-primary/10' 
                  : 'text-slate-500 hover:text-school-primary hover:bg-slate-50'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </button>

            <NavDropdown 
              label="Account" 
              icon={UserIcon} 
              items={profileItems} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab}
            />
            
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'admin' 
                    ? 'text-school-primary bg-school-primary/10' 
                    : 'text-slate-500 hover:text-school-primary hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            )}
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            {user && (
              <NotificationDropdown 
                notifications={notifications}
                onMarkAsRead={onMarkAsRead}
                onMarkAllAsRead={onMarkAllAsRead}
                setActiveTab={setActiveTab}
                onDeepLink={onDeepLink}
              />
            )}

            {user ? (
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('auth')}
                className="btn-primary text-sm py-2"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div className="relative">
                <button 
                  onClick={() => {
                    setActiveTab('profile'); // Or wherever notifications are most visible on mobile
                  }}
                  className="p-2 text-slate-600"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-notif-badge text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-1 text-slate-600 hover:text-school-primary p-2 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Menu</span>
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
            className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/10 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              <button
                onClick={() => { setActiveTab('home'); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${
                  activeTab === 'home' ? 'bg-school-primary/10 text-school-primary dark:bg-school-secondary/10 dark:text-school-secondary' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <HomeIcon className="w-5 h-5" />
                Home
              </button>

              <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-3 h-3" />
                Community
              </div>
              {communityItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${
                    activeTab === item.id ? 'bg-school-primary/10 text-school-primary dark:bg-school-secondary/10 dark:text-school-secondary' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}

              <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-3 h-3" />
                Account
              </div>
              <button
                onClick={() => { setActiveTab('messages'); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${
                  activeTab === 'messages' ? 'bg-school-primary/10 text-school-primary dark:bg-school-secondary/10 dark:text-school-secondary' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                Messages
              </button>

              {profileItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold ${
                    activeTab === item.id ? 'bg-school-primary/10 text-school-primary dark:bg-school-secondary/10 dark:text-school-secondary' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}


              {user ? (
                <button 
                  onClick={() => { onLogout(); setIsOpen(false); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold text-red-600 mt-4"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              ) : (
                <button 
                  onClick={() => { setActiveTab('auth'); setIsOpen(false); }}
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
        setAnnouncements(data || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="space-y-16 pb-12">
      {/* Hero Section with Video Background */}
      <section className="relative overflow-hidden rounded-[2rem] bg-school-primary text-white min-h-[500px] md:min-h-[600px] flex items-center p-6 md:p-20 shadow-2xl">
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
            <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-school-secondary/20 backdrop-blur-md text-school-secondary text-[10px] md:text-sm font-bold tracking-wider uppercase mb-4 md:mb-6 border border-school-secondary/30">
              Est. 1963 • Excellence in Education
            </span>
            <h1 className="text-4xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.1] tracking-tight">
              No Pain <br /> 
              <span className="text-school-secondary">No Gains</span>
            </h1>
            <p className="text-white/80 text-base md:text-xl mb-8 md:mb-10 max-w-xl leading-relaxed">
              Welcome to Ndejje Senior Secondary School. We are a Christ-centered institution dedicated to nurturing holistically competent citizens for a prosperous future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('blog')} 
                className="bg-school-secondary text-school-primary px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-school-secondary/20 hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
              >
                Explore Blog <ChevronRight className="w-5 h-5" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('events')} 
                className="bg-white/10 text-white border border-white/20 backdrop-blur-md px-6 py-3 md:px-8 md:py-4 rounded-2xl font-bold text-base md:text-lg hover:bg-white/20 transition-all flex items-center justify-center"
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
      <section className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 z-0"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">School Announcements</h2>
              <p className="text-sm md:text-base text-slate-500">Important updates for the Ndejjean community</p>
            </div>
            <div className="p-2 md:p-3 bg-school-primary/5 rounded-2xl">
              <Bell className="text-school-primary w-6 h-6 md:w-7 md:h-7" />
            </div>
          </div>
          
          <div className="grid gap-4">
            {loading ? (
              <div className="py-10 text-center text-slate-400">Loading announcements...</div>
            ) : announcements.length === 0 ? (
              <div className="py-10 text-center text-slate-400">No announcements at the moment.</div>
            ) : (
              (showAll ? announcements : announcements.slice(0, 3)).map((item, i) => (
                <motion.div 
                  key={item.id} 
                  whileHover={{ x: 10 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group gap-4"
                >
                  <div className="flex items-center gap-4 md:gap-5">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-xl md:text-2xl group-hover:bg-white transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-base md:text-lg group-hover:text-school-primary transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <span className="self-start sm:self-auto px-3 py-1 md:px-4 md:py-1.5 bg-slate-100 text-slate-600 text-[9px] md:text-[10px] font-black rounded-full uppercase tracking-widest group-hover:bg-school-primary group-hover:text-white transition-colors">
                    {item.tag}
                  </span>
                </motion.div>
              ))
            )}
          </div>
          
          {announcements.length > 3 && (
            <button 
              onClick={() => setShowAll(!showAll)}
              className="w-full mt-8 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-school-primary hover:text-school-primary transition-all"
            >
              {showAll ? 'Show Less' : 'View All Announcements'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
};

const Blog = ({ user, deepLink, setActiveTab }: { user: User | null, deepLink: Record<string, string> | null, setActiveTab: (tab: string) => void }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', image: '' });
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ content: '', image: '' });
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(new Set());
  const POSTS_PER_PAGE = 5;
  const MAX_PREVIEW_LENGTH = 300;

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (deepLink?.post_id && posts.length > 0) {
      const post = posts.find(p => p.id === parseInt(deepLink.post_id));
      if (post) {
        openComments(post);
        // Scroll to post
        const element = document.getElementById(`post-${post.id}`);
        if (element) element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [deepLink, posts]);

  const fetchPosts = async () => {
    try {
      const { data: posts, error } = await supabase
        .from("posts")
        .select(`
          *,
          author:users!author_id(name),
          likes_count:likes(count),
          comments_count:comments(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPosts = posts.map(p => ({
        ...p,
        author_name: p.author?.name,
        likes_count: p.likes_count?.[0]?.count || 0,
        comments_count: p.comments_count?.[0]?.count || 0
      }));

      setPosts(formattedPosts);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'post' | 'comment') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'post') {
          setNewPost({ ...newPost, image: reader.result as string });
        } else {
          setNewComment({ ...newComment, image: reader.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLike = async (postId: number) => {
    if (!user) {
      setActiveTab('auth');
      return;
    }
    try {
      const { data: existingLike } = await supabase
        .from("likes")
        .select("*")
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingLike) {
        await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("likes").insert([{ post_id: postId, user_id: user.id }]);
      }
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const startEditPost = (post: Post) => {
    setNewPost({ title: post.title, content: post.content, image: post.image || '' });
    setEditingPostId(post.id);
    setShowCreate(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    try {
      if (editingPostId) {
        await supabase.from("posts").update({ ...newPost }).eq("id", editingPostId);
      } else {
        await supabase.from("posts").insert([{ ...newPost, author_id: user.id }]);
      }
      
      setNewPost({ title: '', content: '', image: '' });
      setEditingPostId(null);
      setShowCreate(false);
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await supabase.from("posts").delete().eq("id", postId);
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const openComments = async (post: Post) => {
    setSelectedPost(post);
    try {
      const { data: comments } = await supabase
        .from("comments")
        .select("*, user:users!user_id(name)")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });

      const formattedComments = comments?.map(c => ({
        ...c,
        user_name: c.user?.name
      }));

      setComments(formattedComments || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPost) {
      setActiveTab('auth');
      return;
    }
    try {
      await supabase.from("comments").insert([{ post_id: selectedPost.id, user_id: user.id, content: newComment.content, image: newComment.image }]);
      
      // Notify post author
      const { data: post } = await supabase.from("posts").select("author_id, title").eq("id", selectedPost.id).single();
      if (post && post.author_id !== user.id) {
        await createNotification(post.author_id, 'comment', `${user.name} commented on your post: ${post.title}`, `blog?post_id=${selectedPost.id}`);
      }

      setNewComment({ content: '', image: '' });
      openComments(selectedPost);
      fetchPosts();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!user || user.role !== 'admin') return;
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await supabase.from("comments").delete().eq("id", commentId);
      if (selectedPost) {
        openComments(selectedPost);
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!user || user.role !== 'admin') return;
    
    try {
      await supabase.from("comments").update({ content: editCommentContent }).eq("id", commentId);
      if (selectedPost) {
        setEditingCommentId(null);
        setEditCommentContent('');
        openComments(selectedPost);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleExpand = (postId: number) => {
    const newExpanded = new Set(expandedPosts);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedPosts(newExpanded);
  };

  const paginatedPosts = posts.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE);
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-primary"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">School Blog</h1>
          <p className="text-sm md:text-base text-slate-600">Insights and updates from our community</p>
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
          className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-school-primary/10 rounded-2xl flex items-center justify-center text-school-primary">
              <Edit2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{editingPostId ? 'Edit Post' : 'Create New Post'}</h2>
              <p className="text-sm text-slate-500">Share your thoughts with the Ndejje community</p>
            </div>
          </div>

          <form onSubmit={handleSubmitPost} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Title</label>
              <input 
                type="text" 
                placeholder="Give your post a catchy title" 
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none transition-all"
                value={newPost.title}
                onChange={e => setNewPost({...newPost, title: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Content</label>
              <textarea 
                placeholder="What's on your mind?" 
                className="w-full p-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none min-h-[200px] transition-all"
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Featured Image</label>
              <div className="flex items-start gap-6">
                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[2rem] p-8 hover:border-school-primary hover:bg-school-primary/5 transition-all cursor-pointer group">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white transition-colors">
                    <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-school-primary" />
                  </div>
                  <span className="text-base font-bold text-slate-600 group-hover:text-school-primary">Click to upload image</span>
                  <span className="text-xs text-slate-400 mt-1">High quality images recommended (Max 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'post')} />
                </label>
                
                {newPost.image && (
                  <div className="relative w-40 h-40 rounded-[2rem] overflow-hidden border border-slate-200 shadow-md">
                    <img src={newPost.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => setNewPost({...newPost, image: ''})}
                      className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => {
                  setShowCreate(false);
                  setEditingPostId(null);
                  setNewPost({ title: '', content: '', image: '' });
                }} 
                className="px-8 py-4 rounded-2xl font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Discard
              </button>
              <button type="submit" className="btn-primary px-10">
                {editingPostId ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="space-y-6">
        {paginatedPosts.map(post => {
          const isExpanded = expandedPosts.has(post.id);
          const needsReadMore = post.content.length > MAX_PREVIEW_LENGTH;
          const displayContent = isExpanded || !needsReadMore 
            ? post.content 
            : post.content.substring(0, MAX_PREVIEW_LENGTH) + '...';

          return (
            <motion.article 
              key={post.id}
              id={`post-${post.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
            >
              <div className="p-5 md:p-8">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-school-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-school-primary">
                      <UserIcon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm md:text-base">{post.author_name}</p>
                      <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                  {user && (user.role === 'admin' || user.role === 'teacher') && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => startEditPost(post)}
                        className="p-2.5 text-slate-400 hover:text-school-primary hover:bg-school-primary/5 rounded-xl transition-all"
                        title="Edit Post"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl md:text-3xl font-black mb-3 md:mb-4 text-slate-900 leading-tight">{post.title}</h2>
                
                {post.image && (
                  <div className="mb-4 md:mb-6 rounded-xl md:rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
                    <img src={post.image} alt={post.title} className="w-full max-h-[300px] md:max-h-[500px] object-cover hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  </div>
                )}
                
                <div className="relative">
                  <p className="text-slate-700 leading-relaxed mb-4 md:mb-6 whitespace-pre-wrap text-base md:text-lg">
                    {displayContent}
                  </p>
                  {needsReadMore && (
                    <button 
                      onClick={() => toggleExpand(post.id)}
                      className="text-school-primary font-bold hover:underline mb-6 flex items-center gap-1 transition-all group"
                    >
                      {isExpanded ? 'Show Less' : 'Read More'}
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'group-hover:translate-y-1'}`} />
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-500 transition-all group"
                  >
                    <Heart className={`w-5 h-5 group-hover:fill-red-500 transition-colors ${post.likes_count > 0 ? 'fill-red-500 text-red-500' : ''}`} />
                    <span className="font-bold">{post.likes_count}</span>
                  </button>
                  <button 
                    onClick={() => openComments(post)}
                    className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-school-primary/5 text-slate-600 hover:text-school-primary transition-all group"
                  >
                    <MessageSquare className="w-5 h-5 group-hover:fill-school-primary/20 transition-colors" />
                    <span className="font-bold">{post.comments_count}</span>
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button 
            onClick={() => {
              setCurrentPage(prev => Math.max(1, prev - 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentPage(i + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-12 h-12 rounded-xl font-bold transition-all ${
                currentPage === i + 1 
                  ? 'bg-school-primary text-white shadow-lg shadow-school-primary/20' 
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button 
            onClick={() => {
              setCurrentPage(prev => Math.min(totalPages, prev + 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className="p-3 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

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
                    <div key={comment.id} className="bg-slate-50 p-4 rounded-2xl group relative">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm">{comment.user_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString()}</span>
                          {user?.role === 'admin' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => {
                                  setEditingCommentId(comment.id);
                                  setEditCommentContent(comment.content);
                                }}
                                className="p-1 text-slate-400 hover:text-school-primary"
                                title="Edit Comment"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteComment(comment.id)}
                                className="p-1 text-slate-400 hover:text-red-500"
                                title="Delete Comment"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <textarea 
                            className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                            value={editCommentContent}
                            onChange={e => setEditCommentContent(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setEditingCommentId(null)}
                              className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => handleUpdateComment(comment.id)}
                              className="px-3 py-1 text-xs font-bold bg-school-primary text-white rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-700 text-sm mb-2">{comment.content}</p>
                      )}

                      {comment.image && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-w-[200px]">
                          <img src={comment.image} alt="Comment" className="w-full h-auto" referrerPolicy="no-referrer" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="p-6 border-t border-slate-100">
                <form onSubmit={handleAddComment} className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder={user ? "Write a comment..." : "Sign in to comment"}
                      disabled={!user}
                      className="flex-1 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-school-primary outline-none"
                      value={newComment.content}
                      onChange={e => setNewComment({...newComment, content: e.target.value})}
                    />
                    <label className="flex items-center justify-center w-12 h-12 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                      <Camera className="w-5 h-5 text-slate-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, 'comment')} />
                    </label>
                    <button 
                      type="submit" 
                      disabled={!user || (!newComment.content.trim() && !newComment.image)}
                      className="btn-primary"
                    >
                      Post
                    </button>
                  </div>
                  {newComment.image && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200">
                      <img src={newComment.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        type="button" 
                        onClick={() => setNewComment({...newComment, image: ''})}
                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Events = ({ user, deepLink }: { user: User | null, deepLink: Record<string, string> | null }) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', time: '', location: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (deepLink?.event_id && events.length > 0) {
      const event = events.find(e => e.id === parseInt(deepLink.event_id));
      if (event) {
        setViewMode('list');
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          const element = document.getElementById(`event-${event.id}`);
          if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  }, [deepLink, events]);

  const fetchEvents = async () => {
    try {
      const { data: events, error } = await supabase.from("events").select("*").order("date", { ascending: true });
      if (error) throw error;
      setEvents(events || []);
      setLoading(false);
    } catch (e) {
      console.error(e);
    }
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white rounded-xl border border-slate-200 transition-all">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-white rounded-xl border border-slate-200 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 border-b border-slate-100">
          {days.map(day => (
            <div key={day} className="py-3 text-center text-xs font-black text-slate-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={i} 
                className={`min-h-[120px] p-2 border-r border-b border-slate-100 transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50/50' : 'bg-white'
                } ${i % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                    isToday ? 'bg-school-primary text-white' : 
                    isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                    {dayEvents.map(event => (
                      <div 
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user && (user.role === 'admin' || user.role === 'teacher')) {
                            startEdit(event);
                          } else {
                            setSelectedEvent(event);
                          }
                        }}
                        className="text-[10px] p-1.5 bg-school-primary/10 text-school-primary rounded-lg font-bold truncate cursor-pointer hover:bg-school-primary/20 transition-colors border border-school-primary/10"
                        title={event.title}
                      >
                        {event.time && <span className="mr-1 opacity-60">{event.time}</span>}
                        {event.title}
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    
    try {
      if (editingEvent) {
        await supabase.from("events").update({ ...formData }).eq("id", editingEvent.id);
      } else {
        const { data: event } = await supabase.from("events").insert([{ ...formData }]).select().single();
        if (event) {
          // Notify all users about new event
          const { data: users } = await supabase.from("users").select("id").neq("id", user.id);
          users?.forEach(u => {
            createNotification(u.id, 'event', `New school event: ${formData.title}`, `events?event_id=${event.id}`);
          });
        }
      }
      
      setFormData({ title: '', description: '', date: '', time: '', location: '' });
      setShowCreate(false);
      setEditingEvent(null);
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) return;
    try {
      await supabase.from("events").delete().eq("id", id);
      fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  const addToCalendar = (event: SchoolEvent) => {
    const title = encodeURIComponent(event.title);
    const description = encodeURIComponent(event.description);
    const location = encodeURIComponent(event.location);
    
    // Format date for Google Calendar (YYYYMMDD)
    const dateObj = new Date(event.date);
    const dateStr = dateObj.toISOString().replace(/-|:|\.\d+/g, '').split('T')[0];
    
    // If time is provided, we could try to parse it, but for simplicity we'll just use the date
    // Google Calendar template for all-day event: dates=YYYYMMDD/YYYYMMDD
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().replace(/-|:|\.\d+/g, '').split('T')[0];
    
    const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${description}&location=${location}&dates=${dateStr}/${nextDayStr}`;
    
    window.open(googleUrl, '_blank');
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
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Upcoming Events</h1>
          <p className="text-sm md:text-base text-slate-600">Mark your calendars for these school highlights</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                viewMode === 'list' ? 'bg-white text-school-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              List
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                viewMode === 'calendar' ? 'bg-white text-school-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Calendar
            </button>
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

      {viewMode === 'calendar' ? renderCalendar() : (
        <div className="grid md:grid-cols-2 gap-6">
          {events.length === 0 ? (
            <div className="md:col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No events scheduled yet.</p>
            </div>
          ) : (
            events.map(event => (
              <motion.div 
                key={event.id}
                id={`event-${event.id}`}
                whileHover={{ scale: 1.01 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 flex flex-col sm:flex-row gap-4 md:gap-6 relative group"
              >
                <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 bg-school-primary/10 rounded-xl md:rounded-2xl flex flex-col items-center justify-center text-school-primary">
                  <span className="text-[10px] md:text-xs font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl md:text-3xl font-bold">{new Date(event.date).getDate()}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold mb-1">{event.title}</h3>
                  <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-slate-500 text-xs md:text-sm mb-3">
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
                  <p className="text-slate-600 text-sm line-clamp-2 mb-4">{event.description}</p>
                  
                  <button 
                    onClick={() => addToCalendar(event)}
                    className="flex items-center gap-2 text-xs font-bold text-school-primary hover:text-school-secondary transition-colors bg-school-primary/5 px-3 py-1.5 rounded-lg border border-school-primary/10"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Add to Google Calendar
                  </button>
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
            ))
          )}
        </div>
      )}

      {/* Event Details Modal for Calendar View */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex-shrink-0 w-16 h-16 bg-school-primary/10 rounded-2xl flex flex-col items-center justify-center text-school-primary">
                  <span className="text-[10px] font-bold uppercase">{new Date(selectedEvent.date).toLocaleString('default', { month: 'short' })}</span>
                  <span className="text-2xl font-bold">{new Date(selectedEvent.date).getDate()}</span>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="p-2 hover:bg-slate-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <h3 className="text-2xl font-bold mb-4">{selectedEvent.title}</h3>
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-5 h-5 text-school-primary" />
                  <span className="font-medium">{new Date(selectedEvent.date).toLocaleDateString(undefined, { dateStyle: 'full' })}</span>
                </div>
                {selectedEvent.time && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Clock className="w-5 h-5 text-school-primary" />
                    <span className="font-medium">{selectedEvent.time}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="w-5 h-5 text-school-primary" />
                  <span className="font-medium">{selectedEvent.location}</span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mb-8">{selectedEvent.description}</p>

              <button 
                onClick={() => {
                  addToCalendar(selectedEvent);
                  setSelectedEvent(null);
                }}
                className="w-full btn-primary py-4 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Add to Google Calendar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminDashboard = ({ user }: { user: User }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'posts' | 'events' | 'announcements' | 'forum'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [forumTopics, setForumTopics] = useState<any[]>([]);
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    users: 0,
    posts: 0,
    events: 0,
    announcements: 0,
    forumTopics: 0,
    forumPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', tag: 'General', icon: '📢' });

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch stats using direct counts
      const [{ count: userCount }, { count: postCount }, { count: eventCount }, { count: announcementCount }, { count: topicCount }, { count: forumPostCount }] = await Promise.all([
        supabase.from("users").select("*", { count: 'exact', head: true }),
        supabase.from("posts").select("*", { count: 'exact', head: true }),
        supabase.from("events").select("*", { count: 'exact', head: true }),
        supabase.from("announcements").select("*", { count: 'exact', head: true }),
        supabase.from("forum_topics").select("*", { count: 'exact', head: true }),
        supabase.from("forum_posts").select("*", { count: 'exact', head: true })
      ]);

      setStats({
        users: userCount || 0,
        posts: postCount || 0,
        events: eventCount || 0,
        announcements: announcementCount || 0,
        forumTopics: topicCount || 0,
        forumPosts: forumPostCount || 0
      });

      if (activeSubTab === 'users') {
        const { data } = await supabase.from("users").select("*").order("name");
        setUsers(data || []);
      } else if (activeSubTab === 'posts') {
        const { data } = await supabase.from("posts").select("*, author:users!author_id(name)").order("created_at", { ascending: false });
        setPosts(data?.map(p => ({ ...p, author_name: p.author?.name })) || []);
      } else if (activeSubTab === 'events') {
        const { data } = await supabase.from("events").select("*").order("date", { ascending: true });
        setEvents(data || []);
      } else if (activeSubTab === 'announcements') {
        const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
        setAnnouncements(data || []);
      } else if (activeSubTab === 'forum') {
        const { data: topics } = await supabase.from("forum_topics").select("*, category:forum_categories!category_id(name), author:users!author_id(name)").order("created_at", { ascending: false });
        const { data: forumPosts } = await supabase.from("forum_posts").select("*, topic:forum_topics!topic_id(title), author:users!author_id(name)").order("created_at", { ascending: false });
        
        setForumTopics(topics?.map(t => ({ ...t, category_name: t.category?.name, author_name: t.author?.name })) || []);
        setForumPosts(forumPosts?.map(p => ({ ...p, topic_title: p.topic?.title, author_name: p.author?.name })) || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await supabase.from("users").delete().eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangeRole = async (id: number, newRole: string) => {
    try {
      await supabase.from("users").update({ role: newRole }).eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await supabase.from("posts").delete().eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await supabase.from("events").delete().eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await supabase.from("announcements").delete().eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteForumTopic = async (id: number) => {
    if (!confirm('Are you sure you want to delete this forum topic and all its posts?')) return;
    try {
      await supabase.from("forum_topics").delete().eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteForumPost = async (id: number) => {
    if (!confirm('Are you sure you want to delete this forum post?')) return;
    try {
      await supabase.from("forum_posts").delete().eq("id", id);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnnouncement) {
        await supabase.from("announcements").update({ ...announcementForm }).eq("id", editingAnnouncement.id);
      } else {
        const { data: announcement } = await supabase.from("announcements").insert([{ ...announcementForm }]).select().single();
        if (announcement) {
          // Notify all users
          const { data: users } = await supabase.from("users").select("id").neq("id", user.id);
          users?.forEach(u => {
            createNotification(u.id, 'announcement', `New announcement: ${announcementForm.title}`, `home`);
          });
        }
      }
      setShowCreateAnnouncement(false);
      setEditingAnnouncement(null);
      setAnnouncementForm({ title: '', content: '', tag: 'General', icon: '📢' });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 px-4 sm:px-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-sm sticky top-24">
            <div className="mb-6 px-2">
              <h1 className="text-xl font-bold">Admin Panel</h1>
              <p className="text-xs text-slate-500">School Management</p>
            </div>
            <nav className="space-y-1">
              {[
                { id: 'users', label: 'Users', icon: Users },
                { id: 'posts', label: 'Posts', icon: BookOpen },
                { id: 'events', label: 'Events', icon: Calendar },
                { id: 'announcements', label: 'Announcements', icon: Bell },
                { id: 'forum', label: 'Forum', icon: MessageSquare },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSubTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                    activeSubTab === item.id 
                      ? 'bg-school-primary text-white shadow-lg shadow-school-primary/20' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-8 min-w-0">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Users</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.users}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Blog Posts</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.posts}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Forum Topics</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.forumTopics}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Forum Replies</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.forumPosts}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">School Events</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.events}</h3>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Announcements</p>
                  <h3 className="text-2xl font-black text-slate-900">{stats.announcements}</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold capitalize">{activeSubTab} Management</h2>
              {activeSubTab === 'announcements' && (
                <button 
                  onClick={() => {
                    setEditingAnnouncement(null);
                    setAnnouncementForm({ title: '', content: '', tag: 'General', icon: '📢' });
                    setShowCreateAnnouncement(true);
                  }}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Announcement
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-primary"></div>
              </div>
            ) : (
              <div className="p-0">
                {activeSubTab === 'users' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Name</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Email</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{u.name}</td>
                            <td className="px-6 py-4 text-slate-500">{u.email}</td>
                            <td className="px-6 py-4">
                              <select 
                                value={u.role}
                                onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                className="bg-slate-100 border-none rounded-lg text-xs font-bold p-1 focus:ring-2 focus:ring-school-primary"
                                disabled={u.id === user.id}
                              >
                                <option value="student">Student</option>
                                <option value="parent">Parent</option>
                                <option value="teacher">Teacher</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={u.id === user.id}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'posts' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Title</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Author</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {posts.map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700 truncate max-w-xs">{p.title}</td>
                            <td className="px-6 py-4 text-slate-500">{p.author_name}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDeletePost(p.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'events' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Title</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Location</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {events.map(e => (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{e.title}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-slate-500">{e.location}</td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => handleDeleteEvent(e.id)}
                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'announcements' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Icon</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Title</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Tag</th>
                          <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {announcements.map(a => (
                          <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 text-xl">{a.icon}</td>
                            <td className="px-6 py-4 font-bold text-slate-700">{a.title}</td>
                            <td className="px-6 py-4">
                              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {a.tag}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingAnnouncement(a);
                                    setAnnouncementForm({ title: a.title, content: a.content, tag: a.tag, icon: a.icon });
                                    setShowCreateAnnouncement(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-school-primary transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteAnnouncement(a.id)}
                                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeSubTab === 'forum' && (
                  <div className="space-y-8 p-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-school-primary" />
                        Forum Topics
                      </h3>
                      <div className="overflow-x-auto bg-slate-50 rounded-2xl border border-slate-100">
                        <table className="w-full text-left min-w-[600px]">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Title</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Category</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Author</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {forumTopics.length === 0 ? (
                              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No topics found</td></tr>
                            ) : (
                              forumTopics.map(t => (
                                <tr key={t.id} className="hover:bg-white transition-colors">
                                  <td className="px-6 py-4 font-bold text-slate-700">{t.title}</td>
                                  <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase">
                                      {t.category_name}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-slate-500">{t.author_name}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => handleDeleteForumTopic(t.id)}
                                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-school-secondary" />
                        Forum Replies
                      </h3>
                      <div className="overflow-x-auto bg-slate-50 rounded-2xl border border-slate-100">
                        <table className="w-full text-left min-w-[600px]">
                          <thead>
                            <tr className="border-b border-slate-200">
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Content</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Topic</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Author</th>
                              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {forumPosts.length === 0 ? (
                              <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No replies found</td></tr>
                            ) : (
                              forumPosts.map(p => (
                                <tr key={p.id} className="hover:bg-white transition-colors">
                                  <td className="px-6 py-4 text-slate-700 text-sm max-w-xs truncate">{p.content}</td>
                                  <td className="px-6 py-4 text-slate-500 text-xs">{p.topic_title}</td>
                                  <td className="px-6 py-4 text-slate-500">{p.author_name}</td>
                                  <td className="px-6 py-4 text-right">
                                    <button 
                                      onClick={() => handleDeleteForumPost(p.id)}
                                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dedicated Post Announcement Section */}
          <section className="bg-school-primary text-white rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-school-primary/20 flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold mb-4 tracking-tight">Post Official Announcement</h2>
            <p className="text-white/70 text-sm md:text-lg mb-10 max-w-2xl leading-relaxed">
              Broadcast important school updates, policy changes, or emergency alerts directly to the entire Ndejjean community.
            </p>
            <div className="w-full bg-white/10 backdrop-blur-md p-4 md:p-8 rounded-3xl border border-white/20">
              <div className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 opacity-60">Announcement Title</label>
                  <input 
                    type="text"
                    placeholder="Enter a clear, concise title..."
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 text-sm md:text-base text-white placeholder:text-white/30 focus:bg-white/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 opacity-60">Message Content</label>
                  <textarea 
                    placeholder="Write your detailed announcement here..."
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 md:p-6 text-sm md:text-base text-white placeholder:text-white/30 focus:bg-white/20 outline-none transition-all min-h-[150px] md:min-h-[200px]"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <div className="flex-1">
                    <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest mb-2 opacity-60">Category Tag</label>
                    <select 
                      value={announcementForm.tag}
                      onChange={(e) => setAnnouncementForm({...announcementForm, tag: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 rounded-xl p-3 md:p-4 text-sm md:text-base text-white focus:bg-white/20 outline-none transition-all appearance-none"
                    >
                      <option value="General" className="text-slate-900">General</option>
                      <option value="Academic" className="text-slate-900">Academic</option>
                      <option value="Event" className="text-slate-900">Event</option>
                      <option value="Urgent" className="text-slate-900">Urgent</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleSaveAnnouncement}
                    className="bg-school-secondary text-school-primary px-8 py-4 rounded-2xl font-bold text-base md:text-lg shadow-xl shadow-school-secondary/20 hover:bg-yellow-400 transition-all flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Post Announcement
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Announcement Modal */}
      <AnimatePresence>
        {showCreateAnnouncement && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCreateAnnouncement(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-2xl font-bold">{editingAnnouncement ? 'Edit' : 'New'} Announcement</h2>
                <button onClick={() => setShowCreateAnnouncement(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleSaveAnnouncement} className="p-8 space-y-6">
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Icon</label>
                    <input 
                      type="text" 
                      value={announcementForm.icon}
                      onChange={e => setAnnouncementForm({...announcementForm, icon: e.target.value})}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-school-primary text-center text-2xl"
                      placeholder="📢"
                      required
                    />
                  </div>
                  <div className="col-span-3 space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Title</label>
                    <input 
                      type="text" 
                      value={announcementForm.title}
                      onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                      className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-school-primary font-bold"
                      placeholder="Announcement Title"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Tag</label>
                  <select 
                    value={announcementForm.tag}
                    onChange={e => setAnnouncementForm({...announcementForm, tag: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-school-primary font-bold appearance-none"
                  >
                    <option value="General">General</option>
                    <option value="Facility">Facility</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Holiday">Holiday</option>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Content</label>
                  <textarea 
                    value={announcementForm.content}
                    onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-school-primary min-h-[150px] resize-none"
                    placeholder="Describe the announcement..."
                    required
                  ></textarea>
                </div>
                <button type="submit" className="w-full btn-primary py-4 text-lg">
                  {editingAnnouncement ? 'Update' : 'Publish'} Announcement
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Settings = ({ user }: { user: User | null }) => {
  const [settings, setSettings] = useState({
    notify_messages: true,
    notify_events: true,
    notify_blog: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      if (data) {
        setSettings({
          notify_messages: !!data.notify_messages,
          notify_events: !!data.notify_events,
          notify_blog: !!data.notify_blog
        });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setMessage('');
    try {
      const { error } = await supabase.from("user_settings").upsert({ 
        user_id: user.id,
        ...settings 
      });
      if (error) throw error;
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (e) {
      console.error(e);
      setMessage('Failed to save settings');
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-school-primary"></div></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-slate-600">Manage your account preferences and notifications</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-school-primary" />
            Notification Preferences
          </h2>
          <p className="text-sm text-slate-500 mt-1">Choose which updates you'd like to receive notifications for</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-700">Messages</h4>
              <p className="text-sm text-slate-500">Get notified when you receive a new private message</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notify_messages}
                onChange={e => setSettings({...settings, notify_messages: e.target.checked})}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-school-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-700">School Events</h4>
              <p className="text-sm text-slate-500">Stay updated on new school events and calendar changes</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notify_events}
                onChange={e => setSettings({...settings, notify_events: e.target.checked})}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-school-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-700">Blog Activity</h4>
              <p className="text-sm text-slate-500">Notifications for comments on your posts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.notify_blog}
                onChange={e => setSettings({...settings, notify_blog: e.target.checked})}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-school-primary"></div>
            </label>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm font-medium text-emerald-600">{message}</p>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Messages = ({ user, deepLink }: { user: User | null, deepLink: Record<string, string> | null }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (deepLink?.user_id && user) {
      setActiveConversation(parseInt(deepLink.user_id));
    }
  }, [deepLink, user]);

  useEffect(() => {
    if (user && activeConversation) {
      fetchMessages(activeConversation);
      const interval = setInterval(() => fetchMessages(activeConversation), 5000);
      return () => clearInterval(interval);
    }
  }, [user, activeConversation]);

  const fetchConversations = async () => {
    if (!user) return;
    try {
      // This is a complex query to get unique conversations
      // We'll fetch all messages where user is sender or receiver
      const { data, error } = await supabase
        .from("messages")
        .select("*, sender:users!sender_id(name), receiver:users!receiver_id(name)")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const convMap = new Map();
      data?.forEach(m => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        const otherName = m.sender_id === user.id ? m.receiver?.name : m.sender?.name;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            other_user_id: otherId,
            other_user_name: otherName,
            last_message: m.content,
            last_message_at: m.created_at
          });
        }
      });
      setConversations(Array.from(convMap.values()));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const { data } = await supabase.from("users").select("*").neq("id", user?.id).order("name");
      setUsers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMessages = async (otherId: number) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!user || user.role !== 'admin') return;
    try {
      await supabase.from("messages").delete().eq("id", messageId);
      if (activeConversation) fetchMessages(activeConversation);
      fetchConversations();
      setMessageToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConversation || !newMessage.trim()) return;

    try {
      const { data: msg } = await supabase.from("messages").insert([{
        sender_id: user.id,
        receiver_id: activeConversation,
        content: newMessage
      }]).select().single();

      if (msg) {
        setNewMessage('');
        fetchMessages(activeConversation);
        fetchConversations();
        
        // Notify receiver
        createNotification(activeConversation, 'message', `New message from ${user.name}`, `messages?user_id=${user.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const startChat = (otherId: number) => {
    setActiveConversation(otherId);
    setShowNewChat(false);
  };

  if (!user) return <Profile user={null} onLogout={() => {}} onUpdateUser={() => {}} />;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-12rem)] flex gap-0 md:gap-6 pb-8 px-4 sm:px-6">
      {/* Sidebar */}
      <div className={`w-full md:w-80 flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
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
      <div className={`flex-1 flex-col bg-white rounded-3xl border border-slate-200 overflow-hidden ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
        {activeConversation ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-4">
              <button 
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-full text-slate-500"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-base">
                  {conversations.find(c => c.other_user_id === activeConversation)?.other_user_name || 
                   users.find(u => u.id === activeConversation)?.name}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-500 capitalize">
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
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm relative group/msg ${
                    msg.sender_id === user.id 
                      ? 'bg-school-primary text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'
                  }`}>
                    {user.role === 'admin' && (
                      <button 
                        onClick={() => setMessageToDelete(msg.id)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover/msg:opacity-100 transition-opacity shadow-lg"
                        title="Delete Message"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_id === user.id ? 'text-white/60' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {messageToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessageToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Delete Message?</h2>
              <p className="text-slate-500 mb-8">
                Are you sure you want to delete this message? This action cannot be undone and the message will be removed for all users.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDeleteMessage(messageToDelete)}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                >
                  Delete Permanently
                </button>
                <button 
                  onClick={() => setMessageToDelete(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
const Profile = ({ user, onLogout, onUpdateUser }: { user: User | null, onLogout: () => void, onUpdateUser: (user: User) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEditedName(user.name);
      setAvatar(user.avatar || '');
      setBio(user.bio || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { data: updatedUser, error } = await supabase
        .from("users")
        .update({ name: editedName, avatar, bio, phone })
        .eq("id", user.id)
        .select("id, name, email, role, avatar, bio, phone")
        .single();

      if (error) throw error;
      
      if (updatedUser) {
        onUpdateUser(updatedUser);
        localStorage.setItem('school_user', JSON.stringify(updatedUser));
        setIsEditing(false);
      }
    } catch (error: any) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 overflow-hidden">
        <div className="h-24 md:h-32 bg-gradient-to-r from-school-primary to-school-secondary"></div>
        <div className="px-5 md:px-8 pb-6 md:pb-8">
          <div className="relative -mt-10 md:-mt-12 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="relative group self-start">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-2xl p-1 shadow-lg overflow-hidden">
                {avatar ? (
                  <img src={avatar} alt={user.name} className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                    <UserIcon className="w-10 h-10 md:w-12 md:h-12" />
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white w-6 h-6" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                </label>
              )}
            </div>
            
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="btn-secondary flex items-center gap-2 w-full sm:w-auto"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(user.name);
                    setAvatar(user.avatar || '');
                    setBio(user.bio || '');
                    setPhone(user.phone || '');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateProfile}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none btn-primary px-6 py-2 flex items-center gap-2"
                >
                  {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCheck className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1 w-full">
              {isEditing ? (
                <div className="space-y-1 max-w-sm">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Display Name</label>
                  <input 
                    type="text" 
                    value={editedName}
                    onChange={e => setEditedName(e.target.value)}
                    className="text-2xl md:text-3xl font-bold w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 focus:ring-2 focus:ring-school-primary outline-none"
                    autoFocus
                  />
                </div>
              ) : (
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{user.name}</h1>
              )}
              <p className="text-sm md:text-base text-slate-500 mt-1">{user.email}</p>
              
              {isEditing ? (
                <div className="mt-4 space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+256 ..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 focus:ring-2 focus:ring-school-primary outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio / About Me</label>
                    <textarea 
                      value={bio}
                      onChange={e => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-school-primary outline-none min-h-[100px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {user.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-4 h-4 text-school-primary" />
                      <span className="text-sm">{user.phone}</span>
                    </div>
                  )}
                  {user.bio && (
                    <div className="flex items-start gap-2 text-slate-600 max-w-lg">
                      <Info className="w-4 h-4 text-school-primary mt-1 flex-shrink-0" />
                      <p className="text-sm leading-relaxed">{user.bio}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex gap-2">
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

const Auth = ({ onLogin, onBack }: { onLogin: (user: User) => void, onBack: () => void }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'reset'>('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'student', token: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        const { data: user, error } = await supabase
          .from("users")
          .select("id, name, email, role, avatar, bio, phone")
          .eq("email", formData.email)
          .eq("password", formData.password)
          .maybeSingle();

        if (error) throw error;
        if (user) {
          onLogin(user);
        } else {
          setError("Invalid email or password");
        }
      } else if (mode === 'signup') {
        const { data: newUser, error } = await supabase
          .from("users")
          .insert([{ 
            name: formData.name, 
            email: formData.email, 
            password: formData.password, 
            role: formData.role || 'student' 
          }])
          .select()
          .single();

        if (error) throw error;

        // Initialize settings
        await supabase.from("user_settings").insert([{ user_id: newUser.id }]);
        onLogin(newUser);
      } else if (mode === 'forgot') {
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("email", formData.email)
          .single();

        if (!user) {
          setError("User not found");
          return;
        }

        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

        await supabase
          .from("password_resets")
          .insert([{ email: formData.email, token, expires_at: expiresAt }]);

        setMessage("Reset link generated (Demo: " + token + ")");
        setFormData(prev => ({ ...prev, token }));
        setMode('reset');
      } else if (mode === 'reset') {
        const { data: reset } = await supabase
          .from("password_resets")
          .select("email")
          .eq("token", formData.token)
          .gt("expires_at", new Date().toISOString())
          .single();
        
        if (!reset) {
          setError("Invalid or expired token");
          return;
        }

        await supabase.from("users").update({ password: formData.password }).eq("email", reset.email);
        await supabase.from("password_resets").delete().eq("email", reset.email);

        setMessage("Password updated successfully");
        setMode('login');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white overflow-hidden z-[9999]">
      {/* Corner Waves - Top Left */}
      <div className="absolute top-0 left-0 w-64 h-64 pointer-events-none">
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0,0 L250,0 Q180,150 0,200 Z" fill="#0a1f44" />
          <path d="M0,0 L180,0 Q120,100 0,140 Z" fill="#ffd700" />
        </svg>
      </div>

      {/* Corner Waves - Bottom Right */}
      <div className="absolute bottom-0 right-0 w-64 h-64 pointer-events-none rotate-180">
        <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M0,0 L250,0 Q180,150 0,200 Z" fill="#0a1f44" />
          <path d="M0,0 L180,0 Q120,100 0,140 Z" fill="#ffd700" />
        </svg>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-[380px] p-10 bg-[#0a1f44] rounded-[20px] border-2 border-[#ffd700] shadow-[0_20px_60px_rgba(10,31,68,0.3)] text-center animate-float-card z-10"
      >
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 z-20 p-2 text-white/40 hover:text-[#ffd700] transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* White Scrolls in Corners */}
        <ScrollText className="absolute top-4 left-4 text-white/40 w-6 h-6 rotate-[-15deg]" />
        <ScrollText className="absolute bottom-4 right-4 text-white/40 w-6 h-6 rotate-[165deg]" />

        {/* Logo */}
        <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
          <img 
            src="https://images.seeklogo.com/logo-png/55/2/ndejje-senior-secondary-school-bombo-logo-png_seeklogo-556141.png?v=1958513566915908752" 
            alt="Ndejje SSS Logo" 
            className="w-full h-full object-contain"
            referrerPolicy="no-referrer"
          />
        </div>

        <h2 className="text-[#ffd700] text-2xl font-bold mb-1 uppercase tracking-tight">Ndejje Senior Secondary School</h2>
        <h4 className="text-white font-light mb-6 tracking-[2px] text-sm uppercase">Connect Portal</h4>

        {error && (
          <div className="bg-red-500/20 text-red-200 p-3 rounded-lg mb-4 text-xs font-medium border border-red-500/30">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/20 text-emerald-200 p-3 rounded-lg mb-4 text-xs font-medium border border-emerald-500/30">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[#ffd700] text-xs font-semibold ml-1">Full Name</label>
              <input 
                type="text" 
                placeholder="Enter your full name"
                className="w-full p-3 rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-[#ffd700] transition-all bg-white"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'forgot') && (
            <div className="space-y-1">
              <label className="text-[#ffd700] text-xs font-semibold ml-1">Email</label>
              <input 
                type="email" 
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-[#ffd700] transition-all bg-white"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          )}

          {mode === 'reset' && (
            <div className="space-y-1">
              <label className="text-[#ffd700] text-xs font-semibold ml-1">Reset Token</label>
              <input 
                type="text" 
                placeholder="Enter token from email"
                className="w-full p-3 rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-[#ffd700] transition-all bg-white"
                value={formData.token}
                onChange={e => setFormData({...formData, token: e.target.value})}
                required
              />
            </div>
          )}

          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[#ffd700] text-xs font-semibold ml-1">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button 
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-[10px] font-bold text-white/60 hover:text-[#ffd700] transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                placeholder="Enter password"
                className="w-full p-3 rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-[#ffd700] transition-all bg-yellow-100"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-[#ffd700] text-xs font-semibold ml-1">Role</label>
              <select 
                className="w-full p-3 rounded-lg border-none outline-none text-sm focus:ring-2 focus:ring-[#ffd700] transition-all bg-white appearance-none"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                required
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="parent">Parent</option>
              </select>
            </div>
          )}

          <button type="submit" className="w-full p-3 bg-[#ffd700] text-[#0a1f44] font-bold rounded-lg text-base hover:bg-white hover:scale-[1.05] transition-all mt-2">
            {mode === 'login' ? 'Login' : 
             mode === 'signup' ? 'Register' : 
             mode === 'forgot' ? 'Send Reset Link' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-white text-[13px] font-medium">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-[#ffd700] font-bold hover:underline">Register</button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-[#ffd700] font-bold hover:underline">Login</button>
            </p>
          )}
        </div>

        <div className="mt-4 text-white/60 text-[11px] uppercase tracking-widest">
          Uniting Parents, Students & Administration
        </div>
      </motion.div>
    </div>
  );
};

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-[100] p-4 bg-school-primary text-white rounded-2xl shadow-2xl hover:bg-school-secondary transition-colors group"
          title="Scroll to top"
        >
          <ChevronUp className="w-6 h-6 group-hover:-translate-y-1 transition-transform" />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

const Toasts = ({ toasts, onRemove }: { toasts: any[], onRemove: (id: number) => void }) => {
  return (
    <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: -20, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -20, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 flex items-start gap-4 min-w-[300px] max-w-md relative group"
          >
            <div className={`p-2 rounded-xl flex-shrink-0 ${
              toast.type === 'message' ? 'bg-blue-100 text-blue-600' :
              toast.type === 'event' ? 'bg-amber-100 text-amber-600' :
              'bg-school-primary/10 text-school-primary'
            }`}>
              {toast.type === 'message' ? <MessageSquare className="w-5 h-5" /> :
               toast.type === 'event' ? <Calendar className="w-5 h-5" /> :
               <Bell className="w-5 h-5" />}
            </div>
            <div className="flex-1 pr-6">
              <h4 className="font-bold text-sm mb-1">New Update</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{toast.content}</p>
            </div>
            <button 
              onClick={() => onRemove(toast.id)}
              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setActiveTab(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [deepLink, setDeepLink] = useState<{ tab: string, params: Record<string, string> } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('school_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Supabase Realtime for notifications
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newToast = {
              id: Date.now(),
              ...payload.new
            };
            setToasts(prev => [newToast as any, ...prev]);
            fetchNotifications();
            
            // Auto remove toast after 5 seconds
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== newToast.id));
            }, 5000);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id);
      fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('school_user', JSON.stringify(userData));
    setActiveTab('home');
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setUser(null);
    localStorage.removeItem('school_user');
    setActiveTab('home');
    setShowLogoutConfirm(false);
  };

  const handleDeepLink = (link: string) => {
    const [tab, query] = link.split('?');
    const params: Record<string, string> = {};
    if (query) {
      query.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[key] = value;
      });
    }
    setDeepLink({ tab, params });
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <Home setActiveTab={setActiveTab} />;
      case 'blog': return <Blog user={user} deepLink={deepLink?.tab === 'blog' ? deepLink.params : null} setActiveTab={setActiveTab} />;
      case 'forum': return <Forum user={user} deepLink={deepLink?.tab === 'forum' ? deepLink.params : null} />;
      case 'events': return <Events user={user} deepLink={deepLink?.tab === 'events' ? deepLink.params : null} />;
      case 'messages': return <Messages user={user} deepLink={deepLink?.tab === 'messages' ? deepLink.params : null} />;
      case 'settings': return <Settings user={user} />;
      case 'profile': return <Profile user={user} onLogout={handleLogout} onUpdateUser={setUser} />;
      case 'admin': return user?.role === 'admin' ? <AdminDashboard user={user} /> : <Home setActiveTab={setActiveTab} />;
      case 'auth': return <Auth onLogin={handleLogin} onBack={() => setActiveTab('home')} />;
      default: return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white transition-colors duration-300">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDeepLink={handleDeepLink}
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

      <ScrollToTop />
      <Toasts toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      <footer className="bg-school-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-12 h-12 flex items-center justify-center">
                  <img 
                    src="https://images.seeklogo.com/logo-png/55/2/ndejje-senior-secondary-school-bombo-logo-png_seeklogo-556141.png?v=1958513566915908752" 
                    alt="Ndejje SSS Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="text-xl font-bold font-display">Ndejje Senior Secondary School</span>
              </div>
              <p className="text-white/70 max-w-xs mb-4">
                A Christ-centered school nurturing holistically competent citizens for development and prosperity.
              </p>
              <p className="text-school-secondary font-bold italic mb-6">"No Pain No Gains"</p>
              <a 
                href="https://ndejjesss.ac.ug/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-school-secondary text-school-primary rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-black/20"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Official Website
              </a>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-school-secondary">Quick Links</h4>
              <ul className="space-y-2 text-white/70">
                <li><button onClick={() => setActiveTab('home')} className="hover:text-school-secondary transition-colors">Home</button></li>
                <li><button onClick={() => setActiveTab('blog')} className="hover:text-school-secondary transition-colors">School Blog</button></li>
                <li><button onClick={() => setActiveTab('events')} className="hover:text-school-secondary transition-colors">Events</button></li>
                <li><button onClick={() => setActiveTab('messages')} className="hover:text-school-secondary transition-colors">Messages</button></li>
                <li><a href="https://ndejjesss.ac.ug/" target="_blank" rel="noopener noreferrer" className="hover:text-school-secondary transition-colors flex items-center gap-1">Official Website <ExternalLink className="w-3 h-3" /></a></li>
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

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Confirm Logout</h2>
              <p className="text-slate-500 mb-8">
                Are you sure you want to log out of your account? You'll need to sign in again to access your messages and profile.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={confirmLogout}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  Yes, Log Me Out
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
