import { Link } from "react-router-dom";

// Full Copyright Policy as provided by Study2Gate. Structured the same way
// as Terms.js and PrivacyPolicy.js (numbered sections, each with prose
// paragraphs and/or a bulleted list) so all three policy pages read
// consistently across the site.
const LAST_UPDATED = "30th August, 2026";

const INTRO = [
  "Study2Gate respects the intellectual-property rights of authors, publishers, lecturers, educational institutions, students and other copyright owners.",
  "This Copyright Policy explains how Study2Gate handles copyright complaints concerning content uploaded or shared by users.",
];

const SECTIONS = [
  {
    title: "1. Our Position",
    body: [
      "Study2Gate does not encourage users to upload copyrighted material without permission.",
      "Users are responsible for ensuring that they have the necessary rights, permissions or other lawful basis to upload and share materials through Study2Gate.",
      "The fact that material is educational, academic or intended for students does not automatically make it free to reproduce or distribute.",
    ],
  },
  {
    title: "2. Examples of Potentially Infringing Material",
    body: ["Potentially infringing content may include:"],
    list: [
      "unauthorised copies of textbooks;",
      "copyrighted lecture notes;",
      "commercially licensed study guides;",
      "paid educational courses;",
      "copyrighted question banks;",
      "examination materials;",
      "copyrighted articles or publications;",
      "another student's original work;",
      "another person's notes, slides or educational materials;",
      "scanned or copied materials distributed without the copyright owner's permission.",
    ],
    after: ["This list is not exhaustive."],
  },
  {
    title: "3. User Responsibility",
    body: ["Before uploading a file, users must confirm that:"],
    list: [
      "\u201cI confirm that I own this material or have permission or another lawful basis to upload and share it on Study2Gate.\u201d",
    ],
    after: [
      "Users must not knowingly upload material that infringes another person's copyright.",
      "Where Study2Gate provides an upload confirmation checkbox, accepting the checkbox constitutes the user's representation that the statement is accurate.",
    ],
  },
  {
    title: "4. Reporting Copyright Infringement",
    body: [
      "If you believe that material available through Study2Gate infringes your copyright, you may contact us at:",
      "Copyright Email: officialstudy2gate@gmail.com",
      "A copyright complaint should provide enough information for us to identify and investigate the material.",
      "Where reasonably possible, include:",
    ],
    list: [
      "your full name;",
      "your contact information;",
      "identification of the copyrighted work you believe has been infringed;",
      "identification and location of the allegedly infringing material on Study2Gate;",
      "an explanation of why you believe the material infringes your rights;",
      "information demonstrating your ownership or authority to act for the copyright owner;",
      "any additional information reasonably necessary to investigate the complaint;",
      "a declaration that the information supplied is accurate to the best of your knowledge.",
    ],
  },
  {
    title: "5. What Study2Gate May Do After Receiving a Complaint",
    body: [
      "After receiving a sufficiently detailed complaint, Study2Gate may investigate the report.",
      "Depending on the circumstances, we may:",
    ],
    list: [
      "temporarily restrict access to the reported material;",
      "remove the material;",
      "notify the uploader;",
      "request additional information from the complainant or uploader;",
      "review the uploader's account for repeated infringement;",
      "suspend or terminate an account;",
      "take other action reasonably necessary to address the issue.",
    ],
    after: ["We do not guarantee that every complaint will automatically result in removal."],
  },
  {
    title: "6. Counter-Notice or Dispute",
    body: [
      "If you believe that your material was removed or restricted incorrectly, you may contact us at:",
      "Copyright Email: officialstudy2gate@gmail.com",
      "Your response should explain why you believe you have the right to use and distribute the material.",
      "We may request supporting information.",
      "Where appropriate, we may review the dispute and determine whether the material should remain restricted or be restored.",
      "Nothing in this procedure prevents a copyright owner or uploader from exercising rights available under Nigerian law.",
    ],
  },
  {
    title: "7. Repeat Infringers",
    body: [
      "Study2Gate may restrict, suspend or terminate accounts associated with repeated or serious copyright infringement.",
      "In deciding what action to take, we may consider:",
    ],
    list: [
      "the number of complaints;",
      "the credibility of the complaints;",
      "the nature of the alleged infringement;",
      "whether the user has previously received warnings;",
      "whether the user cooperated with investigations;",
      "whether the user continued uploading allegedly infringing material after notice.",
    ],
  },
  {
    title: "8. False Complaints",
    body: [
      "You must not knowingly submit false, fraudulent or materially misleading copyright complaints.",
      "Study2Gate may take appropriate action against users who deliberately misuse the copyright-reporting process.",
    ],
  },
  {
    title: "9. Removal Does Not Determine Legal Ownership",
    body: [
      "When Study2Gate removes or restricts content following a complaint, that action does not necessarily constitute a legal determination that infringement occurred.",
      "Study2Gate may take temporary or precautionary action while a matter is investigated.",
    ],
  },
  {
    title: "10. Educational Exceptions and Other Lawful Uses",
    body: [
      "Copyright law may permit certain uses of copyrighted works in particular circumstances.",
      "Study2Gate does not determine the legal validity of every individual use solely from the nature of the material.",
      "Users remain responsible for ensuring that their use and distribution of copyrighted works is lawful.",
    ],
  },
  {
    title: "11. Copyright in Study2Gate",
    body: [
      "The Study2Gate name, branding, website design, software, original graphics, logos and other materials created by or for Study2Gate may be protected by intellectual-property laws.",
      "Except where permitted by law or expressly authorised by Study2Gate, users may not reproduce, modify, distribute or commercially exploit Study2Gate's proprietary materials.",
    ],
  },
  {
    title: "12. Cooperation With Authorities",
    body: [
      "Where legally required, Study2Gate may cooperate with courts, law-enforcement authorities, regulators, copyright authorities or other competent bodies in connection with copyright or other legal matters.",
    ],
  },
  {
    title: "13. Contact",
    body: ["For copyright matters:"],
    list: [
      "General Email: officialstudy2gate@gmail.com",
      "Copyright Email: study2gatecopyright@gmail.com"
    ],
    after: [
      "Study2Gate may update this Copyright Policy when necessary to reflect changes in the law, the Service or our procedures.",
    ],
  },
];

export default function CopyrightPolicy() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="text-sm font-bold text-accent hover:text-accent-hover">
          &larr; Back to Study2Gate
        </Link>

        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <h1 className="text-3xl font-black text-slate-900">Copyright Policy</h1>
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
              </section>
            ))}
          </div>

          <div className="mt-10 border-t border-slate-100 pt-6 text-sm text-slate-500">
            Also see our{" "}
            <Link to="/terms" className="font-bold text-accent hover:underline">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-bold text-accent hover:underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </main>
  );
}
