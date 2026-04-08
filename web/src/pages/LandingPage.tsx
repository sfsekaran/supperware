import { Link } from 'react-router-dom';
import { Globe, Clipboard, Smartphone, Share2 } from 'lucide-react';

const features = [
  {
    icon: <Globe size={22} />,
    title: 'Save from any URL',
    desc: 'Paste a link and Supperware pulls the recipe automatically — ingredients, steps, timing and all.',
  },
  {
    icon: <Clipboard size={22} />,
    title: 'Or paste the text',
    desc: 'Found it behind a paywall? Just copy and paste. We\'ll parse it into clean, structured data.',
  },
  {
    icon: <Smartphone size={22} />,
    title: 'Cook-friendly view',
    desc: 'Large text, step-by-step checklist, serving scaler, and screen-stay-awake — built for the kitchen.',
  },
  {
    icon: <Share2 size={22} />,
    title: 'Share your collection',
    desc: 'Every recipe gets a public page. Share a link with anyone, no account required to view.',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section
        className="px-6 pt-20 pb-24 text-center"
        style={{ background: 'linear-gradient(to bottom, var(--color-cream-dark), var(--color-cream))' }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--color-terra)' }}>
            Your personal recipe keeper
          </p>
          <h1
            className="mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 600,
              lineHeight: 1.15,
              color: 'var(--color-charcoal)',
            }}
          >
            All your favourite recipes,<br />
            <em style={{ color: 'var(--color-terra)' }}>in one place.</em>
          </h1>
          <p className="text-lg mb-10" style={{ color: 'var(--color-warm-gray)', lineHeight: 1.7 }}>
            Save recipes from any website, paste them from anywhere, then cook with a calm, distraction-free view.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              to="/signup"
              className="px-7 py-3 rounded-xl text-base font-semibold no-underline"
              style={{ background: 'var(--color-terra)', color: 'white' }}
            >
              Start for free
            </Link>
            <Link
              to="/login"
              className="px-7 py-3 rounded-xl text-base font-medium no-underline"
              style={{ color: 'var(--color-warm-gray)', border: '1.5px solid var(--color-border)' }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--color-border)', maxWidth: '60rem', margin: '0 auto' }} />

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-center mb-14"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 500,
              color: 'var(--color-charcoal)',
            }}
          >
            Everything you need, nothing you don't.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-2xl"
                style={{ background: 'var(--color-cream-dark)', border: '1px solid var(--color-border)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--color-terra)', color: 'white' }}
                >
                  {f.icon}
                </div>
                <h3
                  className="mb-2"
                  style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-charcoal)' }}
                >
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-warm-gray)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section
        className="mx-6 mb-16 rounded-3xl px-10 py-14 text-center"
        style={{ background: 'var(--color-sage)', color: 'white' }}
      >
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 500, marginBottom: '1rem' }}>
          Ready to get cooking?
        </h2>
        <p className="mb-8 opacity-80">Free forever. No credit card required.</p>
        <Link
          to="/signup"
          className="inline-block px-8 py-3 rounded-xl font-semibold no-underline"
          style={{ background: 'white', color: 'var(--color-sage)' }}
        >
          Create your account
        </Link>
      </section>
    </div>
  );
}
