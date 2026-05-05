# Arabic E-commerce Platform - جيفارا للتسوق (Jivara Shopping)

## Project Overview
A comprehensive Arabic e-commerce website for "جيفارا للتسوق" (Jivara Shopping) featuring a modern professional interface for customers to shop from a wide range of products, plus a complete admin dashboard for store management. A multi-category marketplace covering watches, perfumes, accessories, sunglasses, and women's watches.

## Recent Achievements (April 2026)

✅ **AI Social Page Manager (April 12, 2026)**
- **New Admin Module:** Full AI-powered social media page management system at `/admin/social-manager`
- **Page Connection:** Connect Facebook/Instagram pages with stats (followers, posts, engagement %)
- **AI Analysis Engine:** Smart rule-based analysis of engagement, posting frequency, follower growth
- **Full Reports:** Generated reports with errors, weaknesses, strengths, recommendations, content mix, best posting times, and an overall score (0–100)
- **Content Calendar:** Create, schedule (draft/scheduled/published), and manage posts with category tagging (sale/entertainment/info/random)
- **AI Command System:** Natural language commands like "حسّن الصفحة", "أنشئ محتوى أسبوع كامل", "حوّل الصفحة إلى صفحة مبيعات" — AI generates full content plans and post drafts
- **Auto Content Generation:** "Create week's content" command automatically generates 7 posts saved to the calendar
- **Command History:** Full log of all AI commands and their results
- **Database Tables Added:** `social_pages`, `social_posts`, `social_reports`, `ai_commands`
- **Meta Graph API Ready:** Architecture supports real token-based API integration; currently runs in smart analysis mode

## Recent Achievements (March 2026)

✅ **Shoe Size Selection Feature in Shop Page (March 15, 2026)**
- Products with SKUs ['59', '58', 'H', 'w'] now show size picker (40–45)
- Inline size picker opens within the product card grid (expands to full width)
- Per-size quantity selection with +/− buttons
- cart and sizeSelections state synced correctly
- Order submission includes sizes in the items payload
- buy.tsx also supports shoe size selection with same SKU list
- Cart summary shows size breakdown in cart view

## Recent Achievements (November 2025)

✅ **Comprehensive Sales & Profit Management System (November 18, 2025)**
- **Enhanced Product Financial Data:**
  - Added cost price tracking (purchase cost per unit)
  - Shipping cost per unit tracking
  - Promotion/marketing cost per unit
  - Initial stock quantity management
  - Monthly sales targets (quantity & revenue goals)
  
- **Sales Tracking System:**
  - Manual daily sales entry with full cost breakdown
  - Support for offline/external sales tracking
  - Automatic profit calculations (revenue - all costs)
  - Sales records with notes and date tracking
  - Product-specific sales performance analytics
  
- **Profit Reports Dashboard:**
  - Real-time financial overview (total revenue, costs, net profit)
  - Interactive charts and graphs (line, bar, pie charts)
  - 7-day sales trend analysis
  - Top performing products by profit
  - Products requiring improvement identification
  - Monthly goals progress tracking with visual indicators
  - Detailed cost distribution analysis
  - Profit margin calculations and display
  
- **Admin-Only Financial Privacy:**
  - All financial data completely hidden from public website
  - Secure admin authentication required for reports access
  - Professional Arabic interface with RTL support

## Previous Achievements (August 2025)

✅ **Store Category Expansion (August 20, 2025)**
- Added three new product categories to expand store offerings
- New categories: ساعات نسائية (Women Watches), نظارات (Sunglasses), إكسسوارات (Accessories)
- Total categories now: 5 (Watches, Perfumes, Women Watches, Sunglasses, Accessories)
- Enhanced product categorization for better customer experience

## Previous Achievements (January 2025)
✅ **Complete Telegram Bot Integration**
- Automatic order notifications in Arabic sent to Telegram
- Admin configuration panel for bot token and chat ID
- Real-time test functionality to verify bot settings
- Error handling with detailed Arabic messages
- Integration with order creation workflow

✅ **Advanced Analytics & Visitor Tracking**
- Country-based visitor analytics with IP geolocation
- Real-time visitor statistics and daily counts
- Admin dashboard with visitor insights
- Activity logging for customer behavior

✅ **Dynamic Currency System**
- Custom USD exchange rate management (default: 1500 IQD per USD)
- Applied across all financial reports and displays
- Admin configurable through settings panel

✅ **Current Time Display Removal (January 21, 2025)**
- Removed live time display component from main theme upon user request
- Cleaned up imports and references from homepage and admin dashboard
- Maintained clean codebase without unused components

✅ **Saved Custom Theme Preservation (January 21, 2025)**
- Updated main theme to preserve user's current color customizations
- Created "محفوظ" (Saved) category for preserved custom themes
- Updated theme gallery to show saved theme as "الثيم الأساسي المحفوظ"
- Allows user to return to customized colors after trying other themes

✅ **Store Information Update (October 23, 2025)**
- Updated store name to "جيفارا للتسوق" (Jivara Shopping)
- Updated phone number: 07819966698
- Updated address: الأنبار
- All store settings updated in database with current information

✅ **Enhanced Admin Security System (August 17, 2025)**
- Implemented comprehensive authentication middleware for all admin pages
- Added useAdminAuth hook with automatic redirect and token validation
- Fixed direct admin access vulnerability - now requires valid login
- Admin pages protected: dashboard, products, orders, customers, settings, reports, themes
- Added logout functionality in admin sidebar with proper session cleanup
- Fixed phone number display truncation issue in header
- Updated hero image with luxury watch and perfume professional background

✅ **Database Integrity & Product Management Fix (January 21, 2025)**
- Fixed product deletion foreign key constraint issues
- Implemented proper cascading deletion for related records
- Enhanced transaction handling for data integrity
- Added comprehensive error logging for debugging
- Product deletion now properly handles cart items and activity records

✅ **Database Cleanup for Production (January 21, 2025)**
- Removed all test customer data and orders
- Cleaned visitor statistics and activity logs
- Preserved admin account and store settings
- Database ready for real customer data entry

✅ **Dynamic Image Management System (January 21, 2025)**
- Added "صور الموقع" tab in admin settings
- All website images now manageable from admin panel
- Includes category images, customer testimonials, and default product image
- Dynamic integration with homepage and product pages
- Default values set with current Unsplash images

✅ **Complete Interface Separation & Enhanced Security (January 21, 2025)**
- Completely separated customer interface from admin panel
- Removed all admin access links/buttons from customer-facing pages
- Enhanced security by hiding admin functionality from regular users
- Admin access only available through direct URL: `/admin/login`
- Clean customer experience without administrative distractions

✅ **Enhanced Testimonials Design (January 21, 2025)**
- Redesigned testimonials section with hierarchical layout
- Hero testimonial prominently displayed with larger text and hover effects
- Two supporting testimonials in balanced side-by-side layout
- Added smooth transitions and interactive hover states
- Improved visual flow and professional appearance

✅ **Complete Special Offers Page (January 21, 2025)**
- Created dedicated offers page with professional design
- Automatic discount calculation and badge display
- Linked "Special Offers" button to functional page
- Responsive design with offer statistics and call-to-action sections

✅ **Fixed Account Creation Icon Visibility (January 21, 2025)**
- Account creation button now permanently disappears after first user registration
- Uses localStorage to maintain state across login/logout sessions
- Improved user experience by preventing confusion about account creation
- Fixed authentication flow to work seamlessly with login/logout cycles

✅ **Advanced Security Implementation (January 21, 2025)**
- Multi-layer security system with rate limiting and IP blocking
- Failed login attempt tracking (5 attempts = 15 min lockout)
- Advanced JWT token security with 8-hour expiration
- Input sanitization to prevent XSS and injection attacks
- Security headers (X-Frame-Options, CSP, XSS Protection)
- Suspicious activity detection and automatic blocking
- Enhanced admin authentication with extra rate limiting (3 attempts per 15 min)
- Comprehensive security event logging for monitoring

✅ **Enhanced Admin Login Interface (January 21, 2025)**
- Professional dual-panel login design with features showcase
- Left panel displays all system capabilities with visual icons
- Advanced features section highlighting Telegram, analytics, and security
- Modern gradient design with glassmorphic effects
- Real-time status indicators for all system features
- Enhanced user experience with animated loading states
- Mobile-responsive design maintaining professional appearance

✅ **Interactive Theme Gallery (January 21, 2025)**
- Complete theme gallery with 6 professional themes
- Real-time theme preview and instant application
- Themes include: Royal Blue, Emerald Luxury, Sunset Warmth, Midnight Elegance, Rose Gold, Nature Green
- Admin panel integration for easy theme management
- Dynamic color system updates across entire website

✅ **Complete Mobile Optimization (January 21, 2025)**
- Fixed floating cart button positioning and design for mobile devices
- Completely redesigned cart page with separate mobile and desktop layouts
- Smooth, gradient dividers replacing harsh borders throughout the site
- Enhanced mobile-friendly product cards with rounded corners
- Improved mobile checkout process with better form layouts
- Mobile-optimized buttons, inputs, and spacing
- Professional mobile cart button with gradient background and hover effects

## Current System Features

### Customer Features
- Bilingual Arabic/English product browsing
- Advanced cart system with session persistence
- Real-time order tracking
- Mobile-responsive design
- Visitor analytics tracking

### Admin Features
- Complete product and category management
- Order management with status updates
- Financial reporting with custom exchange rates
- Telegram Bot notifications for new orders
- Visitor analytics dashboard
- Store customization (colors, branding, policies)

## Technical Architecture
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based admin system
- **Integrations**: Telegram Bot API
- **Analytics**: Custom visitor tracking system

## Admin Access
- URL: `/admin/login`
- يجب إنشاء حساب جديد عند أول استخدام

## Telegram Bot Configuration
**Location**: Admin Settings → معلومات المتجر → إعدادات بوت Telegram

**Required Settings**:
1. **Bot Token**: Get from @BotFather on Telegram
2. **Chat ID**: Your Telegram user/group ID for notifications

**Features**:
- Automatic Arabic notifications for new orders
- Test functionality to verify configuration
- Order details include customer info, products, and totals

## Key Business Information
- **Store Name**: جيفارا للتسوق (Jivara Shopping)
- **Address**: الأنبار (Anbar)
- **Phone**: 07819966698
- **Email**: info@jivarashopping.com
- **Specialties**: Multi-category shopping including watches, perfumes, accessories, sunglasses, and women's watches

## User Preferences
- Communication in Arabic for business context
- Focus on professional, modern design
- Emphasis on mobile responsiveness
- Real-time notifications and analytics priority

## Next Development Priorities
1. Enhanced product search and filtering
2. Customer wishlist functionality
3. Advanced inventory management
4. Multi-payment gateway integration