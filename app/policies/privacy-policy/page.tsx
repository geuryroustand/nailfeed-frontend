import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Nail Art Social",
  description:
    "Privacy policy and data protection information for Nail Art Social platform users",
};

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-800"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to Home
        </Link>
      </div>

      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-500">Last Updated: May 16, 2025</p>
        </div>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700 mb-4">
            Welcome to Nail Art Social. We respect your privacy and are
            committed to protecting your personal data. This privacy policy
            explains how we collect, use, disclose, and safeguard your
            information when you use our platform.
          </p>
          <p className="text-gray-700">
            By using our service, you agree to the collection and use of
            information in accordance with this policy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            2. Information We Collect
          </h2>

          <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
          <p className="text-gray-700 mb-4">
            We may collect personal information that you provide directly to us,
            including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>
              Account information (name, email address, username, password)
            </li>
            <li>Profile information (profile picture, bio, location)</li>
            <li>Content you post (images, comments, reactions)</li>
            <li>Communications with other users</li>
            <li>Customer support communications</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">2.2 Usage Information</h3>
          <p className="text-gray-700 mb-4">
            We automatically collect certain information about your device and
            how you interact with our platform:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>
              Device information (IP address, browser type, operating system)
            </li>
            <li>Usage data (pages visited, time spent, actions taken)</li>
            <li>Location information (with your permission)</li>
            <li>Cookies and similar tracking technologies</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            3. How We Use Your Information
          </h2>
          <p className="text-gray-700 mb-4">
            We use the information we collect for various purposes, including:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Providing and maintaining our service</li>
            <li>Personalizing your experience</li>
            <li>Processing transactions</li>
            <li>Sending notifications and updates</li>
            <li>Responding to your requests and inquiries</li>
            <li>Analyzing usage patterns to improve our platform</li>
            <li>
              Detecting and preventing fraudulent or unauthorized activity
            </li>
            <li>Complying with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            4. Sharing Your Information
          </h2>
          <p className="text-gray-700 mb-4">
            We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Other users (according to your privacy settings)</li>
            <li>Service providers who perform services on our behalf</li>
            <li>Business partners (with your consent)</li>
            <li>Legal authorities when required by law</li>
            <li>
              In connection with a business transaction (merger, acquisition,
              sale of assets)
            </li>
          </ul>
          <p className="text-gray-700">
            We do not sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            5. Your Rights and Choices
          </h2>
          <p className="text-gray-700 mb-4">
            Depending on your location, you may have certain rights regarding
            your personal information:
          </p>
          <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1">
            <li>Access and review your personal information</li>
            <li>Update or correct inaccurate information</li>
            <li>Delete your personal information</li>
            <li>Restrict or object to processing of your information</li>
            <li>Data portability</li>
            <li>Withdraw consent (where applicable)</li>
          </ul>
          <p className="text-gray-700">
            You can manage many of these rights through your account settings or
            by contacting us directly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p className="text-gray-700 mb-4">
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no method of
            transmission over the Internet or electronic storage is 100% secure,
            and we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Children's Privacy</h2>
          <p className="text-gray-700 mb-4">
            Our service is not intended for individuals under the age of 13. We
            do not knowingly collect personal information from children under
            13. If you are a parent or guardian and believe your child has
            provided us with personal information, please contact us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">
            8. Changes to This Privacy Policy
          </h2>
          <p className="text-gray-700 mb-4">
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date. You are advised to review this
            Privacy Policy periodically for any changes.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
          <p className="text-gray-700 mb-4">
            If you have any questions about this Privacy Policy or our data
            practices, please contact us at:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-gray-700 mb-1">Email: hello@nailfeed.com</p>
            {/* <p className="text-gray-700 mb-1">Address: 123 Nail Art Way, Beauty City, BC 12345</p>
            <p className="text-gray-700">Phone: (555) 123-4567</p> */}
          </div>
        </section>
      </div>
    </div>
  );
}
