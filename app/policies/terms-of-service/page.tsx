import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Terms of Service | NailFeed",
  description: "Terms of Service for NailFeed - The nail art social platform",
}

export default function TermsPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-pink-500 hover:text-pink-600 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Terms of Service</h1>
        <p className="text-gray-500 mb-8 text-center">Last Updated: May 16, 2025</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to NailFeed ("we," "our," or "us"). By accessing or using our website, mobile application, and
              services (collectively, the "Services"), you agree to be bound by these Terms of Service ("Terms"). If you
              do not agree to these Terms, please do not use our Services.
            </p>
            <p className="text-gray-700">
              These Terms constitute a legally binding agreement between you and NailFeed regarding your use of the
              Services. Please read them carefully.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Account Registration</h2>
            <p className="text-gray-700 mb-4">
              To access certain features of our Services, you may need to register for an account. When you register,
              you agree to provide accurate, current, and complete information and to update this information to
              maintain its accuracy.
            </p>
            <p className="text-gray-700 mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities
              that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your account if any information provided during registration
              or thereafter proves to be inaccurate, false, or misleading.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Content</h2>
            <p className="text-gray-700 mb-4">
              Our Services allow you to post, link, store, share, and otherwise make available certain information,
              text, graphics, videos, or other material ("User Content"). You retain ownership rights in your User
              Content.
            </p>
            <p className="text-gray-700 mb-4">
              By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce,
              modify, adapt, publish, translate, distribute, and display such content in connection with providing and
              promoting our Services.
            </p>
            <p className="text-gray-700">
              You represent and warrant that: (i) you own the User Content or have the right to use and grant us the
              rights and license as provided in these Terms, and (ii) the posting of your User Content does not violate
              the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Prohibited Activities</h2>
            <p className="text-gray-700 mb-4">You agree not to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>
                Using the Services for any illegal purpose or in violation of any local, state, national, or
                international law
              </li>
              <li>Harassing, threatening, or intimidating other users</li>
              <li>Posting or transmitting viruses, malware, or other malicious code</li>
              <li>
                Attempting to interfere with, compromise the system integrity or security, or decipher any transmissions
                to or from the servers running the Services
              </li>
              <li>Collecting or harvesting any personally identifiable information from the Services</li>
              <li>
                Impersonating another person or otherwise misrepresenting your affiliation with a person or entity
              </li>
              <li>Using the Services in a manner that could disable, overburden, damage, or impair the site</li>
              <li>Posting content that is defamatory, obscene, pornographic, violent, or otherwise offensive</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Services and their original content (excluding User Content), features, and functionality are and will
              remain the exclusive property of NailFeed and its licensors. The Services are protected by copyright,
              trademark, and other laws.
            </p>
            <p className="text-gray-700">
              Our trademarks and trade dress may not be used in connection with any product or service without the prior
              written consent of NailFeed.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Copyright Policy</h2>
            <p className="text-gray-700 mb-4">
              We respect the intellectual property rights of others and expect users of our Services to do the same. We
              will respond to notices of alleged copyright infringement that comply with applicable law.
            </p>
            <p className="text-gray-700">
              If you believe that your copyrighted work has been copied in a way that constitutes copyright
              infringement, please provide us with the following information: (i) a physical or electronic signature of
              the copyright owner or a person authorized to act on their behalf; (ii) identification of the copyrighted
              work claimed to have been infringed; (iii) identification of the material that is claimed to be infringing
              or to be the subject of infringing activity and that is to be removed or access to which is to be
              disabled, and information reasonably sufficient to permit us to locate the material; (iv) your contact
              information; (v) a statement by you that you have a good faith belief that use of the material in the
              manner complained of is not authorized by the copyright owner, its agent, or the law; and (vi) a statement
              that the information in the notification is accurate, and, under penalty of perjury, that you are
              authorized to act on behalf of the copyright owner.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              To the maximum extent permitted by law, in no event shall NailFeed, its directors, employees, partners,
              agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or
              punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible
              losses, resulting from (i) your access to or use of or inability to access or use the Services; (ii) any
              conduct or content of any third party on the Services; (iii) any content obtained from the Services; and
              (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty,
              contract, tort (including negligence), or any other legal theory, whether or not we have been informed of
              the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Disclaimer</h2>
            <p className="text-gray-700 mb-4">
              Your use of the Services is at your sole risk. The Services are provided on an "AS IS" and "AS AVAILABLE"
              basis. The Services are provided without warranties of any kind, whether express or implied, including,
              but not limited to, implied warranties of merchantability, fitness for a particular purpose,
              non-infringement, or course of performance.
            </p>
            <p className="text-gray-700">
              NailFeed, its subsidiaries, affiliates, and licensors do not warrant that a) the Services will function
              uninterrupted, secure, or available at any particular time or location; b) any errors or defects will be
              corrected; c) the Services are free of viruses or other harmful components; or d) the results of using the
              Services will meet your requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
            <p className="text-gray-700">
              These Terms shall be governed and construed in accordance with the laws of the United States, without
              regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms
              will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision
              is material, we will provide at least 30 days' notice prior to any new terms taking effect. What
              constitutes a material change will be determined at our sole discretion. By continuing to access or use
              our Services after any revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Termination</h2>
            <p className="text-gray-700">
              We may terminate or suspend your account and bar access to the Services immediately, without prior notice
              or liability, under our sole discretion, for any reason whatsoever and without limitation, including but
              not limited to a breach of the Terms. If you wish to terminate your account, you may simply discontinue
              using the Services or delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions about these Terms, please contact us at support@nailfeed.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
