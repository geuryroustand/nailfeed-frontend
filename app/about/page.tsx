import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Users, Sparkles, Shield, Globe, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            About NailArt Social
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Express Your Creativity
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The ultimate platform for nail art enthusiasts to share, discover, and celebrate the art of beautiful nails.
            Connect with artists worldwide and showcase your unique style.
          </p>
        </div>

        {/* Mission Section */}
        <Card className="mb-12 border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-4">Our Mission</CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              To create a vibrant community where nail art enthusiasts can inspire each other, share techniques, and
              celebrate the beauty of creative expression through nail design.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">Share Your Art</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Upload and showcase your nail art creations with our easy-to-use platform. Get feedback and appreciation
                from fellow artists.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">Connect & Follow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Follow your favorite nail artists, build your network, and stay updated with the latest trends in the
                nail art community.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">Discover Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Explore trending designs, seasonal collections, and innovative techniques from artists around the world.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">Safe Community</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Enjoy a supportive and respectful environment with community guidelines that promote positive
                interactions and creativity.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">Global Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Connect with nail artists from every corner of the world and discover diverse styles and cultural
                influences in nail art.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-800">Easy to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">
                Intuitive interface designed for creators. Upload, edit, and share your nail art with just a few clicks.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Community Stats */}
        <Card className="mb-12 border-0 shadow-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
          <CardContent className="py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10K+</div>
                <div className="text-pink-100">Active Artists</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">50K+</div>
                <div className="text-pink-100">Nail Art Posts</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100K+</div>
                <div className="text-pink-100">Community Reactions</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Values Section */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold text-gray-800 mb-4">Our Values</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="text-center">
                <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
                  Creativity
                </Badge>
                <p className="text-gray-600">
                  We celebrate unique artistic expression and encourage experimentation with new techniques and styles.
                </p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
                  Community
                </Badge>
                <p className="text-gray-600">
                  Building meaningful connections between artists and fostering a supportive environment for growth.
                </p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
                  Inclusivity
                </Badge>
                <p className="text-gray-600">
                  Welcoming artists of all skill levels and backgrounds to share their passion for nail art.
                </p>
              </div>
              <div className="text-center">
                <Badge variant="secondary" className="mb-4 text-sm px-4 py-2">
                  Innovation
                </Badge>
                <p className="text-gray-600">
                  Continuously improving our platform with new features and tools to enhance the user experience.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Join Our Community?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start sharing your nail art creations and connect with thousands of passionate artists today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/auth"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Get Started
            </a>
            <a
              href="/explore"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Explore Gallery
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
