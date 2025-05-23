import Link from "next/link"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-6">
        <Link href="/" className="text-pink-500 hover:underline mb-6 inline-block">
          ← Back to Home
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">About NAILFEED</h1>

      <div className="prose max-w-none">
        <p className="mb-4">
          NAILFEED is a social platform dedicated to nail art enthusiasts, professionals, and hobbyists. Our mission is
          to connect people through their shared passion for nail art and design.
        </p>

        <p className="mb-4">
          Founded in 2025, we've grown into a vibrant community where members can share their creations, discover new
          trends, and connect with others who share their interests.
        </p>

        <p className="mb-4">
          Whether you're a professional nail artist, a beauty enthusiast, or someone who simply appreciates creative
          nail designs, NAILFEED is the place for you.
        </p>

        <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>
          Have questions or feedback? Reach out to us at{" "}
          <a href="mailto:info@nailfeed.com" className="text-pink-500 hover:underline">
            info@nailfeed.com
          </a>
        </p>
      </div>
    </div>
  )
}
