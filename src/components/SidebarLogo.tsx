export default function SidebarLogo({ portal }: { portal: string }) {
  return (
    <div className="px-4 py-5 border-b border-white/10">
      <div className="flex items-center gap-2.5 mb-1.5">
        {/* Rotaract gear mark */}
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="14" cy="14" r="12.5" stroke="#E8175D" strokeWidth="2"/>
          <circle cx="14" cy="14" r="5.5" stroke="#E8175D" strokeWidth="2"/>
          <circle cx="14" cy="14" r="2.5" fill="#E8175D"/>
          <line x1="14" y1="8.5" x2="14" y2="2.5" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="14" y1="25.5" x2="14" y2="19.5" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="8.5" y1="14" x2="2.5" y2="14" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="25.5" y1="14" x2="19.5" y2="14" stroke="#E8175D" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="9.9" y1="9.9" x2="5.8" y2="5.8" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
          <line x1="22.2" y1="22.2" x2="18.1" y2="18.1" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
          <line x1="18.1" y1="9.9" x2="22.2" y2="5.8" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
          <line x1="5.8" y1="22.2" x2="9.9" y2="18.1" stroke="#E8175D" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span className="font-['Fraunces'] text-white font-bold text-[22px] tracking-tight leading-none">SYNC</span>
      </div>
      <p className="text-white/30 text-[9px] font-['Geist'] uppercase tracking-[0.15em]">
        by Team HRD &nbsp;·&nbsp; District 3141
      </p>
    </div>
  );
}
