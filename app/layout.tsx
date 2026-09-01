import "@/app/globals.css";

export const metadata = {
  title: "Shira Gui Photography",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
