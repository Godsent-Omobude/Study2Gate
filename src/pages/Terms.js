import { Link } from "react-router-dom";

// Full Terms & Conditions as provided by Study2Gate. Structured the same
// way as PrivacyPolicy.js (numbered sections, each with either prose
// paragraphs or a bulleted list) so the two policy pages read consistently
// across the site.
const LAST_UPDATED = "3rd September, 2026";

const INTRO = [
  "These Terms & Conditions govern your access to and use of the Study2Gate website, applications, services and related features.",
  "By creating an account, accessing or using Study2Gate, you agree to be legally bound by these Terms. If you do not agree with these Terms, you must not use the Service.",
  "Study2Gate is owned by Godsent Omobude.",
];

const SECTIONS = [
  {
    title: "1. Eligibility",
    body: [
      "You must provide accurate information when creating an account and must keep your account information reasonably up to date.",
      "You must be legally capable of entering into these Terms under applicable law.",
      "If you are under the age of 18, you should only use Study2Gate with the involvement and permission of a parent, guardian or other person legally authorised to permit your use of online services, where required by applicable law.",
      "Study2Gate may restrict or terminate access where we reasonably believe that an account has been created or used in violation of applicable law or these Terms.",
    ],
  },
  {
    title: "2. Your Account",
    body: [
      "You are responsible for:",
    ],
    list: [
      "keeping your login credentials confidential;",
      "providing truthful and accurate information;",
      "taking reasonable steps to protect your account;",
      "all activity carried out through your account, except where the activity results from circumstances outside your reasonable control.",
    ],
    after: [
      "You must notify Study2Gate promptly if you believe that your account has been accessed without your permission.",
      "You must not:",
    ],
    afterList: [
      "impersonate another person;",
      "create an account using another person's identity or information without authorisation;",
      "share your account credentials for the purpose of circumventing Study2Gate restrictions;",
      "attempt to gain unauthorised access to another user's account.",
    ],
  },
  {
    title: "3. Permitted Use",
    body: [
      "Study2Gate is intended to provide students with educational resources, study materials, flashcards, study tools, Study Circles, messaging and related educational features.",
      "You agree to use the Service only for lawful purposes and in accordance with these Terms.",
      "You must NOT use Study2Gate to:",
    ],
    list: [
      "Violate any applicable Nigerian or foreign law;",
      "Infringe intellectual-property rights;",
      "Upload malicious software, viruses or harmful code;",
      "Distribute fraudulent, deceptive or unlawful material;",
      "Harass, threaten or abuse another person;",
      "Impersonate another person or organisation;",
      "Interfere with the operation or security of the Service;",
      "Attempt to bypass security, authentication or access controls;",
      "Scrape or systematically collect information from the Service without permission;",
      "Use automated methods to abuse the Service;",
      "Exploit Study2Gate for unauthorised commercial purposes;",
      "Upload material that you do not have the right to distribute.",
    ],
  },
  {
    title: "4. User-Uploaded Content",
    body: [
      "Study2Gate allows users to upload educational materials, documents, and educational images.",
      "You retain ownership of User Content that you legally own.",
      "However, by uploading User Content, you grant Study2Gate a non-exclusive, worldwide, royalty-free licence to host, store, reproduce, process, display, transmit and make that User Content available through the Service solely as reasonably necessary to operate, maintain, secure, improve and provide the features of Study2Gate.",
      "This licence does not transfer ownership of your User Content to Study2Gate.",
      "You represent and warrant that:",
    ],
    list: [
      "you own the User Content or have obtained all permissions, licences and consents necessary to upload and share it;",
      "your User Content does not knowingly infringe another person's copyright, trademark, privacy, publicity or other legal rights;",
      "your User Content does not violate applicable law;",
      "you have the authority to grant Study2Gate the licence described above.",
    ],
  },
  {
    title: "5. Copyright and Intellectual Property",
    body: [
      "Study2Gate respects copyright and other intellectual-property rights.",
      "You must not upload, distribute or make available copyrighted material unless you own the rights or have appropriate permission or another lawful basis to do so.",
      "Examples of potentially infringing material include:",
    ],
    list: [
      "unauthorised copies of textbooks;",
      "commercially purchased study materials where redistribution is prohibited;",
      "copyrighted lecture materials uploaded without permission;",
      "paid courses or subscription materials;",
      "copyrighted question banks;",
      "copyrighted examination materials where redistribution is unlawful;",
      "another person's original notes or educational content uploaded without permission.",
    ],
    after: [
      "The fact that a material is educational, academic or useful to students does not automatically mean that it may be freely uploaded or distributed.",
      "Study2Gate may remove, restrict or disable access to User Content where we receive a credible copyright complaint, reasonably believe that the content may infringe rights, or are required to do so by law.",
    ],
    afterNode: (
      <p>
        Further procedures are provided in our{" "}
        <Link to="/copyright" className="font-bold text-accent hover:underline">
          Copyright Policy
        </Link>
        .
      </p>
    ),
  },
  {
    title: "6. Copyright Complaints",
    intro: (
      <p>
        If you believe that User Content on Study2Gate infringes your copyright, you may submit a
        copyright complaint through the contact method specified in our{" "}
        <Link to="/copyright" className="font-bold text-accent hover:underline">
          Copyright Policy
        </Link>
        .
      </p>
    ),
    body: [
      "We may request information reasonably necessary to assess the complaint.",
      "Where appropriate, Study2Gate may:",
    ],
    list: [
      "remove or restrict access to the reported content;",
      "notify the uploader;",
      "request additional information;",
      "restore content where a valid dispute or counter-notice establishes a reasonable basis for restoration;",
      "restrict or terminate accounts belonging to repeat infringers.",
    ],
    after: [
      "Submitting a false or knowingly misleading copyright complaint may result in appropriate action.",
    ],
  },
  {
    title: "7. Prohibited User Content",
    body: ["You must not upload or share content that:"],
    list: [
      "infringes copyright or other intellectual-property rights;",
      "contains malware or malicious code;",
      "unlawfully discloses another person's private information;",
      "contains unlawful threats or targeted harassment;",
      "facilitates fraud, scams or other unlawful activity;",
      "violates applicable law;",
      "is designed primarily to compromise the security or operation of Study2Gate.",
    ],
    after: ["Study2Gate reserves the right to remove content that violates these Terms."],
  },
  {
    title: "8. Study Circles and User Communications",
    body: [
      "Study Circles may allow users to communicate with one another through messages, invitations, shared materials and other features.",
      "You remain responsible for content you post or send.",
      "Study2Gate may provide moderation tools to Circle owners or moderators, including tools for removing messages, removing members, managing invitations and controlling access.",
      "Study2Gate may also intervene where reasonably necessary to address abuse, security issues, legal requirements or violations of these Terms.",
      "Users must not use Study Circles to harass, threaten, impersonate, scam or unlawfully target another person.",
    ],
  },
  {
    title: "9. Artificial Intelligence Features",
    body: [
      "Study2Gate may provide artificial-intelligence-powered features, including tools for generating flashcards, questions, summaries or other educational content.",
      "AI-generated content may contain inaccuracies, omissions or errors.",
      "You are responsible for independently reviewing AI-generated information before relying on it for academic, professional, medical or other important purposes.",
      "Study2Gate does not guarantee that AI-generated content is accurate, complete, current or suitable for a particular purpose.",
    ],
  },
  {
    title: "10. Educational Disclaimer",
    body: [
      "Study2Gate is an educational platform.",
      "Study2Gate does not guarantee academic results, examination success, grades, admission or professional qualification.",
      "Study materials and user-generated content may contain errors or outdated information.",
      "You should verify important academic or professional information using appropriate authoritative sources.",
    ],
  },
  {
    title: "11. Availability of the Service",
    body: [
      "We aim to keep Study2Gate available and reliable, but we do not guarantee that the Service will always be uninterrupted, error-free or available.",
      "We may temporarily suspend, modify or discontinue features for maintenance, security, technical, legal or operational reasons.",
      "We are not responsible for interruptions caused by circumstances beyond our reasonable control.",
    ],
  },
  {
    title: "12. Third-Party Services",
    body: [
      "Study2Gate may rely on third-party services for hosting, databases, email, authentication, analytics, notifications, file storage, artificial intelligence and other functionality.",
      "Your use of certain features may therefore be subject to applicable third-party terms and policies.",
      "Study2Gate is not responsible for the independent acts or omissions of third-party providers.",
    ],
  },
  {
    title: "13. Security",
    body: [
      "We implement reasonable technical and organisational measures designed to protect the Service and information processed through it.",
      "However, no internet-based service can guarantee absolute security.",
      "You acknowledge that transmission and storage of information online involves risks.",
      "You must not attempt to compromise or circumvent Study2Gate's security measures.",
    ],
  },
  {
    title: "14. Account Suspension and Termination",
    body: ["We may suspend, restrict or terminate your account if:"],
    list: [
      "you materially breach these Terms;",
      "you repeatedly infringe copyright;",
      "you engage in fraudulent, abusive or unlawful activity;",
      "your activity creates a security or legal risk;",
      "we are required to do so by law.",
    ],
    after: [
      "Where reasonably appropriate, we may provide notice and an opportunity to address the violation.",
      "You may stop using Study2Gate at any time.",
      "Account termination does not necessarily require immediate deletion of information where retention is reasonably necessary for legal, security, fraud-prevention, dispute-resolution or other lawful purposes.",
    ],
  },
  {
    title: "15. Disclaimers",
    body: [
      "To the extent permitted by applicable law, Study2Gate is provided on an \"as available\" and \"as is\" basis.",
      "We do not warrant that:",
    ],
    list: [
      "the Service will always be available;",
      "all User Content is accurate or lawful;",
      "all files will remain available indefinitely;",
      "the Service will be free from every error or security vulnerability;",
      "information obtained through the Service will satisfy every user's particular requirements.",
    ],
    after: [
      "Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable Nigerian law.",
    ],
  },
  {
    title: "16. Limitation of Liability",
    body: [
      "To the maximum extent permitted by applicable law, Study2Gate will not be liable for indirect, incidental, special, consequential or unforeseeable losses arising from your use of the Service.",
      "Nothing in these Terms excludes liability for matters that cannot legally be excluded under Nigerian law.",
    ],
  },
  {
    title: "17. Indemnity",
    body: [
      "To the extent permitted by applicable law, you agree to indemnify and hold harmless Study2Gate from claims, losses, liabilities, damages and reasonable expenses arising from:",
    ],
    list: [
      "your unlawful use of the Service;",
      "your violation of these Terms;",
      "your User Content;",
      "your infringement of another person's intellectual-property rights;",
      "your violation of another person's rights.",
    ],
    after: [
      "This provision does not require you to indemnify Study2Gate for liability caused by Study2Gate's own unlawful conduct.",
    ],
  },
  {
    title: "18. Privacy",
    body: [
      "Our collection and processing of personal information is governed by our Privacy Policy.",
      "Our Privacy Policy forms part of these Terms.",
    ],
  },
  {
    title: "19. Changes to These Terms",
    body: [
      "We may update these Terms from time to time.",
      "Where changes are material, we will take reasonable steps to notify users through the Service or another appropriate method.",
      "Your continued use of Study2Gate after the effective date of updated Terms constitutes acceptance of the updated Terms, to the extent permitted by law.",
    ],
  },
  {
    title: "20. Governing Law",
    body: [
      "These Terms shall be governed by and interpreted in accordance with the laws of the Federal Republic of Nigeria.",
      "Subject to any mandatory rights available to you under applicable law, disputes arising from these Terms or your use of Study2Gate shall be subject to the jurisdiction of the appropriate courts of Nigeria.",
    ],
  },
  {
    title: "21. Severability",
    body: [
      "If any provision of these Terms is found to be invalid, unlawful or unenforceable, the remaining provisions will continue to apply to the extent permitted by law.",
    ],
  },
  {
    title: "22. Entire Agreement",
    body: [
      "These Terms, together with the Privacy Policy and Copyright Policy, constitute the agreement between you and Study2Gate concerning your use of the Service, subject to any additional terms applicable to specific features.",
    ],
  },
  {
    title: "23. Contact",
    body: ["For questions concerning these Terms:"],
    list: [
      "Email: officialstudy2gate@gmail.com",
      "Copyright complaints: study2gatecopyright@gmail.com",
      "Privacy enquiries: officialstudy2gate@gmail.com",
    ],
  },
];

export default function Terms() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-bold text-accent hover:text-accent-hover">
          &larr; Back to Study2Gate
        </Link>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-3xl font-black text-slate-900">Terms & Conditions</h1>
          <p className="mt-2 text-sm text-slate-500">Last Updated: {LAST_UPDATED}</p>

          <div className="mt-6 space-y-3 text-sm leading-6 text-slate-600">
            {INTRO.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          <div className="mt-8 space-y-8">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-black text-slate-900">{section.title}</h2>

                {section.intro && (
                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {section.intro}
                  </div>
                )}

                {section.body?.length > 0 && (
                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {section.body.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                )}

                {section.list?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {section.list.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}

                {section.after?.length > 0 && (
                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {section.after.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                )}

                {section.afterList?.length > 0 && (
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                    {section.afterList.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                )}

                {section.afterNode && (
                  <div className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                    {section.afterNode}
                  </div>
                )}
              </section>
            ))}
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
            Also see our{" "}
            <Link to="/privacy" className="font-bold text-accent hover:underline">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link to="/copyright" className="font-bold text-accent hover:underline">
              Copyright Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
