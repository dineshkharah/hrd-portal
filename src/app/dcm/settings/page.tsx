export const dynamic = 'force-dynamic';

import ChangePasswordForm from "@/components/ChangePasswordForm";

export default function DcmSettingsPage() {
  return (
    <div className="max-w-md mx-auto p-4 sm:p-6">
      <h1 className="font-['Fraunces'] text-2xl font-bold text-[#180F04] mb-6">Account Settings</h1>
      <div className="bg-white rounded-xl border border-black/5 p-6">
        <h2 className="text-sm font-semibold text-[#180F04] mb-4">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
