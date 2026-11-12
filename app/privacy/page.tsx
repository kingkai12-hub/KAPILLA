import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How Kapilla Group Limited collects, uses and protects personal information in the Kapilla Group app and website.',
  alternates: { canonical: 'https://kapilla-logistics.vercel.app/privacy' },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '12 November 2026';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen safe-page">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-navy-700 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft aria-hidden="true" className="w-4 h-4" />
          Back to Kapilla Group
        </Link>

        <div className="mt-6 glass-card p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="glass inline-flex p-2.5 rounded-md">
              <ShieldCheck aria-hidden="true" className="w-5 h-5 text-navy-700" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wider text-navy-600">
              Kapilla Group Limited
            </p>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-navy-900">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-charcoal-muted">Last updated: {LAST_UPDATED}</p>

          <p className="mt-6 text-sm text-charcoal-light leading-relaxed">
            This policy explains what information Kapilla Group Limited collects when you use the
            Kapilla Group mobile app or the website at kapillagroup.vercel.app, why we collect it,
            and the choices you have.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Who we are</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            Kapilla Group Limited is a transport and general supply company based in Tanzania. For
            the purposes of this policy we are the controller of the personal information described
            below. You can reach us using the contact details at the end of this page.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Information we collect</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            We only collect information that is needed to move your cargo and answer your requests.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-charcoal-light leading-relaxed list-disc pl-5">
            <li>
              <span className="font-semibold text-charcoal">Pickup requests.</span> When you submit
              the pickup form we collect your name, phone number, pickup address, destination,
              estimated weight and a description of the cargo.
            </li>
            <li>
              <span className="font-semibold text-charcoal">Consignment tracking.</span> To show the
              status of a shipment we process the waybill number you enter. No account or sign-in is
              required to track a consignment.
            </li>
            <li>
              <span className="font-semibold text-charcoal">Client records.</span> For invoicing and
              delivery we hold a client record that may include name, phone number, email address,
              physical address, contact person and notes. These records are created and maintained
              by our staff.
            </li>
            <li>
              <span className="font-semibold text-charcoal">Staff accounts.</span> Staff accounts
              are created by us, never through self-registration, and hold a name, email address,
              role and permission settings.
            </li>
            <li>
              <span className="font-semibold text-charcoal">Vehicle location.</span> To display live
              tracking, our system records the position of our own vehicles on a route. This
              location data relates to our fleet and operations, not to your device.
            </li>
            <li>
              <span className="font-semibold text-charcoal">Technical data.</span> Like most web
              services, our hosting provider logs requests such as IP address, browser type and the
              pages requested, in order to keep the service secure and working.
            </li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">
            What the mobile app does not access
          </h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            The Android app requests a single permission: internet access, which it needs to load
            the service. The app does not request access to your location, camera, microphone,
            contacts, files or storage, and it does not read your SMS messages. One-time codes and
            tracking updates sent by SMS are delivered by our messaging provider to the phone number
            you gave us, and are not read from your device.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">How we use your information</h2>
          <ul className="mt-3 space-y-3 text-sm text-charcoal-light leading-relaxed list-disc pl-5">
            <li>To arrange collection, freight, customs clearing and delivery of your cargo.</li>
            <li>To show you the current status and location of a consignment.</li>
            <li>To prepare quotations, proforma invoices, invoices and delivery notes.</li>
            <li>To send service messages about your shipment by SMS or email.</li>
            <li>To keep our accounting and transport records accurate and auditable.</li>
            <li>To keep the service secure, prevent abuse and fix faults.</li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">
            Who we share information with
          </h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            We do not sell your personal information. We share it only with service providers who
            help us operate the service, and only as far as needed:
          </p>
          <ul className="mt-4 space-y-3 text-sm text-charcoal-light leading-relaxed list-disc pl-5">
            <li>
              <span className="font-semibold text-charcoal">Hosting and database providers</span>{' '}
              that run the application and store its records.
            </li>
            <li>
              <span className="font-semibold text-charcoal">SMS and email providers</span> that
              deliver shipment notifications to the phone number or email address you supplied.
            </li>
            <li>
              <span className="font-semibold text-charcoal">Mapping providers</span> that render the
              map used to display a route.
            </li>
            <li>
              <span className="font-semibold text-charcoal">
                Regulatory and customs authorities
              </span>{' '}
              where the law requires us to declare a consignment.
            </li>
          </ul>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Analytics</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            The website uses Vercel Analytics and Speed Insights to measure aggregate traffic and
            page performance. These tools report aggregated measurements and are not used to build
            advertising profiles. We do not show third-party advertising in the app or on the
            website.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">How long we keep it</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            Consignment, invoice and delivery records are kept for as long as we need them for our
            operations and to meet Tanzanian accounting and tax requirements. Pickup requests that
            do not become a shipment are kept only long enough to handle your enquiry. Staff
            accounts are removed when a person leaves the company, subject to the same
            record-keeping rules.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">How we protect it</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            Access to client and shipment records is limited to the accounts that need it, and staff
            permissions are managed by an administrator. Traffic between the app and the service is
            encrypted in transit. No system is perfectly secure, so please contact us if you believe
            your information has been misused.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Your choices</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            You can ask us what personal information we hold about you, ask us to correct it, or ask
            us to delete it where we are not required to keep it. Service notifications about an
            active shipment cannot be switched off while the shipment is in transit, but you can ask
            us to stop other messages at any time. To make a request, contact us using the details
            below.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Children</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            The service is intended for business use and is not directed at children. We do not
            knowingly collect personal information from children.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Changes to this policy</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            If we change how we handle personal information we will update this page and change the
            date shown at the top.
          </p>

          <h2 className="mt-10 text-xl font-semibold text-navy-900">Contact us</h2>
          <p className="mt-3 text-sm text-charcoal-light leading-relaxed">
            Questions about this policy or about your personal information can be sent to:
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <p className="flex items-center gap-2 text-charcoal-light">
              <Mail aria-hidden="true" className="w-4 h-4 text-navy-600 shrink-0" />
              <a
                href="mailto:info@kapillagroup.co.tz"
                className="font-medium text-navy-700 hover:text-navy-900 underline underline-offset-2"
              >
                info@kapillagroup.co.tz
              </a>
            </p>
            <p className="flex items-center gap-2 text-charcoal-light">
              <Phone aria-hidden="true" className="w-4 h-4 text-navy-600 shrink-0" />
              <a
                href="tel:+255756656218"
                className="font-medium text-navy-700 hover:text-navy-900 underline underline-offset-2"
              >
                +255 756 656 218
              </a>
              <span aria-hidden="true">/</span>
              <a
                href="tel:+255766724062"
                className="font-medium text-navy-700 hover:text-navy-900 underline underline-offset-2"
              >
                +255 766 724 062
              </a>
            </p>
            <p className="text-charcoal-muted">
              Kapilla Group Limited, Tanzania &middot; TIN: 157-935-380
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
