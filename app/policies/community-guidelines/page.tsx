import Link from "next/link"

export default function CommunityGuidelines() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="text-pink-500 hover:text-pink-700 transition-colors flex items-center gap-1">
          ← Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-6">Community Guidelines</h1>

        <div className="prose max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Our Community Values</h2>
            <p className="mb-4">
              Welcome to NAILFEED! We're building a creative, supportive community where nail art enthusiasts can share
              their passion, inspire others, and connect with like-minded creators. These guidelines help ensure our
              platform remains a positive space for everyone.
            </p>
            <p>Our community is built on these core values:</p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>
                <strong>Creativity:</strong> We celebrate artistic expression and innovation in nail art
              </li>
              <li>
                <strong>Respect:</strong> We treat each other with kindness and consideration
              </li>
              <li>
                <strong>Inclusivity:</strong> We welcome people of all backgrounds, skill levels, and styles
              </li>
              <li>
                <strong>Authenticity:</strong> We value genuine content and honest interactions
              </li>
              <li>
                <strong>Safety:</strong> We prioritize creating a secure environment for all members
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Content Guidelines</h2>

            <h3 className="text-xl font-medium mt-6 mb-3">Encouraged Content</h3>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>Original nail art designs and techniques</li>
              <li>Tutorials and educational content about nail care and art</li>
              <li>Product reviews and recommendations</li>
              <li>Before and after transformations</li>
              <li>Inspiration and trend discussions</li>
              <li>Questions and requests for advice</li>
            </ul>

            <h3 className="text-xl font-medium mt-6 mb-3">Prohibited Content</h3>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>
                <strong>Harmful or dangerous content:</strong> Including but not limited to content promoting unsafe
                nail practices that could cause injury
              </li>
              <li>
                <strong>Harassment or bullying:</strong> Content that demeans, intimidates, or targets others
              </li>
              <li>
                <strong>Hate speech:</strong> Content that promotes discrimination or violence against individuals or
                groups
              </li>
              <li>
                <strong>Adult content:</strong> Sexually explicit or suggestive content
              </li>
              <li>
                <strong>Violence and gore:</strong> Graphic depictions of violence or injuries
              </li>
              <li>
                <strong>Spam:</strong> Repetitive, unwanted, or misleading content
              </li>
              <li>
                <strong>Misinformation:</strong> False health claims or dangerous nail care advice
              </li>
              <li>
                <strong>Illegal activities:</strong> Content promoting illegal activities or products
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">User Behavior</h2>
            <p className="mb-4">
              How we interact with each other is just as important as the content we share. We expect all community
              members to:
            </p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>Be respectful in comments and messages</li>
              <li>Provide constructive feedback rather than criticism</li>
              <li>Respect others' boundaries and privacy</li>
              <li>Support beginners and help them grow their skills</li>
              <li>Resolve disagreements respectfully</li>
              <li>Report guideline violations rather than engaging negatively</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Intellectual Property</h2>
            <p className="mb-4">Respecting creative ownership is essential in our artistic community:</p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>Only share content you've created or have permission to share</li>
              <li>Give proper credit when sharing inspiration from others</li>
              <li>Don't claim others' work as your own</li>
              <li>Respect copyright and trademark rights</li>
              <li>Ask permission before reposting someone else's content</li>
            </ul>
            <p>
              If you believe your intellectual property has been infringed, please report it through our reporting
              system.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Reporting Violations</h2>
            <p className="mb-4">If you encounter content or behavior that violates these guidelines:</p>
            <ol className="list-decimal pl-6 my-4 space-y-2">
              <li>Use the "Report" button on the post or profile</li>
              <li>Select the appropriate reason for reporting</li>
              <li>Provide any additional context that might help our moderation team</li>
            </ol>
            <p>
              We review all reports and take appropriate action as quickly as possible. Your reports help keep our
              community safe and positive.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Enforcement</h2>
            <p className="mb-4">When guidelines are violated, we may take one or more of the following actions:</p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>
                <strong>Content removal:</strong> Removing posts that violate our guidelines
              </li>
              <li>
                <strong>Warnings:</strong> Notifying users about violations and requesting compliance
              </li>
              <li>
                <strong>Temporary restrictions:</strong> Limiting account functionality for a period of time
              </li>
              <li>
                <strong>Account suspension:</strong> Temporarily disabling accounts for serious or repeated violations
              </li>
              <li>
                <strong>Account termination:</strong> Permanently removing accounts for the most severe violations
              </li>
            </ul>
            <p>
              The action taken depends on the severity and frequency of violations, as well as the user's history on the
              platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Changes to Guidelines</h2>
            <p className="mb-4">
              These guidelines may be updated periodically to address new challenges or improve clarity. We'll notify
              users of significant changes through:
            </p>
            <ul className="list-disc pl-6 my-4 space-y-2">
              <li>In-app notifications</li>
              <li>Email updates for registered users</li>
              <li>Announcements on our official social media channels</li>
            </ul>
            <p>Continued use of NAILFEED after guideline updates constitutes acceptance of the revised guidelines.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="mb-4">
              If you have questions about these guidelines or need to report something that can't be addressed through
              our standard reporting system, please contact us at:
            </p>
            <p className="mb-4">
              <a href="mailto:community@nailfeed.com" className="text-pink-500 hover:underline">
                community@nailfeed.com
              </a>
            </p>
            <p>
              Thank you for helping make NAILFEED a positive, creative, and supportive community for nail art
              enthusiasts everywhere!
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
