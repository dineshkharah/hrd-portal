export const dynamic = 'force-dynamic';

import ContactsView from "@/components/ContactsView";

export default function DecContactPage() {
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-['Fraunces'] font-bold text-[#180F04]">Contact Us</h1>
        <p className="text-sm text-[#180F04]/50 mt-0.5">Reach out to Team HRD, the DRR, or the DRS for any support</p>
      </div>
      <ContactsView />
    </div>
  );
}
