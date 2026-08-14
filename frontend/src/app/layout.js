import './globals.css';

export const metadata = {
  title: 'Assignment & Submission Management System',
  description: 'A role-based school application.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
