import '../index.css';

export const metadata = {
  title: 'NeuroPulse 2.0 — AI Sentiment Intelligence Platform',
  description: 'NeuroPulse 2.0 — Enterprise AI-powered real-time sentiment intelligence and misinformation surveillance platform.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body { background: #070711; }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
