import { GlassPanel, SectionHeader } from '@/shared/components/ui';

interface ComingSoonSectionProps {
  title: string;
  icon?: string;
  description?: string;
}

export function ComingSoonSection({ title, icon = '🚧', description }: ComingSoonSectionProps) {
  return (
    <section className="relative px-16 py-16 opacity-50">
      <div className="section-atmosphere" />
      <div className="relative z-10">
        <SectionHeader
          title={title}
          action={
            <span className="px-3 py-1 rounded-full bg-[var(--color-bg-overlay)] border border-[var(--color-border)] text-sm text-[var(--color-text-muted)]">
              Coming soon
            </span>
          }
        />
        <GlassPanel className="p-8 text-center">
          <span className="text-4xl mb-4 block">{icon}</span>
          <p className="text-sm text-[var(--color-text-muted)]">
            {description || `${title} data will be available in a future update.`}
          </p>
        </GlassPanel>
      </div>
    </section>
  );
}
