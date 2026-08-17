import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'AI Website Growth & Intelligence Platform',
  description: 'Audit, diagnose, and improve websites with SEO, content, lead generation, performance, security, and technical insights.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
