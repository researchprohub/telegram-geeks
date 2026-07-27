const partners = [
  "SMSPool", "5SIM.net", "SMShub", "SMSCenter",
  "SMS-Activate", "Grizzly SMS", "SMSCode", "SMSService",
];

export function PartnerLogos() {
  return (
    <section className="py-10 border-b border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="flex gap-16 animate-[scroll_30s_linear_infinite] whitespace-nowrap">
            {[...partners, ...partners].map((name, i) => (
              <div
                key={`${name}-${i}`}
                className="text-muted-foreground/30 text-lg font-bold tracking-widest uppercase shrink-0 hover:text-foreground/40 transition-colors"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#07070c] to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#07070c] to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
