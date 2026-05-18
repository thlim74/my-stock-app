import "./globals.css";

export const metadata = {
  title: "My Stock App V3",
  description: "Stock portfolio management dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
