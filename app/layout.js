export const metadata = {
  title: 'Website Improvement Analyzer',
  description: 'Audit a website and get practical SEO, accessibility, performance, content and security improvements.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
