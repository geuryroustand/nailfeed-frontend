import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Notice | NailFeed",
  description: "Legal information and company details for NailFeed",
};

export default function LegalNoticePage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-pink-500 hover:text-pink-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Legal Notice</h1>
        <p className="text-gray-500 mb-8 text-center">According to § 5 TMG</p>

        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Company Information</h2>
            <p className="text-gray-700 mb-2">Vershera</p>
            <p className="text-gray-700">
              Bahnhofstraße 24
              <br />
              73033 Göppingen
              <br />
              Germany
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Represented by</h2>
            <p className="text-gray-700">Amado Nunez</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Contact</h2>
            <p className="text-gray-700">
              Email:{" "}
              <a
                href="mailto:info@vershera.com"
                className="text-pink-500 hover:underline"
              >
                hello@vershera.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">VAT-ID</h2>
            <p className="text-gray-700">
              Sales tax identification number according to §27a Value Added Tax
              Act: 6335820710
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">
              Responsible for Content
            </h2>
            <p className="text-gray-700">
              Amado Nunez
              <br />
              Bahnhofstraße 24
              <br />
              73033 Göppingen
              <br />
              Germany
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Dispute Resolution</h2>
            <p className="text-gray-700 mb-4">
              The European Commission provides a platform for online dispute
              resolution (OS):
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-500 hover:underline ml-1"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="text-gray-700">
              We are not willing or obliged to participate in dispute resolution
              proceedings before a consumer arbitration board.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">
              Liability for Content
            </h2>
            <p className="text-gray-700 mb-4">
              As a service provider, we are responsible for our own content on
              these pages according to § 7 paragraph 1 TMG under the general
              laws. According to §§ 8 to 10 TMG, however, we are not obligated
              to monitor transmitted or stored third-party information or to
              investigate circumstances that indicate illegal activity.
            </p>
            <p className="text-gray-700">
              Obligations to remove or block the use of information under the
              general laws remain unaffected. However, liability in this regard
              is only possible from the point in time at which a concrete
              infringement of the law becomes known. If we become aware of any
              such infringements, we will remove the relevant content
              immediately.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
