# NailFeed 💅

A modern social network platform for nail art enthusiasts to share, discover, and connect over stunning nail designs.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/geuryroustands-projects/v0-social)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## 🌟 Overview

NailFeed is a comprehensive social platform designed specifically for the nail art community. Users can share their creative nail designs, discover trending styles, connect with fellow nail artists, and build collections of their favorite looks. The platform combines modern web technologies with an intuitive user experience to create the ultimate destination for nail art inspiration.

## ✨ Key Features

### 🎨 Content & Discovery
- **Post Feed**: Browse an endless stream of nail art designs with high-quality images
- **Featured Stories**: Curated highlights of exceptional nail art creations
- **Advanced Search**: Find specific designs by color, style, technique, or artist
- **Trending Section**: Discover what's popular in the nail art community
- **Collections**: Save and organize favorite designs into personal collections

### 👥 Social Features
- **User Profiles**: Personalized profiles showcasing individual nail art journeys
- **Comments & Reactions**: Engage with posts through comments and emoji reactions
- **Follow System**: Connect with favorite nail artists and friends
- **Mood Tracking**: Express your nail art mood and discover matching content

### 📱 User Experience
- **Progressive Web App (PWA)**: Install on mobile devices for app-like experience
- **Push Notifications**: Stay updated with new posts and interactions
- **Responsive Design**: Seamless experience across desktop, tablet, and mobile
- **Dark/Light Theme**: Choose your preferred viewing experience
- **Offline Support**: Browse cached content even without internet connection

### 🔧 Technical Features
- **Real-time Updates**: Live updates for new posts and interactions
- **Image Optimization**: Fast loading with optimized image delivery
- **SEO Optimized**: Enhanced discoverability through search engines
- **Analytics Integration**: Track user engagement and platform growth
- **Error Boundaries**: Graceful error handling for better user experience

## 🚀 Live Demo

**Production**: [https://vercel.com/geuryroustands-projects/v0-social](https://vercel.com/geuryroustands-projects/v0-social)

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context + Custom Hooks
- **Animations**: CSS animations + Framer Motion
- **PWA**: Service Worker + Web App Manifest

### Backend Integration
- **CMS**: Strapi v5
- **API**: RESTful API with query optimization
- **Authentication**: JWT-based authentication
- **File Storage**: Optimized image handling and storage

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Build Tool**: Next.js built-in bundler

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher
- **Strapi v5 backend** (for full functionality)

## 🔧 Installation

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/your-username/nailfeed-frontend.git
cd nailfeed-frontend
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

\`\`\`env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:1337
API_URL=http://localhost:1337
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
API_TOKEN=your_strapi_api_token
NEXT_PUBLIC_API_TOKEN=your_public_api_token

# Features Toggle
NEXT_PUBLIC_ENABLE_COMMENTS=true
NEXT_PUBLIC_ENABLE_REACTIONS=true
NEXT_PUBLIC_ENABLE_SOCIAL_AUTH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Development
USE_SAMPLE_DATA=false
NEXT_PUBLIC_USE_SAMPLE_DATA=false

# Security
REVALIDATE_SECRET=your_revalidate_secret
WEBHOOK_SECRET=your_webhook_secret

# Push Notifications (Optional)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_SUBJECT=mailto:your-email@example.com
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Usage Guide

### For Users
1. **Browse Content**: Explore the main feed to discover nail art designs
2. **Search**: Use the advanced search to find specific styles or techniques
3. **Engage**: Like, comment, and react to posts you love
4. **Create Collections**: Save your favorite designs for future reference
5. **Follow Artists**: Connect with your favorite nail artists
6. **Share**: Upload your own nail art creations

### For Developers
1. **Component Structure**: Components are organized in `/components` with clear separation of concerns
2. **API Integration**: All API calls are handled through server actions in `/app/actions`
3. **Styling**: Use Tailwind CSS classes and shadcn/ui components for consistency
4. **State Management**: Leverage React Context providers for global state
5. **Error Handling**: Implement proper error boundaries and loading states

## 🏗️ Project Structure

\`\`\`text
.
├── app/                    # Next.js App Router
│   ├── actions/            # Server actions for API calls
│   ├── globals.css         # Global styles and animations
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Homepage component
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui base components
│   ├── auth/               # Authentication components
│   ├── search/             # Search functionality
│   └── ...                 # Feature-specific components
├── context/                # React Context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions and configurations
├── public/                 # Static assets
└── types/                  # TypeScript type definitions

\`\`\`

## 📄 License

This is a **private project**.  
You are **not allowed** to copy, distribute, or use this code without the explicit permission of the author.  

Access to this repository has been granted **for interview purposes only**.  
Any other use is strictly prohibited.

## 🙏 Acknowledgments

- **v0.dev** - For providing the initial development platform
- **Vercel** - For seamless deployment and hosting
- **shadcn/ui** - For beautiful, accessible UI components
- **Next.js Team** - For the amazing React framework
- **Nail Art Community** - For inspiration and feedback

---

<div align="center">
  <p>Made with 💅 by the NailFeed team</p>
  <p>
    <a href="https://vercel.com">Deployed on Vercel</a>
  </p>
</div>
